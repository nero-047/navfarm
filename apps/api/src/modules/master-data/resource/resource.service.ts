import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { 
  CreateResourceDto, 
  UpdateResourceDto, 
  QueryResourceDto,
  CreateMaintenanceLogDto,
  UpdateMaintenanceLogDto
} from './dto/resource.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class ResourceService {
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

  // --- Resource CRUD ---

  async create(dto: CreateResourceDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check duplicate resource code within the company scope
    const existing = await this.db
      .select()
      .from(schema.resourceMaster)
      .where(
        and(
          eq(schema.resourceMaster.tenant_id, tenantId),
          eq(schema.resourceMaster.company_id, dto.company_id),
          eq(schema.resourceMaster.resource_code, dto.resource_code.toUpperCase()),
          isNull(schema.resourceMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Resource with code '${dto.resource_code}' already exists in this company.`);
    }

    const resourceId = randomUUID();
    const newResource = {
      resource_id: resourceId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      resource_code: dto.resource_code.toUpperCase(),
      resource_name: dto.resource_name,
      resource_type: dto.resource_type,
      capacity: dto.capacity?.toString() || null,
      unit: dto.unit || null,
      cost_rate: dto.cost_rate?.toString() || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.resourceMaster).values(newResource);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'resource_master',
      entityId: resourceId,
      newValues: newResource,
    });

    return this.findOne(resourceId);
  }

  async findOne(id: string) {
    const [resource] = await this.db
      .select()
      .from(schema.resourceMaster)
      .where(and(eq(schema.resourceMaster.resource_id, id), isNull(schema.resourceMaster.deleted_at)))
      .limit(1);

    if (!resource) {
      throw new NotFoundException(`Resource with ID '${id}' not found.`);
    }

    return resource;
  }

  async findAll(query: QueryResourceDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.resourceMaster.tenant_id, tenantId),
      isNull(schema.resourceMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.resourceMaster.company_id, query.companyId));
    }
    if (query.resourceType) {
      conditions.push(eq(schema.resourceMaster.resource_type, query.resourceType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.resourceMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.resourceMaster.resource_code, `%${query.search}%`),
          like(schema.resourceMaster.resource_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.resourceMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateResourceDto, tenantId: string, userPayload?: any) {
    const resource = await this.findOne(id);

    if (dto.resource_code && dto.resource_code.toUpperCase() !== resource.resource_code) {
      const existing = await this.db
        .select()
        .from(schema.resourceMaster)
        .where(
          and(
            eq(schema.resourceMaster.tenant_id, tenantId),
            eq(schema.resourceMaster.company_id, resource.company_id),
            eq(schema.resourceMaster.resource_code, dto.resource_code.toUpperCase()),
            ne(schema.resourceMaster.resource_id, id),
            isNull(schema.resourceMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Resource with code '${dto.resource_code}' already exists in this company.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.resource_code !== undefined) updates.resource_code = dto.resource_code.toUpperCase();
    if (dto.resource_name !== undefined) updates.resource_name = dto.resource_name;
    if (dto.resource_type !== undefined) updates.resource_type = dto.resource_type;
    if (dto.capacity !== undefined) updates.capacity = dto.capacity?.toString() || null;
    if (dto.unit !== undefined) updates.unit = dto.unit;
    if (dto.cost_rate !== undefined) updates.cost_rate = dto.cost_rate?.toString() || null;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.resourceMaster)
      .set(updates)
      .where(eq(schema.resourceMaster.resource_id, id));

    await this.auditService.log({
      tenantId,
      companyId: resource.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'resource_master',
      entityId: id,
      oldValues: resource,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const resource = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.resourceMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.resourceMaster.resource_id, id));

    await this.auditService.log({
      tenantId,
      companyId: resource.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'resource_master',
      entityId: id,
      oldValues: resource,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Resource '${resource.resource_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [resource] = await this.db
      .select()
      .from(schema.resourceMaster)
      .where(eq(schema.resourceMaster.resource_id, id))
      .limit(1);

    if (!resource) {
      throw new NotFoundException(`Resource with ID '${id}' not found.`);
    }

    if (!resource.deleted_at) {
      return resource;
    }

    await this.db
      .update(schema.resourceMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.resourceMaster.resource_id, id));

    await this.auditService.log({
      tenantId,
      companyId: resource.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'resource_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }

  // --- Maintenance Logs ---

  async createMaintenanceLog(resourceId: string, dto: CreateMaintenanceLogDto, tenantId: string, userPayload?: any) {
    const resource = await this.findOne(resourceId);

    const logId = randomUUID();
    const newLog = {
      log_id: logId,
      tenant_id: tenantId,
      company_id: resource.company_id,
      resource_id: resourceId,
      maintenance_date: dto.maintenance_date,
      maintenance_type: dto.maintenance_type,
      description: dto.description || null,
      cost: dto.cost?.toString() || null,
      performed_by: dto.performed_by || null,
      status: dto.status || 'COMPLETED',
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
    };

    await this.db.insert(schema.resourceMaintenanceLog).values(newLog);

    await this.auditService.log({
      tenantId,
      companyId: resource.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'resource_maintenance_log',
      entityId: logId,
      newValues: newLog,
    });

    return this.findOneMaintenanceLog(logId);
  }

  async findOneMaintenanceLog(logId: string) {
    const [log] = await this.db
      .select()
      .from(schema.resourceMaintenanceLog)
      .where(and(eq(schema.resourceMaintenanceLog.log_id, logId), isNull(schema.resourceMaintenanceLog.deleted_at)))
      .limit(1);

    if (!log) {
      throw new NotFoundException(`Maintenance log with ID '${logId}' not found.`);
    }

    return log;
  }

  async findAllMaintenanceLogs(resourceId: string, tenantId: string) {
    await this.findOne(resourceId);

    return this.db
      .select()
      .from(schema.resourceMaintenanceLog)
      .where(
        and(
          eq(schema.resourceMaintenanceLog.tenant_id, tenantId),
          eq(schema.resourceMaintenanceLog.resource_id, resourceId),
          isNull(schema.resourceMaintenanceLog.deleted_at)
        )
      );
  }

  async updateMaintenanceLog(logId: string, dto: UpdateMaintenanceLogDto, tenantId: string, userPayload?: any) {
    const log = await this.findOneMaintenanceLog(logId);

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.maintenance_date !== undefined) updates.maintenance_date = dto.maintenance_date;
    if (dto.maintenance_type !== undefined) updates.maintenance_type = dto.maintenance_type;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.cost !== undefined) updates.cost = dto.cost?.toString() || null;
    if (dto.performed_by !== undefined) updates.performed_by = dto.performed_by;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.resourceMaintenanceLog)
      .set(updates)
      .where(eq(schema.resourceMaintenanceLog.log_id, logId));

    await this.auditService.log({
      tenantId,
      companyId: log.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'resource_maintenance_log',
      entityId: logId,
      oldValues: log,
      newValues: updates,
    });

    return this.findOneMaintenanceLog(logId);
  }

  async removeMaintenanceLog(logId: string, tenantId: string, userPayload?: any) {
    const log = await this.findOneMaintenanceLog(logId);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.resourceMaintenanceLog)
      .set({
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.resourceMaintenanceLog.log_id, logId));

    await this.auditService.log({
      tenantId,
      companyId: log.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'resource_maintenance_log',
      entityId: logId,
      oldValues: log,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Maintenance log has been soft-deleted.` };
  }
}
