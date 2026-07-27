import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateFarmDto, UpdateFarmDto, QueryFarmDto } from './dto/farm.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class FarmService {
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

  async create(dto: CreateFarmDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check for duplicate farm code within company
    const existing = await this.db
      .select()
      .from(schema.farmMaster)
      .where(
        and(
          eq(schema.farmMaster.tenant_id, tenantId),
          eq(schema.farmMaster.company_id, dto.company_id),
          eq(schema.farmMaster.farm_code, dto.farm_code.toUpperCase()),
          isNull(schema.farmMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Farm with code '${dto.farm_code}' already exists in this company.`);
    }

    const farmId = randomUUID();
    const newFarm = {
      farm_id: farmId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      farm_code: dto.farm_code.toUpperCase(),
      farm_name: dto.farm_name,
      farm_type: dto.farm_type,
      capacity: dto.capacity || 0,
      address_line1: dto.address_line1 || null,
      city: dto.city || null,
      state: dto.state || null,
      country: dto.country || null,
      pincode: dto.pincode || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.farmMaster).values(newFarm);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'farm_master',
      entityId: farmId,
      newValues: newFarm,
    });

    return this.findOne(farmId);
  }

  async findOne(id: string) {
    const [farm] = await this.db
      .select()
      .from(schema.farmMaster)
      .where(and(eq(schema.farmMaster.farm_id, id), isNull(schema.farmMaster.deleted_at)))
      .limit(1);

    if (!farm) {
      throw new NotFoundException(`Farm with ID '${id}' not found.`);
    }

    return farm;
  }

  async findAll(query: QueryFarmDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.farmMaster.tenant_id, tenantId),
      isNull(schema.farmMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.farmMaster.company_id, query.companyId));
    }
    if (query.farmType) {
      conditions.push(eq(schema.farmMaster.farm_type, query.farmType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.farmMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.farmMaster.farm_code, `%${query.search}%`),
          like(schema.farmMaster.farm_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.farmMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateFarmDto, tenantId: string, userPayload?: any) {
    const farm = await this.findOne(id);

    if (dto.farm_code && dto.farm_code.toUpperCase() !== farm.farm_code) {
      const existing = await this.db
        .select()
        .from(schema.farmMaster)
        .where(
          and(
            eq(schema.farmMaster.tenant_id, tenantId),
            eq(schema.farmMaster.company_id, farm.company_id),
            eq(schema.farmMaster.farm_code, dto.farm_code.toUpperCase()),
            ne(schema.farmMaster.farm_id, id),
            isNull(schema.farmMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Farm with code '${dto.farm_code}' already exists in this company.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.farm_code !== undefined) updates.farm_code = dto.farm_code.toUpperCase();
    if (dto.farm_name !== undefined) updates.farm_name = dto.farm_name;
    if (dto.farm_type !== undefined) updates.farm_type = dto.farm_type;
    if (dto.capacity !== undefined) updates.capacity = dto.capacity;
    if (dto.address_line1 !== undefined) updates.address_line1 = dto.address_line1;
    if (dto.city !== undefined) updates.city = dto.city;
    if (dto.state !== undefined) updates.state = dto.state;
    if (dto.country !== undefined) updates.country = dto.country;
    if (dto.pincode !== undefined) updates.pincode = dto.pincode;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.farmMaster)
      .set(updates)
      .where(eq(schema.farmMaster.farm_id, id));

    await this.auditService.log({
      tenantId,
      companyId: farm.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'farm_master',
      entityId: id,
      oldValues: farm,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const farm = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.farmMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.farmMaster.farm_id, id));

    await this.auditService.log({
      tenantId,
      companyId: farm.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'farm_master',
      entityId: id,
      oldValues: farm,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Farm '${farm.farm_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [farm] = await this.db
      .select()
      .from(schema.farmMaster)
      .where(eq(schema.farmMaster.farm_id, id))
      .limit(1);

    if (!farm) {
      throw new NotFoundException(`Farm with ID '${id}' not found.`);
    }

    if (!farm.deleted_at) {
      return farm;
    }

    await this.db
      .update(schema.farmMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.farmMaster.farm_id, id));

    await this.auditService.log({
      tenantId,
      companyId: farm.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'farm_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
