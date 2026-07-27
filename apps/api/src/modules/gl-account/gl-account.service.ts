import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateGlAccountDto, UpdateGlAccountDto, QueryGlAccountDto } from './dto/gl-account.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class GlAccountService {
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

  async create(dto: CreateGlAccountDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check unique account code in this company
    const existing = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, dto.company_id),
          eq(schema.glAccountMaster.account_code, dto.account_code),
          isNull(schema.glAccountMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`G/L Account with code '${dto.account_code}' already exists in this company.`);
    }

    // 3. Verify parent account exists if specified
    if (dto.parent_account_id) {
      const [parent] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, dto.parent_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!parent) {
        throw new NotFoundException(`Parent G/L Account with ID '${dto.parent_account_id}' not found.`);
      }
    }

    const glAccountId = randomUUID();
    const newAccount = {
      gl_account_id: glAccountId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      account_code: dto.account_code,
      account_name: dto.account_name,
      account_type: dto.account_type,
      parent_account_id: dto.parent_account_id || null,
      is_sub_account: dto.is_sub_account ?? false,
      is_reconciliation: dto.is_reconciliation ?? false,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.glAccountMaster).values(newAccount);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'gl_account_master',
      entityId: glAccountId,
      newValues: newAccount,
    });

    return this.findOne(glAccountId);
  }

  async findOne(id: string) {
    const [account] = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(and(eq(schema.glAccountMaster.gl_account_id, id), isNull(schema.glAccountMaster.deleted_at)))
      .limit(1);

    if (!account) {
      throw new NotFoundException(`G/L Account with ID '${id}' not found.`);
    }

    return account;
  }

  async findAll(query: QueryGlAccountDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.glAccountMaster.tenant_id, tenantId),
      isNull(schema.glAccountMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.glAccountMaster.company_id, query.companyId));
    }
    if (query.accountType) {
      conditions.push(eq(schema.glAccountMaster.account_type, query.accountType));
    }
    if (query.parentAccountId) {
      conditions.push(eq(schema.glAccountMaster.parent_account_id, query.parentAccountId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.glAccountMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.glAccountMaster.account_code, `%${query.search}%`),
          like(schema.glAccountMaster.account_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.glAccountMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateGlAccountDto, tenantId: string, userPayload?: any) {
    const account = await this.findOne(id);

    if (dto.account_code && dto.account_code !== account.account_code) {
      const existing = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.tenant_id, tenantId),
            eq(schema.glAccountMaster.company_id, account.company_id),
            eq(schema.glAccountMaster.account_code, dto.account_code),
            ne(schema.glAccountMaster.gl_account_id, id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`G/L Account with code '${dto.account_code}' already exists in this company.`);
      }
    }

    if (dto.parent_account_id && dto.parent_account_id !== account.parent_account_id) {
      if (dto.parent_account_id === id) {
        throw new ConflictException('A G/L Account cannot be its own parent.');
      }

      const [parent] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, dto.parent_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!parent) {
        throw new NotFoundException(`Parent G/L Account with ID '${dto.parent_account_id}' not found.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.account_code !== undefined) updates.account_code = dto.account_code;
    if (dto.account_name !== undefined) updates.account_name = dto.account_name;
    if (dto.account_type !== undefined) updates.account_type = dto.account_type;
    if (dto.parent_account_id !== undefined) updates.parent_account_id = dto.parent_account_id;
    if (dto.is_sub_account !== undefined) updates.is_sub_account = dto.is_sub_account;
    if (dto.is_reconciliation !== undefined) updates.is_reconciliation = dto.is_reconciliation;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.glAccountMaster)
      .set(updates)
      .where(eq(schema.glAccountMaster.gl_account_id, id));

    await this.auditService.log({
      tenantId,
      companyId: account.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'gl_account_master',
      entityId: id,
      oldValues: account,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const account = await this.findOne(id);

    // Verify no sub-accounts exist linking to this account
    const subAccounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.parent_account_id, id),
          isNull(schema.glAccountMaster.deleted_at)
        )
      )
      .limit(1);

    if (subAccounts.length > 0) {
      throw new ConflictException('Cannot delete a G/L Account that has active sub-accounts.');
    }

    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.glAccountMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.glAccountMaster.gl_account_id, id));

    await this.auditService.log({
      tenantId,
      companyId: account.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'gl_account_master',
      entityId: id,
      oldValues: account,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `G/L Account '${account.account_name}' soft-deleted successfully.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [account] = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(eq(schema.glAccountMaster.gl_account_id, id))
      .limit(1);

    if (!account) {
      throw new NotFoundException(`G/L Account with ID '${id}' not found.`);
    }

    if (!account.deleted_at) {
      return this.findOne(id);
    }

    // Verify parent is not deleted
    if (account.parent_account_id) {
      const [parent] = await this.db
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.gl_account_id, account.parent_account_id),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);

      if (!parent) {
        throw new ConflictException('Cannot restore a G/L Account whose parent is deleted or inactive. Restore parent first.');
      }
    }

    await this.db
      .update(schema.glAccountMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.glAccountMaster.gl_account_id, id));

    await this.auditService.log({
      tenantId,
      companyId: account.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'gl_account_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
