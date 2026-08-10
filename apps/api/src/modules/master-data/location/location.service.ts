import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateLocationDto, UpdateLocationDto, QueryLocationDto } from './dto/location.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class LocationService {
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

  /** A location anchors to exactly one direct parent: a Farm, a Shed, or a Warehouse. */
  private assertExactlyOneParent(farmId?: string | null, shedId?: string | null, warehouseId?: string | null) {
    const setCount = [farmId, shedId, warehouseId].filter(Boolean).length;
    if (setCount !== 1) {
      throw new ConflictException(
        'A location must have exactly one parent: set exactly one of farm_id, shed_id, or warehouse_id.'
      );
    }
  }

  async create(dto: CreateLocationDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists (if provided)
    if (dto.company_id) {
      const [company] = await this.db
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);

      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }
    }

    // 2. Verify parent location exists (if provided)
    if (dto.parent_location_id) {
      const parent = await this.findOne(dto.parent_location_id);
      if (!parent) {
        throw new NotFoundException(`Parent location with ID '${dto.parent_location_id}' not found.`);
      }
    }

    // 3. Exactly one of farm/shed/warehouse must be this location's parent
    this.assertExactlyOneParent(dto.farm_id, dto.shed_id, dto.warehouse_id);

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

    if (dto.shed_id) {
      const [shed] = await this.db
        .select()
        .from(schema.shedMaster)
        .where(and(eq(schema.shedMaster.shed_id, dto.shed_id), isNull(schema.shedMaster.deleted_at)))
        .limit(1);
      if (!shed) {
        throw new NotFoundException(`Shed with ID '${dto.shed_id}' not found.`);
      }
    }

    if (dto.warehouse_id) {
      const [warehouse] = await this.db
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.warehouse_id), isNull(schema.warehouseMaster.deleted_at)))
        .limit(1);

      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID '${dto.warehouse_id}' not found.`);
      }
    }

    // 4. Check duplicate location code
    const duplicateConditions = [
      eq(schema.locationMaster.tenant_id, tenantId),
      eq(schema.locationMaster.location_code, dto.location_code.toUpperCase()),
      isNull(schema.locationMaster.deleted_at),
    ];
    if (dto.company_id) {
      duplicateConditions.push(eq(schema.locationMaster.company_id, dto.company_id));
    } else {
      duplicateConditions.push(isNull(schema.locationMaster.company_id));
    }

    const existing = await this.db
      .select()
      .from(schema.locationMaster)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Location with code '${dto.location_code}' already exists in this scope.`);
    }

    const locationId = randomUUID();
    const newLocation = {
      location_id: locationId,
      tenant_id: tenantId,
      company_id: dto.company_id || null,
      nob_id: dto.nob_id || null,
      lob_id: dto.lob_id || null,
      farm_id: dto.farm_id || null,
      shed_id: dto.shed_id || null,
      warehouse_id: dto.warehouse_id || null,
      location_code: dto.location_code.toUpperCase(),
      location_name: dto.location_name,
      location_level: dto.location_level,
      location_type: dto.location_type,
      parent_location_id: dto.parent_location_id || null,
      area_size: dto.area_size?.toString() || null,
      area_unit: dto.area_unit || null,
      max_capacity: dto.max_capacity?.toString() || null,
      capacity_uom: dto.capacity_uom || null,
      current_count: dto.current_count?.toString() || '0.00',
      gps_latitude: dto.gps_latitude?.toString() || null,
      gps_longitude: dto.gps_longitude?.toString() || null,
      storage_type: dto.storage_type || null,
      is_quarantine_zone: dto.is_quarantine_zone || false,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.locationMaster).values(newLocation);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'location_master',
      entityId: locationId,
      newValues: newLocation,
    });

    return this.findOne(locationId);
  }

  async findOne(id: string) {
    const [location] = await this.db
      .select()
      .from(schema.locationMaster)
      .where(and(eq(schema.locationMaster.location_id, id), isNull(schema.locationMaster.deleted_at)))
      .limit(1);

    if (!location) {
      throw new NotFoundException(`Location with ID '${id}' not found.`);
    }

    return location;
  }

  async findAll(query: QueryLocationDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.locationMaster.tenant_id, tenantId),
      isNull(schema.locationMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(
        or(
          eq(schema.locationMaster.company_id, query.companyId),
          isNull(schema.locationMaster.company_id)
        )
      );
    }
    if (query.nobId) {
      conditions.push(eq(schema.locationMaster.nob_id, query.nobId));
    }
    if (query.lobId) {
      conditions.push(eq(schema.locationMaster.lob_id, query.lobId));
    }
    if (query.farmId) {
      conditions.push(eq(schema.locationMaster.farm_id, query.farmId));
    }
    if (query.shedId) {
      conditions.push(eq(schema.locationMaster.shed_id, query.shedId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.locationMaster.warehouse_id, query.warehouseId));
    }
    if (query.parentLocationId) {
      conditions.push(eq(schema.locationMaster.parent_location_id, query.parentLocationId));
    }
    if (query.locationType) {
      conditions.push(eq(schema.locationMaster.location_type, query.locationType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.locationMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.locationMaster.location_code, `%${query.search}%`),
          like(schema.locationMaster.location_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.locationMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateLocationDto, tenantId: string, userPayload?: any) {
    const location = await this.findOne(id);

    if (dto.company_id) {
      const [company] = await this.db
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);

      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }
    }

    if (dto.parent_location_id) {
      await this.findOne(dto.parent_location_id);
    }

    // Exactly one of farm/shed/warehouse must be the parent — validate against the
    // effective values (dto's if this update touches it, otherwise the existing row's).
    const effectiveFarmId = dto.farm_id !== undefined ? dto.farm_id : location.farm_id;
    const effectiveShedId = dto.shed_id !== undefined ? dto.shed_id : location.shed_id;
    const effectiveWarehouseId = dto.warehouse_id !== undefined ? dto.warehouse_id : location.warehouse_id;
    this.assertExactlyOneParent(effectiveFarmId, effectiveShedId, effectiveWarehouseId);

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

    if (dto.shed_id) {
      const [shed] = await this.db
        .select()
        .from(schema.shedMaster)
        .where(and(eq(schema.shedMaster.shed_id, dto.shed_id), isNull(schema.shedMaster.deleted_at)))
        .limit(1);
      if (!shed) {
        throw new NotFoundException(`Shed with ID '${dto.shed_id}' not found.`);
      }
    }

    if (dto.warehouse_id) {
      const [warehouse] = await this.db
        .select()
        .from(schema.warehouseMaster)
        .where(and(eq(schema.warehouseMaster.warehouse_id, dto.warehouse_id), isNull(schema.warehouseMaster.deleted_at)))
        .limit(1);

      if (!warehouse) {
        throw new NotFoundException(`Warehouse with ID '${dto.warehouse_id}' not found.`);
      }
    }

    if (dto.location_code && dto.location_code.toUpperCase() !== location.location_code) {
      const duplicateConditions = [
        eq(schema.locationMaster.tenant_id, tenantId),
        eq(schema.locationMaster.location_code, dto.location_code.toUpperCase()),
        ne(schema.locationMaster.location_id, id),
        isNull(schema.locationMaster.deleted_at),
      ];
      const targetCompanyId = dto.company_id || location.company_id;
      if (targetCompanyId) {
        duplicateConditions.push(eq(schema.locationMaster.company_id, targetCompanyId));
      } else {
        duplicateConditions.push(isNull(schema.locationMaster.company_id));
      }

      const existing = await this.db
        .select()
        .from(schema.locationMaster)
        .where(and(...duplicateConditions))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Location with code '${dto.location_code}' already exists in this scope.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.company_id !== undefined) updates.company_id = dto.company_id;
    if (dto.nob_id !== undefined) updates.nob_id = dto.nob_id;
    if (dto.lob_id !== undefined) updates.lob_id = dto.lob_id;
    if (dto.farm_id !== undefined) updates.farm_id = dto.farm_id;
    if (dto.shed_id !== undefined) updates.shed_id = dto.shed_id;
    if (dto.warehouse_id !== undefined) updates.warehouse_id = dto.warehouse_id;
    if (dto.location_code !== undefined) updates.location_code = dto.location_code.toUpperCase();
    if (dto.location_name !== undefined) updates.location_name = dto.location_name;
    if (dto.location_level !== undefined) updates.location_level = dto.location_level;
    if (dto.location_type !== undefined) updates.location_type = dto.location_type;
    if (dto.parent_location_id !== undefined) updates.parent_location_id = dto.parent_location_id;
    if (dto.area_size !== undefined) updates.area_size = dto.area_size?.toString() || null;
    if (dto.area_unit !== undefined) updates.area_unit = dto.area_unit;
    if (dto.max_capacity !== undefined) updates.max_capacity = dto.max_capacity?.toString() || null;
    if (dto.capacity_uom !== undefined) updates.capacity_uom = dto.capacity_uom;
    if (dto.current_count !== undefined) updates.current_count = dto.current_count?.toString() || '0.00';
    if (dto.gps_latitude !== undefined) updates.gps_latitude = dto.gps_latitude?.toString() || null;
    if (dto.gps_longitude !== undefined) updates.gps_longitude = dto.gps_longitude?.toString() || null;
    if (dto.storage_type !== undefined) updates.storage_type = dto.storage_type;
    if (dto.is_quarantine_zone !== undefined) updates.is_quarantine_zone = dto.is_quarantine_zone;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.locationMaster)
      .set(updates)
      .where(eq(schema.locationMaster.location_id, id));

    await this.auditService.log({
      tenantId,
      companyId: location.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'location_master',
      entityId: id,
      oldValues: location,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const location = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.locationMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.locationMaster.location_id, id));

    await this.auditService.log({
      tenantId,
      companyId: location.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'location_master',
      entityId: id,
      oldValues: location,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Location '${location.location_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [location] = await this.db
      .select()
      .from(schema.locationMaster)
      .where(eq(schema.locationMaster.location_id, id))
      .limit(1);

    if (!location) {
      throw new NotFoundException(`Location with ID '${id}' not found.`);
    }

    if (!location.deleted_at) {
      return location;
    }

    await this.db
      .update(schema.locationMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.locationMaster.location_id, id));

    await this.auditService.log({
      tenantId,
      companyId: location.company_id || undefined,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'location_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
