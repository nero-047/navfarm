import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateItemDto, UpdateItemDto, QueryItemDto } from './dto/item.dto';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class ItemService {
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

  async create(dto: CreateItemDto, tenantId: string, userPayload?: any) {
    const companyId = dto.company_id || null;

    // 1. Verify company exists (if provided)
    if (companyId) {
      const [company] = await this.db
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, companyId), isNull(schema.companyMaster.deleted_at)))
        .limit(1);

      if (!company) {
        throw new NotFoundException(`Company with ID '${companyId}' not found.`);
      }
    }

    // 2. Verify category exists (if provided)
    let categoryName = dto.category || null;
    if (dto.category_id) {
      const [category] = await this.db
        .select()
        .from(schema.itemCategoryMaster)
        .where(and(eq(schema.itemCategoryMaster.category_id, dto.category_id), isNull(schema.itemCategoryMaster.deleted_at)))
        .limit(1);

      if (!category) {
        throw new NotFoundException(`Item Category with ID '${dto.category_id}' not found.`);
      }
      categoryName = category.category_name;
    }

    // 3. Verify duplicate code
    const duplicateConditions = [
      eq(schema.itemMaster.tenant_id, tenantId),
      eq(schema.itemMaster.item_code, dto.item_code.toUpperCase()),
      isNull(schema.itemMaster.deleted_at),
    ];
    if (companyId) {
      duplicateConditions.push(eq(schema.itemMaster.company_id, companyId));
    } else {
      duplicateConditions.push(isNull(schema.itemMaster.company_id));
    }

    const existing = await this.db
      .select()
      .from(schema.itemMaster)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Item with code '${dto.item_code}' already exists in this scope.`);
    }

    const itemId = randomUUID();
    const newItem = {
      item_id: itemId,
      tenant_id: tenantId,
      company_id: companyId,
      category_id: dto.category_id || null,
      item_code: dto.item_code.toUpperCase(),
      item_name: dto.item_name,
      item_type: dto.item_type,
      nob_id: dto.nob_id,
      lob_id: dto.lob_id || null,
      category: categoryName,
      sub_category: dto.sub_category || null,
      uom_primary: dto.uom_primary,
      uom_secondary: dto.uom_secondary || null,
      uom_conversion_factor: dto.uom_conversion_factor?.toString() || null,
      valuation_method: dto.valuation_method || null,
      standard_cost: dto.standard_cost?.toString() || null,
      is_lot_tracked: dto.is_lot_tracked || false,
      is_serial_tracked: dto.is_serial_tracked || false,
      is_biological_asset: dto.is_biological_asset || false,
      is_biological_costing_method: dto.is_biological_costing_method || null,
      is_inventoriable: dto.is_inventoriable ?? true,
      min_stock_level: dto.min_stock_level?.toString() || null,
      max_stock_level: dto.max_stock_level?.toString() || null,
      reorder_level: dto.reorder_level?.toString() || null,
      shelf_life_days: dto.shelf_life_days ?? null,
      storage_temp_min: dto.storage_temp_min?.toString() || null,
      storage_temp_max: dto.storage_temp_max?.toString() || null,
      is_qr_enabled: dto.is_qr_enabled || false,
      qr_trigger_event: dto.qr_trigger_event || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    // Transactional save for item + attribute values mapping
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.itemMaster).values(newItem);

      if (dto.attributes && dto.attributes.length > 0) {
        for (const attr of dto.attributes) {
          // Verify attribute definition exists
          const [attrDef] = await tx
            .select()
            .from(schema.itemAttributeMaster)
            .where(and(eq(schema.itemAttributeMaster.attribute_id, attr.attribute_id), isNull(schema.itemAttributeMaster.deleted_at)))
            .limit(1);

          if (!attrDef) {
            throw new NotFoundException(`Attribute definition with ID '${attr.attribute_id}' not found.`);
          }

          await tx.insert(schema.itemAttributeValues).values({
            value_id: randomUUID(),
            item_id: itemId,
            attribute_id: attr.attribute_id,
            attribute_value: attr.attribute_value,
          });
        }
      }
    });

    await this.auditService.log({
      tenantId,
      companyId: companyId || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'item_master',
      entityId: itemId,
      newValues: newItem,
    });

    return this.findOne(itemId);
  }

  async findOne(id: string) {
    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.item_id, id), isNull(schema.itemMaster.deleted_at)))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Item with ID '${id}' not found.`);
    }

    // Fetch mapped attributes
    const attributes = await this.db
      .select({
        attribute_id: schema.itemAttributeValues.attribute_id,
        attribute_code: schema.itemAttributeMaster.attribute_code,
        attribute_name: schema.itemAttributeMaster.attribute_name,
        attribute_value: schema.itemAttributeValues.attribute_value,
      })
      .from(schema.itemAttributeValues)
      .leftJoin(
        schema.itemAttributeMaster,
        eq(schema.itemAttributeValues.attribute_id, schema.itemAttributeMaster.attribute_id)
      )
      .where(eq(schema.itemAttributeValues.item_id, id));

    return {
      ...item,
      attributes,
    };
  }

  async findAll(query: QueryItemDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.itemMaster.tenant_id, tenantId),
      isNull(schema.itemMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(
        or(
          eq(schema.itemMaster.company_id, query.companyId),
          isNull(schema.itemMaster.company_id)
        )
      );
    }
    if (query.categoryId) {
      conditions.push(eq(schema.itemMaster.category_id, query.categoryId));
    }
    if (query.itemType) {
      conditions.push(eq(schema.itemMaster.item_type, query.itemType));
    }
    if (query.nobId) {
      conditions.push(eq(schema.itemMaster.nob_id, query.nobId));
    }
    if (query.lobId) {
      conditions.push(eq(schema.itemMaster.lob_id, query.lobId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.itemMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.itemMaster.item_code, `%${query.search}%`),
          like(schema.itemMaster.item_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.itemMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateItemDto, tenantId: string, userPayload?: any) {
    const item = await this.findOne(id);

    if (dto.category_id) {
      const [category] = await this.db
        .select()
        .from(schema.itemCategoryMaster)
        .where(and(eq(schema.itemCategoryMaster.category_id, dto.category_id), isNull(schema.itemCategoryMaster.deleted_at)))
        .limit(1);

      if (!category) {
        throw new NotFoundException(`Item Category with ID '${dto.category_id}' not found.`);
      }
    }

    if (dto.item_code && dto.item_code.toUpperCase() !== item.item_code) {
      const duplicateConditions = [
        eq(schema.itemMaster.tenant_id, tenantId),
        eq(schema.itemMaster.item_code, dto.item_code.toUpperCase()),
        ne(schema.itemMaster.item_id, id),
        isNull(schema.itemMaster.deleted_at),
      ];
      const targetCompanyId = item.company_id;
      if (targetCompanyId) {
        duplicateConditions.push(eq(schema.itemMaster.company_id, targetCompanyId));
      } else {
        duplicateConditions.push(isNull(schema.itemMaster.company_id));
      }

      const existing = await this.db
        .select()
        .from(schema.itemMaster)
        .where(and(...duplicateConditions))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Item with code '${dto.item_code}' already exists in this scope.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.item_code !== undefined) updates.item_code = dto.item_code.toUpperCase();
    if (dto.item_name !== undefined) updates.item_name = dto.item_name;
    if (dto.item_type !== undefined) updates.item_type = dto.item_type;
    if (dto.nob_id !== undefined) updates.nob_id = dto.nob_id;
    if (dto.lob_id !== undefined) updates.lob_id = dto.lob_id;
    if (dto.category_id !== undefined) updates.category_id = dto.category_id;
    if (dto.category !== undefined) updates.category = dto.category;
    if (dto.sub_category !== undefined) updates.sub_category = dto.sub_category;
    if (dto.uom_primary !== undefined) updates.uom_primary = dto.uom_primary;
    if (dto.uom_secondary !== undefined) updates.uom_secondary = dto.uom_secondary;
    if (dto.uom_conversion_factor !== undefined) updates.uom_conversion_factor = dto.uom_conversion_factor?.toString() || null;
    if (dto.valuation_method !== undefined) updates.valuation_method = dto.valuation_method;
    if (dto.standard_cost !== undefined) updates.standard_cost = dto.standard_cost?.toString() || null;
    if (dto.is_lot_tracked !== undefined) updates.is_lot_tracked = dto.is_lot_tracked;
    if (dto.is_serial_tracked !== undefined) updates.is_serial_tracked = dto.is_serial_tracked;
    if (dto.is_biological_asset !== undefined) updates.is_biological_asset = dto.is_biological_asset;
    if (dto.is_biological_costing_method !== undefined) updates.is_biological_costing_method = dto.is_biological_costing_method;
    if (dto.is_inventoriable !== undefined) updates.is_inventoriable = dto.is_inventoriable;
    if (dto.min_stock_level !== undefined) updates.min_stock_level = dto.min_stock_level?.toString() || null;
    if (dto.max_stock_level !== undefined) updates.max_stock_level = dto.max_stock_level?.toString() || null;
    if (dto.reorder_level !== undefined) updates.reorder_level = dto.reorder_level?.toString() || null;
    if (dto.shelf_life_days !== undefined) updates.shelf_life_days = dto.shelf_life_days;
    if (dto.storage_temp_min !== undefined) updates.storage_temp_min = dto.storage_temp_min?.toString() || null;
    if (dto.storage_temp_max !== undefined) updates.storage_temp_max = dto.storage_temp_max?.toString() || null;
    if (dto.is_qr_enabled !== undefined) updates.is_qr_enabled = dto.is_qr_enabled;
    if (dto.qr_trigger_event !== undefined) updates.qr_trigger_event = dto.qr_trigger_event;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.itemMaster)
        .set(updates)
        .where(eq(schema.itemMaster.item_id, id));

      if (dto.attributes) {
        // Drop existing attributes map
        await tx.delete(schema.itemAttributeValues).where(eq(schema.itemAttributeValues.item_id, id));

        // Insert new ones
        for (const attr of dto.attributes) {
          const [attrDef] = await tx
            .select()
            .from(schema.itemAttributeMaster)
            .where(and(eq(schema.itemAttributeMaster.attribute_id, attr.attribute_id), isNull(schema.itemAttributeMaster.deleted_at)))
            .limit(1);

          if (!attrDef) {
            throw new NotFoundException(`Attribute definition with ID '${attr.attribute_id}' not found.`);
          }

          await tx.insert(schema.itemAttributeValues).values({
            value_id: randomUUID(),
            item_id: id,
            attribute_id: attr.attribute_id,
            attribute_value: attr.attribute_value,
          });
        }
      }
    });

    await this.auditService.log({
      tenantId,
      companyId: item.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'item_master',
      entityId: id,
      oldValues: item,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const item = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.itemMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.itemMaster.item_id, id));

    await this.auditService.log({
      tenantId,
      companyId: item.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'item_master',
      entityId: id,
      oldValues: item,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Item '${item.item_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(eq(schema.itemMaster.item_id, id))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Item with ID '${id}' not found.`);
    }

    if (!item.deleted_at) {
      return item;
    }

    await this.db
      .update(schema.itemMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.itemMaster.item_id, id));

    await this.auditService.log({
      tenantId,
      companyId: item.company_id || undefined,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'item_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
