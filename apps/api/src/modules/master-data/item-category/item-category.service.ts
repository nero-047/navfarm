import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateItemCategoryDto, UpdateItemCategoryDto, QueryItemCategoryDto } from './dto/item-category.dto';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class ItemCategoryService {
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

  async create(dto: CreateItemCategoryDto, tenantId: string, userPayload?: any) {
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

    // 2. Verify parent category exists (if provided)
    if (dto.parent_category_id) {
      await this.findOne(dto.parent_category_id);
    }

    // 3. Check duplicate category code
    const duplicateConditions = [
      eq(schema.itemCategoryMaster.tenant_id, tenantId),
      eq(schema.itemCategoryMaster.category_code, dto.category_code.toUpperCase()),
      isNull(schema.itemCategoryMaster.deleted_at),
    ];
    if (companyId) {
      duplicateConditions.push(eq(schema.itemCategoryMaster.company_id, companyId));
    } else {
      duplicateConditions.push(isNull(schema.itemCategoryMaster.company_id));
    }

    const existing = await this.db
      .select()
      .from(schema.itemCategoryMaster)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Item category with code '${dto.category_code}' already exists in this scope.`);
    }

    const categoryId = randomUUID();
    const newCategory = {
      category_id: categoryId,
      tenant_id: tenantId,
      company_id: companyId,
      category_code: dto.category_code.toUpperCase(),
      category_name: dto.category_name,
      parent_category_id: dto.parent_category_id || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.itemCategoryMaster).values(newCategory);

    await this.auditService.log({
      tenantId,
      companyId: companyId || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'item_category_master',
      entityId: categoryId,
      newValues: newCategory,
    });

    return this.findOne(categoryId);
  }

  async findOne(id: string) {
    const [category] = await this.db
      .select()
      .from(schema.itemCategoryMaster)
      .where(and(eq(schema.itemCategoryMaster.category_id, id), isNull(schema.itemCategoryMaster.deleted_at)))
      .limit(1);

    if (!category) {
      throw new NotFoundException(`Item Category with ID '${id}' not found.`);
    }

    return category;
  }

  async findAll(query: QueryItemCategoryDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.itemCategoryMaster.tenant_id, tenantId),
      isNull(schema.itemCategoryMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(
        or(
          eq(schema.itemCategoryMaster.company_id, query.companyId),
          isNull(schema.itemCategoryMaster.company_id)
        )
      );
    }
    if (query.parentCategoryId) {
      conditions.push(eq(schema.itemCategoryMaster.parent_category_id, query.parentCategoryId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.itemCategoryMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.itemCategoryMaster.category_code, `%${query.search}%`),
          like(schema.itemCategoryMaster.category_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.itemCategoryMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateItemCategoryDto, tenantId: string, userPayload?: any) {
    const category = await this.findOne(id);

    if (dto.parent_category_id) {
      if (dto.parent_category_id === id) {
        throw new ConflictException(`Category cannot be parent of itself.`);
      }
      await this.findOne(dto.parent_category_id);
    }

    if (dto.category_code && dto.category_code.toUpperCase() !== category.category_code) {
      const duplicateConditions = [
        eq(schema.itemCategoryMaster.tenant_id, tenantId),
        eq(schema.itemCategoryMaster.category_code, dto.category_code.toUpperCase()),
        ne(schema.itemCategoryMaster.category_id, id),
        isNull(schema.itemCategoryMaster.deleted_at),
      ];
      const targetCompanyId = category.company_id;
      if (targetCompanyId) {
        duplicateConditions.push(eq(schema.itemCategoryMaster.company_id, targetCompanyId));
      } else {
        duplicateConditions.push(isNull(schema.itemCategoryMaster.company_id));
      }

      const existing = await this.db
        .select()
        .from(schema.itemCategoryMaster)
        .where(and(...duplicateConditions))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Item category with code '${dto.category_code}' already exists in this scope.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.parent_category_id !== undefined) updates.parent_category_id = dto.parent_category_id;
    if (dto.category_code !== undefined) updates.category_code = dto.category_code.toUpperCase();
    if (dto.category_name !== undefined) updates.category_name = dto.category_name;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.itemCategoryMaster)
      .set(updates)
      .where(eq(schema.itemCategoryMaster.category_id, id));

    await this.auditService.log({
      tenantId,
      companyId: category.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'item_category_master',
      entityId: id,
      oldValues: category,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const category = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.itemCategoryMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.itemCategoryMaster.category_id, id));

    await this.auditService.log({
      tenantId,
      companyId: category.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'item_category_master',
      entityId: id,
      oldValues: category,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Item Category '${category.category_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [category] = await this.db
      .select()
      .from(schema.itemCategoryMaster)
      .where(eq(schema.itemCategoryMaster.category_id, id))
      .limit(1);

    if (!category) {
      throw new NotFoundException(`Item Category with ID '${id}' not found.`);
    }

    if (!category.deleted_at) {
      return category;
    }

    await this.db
      .update(schema.itemCategoryMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.itemCategoryMaster.category_id, id));

    await this.auditService.log({
      tenantId,
      companyId: category.company_id || undefined,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'item_category_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
