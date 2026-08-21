import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, or, like } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { QueryAlertDto, MarkAllAlertsReadDto } from './dto/alert.dto';

const toMysqlTimestamp = (date: Date = new Date()) => date.toISOString().slice(0, 19).replace('T', ' ');

@Injectable()
export class AlertService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async findAll(query: QueryAlertDto, tenantId: string) {
    const conditions: any[] = [eq(schema.notificationAlertLog.tenant_id, tenantId)];

    if (query.companyId) conditions.push(eq(schema.notificationAlertLog.company_id, query.companyId));
    if (query.batchId) conditions.push(eq(schema.notificationAlertLog.batch_id, query.batchId));
    if (query.severity) conditions.push(eq(schema.notificationAlertLog.severity, query.severity));
    if (query.isRead !== undefined) conditions.push(eq(schema.notificationAlertLog.is_read, query.isRead));

    if (query.search) {
      const s = `%${query.search.trim()}%`;
      conditions.push(
        or(
          like(schema.notificationAlertLog.title, s),
          like(schema.notificationAlertLog.parameter_name, s),
          like(schema.notificationAlertLog.message, s)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const rows = await this.db
      .select({
        alert_id: schema.notificationAlertLog.alert_id,
        tenant_id: schema.notificationAlertLog.tenant_id,
        company_id: schema.notificationAlertLog.company_id,
        lob_id: schema.notificationAlertLog.lob_id,
        batch_id: schema.notificationAlertLog.batch_id,
        spl_id: schema.notificationAlertLog.spl_id,
        transaction_id: schema.notificationAlertLog.transaction_id,
        alert_type: schema.notificationAlertLog.alert_type,
        severity: schema.notificationAlertLog.severity,
        title: schema.notificationAlertLog.title,
        message: schema.notificationAlertLog.message,
        parameter_name: schema.notificationAlertLog.parameter_name,
        kpi_mode: schema.notificationAlertLog.kpi_mode,
        expected_value: schema.notificationAlertLog.expected_value,
        actual_value: schema.notificationAlertLog.actual_value,
        deviation_amount: schema.notificationAlertLog.deviation_amount,
        deviation_pct: schema.notificationAlertLog.deviation_pct,
        kpi_min: schema.notificationAlertLog.kpi_min,
        kpi_max: schema.notificationAlertLog.kpi_max,
        is_read: schema.notificationAlertLog.is_read,
        read_by: schema.notificationAlertLog.read_by,
        read_at: schema.notificationAlertLog.read_at,
        created_at: schema.notificationAlertLog.created_at,
        batch_no: schema.batchHeader.batch_no,
        batch_status: schema.batchHeader.status,
        current_stage_code: schema.batchHeader.current_stage_code,
      })
      .from(schema.notificationAlertLog)
      .leftJoin(schema.batchHeader, eq(schema.notificationAlertLog.batch_id, schema.batchHeader.batch_id))
      .where(and(...conditions))
      .orderBy(desc(schema.notificationAlertLog.created_at))
      .limit(limit)
      .offset(offset);

    return rows;
  }

  // Scoped by company_id, not just alert_id: within one tenant's physical DB,
  // alerts span every company the tenant has — without this check a user
  // could mark another company's alert read just by guessing/enumerating IDs.
  async markRead(id: string, companyId: string, userPayload?: any) {
    const [alert] = await this.db
      .select()
      .from(schema.notificationAlertLog)
      .where(and(eq(schema.notificationAlertLog.alert_id, id), eq(schema.notificationAlertLog.company_id, companyId)))
      .limit(1);

    if (!alert) {
      throw new NotFoundException(`Alert with ID '${id}' not found.`);
    }

    await this.db
      .update(schema.notificationAlertLog)
      .set({ is_read: true, read_by: userPayload?.userId || null, read_at: toMysqlTimestamp() as any })
      .where(and(eq(schema.notificationAlertLog.alert_id, id), eq(schema.notificationAlertLog.company_id, companyId)));

    return { ...alert, is_read: true, read_by: userPayload?.userId || null, read_at: new Date().toISOString() };
  }

  async markAllRead(dto: MarkAllAlertsReadDto, tenantId: string, userPayload?: any) {
    const conditions = [
      eq(schema.notificationAlertLog.tenant_id, tenantId),
      eq(schema.notificationAlertLog.company_id, dto.companyId),
      eq(schema.notificationAlertLog.is_read, false),
    ];

    if (dto.batchId) {
      conditions.push(eq(schema.notificationAlertLog.batch_id, dto.batchId));
    }

    await this.db
      .update(schema.notificationAlertLog)
      .set({
        is_read: true,
        read_by: userPayload?.userId || null,
        read_at: toMysqlTimestamp() as any,
      })
      .where(and(...conditions));

    return { success: true, message: 'All matching alerts marked as read.' };
  }
}
