import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateCostCenterDto, UpdateCostCenterDto, QueryCostCenterDto } from './dto/cost-center.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class CostCenterService {
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

  async create(dto: CreateCostCenterDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check unique code within company scope
    const existing = await this.db
      .select()
      .from(schema.costCenterMaster)
      .where(
        and(
          eq(schema.costCenterMaster.tenant_id, tenantId),
          eq(schema.costCenterMaster.company_id, dto.company_id),
          eq(schema.costCenterMaster.cost_center_code, dto.cost_center_code.toUpperCase()),
          isNull(schema.costCenterMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Cost Center with code '${dto.cost_center_code}' already exists in this company.`);
    }

    // 3. Verify parent cost center if specified
    if (dto.parent_cost_center_id) {
      const [parent] = await this.db
        .select()
        .from(schema.costCenterMaster)
        .where(
          and(
            eq(schema.costCenterMaster.cost_center_id, dto.parent_cost_center_id),
            isNull(schema.costCenterMaster.deleted_at)
          )
        )
        .limit(1);

      if (!parent) {
        throw new NotFoundException(`Parent Cost Center with ID '${dto.parent_cost_center_id}' not found.`);
      }
    }

    const costCenterId = randomUUID();
    const newCC = {
      cost_center_id: costCenterId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      cost_center_code: dto.cost_center_code.toUpperCase(),
      cost_center_name: dto.cost_center_name,
      cost_center_type: dto.cost_center_type,
      parent_cost_center_id: dto.parent_cost_center_id || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.costCenterMaster).values(newCC);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'cost_center_master',
      entityId: costCenterId,
      newValues: newCC,
    });

    return this.findOne(costCenterId);
  }

  async findOne(id: string) {
    const [cc] = await this.db
      .select()
      .from(schema.costCenterMaster)
      .where(and(eq(schema.costCenterMaster.cost_center_id, id), isNull(schema.costCenterMaster.deleted_at)))
      .limit(1);

    if (!cc) {
      throw new NotFoundException(`Cost Center with ID '${id}' not found.`);
    }

    return cc;
  }

  async findAll(query: QueryCostCenterDto, tenantId: string) {
    // No isNull(deleted_at) filter — list view shows both Active/Inactive states (toggle switch) so a blocked row can be found again and restored.
    const conditions: any[] = [
      eq(schema.costCenterMaster.tenant_id, tenantId),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.costCenterMaster.company_id, query.companyId));
    }
    if (query.costCenterType) {
      conditions.push(eq(schema.costCenterMaster.cost_center_type, query.costCenterType));
    }
    if (query.parentCostCenterId) {
      conditions.push(eq(schema.costCenterMaster.parent_cost_center_id, query.parentCostCenterId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.costCenterMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.costCenterMaster.cost_center_code, `%${query.search}%`),
          like(schema.costCenterMaster.cost_center_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.costCenterMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateCostCenterDto, tenantId: string, userPayload?: any) {
    const cc = await this.findOne(id);

    if (dto.cost_center_code && dto.cost_center_code.toUpperCase() !== cc.cost_center_code) {
      const existing = await this.db
        .select()
        .from(schema.costCenterMaster)
        .where(
          and(
            eq(schema.costCenterMaster.tenant_id, tenantId),
            eq(schema.costCenterMaster.company_id, cc.company_id),
            eq(schema.costCenterMaster.cost_center_code, dto.cost_center_code.toUpperCase()),
            ne(schema.costCenterMaster.cost_center_id, id),
            isNull(schema.costCenterMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Cost Center with code '${dto.cost_center_code}' already exists in this company.`);
      }
    }

    if (dto.parent_cost_center_id && dto.parent_cost_center_id !== cc.parent_cost_center_id) {
      if (dto.parent_cost_center_id === id) {
        throw new ConflictException('A Cost Center cannot be its own parent.');
      }

      const [parent] = await this.db
        .select()
        .from(schema.costCenterMaster)
        .where(
          and(
            eq(schema.costCenterMaster.cost_center_id, dto.parent_cost_center_id),
            isNull(schema.costCenterMaster.deleted_at)
          )
        )
        .limit(1);

      if (!parent) {
        throw new NotFoundException(`Parent Cost Center with ID '${dto.parent_cost_center_id}' not found.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.cost_center_code !== undefined) updates.cost_center_code = dto.cost_center_code.toUpperCase();
    if (dto.cost_center_name !== undefined) updates.cost_center_name = dto.cost_center_name;
    if (dto.cost_center_type !== undefined) updates.cost_center_type = dto.cost_center_type;
    if (dto.parent_cost_center_id !== undefined) updates.parent_cost_center_id = dto.parent_cost_center_id;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.costCenterMaster)
      .set(updates)
      .where(eq(schema.costCenterMaster.cost_center_id, id));

    await this.auditService.log({
      tenantId,
      companyId: cc.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'cost_center_master',
      entityId: id,
      oldValues: cc,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const cc = await this.findOne(id);

    // Verify no sub-cost centers exist linking to this one
    const subCCs = await this.db
      .select()
      .from(schema.costCenterMaster)
      .where(
        and(
          eq(schema.costCenterMaster.parent_cost_center_id, id),
          isNull(schema.costCenterMaster.deleted_at)
        )
      )
      .limit(1);

    if (subCCs.length > 0) {
      throw new ConflictException('Cannot delete a Cost Center that has active sub-cost centers.');
    }

    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.costCenterMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.costCenterMaster.cost_center_id, id));

    await this.auditService.log({
      tenantId,
      companyId: cc.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'cost_center_master',
      entityId: id,
      oldValues: cc,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Cost Center '${cc.cost_center_name}' soft-deleted successfully.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [cc] = await this.db
      .select()
      .from(schema.costCenterMaster)
      .where(eq(schema.costCenterMaster.cost_center_id, id))
      .limit(1);

    if (!cc) {
      throw new NotFoundException(`Cost Center with ID '${id}' not found.`);
    }

    if (!cc.deleted_at) {
      return this.findOne(id);
    }

    // Verify parent is not deleted
    if (cc.parent_cost_center_id) {
      const [parent] = await this.db
        .select()
        .from(schema.costCenterMaster)
        .where(
          and(
            eq(schema.costCenterMaster.cost_center_id, cc.parent_cost_center_id),
            isNull(schema.costCenterMaster.deleted_at)
          )
        )
        .limit(1);

      if (!parent) {
        throw new ConflictException('Cannot restore a Cost Center whose parent is deleted or inactive. Restore parent first.');
      }
    }

    await this.db
      .update(schema.costCenterMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.costCenterMaster.cost_center_id, id));

    await this.auditService.log({
      tenantId,
      companyId: cc.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'cost_center_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
