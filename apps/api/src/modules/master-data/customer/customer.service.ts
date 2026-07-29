import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateCustomerDto, UpdateCustomerDto, QueryCustomerDto } from './dto/customer.dto';
import { AuditLogService } from '../../platform-identity/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class CustomerService {
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

  async create(dto: CreateCustomerDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check duplicate customer code within the company scope
    const existing = await this.db
      .select()
      .from(schema.customerMaster)
      .where(
        and(
          eq(schema.customerMaster.tenant_id, tenantId),
          eq(schema.customerMaster.company_id, dto.company_id),
          eq(schema.customerMaster.customer_code, dto.customer_code.toUpperCase()),
          isNull(schema.customerMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Customer with code '${dto.customer_code}' already exists in this company.`);
    }

    const customerId = randomUUID();
    const newCustomer = {
      customer_id: customerId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      customer_code: dto.customer_code.toUpperCase(),
      customer_name: dto.customer_name,
      email: dto.email || null,
      mobile: dto.mobile,
      tax_number: dto.tax_number || null,
      credit_limit: dto.credit_limit?.toString() || null,
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

    await this.db.insert(schema.customerMaster).values(newCustomer);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'customer_master',
      entityId: customerId,
      newValues: newCustomer,
    });

    return this.findOne(customerId);
  }

  async findOne(id: string) {
    const [customer] = await this.db
      .select()
      .from(schema.customerMaster)
      .where(and(eq(schema.customerMaster.customer_id, id), isNull(schema.customerMaster.deleted_at)))
      .limit(1);

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found.`);
    }

    return customer;
  }

  async findAll(query: QueryCustomerDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.customerMaster.tenant_id, tenantId),
      isNull(schema.customerMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.customerMaster.company_id, query.companyId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.customerMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.customerMaster.customer_code, `%${query.search}%`),
          like(schema.customerMaster.customer_name, `%${query.search}%`),
          like(schema.customerMaster.mobile, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.customerMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateCustomerDto, tenantId: string, userPayload?: any) {
    const customer = await this.findOne(id);

    if (dto.customer_code && dto.customer_code.toUpperCase() !== customer.customer_code) {
      const existing = await this.db
        .select()
        .from(schema.customerMaster)
        .where(
          and(
            eq(schema.customerMaster.tenant_id, tenantId),
            eq(schema.customerMaster.company_id, customer.company_id),
            eq(schema.customerMaster.customer_code, dto.customer_code.toUpperCase()),
            ne(schema.customerMaster.customer_id, id),
            isNull(schema.customerMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Customer with code '${dto.customer_code}' already exists in this company.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.customer_code !== undefined) updates.customer_code = dto.customer_code.toUpperCase();
    if (dto.customer_name !== undefined) updates.customer_name = dto.customer_name;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.mobile !== undefined) updates.mobile = dto.mobile;
    if (dto.tax_number !== undefined) updates.tax_number = dto.tax_number;
    if (dto.credit_limit !== undefined) updates.credit_limit = dto.credit_limit?.toString() || null;
    if (dto.address_line1 !== undefined) updates.address_line1 = dto.address_line1;
    if (dto.city !== undefined) updates.city = dto.city;
    if (dto.state !== undefined) updates.state = dto.state;
    if (dto.country !== undefined) updates.country = dto.country;
    if (dto.pincode !== undefined) updates.pincode = dto.pincode;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.customerMaster)
      .set(updates)
      .where(eq(schema.customerMaster.customer_id, id));

    await this.auditService.log({
      tenantId,
      companyId: customer.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'customer_master',
      entityId: id,
      oldValues: customer,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const customer = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.customerMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.customerMaster.customer_id, id));

    await this.auditService.log({
      tenantId,
      companyId: customer.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'customer_master',
      entityId: id,
      oldValues: customer,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Customer '${customer.customer_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [customer] = await this.db
      .select()
      .from(schema.customerMaster)
      .where(eq(schema.customerMaster.customer_id, id))
      .limit(1);

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found.`);
    }

    if (!customer.deleted_at) {
      return customer;
    }

    await this.db
      .update(schema.customerMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.customerMaster.customer_id, id));

    await this.auditService.log({
      tenantId,
      companyId: customer.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'customer_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
