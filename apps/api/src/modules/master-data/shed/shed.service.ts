import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateShedDto, UpdateShedDto, QueryShedDto } from './dto/shed.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class ShedService {
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

  async create(dto: CreateShedDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Verify farm exists
    const [farm] = await this.db
      .select()
      .from(schema.farmMaster)
      .where(and(eq(schema.farmMaster.farm_id, dto.farm_id), isNull(schema.farmMaster.deleted_at)))
      .limit(1);

    if (!farm) {
      throw new NotFoundException(`Farm with ID '${dto.farm_id}' not found.`);
    }

    // 3. Check duplicate shed code within the farm
    const existing = await this.db
      .select()
      .from(schema.shedMaster)
      .where(
        and(
          eq(schema.shedMaster.tenant_id, tenantId),
          eq(schema.shedMaster.farm_id, dto.farm_id),
          eq(schema.shedMaster.shed_code, dto.shed_code.toUpperCase()),
          isNull(schema.shedMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Shed with code '${dto.shed_code}' already exists in this farm.`);
    }

    const shedId = randomUUID();
    const newShed = {
      shed_id: shedId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      farm_id: dto.farm_id,
      shed_code: dto.shed_code.toUpperCase(),
      shed_name: dto.shed_name,
      shed_type: dto.shed_type,
      nob_id: dto.nob_id || null,
      lob_id: dto.lob_id || null,
      capacity: dto.capacity || 0,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.shedMaster).values(newShed);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'shed_master',
      entityId: shedId,
      newValues: newShed,
    });

    return this.findOne(shedId);
  }

  async findOne(id: string) {
    const [shed] = await this.db
      .select()
      .from(schema.shedMaster)
      .where(and(eq(schema.shedMaster.shed_id, id), isNull(schema.shedMaster.deleted_at)))
      .limit(1);

    if (!shed) {
      throw new NotFoundException(`Shed with ID '${id}' not found.`);
    }

    return shed;
  }

  async findAll(query: QueryShedDto, tenantId: string) {
    // No isNull(deleted_at) filter — list view shows both Active/Inactive states (toggle switch) so a blocked row can be found again and restored.
    const conditions: any[] = [
      eq(schema.shedMaster.tenant_id, tenantId),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.shedMaster.company_id, query.companyId));
    }
    if (query.farmId) {
      conditions.push(eq(schema.shedMaster.farm_id, query.farmId));
    }
    if (query.nobId) {
      conditions.push(eq(schema.shedMaster.nob_id, query.nobId));
    }
    if (query.lobId) {
      conditions.push(eq(schema.shedMaster.lob_id, query.lobId));
    }
    if (query.shedType) {
      conditions.push(eq(schema.shedMaster.shed_type, query.shedType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.shedMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.shedMaster.shed_code, `%${query.search}%`),
          like(schema.shedMaster.shed_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.shedMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateShedDto, tenantId: string, userPayload?: any) {
    const shed = await this.findOne(id);

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

    const targetFarmId = dto.farm_id || shed.farm_id;

    if (dto.shed_code && (dto.shed_code.toUpperCase() !== shed.shed_code || dto.farm_id)) {
      const existing = await this.db
        .select()
        .from(schema.shedMaster)
        .where(
          and(
            eq(schema.shedMaster.tenant_id, tenantId),
            eq(schema.shedMaster.farm_id, targetFarmId),
            eq(schema.shedMaster.shed_code, dto.shed_code.toUpperCase()),
            ne(schema.shedMaster.shed_id, id),
            isNull(schema.shedMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Shed with code '${dto.shed_code}' already exists in this farm.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.farm_id !== undefined) updates.farm_id = dto.farm_id;
    if (dto.shed_code !== undefined) updates.shed_code = dto.shed_code.toUpperCase();
    if (dto.shed_name !== undefined) updates.shed_name = dto.shed_name;
    if (dto.shed_type !== undefined) updates.shed_type = dto.shed_type;
    if (dto.nob_id !== undefined) updates.nob_id = dto.nob_id;
    if (dto.lob_id !== undefined) updates.lob_id = dto.lob_id;
    if (dto.capacity !== undefined) updates.capacity = dto.capacity;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.shedMaster)
      .set(updates)
      .where(eq(schema.shedMaster.shed_id, id));

    await this.auditService.log({
      tenantId,
      companyId: shed.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'shed_master',
      entityId: id,
      oldValues: shed,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const shed = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.shedMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.shedMaster.shed_id, id));

    await this.auditService.log({
      tenantId,
      companyId: shed.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'shed_master',
      entityId: id,
      oldValues: shed,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Shed '${shed.shed_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [shed] = await this.db
      .select()
      .from(schema.shedMaster)
      .where(eq(schema.shedMaster.shed_id, id))
      .limit(1);

    if (!shed) {
      throw new NotFoundException(`Shed with ID '${id}' not found.`);
    }

    if (!shed.deleted_at) {
      return shed;
    }

    await this.db
      .update(schema.shedMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.shedMaster.shed_id, id));

    await this.auditService.log({
      tenantId,
      companyId: shed.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'shed_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
