import { companyCondition, MASTER_TABLES, masterScopeConditions } from '../../../common/master-data-scope';
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, sql, getTableColumns } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateNumberSeriesDto, UpdateNumberSeriesDto, QueryNumberSeriesDto } from './dto/number-series.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { NobLobResolutionService } from '../../core/operational-area/nob-lob-resolution.service';
import { formatSeriesCode, nextSequence } from './code-format.util';
import { MASTER_CODE_COLUMNS } from './master-code-columns';
import { generateCompositeCode } from './composite-code.util';
import { CodePreviewDto } from './dto/code-preview.dto';

const toMysqlTimestamp = (date: Date = new Date()) => date.toISOString().slice(0, 19).replace('T', ' ');

/**
 * Tenant + company scope for an arbitrary master table. breed_lifecycle_stages is
 * scoped through its breed and has no company_id column at all; passing its
 * undefined column to eq() builds invalid SQL, so the clause is simply omitted.
 */
const scopeKeyConditions = (columns: Record<string, any>, tenantId: string, companyId?: string | null) => {
  const conditions = [eq(columns.tenant_id, tenantId)];
  if (columns.company_id) conditions.push(companyCondition(columns.company_id, companyId));
  return conditions;
};

@Injectable()
export class NumberSeriesService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
    private readonly nobLobResolution: NobLobResolutionService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  /**
   * Materialise an independent counter from built-in defaults. This is
   * used by company-owned master records whose identities must never share a
   * counter with another company. `loadExistingCodes` lets the caller expose
   * its own master table without coupling this system service to every domain.
   *
   * The fallback keeps upgraded tenants working before the seed command is
   * rerun; new tenants receive the same definition from SYSTEM_NO_SERIES_SEED.
   */
  async ensureCompanySeries(
    tenantId: string,
    companyId: string | null | undefined,
    defaults: {
      seriesCode: string;
      seriesName: string;
      documentType: string;
      prefix: string;
      separator?: string;
      seqLength: number;
    },
    loadExistingCodes: () => Promise<Array<string | null | undefined>>,
  ): Promise<void> {
    const [existing] = await this.db.select().from(schema.noSeriesMaster).where(and(
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      companyCondition(schema.noSeriesMaster.company_id, companyId),
      eq(schema.noSeriesMaster.series_code, defaults.seriesCode),
      isNull(schema.noSeriesMaster.deleted_at),
    )).limit(1);
    if (existing) return;

    // Existing companies must not observe later changes to tenant drafts.
    const prefix = defaults.prefix;
    const separator = defaults.separator || '-';
    const existingCodes = await loadExistingCodes();
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedPrefix}${escapedSeparator}(\\d+)$`, 'i');
    const currentSeq = existingCodes.reduce((max, code) => {
      const match = code?.match(pattern);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    await this.db.insert(schema.noSeriesMaster).values({
      series_id: randomUUID(),
      tenant_id: tenantId,
      company_id: companyId,
      series_code: defaults.seriesCode,
      series_name: defaults.seriesName,
      document_type: defaults.documentType,
      prefix,
      date_format: null,
      separator,
      seq_length: defaults.seqLength,
      current_seq: currentSeq,
      reset_frequency: 'NEVER',
      allow_manual: true,
    }).onDuplicateKeyUpdate({ set: { series_name: defaults.seriesName } });
  }

  /**
   * Concurrency-safe next-code generation: locks the single series row
   * (SELECT ... FOR UPDATE), resets current_seq if the reset_frequency period
   * has rolled over, increments, formats, and persists in one statement.
   * Pass `executor` (a transaction handle) when calling from inside a
   * `db.transaction()` — same pattern batch.service.ts's generateBatchNo() used.
   */
  async generateNext(
    seriesCode: string,
    tenantId: string,
    companyId?: string | null,
    executor?: MySql2Database<typeof schema>,
  ): Promise<string> {
    if (!executor) {
      return this.db.transaction((tx) => this.generateNext(seriesCode, tenantId, companyId, tx));
    }
    const conditions = [
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      eq(schema.noSeriesMaster.series_code, seriesCode),
      isNull(schema.noSeriesMaster.deleted_at),
    ];
    // Templates and company counters are independent after company creation.
    conditions.push(
      companyCondition(schema.noSeriesMaster.company_id, companyId)
    );

    const [series] = await executor
      .select()
      .from(schema.noSeriesMaster)
      .where(and(...conditions))
      .orderBy(sql`${schema.noSeriesMaster.company_id} IS NULL`)
      .limit(1)
      .for('update');

    if (!series) {
      throw new NotFoundException(`Number series '${seriesCode}' not found for this tenant/company scope.`);
    }
    if (!series.is_active) {
      throw new BadRequestException(`Number series '${seriesCode}' is inactive.`);
    }

    const now = new Date();
    const { sequence: nextSeq, code: formattedCode } = await this.nextAvailableCode(series, tenantId, companyId, executor, now);

    await executor
      .update(schema.noSeriesMaster)
      .set({
        current_seq: nextSeq,
        last_generated_code: formattedCode,
        updated_at: toMysqlTimestamp(now) as any,
      })
      .where(eq(schema.noSeriesMaster.series_id, series.series_id));

    return formattedCode;
  }

  /** Includes inactive/deleted identities: a manual code is never overwritten
   * or recycled. This is also used by read-only previews, without a row lock. */
  private async nextAvailableCode(series: typeof schema.noSeriesMaster.$inferSelect, tenantId: string, companyId: string | null | undefined, executor = this.db, now = new Date()) {
    const master = series.document_type?.toUpperCase();
    const field = MASTER_CODE_COLUMNS[master];
    const table = MASTER_TABLES[master?.toLowerCase().replaceAll('_', '-')];
    const columns = table ? getTableColumns(table) : undefined;
    const occupied = new Set<string>();
    if (field && columns?.[field]) {
      const rows = await executor.select({ code: columns[field] }).from(table).where(and(
        ...scopeKeyConditions(columns, tenantId, companyId),
      ));
      for (const row of rows) occupied.add(String(row.code).toUpperCase());
    }
    let sequence = nextSequence(series, now);
    let code = formatSeriesCode(series, sequence, now);
    while (occupied.has(code.toUpperCase())) code = formatSeriesCode(series, ++sequence, now);
    return { sequence, code };
  }

  /**
   * Type-aware series resolution, shared by every master that wants "auto-numbered
   * where configured, manual everywhere else". Checks, in order:
   *   1. a series for master + type (e.g. `ITEM_RAW_MATERIAL`, `ANIMAL_SOW`) — the
   *      more specific configuration;
   *   2. else a series for the master alone (e.g. `ITEM`, `ANIMAL`);
   *   3. else `null` — meaning nothing is configured and the caller must leave the
   *      code field to manual entry, exactly as it works today. This is what keeps
   *      `KG`, `LITER`, `GESTATION` and `LARGE_WHITE` meaningful: a master is only
   *      auto-numbered once someone deliberately adds a series row for it.
   *
   * Returns the resolved `series_code` (not a generated code) so the caller passes
   * it straight into `generateNext` / `lockSeries`. Only checks existence + active
   * state — it never mutates a series row, so it's safe to call speculatively
   * before deciding whether to generate a code at all.
   */
  async resolveSeriesFor(
    masterKey: string,
    typeValue: string | null | undefined,
    tenantId: string,
    companyId?: string | null,
    executor: MySql2Database<typeof schema> = this.db,
  ): Promise<string | null> {
    const seriesExists = async (seriesCode: string): Promise<boolean> => {
      const conditions = [
        eq(schema.noSeriesMaster.tenant_id, tenantId),
        eq(schema.noSeriesMaster.series_code, seriesCode),
        eq(schema.noSeriesMaster.is_active, true),
        isNull(schema.noSeriesMaster.deleted_at),
      ];
      conditions.push(
        companyCondition(schema.noSeriesMaster.company_id, companyId)
      );
      const [row] = await executor
        .select({ series_id: schema.noSeriesMaster.series_id })
        .from(schema.noSeriesMaster)
        .where(and(...conditions))
        .limit(1);
      return !!row;
    };

    if (typeValue) {
      const typeSeriesCode = `${masterKey}_${typeValue}`.toUpperCase();
      if (await seriesExists(typeSeriesCode)) return typeSeriesCode;
    }

    const masterSeriesCode = masterKey.toUpperCase();
    if (await seriesExists(masterSeriesCode)) return masterSeriesCode;

    return null;
  }

  async resolveCodeSettings(master: string, type: string | undefined, tenantId: string, companyId?: string | null) {
    if (!/^[A-Z][A-Z_]{0,49}$/.test(master)) throw new BadRequestException('Invalid master code.');
    const code = await this.resolveSeriesFor(master, type, tenantId, companyId) ||
      (master === 'ANIMAL' ? await this.resolveSeriesFor('ANIMAL', 'PIGGERY', tenantId, companyId) : null);
    if (!code) return { generated: false, allowManual: true };
    const [row] = await this.db.select().from(schema.noSeriesMaster).where(and(
      eq(schema.noSeriesMaster.tenant_id, tenantId), eq(schema.noSeriesMaster.series_code, code),
      eq(schema.noSeriesMaster.is_active, true), isNull(schema.noSeriesMaster.deleted_at),
      companyCondition(schema.noSeriesMaster.company_id, companyId),
    )).orderBy(sql`${schema.noSeriesMaster.company_id} IS NULL`).limit(1);
    return row ? { generated: true, allowManual: row.allow_manual, seriesCode: row.series_code, prefix: row.prefix } : { generated: false, allowManual: true };
  }

  /** Read-only: never initializes a series, increments a counter, or reserves a code. */
  async previewCode(query: CodePreviewDto, tenantId: string, companyId?: string | null) {
    if (!MASTER_CODE_COLUMNS[query.master]) throw new BadRequestException('Unsupported master code.');
    let type = query.type;
    if (query.master === 'ANIMAL') {
      const scope = this.cls.get<{ lobId?: string }>('masterScope');
      const lobId = query.lobId || scope?.lobId;
      if (lobId) {
        const [lob] = await this.db.select({ code: schema.lobMaster.lob_code }).from(schema.lobMaster).where(eq(schema.lobMaster.lob_id, lobId)).limit(1);
        type = lob?.code;
      }
    }
    const settings = await this.resolveCodeSettings(query.master, type, tenantId, companyId);
    if (!settings.generated || !settings.seriesCode) return settings;
    const [series] = await this.db.select().from(schema.noSeriesMaster).where(and(
      eq(schema.noSeriesMaster.tenant_id, tenantId), companyCondition(schema.noSeriesMaster.company_id, companyId),
      eq(schema.noSeriesMaster.series_code, settings.seriesCode),
      eq(schema.noSeriesMaster.is_active, true), isNull(schema.noSeriesMaster.deleted_at),
    )).limit(1);
    if (!series) return { generated: false, allowManual: true };
    const hierarchy: Record<string, [string, string, string, string]> = {
      LOCATION: ['location', 'location_id', 'location_code', 'parent_location_id'],
      BREED: ['location', 'location_id', 'location_code', 'location_id'],
      ITEM_CATEGORY: ['item-category', 'category_id', 'category_code', 'parent_category_id'],
      GL_ACCOUNT: ['gl-account', 'gl_account_id', 'account_code', 'parent_account_id'],
      COST_CENTER: ['cost-center', 'cost_center_id', 'cost_center_code', 'parent_cost_center_id'],
    };
    const definition = hierarchy[query.master];
    if (query.parentId && definition) {
      const [parentKey, parentId, parentCode, childParent] = definition;
      const parentTable = MASTER_TABLES[parentKey];
      const parentColumns = getTableColumns(parentTable);
      const [parent] = await this.db.select().from(parentTable).where(and(
        eq(parentColumns[parentId], query.parentId), eq(parentColumns.tenant_id, tenantId),
        companyCondition(parentColumns.company_id, companyId), isNull(parentColumns.deleted_at),
        eq(parentColumns.is_active, true), ...masterScopeConditions(this.cls, parentTable),
      )).limit(1);
      if (!parent) throw new BadRequestException('Select an active parent in this workspace.');
      if (query.master === 'BREED' && (parent.location_type !== 'FARM' || parent.parent_location_id !== null)) {
        throw new BadRequestException('Breed location must be a first-level farm without a parent.');
      }
      let prefix = series.prefix || (query.master === 'BREED' ? query.type : series.series_code) || series.series_code;
      if (query.master === 'LOCATION') {
        const [locationType] = await this.db.select().from(schema.locationTypeMaster).where(and(
          eq(schema.locationTypeMaster.tenant_id, tenantId), companyCondition(schema.locationTypeMaster.company_id, companyId),
          eq(schema.locationTypeMaster.type_code, query.type || ''), isNull(schema.locationTypeMaster.deleted_at),
        )).limit(1);
        if (!locationType) throw new BadRequestException('Select a location type first.');
        prefix = locationType.code_prefix;
      }
      const table = MASTER_TABLES[query.master.toLowerCase().replaceAll('_', '-')];
      const columns = getTableColumns(table);
      const conditions = [eq(columns.tenant_id, tenantId), companyCondition(columns.company_id, companyId), eq(columns[childParent], query.parentId)];
      if (query.master === 'LOCATION') conditions.push(eq(columns.location_type, query.type!));
      const preview = await generateCompositeCode({
        parentCode: String(parent[parentCode]), prefix, seqLength: series.seq_length,
        fetchSiblingCodes: async () => this.db.select({ code: columns[MASTER_CODE_COLUMNS[query.master]] }).from(table).where(and(...conditions)) as Promise<{ code: string }[]>,
      });
      return { ...settings, preview };
    }
    return { ...settings, preview: (await this.nextAvailableCode(series, tenantId, companyId)).code };
  }

  /** Validate an explicit manual identity without consuming the series. */
  async resolveNewCode(master: string, supplied: string | undefined, tenantId: string, companyId?: string | null, type?: string): Promise<string> {
    if (supplied) return this.manualCode(master, supplied, tenantId, companyId, type);
    const series = await this.resolveSeriesFor(master, type, tenantId, companyId);
    if (!series) throw new BadRequestException('Enter a manual code or configure a number series for this master.');
    return this.generateNext(series, tenantId, companyId);
  }

  /** Validate an explicit manual identity without consuming the series. */
  async manualCode(master: string, supplied: string, tenantId: string, companyId?: string | null, type?: string) {
    const settings = await this.resolveCodeSettings(master, type, tenantId, companyId);
    if (settings.generated && !settings.allowManual) throw new BadRequestException('This number series does not allow manual entry.');
    const code = supplied.trim().toUpperCase();
    const table = MASTER_TABLES[master.toLowerCase().replaceAll('_', '-')];
    if (!table || !MASTER_CODE_COLUMNS[master]) throw new BadRequestException('Unsupported master code.');
    const columns = getTableColumns(table);
    const column = columns[MASTER_CODE_COLUMNS[master]];
    const width = Number(column.getSQLType().match(/\((\d+)\)/)?.[1] || 255);
    if (!code || code.length > width) throw new BadRequestException(`Code must contain 1 to ${width} characters.`);
    const [duplicate] = await this.db.select().from(table).where(and(
      ...scopeKeyConditions(columns, tenantId, companyId), eq(column, code),
    )).limit(1);
    if (duplicate) throw new ConflictException(`Code '${code}' already exists in this scope.`);
    return code;
  }

  /**
   * Optional-identity counterpart of resolveNewCode(), for the masters whose code
   * column is nullable because no numbering convention has been agreed for them
   * yet (medicine, UOM conversion, GL mapping, breed lifecycle stage).
   *
   * Same three-way resolution as every other master, minus the throw:
   *   1. a supplied code is validated for width and scope-uniqueness (manualCode);
   *   2. else a configured series generates one;
   *   3. else null — creation proceeds with no code, which is what happens today
   *      because resolveCodeSettings() returns { generated: false, allowManual: true }
   *      when no no_series_master row exists. Configure a series later and this
   *      starts auto-numbering with no further code change.
   */
  async resolveOptionalCode(
    master: string,
    supplied: string | undefined | null,
    tenantId: string,
    companyId?: string | null,
    type?: string,
  ): Promise<string | null> {
    if (supplied?.trim()) return this.manualCode(master, supplied, tenantId, companyId, type);
    const series = await this.resolveSeriesFor(master, type, tenantId, companyId);
    if (!series) return null;
    return this.generateNext(series, tenantId, companyId);
  }

  /**
   * Re-validates a manually edited code on update: same width/uniqueness rules as
   * manualCode(), but the record's own row is excluded so saving an unchanged code
   * is not a conflict with itself. Returns null when nothing was typed, meaning
   * "leave the stored code alone" — the master-data form posts "" for an untouched
   * optional field, and for these masters "" must not mean "clear the identity".
   */
  async editedCode(
    master: string,
    supplied: string | undefined | null,
    current: string | null | undefined,
    tenantId: string,
    companyId?: string | null,
    type?: string,
  ): Promise<string | null> {
    if (!supplied?.trim()) return null;
    const code = supplied.trim().toUpperCase();
    if (code === current) return null;
    return this.manualCode(master, code, tenantId, companyId, type);
  }

  /**
   * Locks the series row (SELECT ... FOR UPDATE) without incrementing it.
   * For callers whose sequence number isn't the row's own current_seq — e.g.
   * hierarchical location codes, which count siblings under a specific
   * parent rather than a company-wide counter — this gives the same
   * concurrency guard generateNext() gives (two concurrent creates of the
   * same series serialize on this row) while leaving current_seq /
   * last_generated_code untouched. Pass `executor` (a transaction handle)
   * so the lock is held until the caller's insert commits.
   */
  async lockSeries(
    seriesCode: string,
    tenantId: string,
    companyId?: string | null,
    executor: MySql2Database<typeof schema> = this.db,
  ): Promise<typeof schema.noSeriesMaster.$inferSelect> {
    const conditions = [
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      eq(schema.noSeriesMaster.series_code, seriesCode),
      isNull(schema.noSeriesMaster.deleted_at),
    ];
    conditions.push(
      companyCondition(schema.noSeriesMaster.company_id, companyId)
    );

    const [series] = await executor
      .select()
      .from(schema.noSeriesMaster)
      .where(and(...conditions))
      .orderBy(sql`${schema.noSeriesMaster.company_id} IS NULL`)
      .limit(1)
      .for('update');

    if (!series) {
      throw new NotFoundException(`Number series '${seriesCode}' not found for this tenant/company scope.`);
    }
    if (!series.is_active) {
      throw new BadRequestException(`Number series '${seriesCode}' is inactive.`);
    }
    return series;
  }

  async create(dto: CreateNumberSeriesDto, tenantId: string, userPayload?: any) {
    const duplicateConditions = [
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      eq(schema.noSeriesMaster.series_code, dto.series_code.toUpperCase()),
      isNull(schema.noSeriesMaster.deleted_at),
    ];
    duplicateConditions.push(
      dto.company_id ? eq(schema.noSeriesMaster.company_id, dto.company_id) : isNull(schema.noSeriesMaster.company_id)
    );

    const existing = await this.db.select().from(schema.noSeriesMaster).where(and(...duplicateConditions)).limit(1);
    if (existing.length > 0) {
      throw new ConflictException(`Number series '${dto.series_code}' already exists in this scope.`);
    }

    // NOB/LOB are no longer asked on the form — derive them from the company's
    // operational areas (an explicit dto value, if a caller still sends one,
    // wins). no_series_master.nob_id/lob_id are nullable, so an ambiguous
    // company simply stores null rather than blocking the create.
    const resolvedNobLob = await this.nobLobResolution.resolve(tenantId, dto.company_id, {
      nob_id: dto.nob_id,
      lob_id: dto.lob_id,
    });

    const seriesId = randomUUID();
    const newSeries = {
      series_id: seriesId,
      tenant_id: tenantId,
      company_id: dto.company_id || null,
      nob_id: resolvedNobLob.nob_id,
      lob_id: resolvedNobLob.lob_id,
      series_code: dto.series_code.toUpperCase(),
      series_name: dto.series_name,
      document_type: dto.document_type,
      prefix: dto.prefix || null,
      date_format: dto.date_format || null,
      separator: dto.separator || '-',
      seq_length: dto.seq_length,
      current_seq: 0,
      last_generated_code: null,
      reset_frequency: dto.reset_frequency || 'NEVER',
      allow_manual: dto.allow_manual ?? false,
      is_active: true,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.noSeriesMaster).values(newSeries);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'no_series_master',
      entityId: seriesId,
      newValues: newSeries,
    });

    return this.findOne(seriesId);
  }

  async findOne(id: string) {
    const [series] = await this.db
      .select()
      .from(schema.noSeriesMaster)
      .where(and(eq(schema.noSeriesMaster.series_id, id), isNull(schema.noSeriesMaster.deleted_at)))
      .limit(1);

    if (!series) {
      throw new NotFoundException(`Number series with ID '${id}' not found.`);
    }
    return series;
  }

  async findAll(query: QueryNumberSeriesDto, tenantId: string) {
    // No isNull(deleted_at) filter — list view shows both Active/Inactive states (toggle switch) so a blocked row can be found again and restored.
    const conditions: any[] = [
      eq(schema.noSeriesMaster.tenant_id, tenantId),
    ];

    conditions.push(...masterScopeConditions(this.cls, schema.noSeriesMaster, query.companyId));
    if (query.documentType) conditions.push(eq(schema.noSeriesMaster.document_type, query.documentType));
    if (query.isActive !== undefined) conditions.push(eq(schema.noSeriesMaster.is_active, query.isActive));
    if (query.search) {
      conditions.push(
        or(
          like(schema.noSeriesMaster.series_code, `%${query.search}%`),
          like(schema.noSeriesMaster.series_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db.select().from(schema.noSeriesMaster).where(and(...conditions)).limit(limit).offset(offset);
  }

  async update(id: string, dto: UpdateNumberSeriesDto, tenantId: string, userPayload?: any) {
    const series = await this.findOne(id);

    const updates: any = { updated_by: userPayload?.userId || null };
    if (dto.series_name !== undefined) updates.series_name = dto.series_name;
    if (dto.document_type !== undefined) updates.document_type = dto.document_type;
    if (dto.prefix !== undefined) updates.prefix = dto.prefix;
    if (dto.date_format !== undefined) updates.date_format = dto.date_format;
    if (dto.separator !== undefined) updates.separator = dto.separator;
    if (dto.seq_length !== undefined) updates.seq_length = dto.seq_length;
    if (dto.reset_frequency !== undefined) updates.reset_frequency = dto.reset_frequency;
    if (dto.allow_manual !== undefined) updates.allow_manual = dto.allow_manual;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    await this.db.update(schema.noSeriesMaster).set(updates).where(eq(schema.noSeriesMaster.series_id, id));

    await this.auditService.log({
      tenantId,
      companyId: series.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'no_series_master',
      entityId: id,
      oldValues: series,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const series = await this.findOne(id);

    await this.db
      .update(schema.noSeriesMaster)
      .set({ is_active: false, deleted_at: toMysqlTimestamp() as any, updated_by: userPayload?.userId || null })
      .where(eq(schema.noSeriesMaster.series_id, id));

    await this.auditService.log({
      tenantId,
      companyId: series.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'no_series_master',
      entityId: id,
      oldValues: series,
    });

    return { success: true, message: `Number series '${series.series_code}' has been deactivated.` };
  }
}
