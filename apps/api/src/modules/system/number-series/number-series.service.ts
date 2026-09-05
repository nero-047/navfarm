import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateNumberSeriesDto, UpdateNumberSeriesDto, QueryNumberSeriesDto } from './dto/number-series.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => date.toISOString().slice(0, 19).replace('T', ' ');

/** Formats a date segment per a simple 'YYYY' / 'YY' token — the only two the spec's examples use. */
function formatDateSegment(dateFormat: string, now: Date): string {
  const year = now.getFullYear();
  if (dateFormat === 'YY') return String(year).slice(-2);
  return String(year); // 'YYYY' and anything else falls back to the 4-digit year.
}

@Injectable()
export class NumberSeriesService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  /**
   * Materialise an independent company counter from a tenant template. This is
   * used by company-owned master records whose identities must never share a
   * counter with another company. `loadExistingCodes` lets the caller expose
   * its own master table without coupling this system service to every domain.
   *
   * The fallback keeps upgraded tenants working before the seed command is
   * rerun; new tenants receive the same definition from SYSTEM_NO_SERIES_SEED.
   */
  async ensureCompanySeries(
    tenantId: string,
    companyId: string,
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
      eq(schema.noSeriesMaster.company_id, companyId),
      eq(schema.noSeriesMaster.series_code, defaults.seriesCode),
      isNull(schema.noSeriesMaster.deleted_at),
    )).limit(1);
    if (existing) return;

    const [template] = await this.db.select().from(schema.noSeriesMaster).where(and(
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      isNull(schema.noSeriesMaster.company_id),
      eq(schema.noSeriesMaster.series_code, defaults.seriesCode),
      isNull(schema.noSeriesMaster.deleted_at),
    )).limit(1);

    const prefix = template?.prefix || defaults.prefix;
    const separator = template?.separator || defaults.separator || '-';
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
      series_name: template?.series_name || defaults.seriesName,
      document_type: template?.document_type || defaults.documentType,
      prefix,
      date_format: template?.date_format || null,
      separator,
      seq_length: template?.seq_length || defaults.seqLength,
      current_seq: currentSeq,
      reset_frequency: template?.reset_frequency || 'NEVER',
      allow_manual: false,
    }).onDuplicateKeyUpdate({ set: { series_name: template?.series_name || defaults.seriesName } });
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
    executor: MySql2Database<typeof schema> = this.db,
  ): Promise<string> {
    const conditions = [
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      eq(schema.noSeriesMaster.series_code, seriesCode),
      isNull(schema.noSeriesMaster.deleted_at),
    ];
    // A company-specific row (if a company overrode the tenant-wide default) wins over
    // the shared one — same wildcard convention findAll() below uses for filtering.
    conditions.push(
      companyId
        ? or(eq(schema.noSeriesMaster.company_id, companyId), isNull(schema.noSeriesMaster.company_id))!
        : isNull(schema.noSeriesMaster.company_id)
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
    const lastUpdated = new Date(series.updated_at);
    const periodRolledOver =
      (series.reset_frequency === 'YEARLY' && now.getFullYear() !== lastUpdated.getFullYear()) ||
      (series.reset_frequency === 'MONTHLY' &&
        (now.getFullYear() !== lastUpdated.getFullYear() || now.getMonth() !== lastUpdated.getMonth()));

    const nextSeq = (periodRolledOver ? 0 : series.current_seq) + 1;

    const parts: string[] = [];
    if (series.prefix) parts.push(series.prefix);
    if (series.date_format) parts.push(formatDateSegment(series.date_format, now));
    parts.push(String(nextSeq).padStart(series.seq_length, '0'));
    const formattedCode = parts.join(series.separator || '-');

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
        companyId
          ? or(eq(schema.noSeriesMaster.company_id, companyId), isNull(schema.noSeriesMaster.company_id))!
          : isNull(schema.noSeriesMaster.company_id)
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
      companyId
        ? or(eq(schema.noSeriesMaster.company_id, companyId), isNull(schema.noSeriesMaster.company_id))!
        : isNull(schema.noSeriesMaster.company_id)
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

    const seriesId = randomUUID();
    const newSeries = {
      series_id: seriesId,
      tenant_id: tenantId,
      company_id: dto.company_id || null,
      nob_id: dto.nob_id || null,
      lob_id: dto.lob_id || null,
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

    if (query.companyId) {
      conditions.push(or(eq(schema.noSeriesMaster.company_id, query.companyId), isNull(schema.noSeriesMaster.company_id)));
    }
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
