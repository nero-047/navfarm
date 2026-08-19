import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateGlMappingDto, UpdateGlMappingDto, QueryGlMappingDto } from './dto/gl-mapping.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class GlMappingService {
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

  async create(dto: CreateGlMappingDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Verify item category exists if specified
    if (dto.item_category_id) {
      const [category] = await this.db
        .select()
        .from(schema.itemCategoryMaster)
        .where(
          and(
            eq(schema.itemCategoryMaster.category_id, dto.item_category_id),
            isNull(schema.itemCategoryMaster.deleted_at)
          )
        )
        .limit(1);

      if (!category) {
        throw new NotFoundException(`Item Category with ID '${dto.item_category_id}' not found.`);
      }
    }

    if (dto.nob_id) {
      const [nob] = await this.db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_id, dto.nob_id)).limit(1);
      if (!nob) {
        throw new NotFoundException(`NOB with ID '${dto.nob_id}' not found.`);
      }
    }

    if (dto.lob_id) {
      const [lob] = await this.db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_id, dto.lob_id)).limit(1);
      if (!lob) {
        throw new NotFoundException(`LOB with ID '${dto.lob_id}' not found.`);
      }
    }

    if (dto.valuation_method) {
      const [method] = await this.db
        .select()
        .from(schema.costingMethodConfig)
        .where(eq(schema.costingMethodConfig.method_code, dto.valuation_method))
        .limit(1);
      if (!method) {
        throw new NotFoundException(`Costing method '${dto.valuation_method}' not found.`);
      }
    }

    // 3. Verify debit G/L account exists if specified
    if (dto.debit_gl_account_id) {
      const [debitGl] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, dto.debit_gl_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!debitGl) {
        throw new NotFoundException(`Debit G/L Account with ID '${dto.debit_gl_account_id}' not found.`);
      }
    }

    // 4. Verify credit G/L account exists if specified
    if (dto.credit_gl_account_id) {
      const [creditGl] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, dto.credit_gl_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!creditGl) {
        throw new NotFoundException(`Credit G/L Account with ID '${dto.credit_gl_account_id}' not found.`);
      }
    }

    // 5. Verify no duplicate mapping rule exists for the same dimensions within the company scope
    const queryConditions = [
      eq(schema.glMappingMaster.tenant_id, tenantId),
      eq(schema.glMappingMaster.company_id, dto.company_id),
      eq(schema.glMappingMaster.transaction_type, dto.transaction_type.toUpperCase()),
      isNull(schema.glMappingMaster.deleted_at),
    ];

    if (dto.item_category_id) {
      queryConditions.push(eq(schema.glMappingMaster.item_category_id, dto.item_category_id));
    } else {
      queryConditions.push(isNull(schema.glMappingMaster.item_category_id));
    }
    if (dto.nob_id) {
      queryConditions.push(eq(schema.glMappingMaster.nob_id, dto.nob_id));
    } else {
      queryConditions.push(isNull(schema.glMappingMaster.nob_id));
    }
    if (dto.lob_id) {
      queryConditions.push(eq(schema.glMappingMaster.lob_id, dto.lob_id));
    } else {
      queryConditions.push(isNull(schema.glMappingMaster.lob_id));
    }
    if (dto.valuation_method) {
      queryConditions.push(eq(schema.glMappingMaster.valuation_method, dto.valuation_method));
    } else {
      queryConditions.push(isNull(schema.glMappingMaster.valuation_method));
    }

    const existing = await this.db
      .select()
      .from(schema.glMappingMaster)
      .where(and(...queryConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`G/L Mapping rule for transaction type '${dto.transaction_type}' with these same category/NOB/LOB/valuation-method dimensions already exists.`);
    }

    const mappingId = randomUUID();
    const newMapping = {
      mapping_id: mappingId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      item_category_id: dto.item_category_id || null,
      nob_id: dto.nob_id || null,
      lob_id: dto.lob_id || null,
      valuation_method: dto.valuation_method || null,
      transaction_type: dto.transaction_type.toUpperCase(),
      debit_gl_account_id: dto.debit_gl_account_id || null,
      credit_gl_account_id: dto.credit_gl_account_id || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.glMappingMaster).values(newMapping);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'gl_mapping_master',
      entityId: mappingId,
      newValues: newMapping,
    });

    return this.findOne(mappingId);
  }

  async findOne(id: string) {
    const [mapping] = await this.db
      .select()
      .from(schema.glMappingMaster)
      .where(and(eq(schema.glMappingMaster.mapping_id, id), isNull(schema.glMappingMaster.deleted_at)))
      .limit(1);

    if (!mapping) {
      throw new NotFoundException(`G/L Mapping rule with ID '${id}' not found.`);
    }

    return mapping;
  }

  async findAll(query: QueryGlMappingDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.glMappingMaster.tenant_id, tenantId),
      isNull(schema.glMappingMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.glMappingMaster.company_id, query.companyId));
    }
    if (query.itemCategoryId) {
      conditions.push(eq(schema.glMappingMaster.item_category_id, query.itemCategoryId));
    }
    if (query.nobId) {
      conditions.push(eq(schema.glMappingMaster.nob_id, query.nobId));
    }
    if (query.lobId) {
      conditions.push(eq(schema.glMappingMaster.lob_id, query.lobId));
    }
    if (query.valuationMethod) {
      conditions.push(eq(schema.glMappingMaster.valuation_method, query.valuationMethod));
    }
    if (query.transactionType) {
      conditions.push(eq(schema.glMappingMaster.transaction_type, query.transactionType.toUpperCase()));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.glMappingMaster.is_active, query.isActive));
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.glMappingMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateGlMappingDto, tenantId: string, userPayload?: any) {
    const mapping = await this.findOne(id);

    const categoryId = dto.item_category_id !== undefined ? dto.item_category_id : mapping.item_category_id;
    const transType = dto.transaction_type !== undefined ? dto.transaction_type : mapping.transaction_type;
    const nobId = dto.nob_id !== undefined ? dto.nob_id : mapping.nob_id;
    const lobId = dto.lob_id !== undefined ? dto.lob_id : mapping.lob_id;
    const valuationMethod = dto.valuation_method !== undefined ? dto.valuation_method : mapping.valuation_method;

    if (dto.item_category_id && dto.item_category_id !== mapping.item_category_id) {
      const [category] = await this.db
        .select()
        .from(schema.itemCategoryMaster)
        .where(
          and(
            eq(schema.itemCategoryMaster.category_id, dto.item_category_id),
            isNull(schema.itemCategoryMaster.deleted_at)
          )
        )
        .limit(1);

      if (!category) {
        throw new NotFoundException(`Item Category with ID '${dto.item_category_id}' not found.`);
      }
    }

    if (dto.nob_id && dto.nob_id !== mapping.nob_id) {
      const [nob] = await this.db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_id, dto.nob_id)).limit(1);
      if (!nob) {
        throw new NotFoundException(`NOB with ID '${dto.nob_id}' not found.`);
      }
    }

    if (dto.lob_id && dto.lob_id !== mapping.lob_id) {
      const [lob] = await this.db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_id, dto.lob_id)).limit(1);
      if (!lob) {
        throw new NotFoundException(`LOB with ID '${dto.lob_id}' not found.`);
      }
    }

    if (dto.valuation_method && dto.valuation_method !== mapping.valuation_method) {
      const [method] = await this.db
        .select()
        .from(schema.costingMethodConfig)
        .where(eq(schema.costingMethodConfig.method_code, dto.valuation_method))
        .limit(1);
      if (!method) {
        throw new NotFoundException(`Costing method '${dto.valuation_method}' not found.`);
      }
    }

    if (dto.debit_gl_account_id && dto.debit_gl_account_id !== mapping.debit_gl_account_id) {
      const [debitGl] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, dto.debit_gl_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!debitGl) {
        throw new NotFoundException(`Debit G/L Account with ID '${dto.debit_gl_account_id}' not found.`);
      }
    }

    if (dto.credit_gl_account_id && dto.credit_gl_account_id !== mapping.credit_gl_account_id) {
      const [creditGl] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, dto.credit_gl_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!creditGl) {
        throw new NotFoundException(`Credit G/L Account with ID '${dto.credit_gl_account_id}' not found.`);
      }
    }

    if (
      (dto.item_category_id !== undefined && dto.item_category_id !== mapping.item_category_id) ||
      (dto.nob_id !== undefined && dto.nob_id !== mapping.nob_id) ||
      (dto.lob_id !== undefined && dto.lob_id !== mapping.lob_id) ||
      (dto.valuation_method !== undefined && dto.valuation_method !== mapping.valuation_method) ||
      (dto.transaction_type !== undefined && dto.transaction_type.toUpperCase() !== mapping.transaction_type)
    ) {
      const queryConditions = [
        eq(schema.glMappingMaster.tenant_id, tenantId),
        eq(schema.glMappingMaster.company_id, mapping.company_id),
        eq(schema.glMappingMaster.transaction_type, transType.toUpperCase()),
        ne(schema.glMappingMaster.mapping_id, id),
        isNull(schema.glMappingMaster.deleted_at),
      ];

      if (categoryId) {
        queryConditions.push(eq(schema.glMappingMaster.item_category_id, categoryId));
      } else {
        queryConditions.push(isNull(schema.glMappingMaster.item_category_id));
      }
      if (nobId) {
        queryConditions.push(eq(schema.glMappingMaster.nob_id, nobId));
      } else {
        queryConditions.push(isNull(schema.glMappingMaster.nob_id));
      }
      if (lobId) {
        queryConditions.push(eq(schema.glMappingMaster.lob_id, lobId));
      } else {
        queryConditions.push(isNull(schema.glMappingMaster.lob_id));
      }
      if (valuationMethod) {
        queryConditions.push(eq(schema.glMappingMaster.valuation_method, valuationMethod));
      } else {
        queryConditions.push(isNull(schema.glMappingMaster.valuation_method));
      }

      const existing = await this.db
        .select()
        .from(schema.glMappingMaster)
        .where(and(...queryConditions))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`G/L Mapping rule for transaction type '${transType}' with these same category/NOB/LOB/valuation-method dimensions already exists.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.item_category_id !== undefined) updates.item_category_id = dto.item_category_id;
    if (dto.nob_id !== undefined) updates.nob_id = dto.nob_id;
    if (dto.lob_id !== undefined) updates.lob_id = dto.lob_id;
    if (dto.valuation_method !== undefined) updates.valuation_method = dto.valuation_method;
    if (dto.transaction_type !== undefined) updates.transaction_type = dto.transaction_type.toUpperCase();
    if (dto.debit_gl_account_id !== undefined) updates.debit_gl_account_id = dto.debit_gl_account_id;
    if (dto.credit_gl_account_id !== undefined) updates.credit_gl_account_id = dto.credit_gl_account_id;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.glMappingMaster)
      .set(updates)
      .where(eq(schema.glMappingMaster.mapping_id, id));

    await this.auditService.log({
      tenantId,
      companyId: mapping.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'gl_mapping_master',
      entityId: id,
      oldValues: mapping,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const mapping = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.glMappingMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.glMappingMaster.mapping_id, id));

    await this.auditService.log({
      tenantId,
      companyId: mapping.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'gl_mapping_master',
      entityId: id,
      oldValues: mapping,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: 'G/L Mapping rule soft-deleted successfully.' };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [mapping] = await this.db
      .select()
      .from(schema.glMappingMaster)
      .where(eq(schema.glMappingMaster.mapping_id, id))
      .limit(1);

    if (!mapping) {
      throw new NotFoundException(`G/L Mapping rule with ID '${id}' not found.`);
    }

    if (!mapping.deleted_at) {
      return this.findOne(id);
    }

    await this.db
      .update(schema.glMappingMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.glMappingMaster.mapping_id, id));

    await this.auditService.log({
      tenantId,
      companyId: mapping.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'gl_mapping_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
