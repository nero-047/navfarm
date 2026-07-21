import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';

@Injectable()
export class AuditLogService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async log(
    params: {
      tenantId: string;
      companyId?: string;
      userId?: string;
      action: string;
      entityName: string;
      entityId: string;
      oldValues?: any;
      newValues?: any;
      ipAddress?: string;
      userAgent?: string;
    },
    tx?: any,
  ) {
    const dbClient = tx || this.db;
    const auditId = randomUUID();
    await dbClient
      .insert(schema.auditLog)
      .values({
        audit_id: auditId,
        tenant_id: params.tenantId,
        company_id: params.companyId || null,
        user_id: params.userId || null,
        action: params.action,
        entity_name: params.entityName,
        entity_id: params.entityId,
        old_values: params.oldValues || null,
        new_values: params.newValues || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      });
    
    const [entry] = await dbClient
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.audit_id, auditId))
      .limit(1);
    return entry;
  }

  async findLogs(filters: {
    tenantId?: string;
    companyId?: string;
    userId?: string;
    action?: string;
    entityName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: any[] = [];

    if (filters.tenantId) {
      conditions.push(eq(schema.auditLog.tenant_id, filters.tenantId));
    }
    if (filters.companyId) {
      conditions.push(eq(schema.auditLog.company_id, filters.companyId));
    }
    if (filters.userId) {
      conditions.push(eq(schema.auditLog.user_id, filters.userId));
    }
    if (filters.action) {
      conditions.push(eq(schema.auditLog.action, filters.action));
    }
    if (filters.entityName) {
      conditions.push(eq(schema.auditLog.entity_name, filters.entityName));
    }
    if (filters.startDate) {
      conditions.push(gte(schema.auditLog.created_at, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(schema.auditLog.created_at, filters.endDate));
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    return this.db
      .select({
        audit_id: schema.auditLog.audit_id,
        tenant_id: schema.auditLog.tenant_id,
        company_id: schema.auditLog.company_id,
        user_id: schema.auditLog.user_id,
        action: schema.auditLog.action,
        entity_name: schema.auditLog.entity_name,
        entity_id: schema.auditLog.entity_id,
        old_values: schema.auditLog.old_values,
        new_values: schema.auditLog.new_values,
        ip_address: schema.auditLog.ip_address,
        user_agent: schema.auditLog.user_agent,
        created_at: schema.auditLog.created_at,
        user_name: schema.userMaster.full_name,
        user_email: schema.userMaster.email,
      })
      .from(schema.auditLog)
      .leftJoin(schema.userMaster, eq(schema.auditLog.user_id, schema.userMaster.user_id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.auditLog.created_at))
      .limit(limit)
      .offset(offset);
  }
}
