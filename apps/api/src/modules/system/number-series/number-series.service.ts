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
    const conditions: any[] = [
      eq(schema.noSeriesMaster.tenant_id, tenantId),
      isNull(schema.noSeriesMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(or(eq(schema.noSeriesMaster.company_id, query.companyId), isNull(schema.noSeriesMaster.company_id)));
    }
    if (query.documentType) conditions.push(eq(schema.noSeriesMaster.document_type, query.documentType));
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
