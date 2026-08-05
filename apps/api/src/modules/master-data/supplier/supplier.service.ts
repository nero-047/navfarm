import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateSupplierDto, UpdateSupplierDto, QuerySupplierDto } from './dto/supplier.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class SupplierService {
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

  async create(dto: CreateSupplierDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check duplicate supplier code within the company scope
    const existing = await this.db
      .select()
      .from(schema.supplierMaster)
      .where(
        and(
          eq(schema.supplierMaster.tenant_id, tenantId),
          eq(schema.supplierMaster.company_id, dto.company_id),
          eq(schema.supplierMaster.supplier_code, dto.supplier_code.toUpperCase()),
          isNull(schema.supplierMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Supplier with code '${dto.supplier_code}' already exists in this company.`);
    }

    const supplierId = randomUUID();
    const newSupplier = {
      supplier_id: supplierId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      supplier_code: dto.supplier_code.toUpperCase(),
      supplier_name: dto.supplier_name,
      email: dto.email || null,
      phone: dto.phone || null,
      tax_number: dto.tax_number || null,
      payment_terms: dto.payment_terms || null,
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

    await this.db.insert(schema.supplierMaster).values(newSupplier);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'supplier_master',
      entityId: supplierId,
      newValues: newSupplier,
    });

    return this.findOne(supplierId);
  }

  async findOne(id: string) {
    const [supplier] = await this.db
      .select()
      .from(schema.supplierMaster)
      .where(and(eq(schema.supplierMaster.supplier_id, id), isNull(schema.supplierMaster.deleted_at)))
      .limit(1);

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID '${id}' not found.`);
    }

    return supplier;
  }

  async findAll(query: QuerySupplierDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.supplierMaster.tenant_id, tenantId),
      isNull(schema.supplierMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.supplierMaster.company_id, query.companyId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.supplierMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.supplierMaster.supplier_code, `%${query.search}%`),
          like(schema.supplierMaster.supplier_name, `%${query.search}%`),
          like(schema.supplierMaster.tax_number, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.supplierMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateSupplierDto, tenantId: string, userPayload?: any) {
    const supplier = await this.findOne(id);

    if (dto.supplier_code && dto.supplier_code.toUpperCase() !== supplier.supplier_code) {
      const existing = await this.db
        .select()
        .from(schema.supplierMaster)
        .where(
          and(
            eq(schema.supplierMaster.tenant_id, tenantId),
            eq(schema.supplierMaster.company_id, supplier.company_id),
            eq(schema.supplierMaster.supplier_code, dto.supplier_code.toUpperCase()),
            ne(schema.supplierMaster.supplier_id, id),
            isNull(schema.supplierMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Supplier with code '${dto.supplier_code}' already exists in this company.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.supplier_code !== undefined) updates.supplier_code = dto.supplier_code.toUpperCase();
    if (dto.supplier_name !== undefined) updates.supplier_name = dto.supplier_name;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.tax_number !== undefined) updates.tax_number = dto.tax_number;
    if (dto.payment_terms !== undefined) updates.payment_terms = dto.payment_terms;
    if (dto.address_line1 !== undefined) updates.address_line1 = dto.address_line1;
    if (dto.city !== undefined) updates.city = dto.city;
    if (dto.state !== undefined) updates.state = dto.state;
    if (dto.country !== undefined) updates.country = dto.country;
    if (dto.pincode !== undefined) updates.pincode = dto.pincode;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.supplierMaster)
      .set(updates)
      .where(eq(schema.supplierMaster.supplier_id, id));

    await this.auditService.log({
      tenantId,
      companyId: supplier.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'supplier_master',
      entityId: id,
      oldValues: supplier,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const supplier = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.supplierMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.supplierMaster.supplier_id, id));

    await this.auditService.log({
      tenantId,
      companyId: supplier.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'supplier_master',
      entityId: id,
      oldValues: supplier,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Supplier '${supplier.supplier_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [supplier] = await this.db
      .select()
      .from(schema.supplierMaster)
      .where(eq(schema.supplierMaster.supplier_id, id))
      .limit(1);

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID '${id}' not found.`);
    }

    if (!supplier.deleted_at) {
      return supplier;
    }

    await this.db
      .update(schema.supplierMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.supplierMaster.supplier_id, id));

    await this.auditService.log({
      tenantId,
      companyId: supplier.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'supplier_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
