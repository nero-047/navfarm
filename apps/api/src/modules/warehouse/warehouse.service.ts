import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateWarehouseDto, UpdateWarehouseDto, QueryWarehouseDto } from './dto/warehouse.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class WarehouseService {
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

  async create(dto: CreateWarehouseDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Verify farm exists (if provided)
    if (dto.farm_id) {
      const [farm] = await this.db
        .select()
        .from(schema.farmMaster)
        .where(and(eq(schema.farmMaster.farm_id, dto.farm_id), isNull(schema.farmMaster.deleted_at)))
        .limit(1);

      if (!farm) {
        throw new NotFoundException(`Farm with ID '${dto.farm_id}' not found.`);
      }
    }

    // 3. Check duplicate warehouse code within company scope
    const existing = await this.db
      .select()
      .from(schema.warehouseMaster)
      .where(
        and(
          eq(schema.warehouseMaster.tenant_id, tenantId),
          eq(schema.warehouseMaster.company_id, dto.company_id),
          eq(schema.warehouseMaster.warehouse_code, dto.warehouse_code.toUpperCase()),
          isNull(schema.warehouseMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Warehouse with code '${dto.warehouse_code}' already exists in this company.`);
    }

    const warehouseId = randomUUID();
    const newWarehouse = {
      warehouse_id: warehouseId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      farm_id: dto.farm_id || null,
      warehouse_code: dto.warehouse_code.toUpperCase(),
      warehouse_name: dto.warehouse_name,
      warehouse_type: dto.warehouse_type,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.warehouseMaster).values(newWarehouse);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'warehouse_master',
      entityId: warehouseId,
      newValues: newWarehouse,
    });

    return this.findOne(warehouseId);
  }

  async findOne(id: string) {
    const [warehouse] = await this.db
      .select()
      .from(schema.warehouseMaster)
      .where(and(eq(schema.warehouseMaster.warehouse_id, id), isNull(schema.warehouseMaster.deleted_at)))
      .limit(1);

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID '${id}' not found.`);
    }

    return warehouse;
  }

  async findAll(query: QueryWarehouseDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.warehouseMaster.tenant_id, tenantId),
      isNull(schema.warehouseMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.warehouseMaster.company_id, query.companyId));
    }
    if (query.farmId) {
      conditions.push(eq(schema.warehouseMaster.farm_id, query.farmId));
    }
    if (query.warehouseType) {
      conditions.push(eq(schema.warehouseMaster.warehouse_type, query.warehouseType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.warehouseMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.warehouseMaster.warehouse_code, `%${query.search}%`),
          like(schema.warehouseMaster.warehouse_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.warehouseMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateWarehouseDto, tenantId: string, userPayload?: any) {
    const warehouse = await this.findOne(id);

    if (dto.farm_id) {
      const [farm] = await this.db
        .select()
        .from(schema.farmMaster)
        .where(and(eq(schema.farmMaster.farm_id, dto.farm_id), isNull(schema.farmMaster.deleted_at)))
        .limit(1);

      if (!farm) {
        throw new NotFoundException(`Farm with ID '${dto.farm_id}' not found.`);
      }
    }

    if (dto.warehouse_code && dto.warehouse_code.toUpperCase() !== warehouse.warehouse_code) {
      const existing = await this.db
        .select()
        .from(schema.warehouseMaster)
        .where(
          and(
            eq(schema.warehouseMaster.tenant_id, tenantId),
            eq(schema.warehouseMaster.company_id, warehouse.company_id),
            eq(schema.warehouseMaster.warehouse_code, dto.warehouse_code.toUpperCase()),
            ne(schema.warehouseMaster.warehouse_id, id),
            isNull(schema.warehouseMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Warehouse with code '${dto.warehouse_code}' already exists in this company.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.farm_id !== undefined) updates.farm_id = dto.farm_id;
    if (dto.warehouse_code !== undefined) updates.warehouse_code = dto.warehouse_code.toUpperCase();
    if (dto.warehouse_name !== undefined) updates.warehouse_name = dto.warehouse_name;
    if (dto.warehouse_type !== undefined) updates.warehouse_type = dto.warehouse_type;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.warehouseMaster)
      .set(updates)
      .where(eq(schema.warehouseMaster.warehouse_id, id));

    await this.auditService.log({
      tenantId,
      companyId: warehouse.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'warehouse_master',
      entityId: id,
      oldValues: warehouse,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const warehouse = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.warehouseMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.warehouseMaster.warehouse_id, id));

    await this.auditService.log({
      tenantId,
      companyId: warehouse.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'warehouse_master',
      entityId: id,
      oldValues: warehouse,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Warehouse '${warehouse.warehouse_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [warehouse] = await this.db
      .select()
      .from(schema.warehouseMaster)
      .where(eq(schema.warehouseMaster.warehouse_id, id))
      .limit(1);

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID '${id}' not found.`);
    }

    if (!warehouse.deleted_at) {
      return warehouse;
    }

    await this.db
      .update(schema.warehouseMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.warehouseMaster.warehouse_id, id));

    await this.auditService.log({
      tenantId,
      companyId: warehouse.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'warehouse_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
