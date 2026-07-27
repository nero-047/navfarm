import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateGlAccountDto, UpdateGlAccountDto, QueryGlAccountDto } from '../dto/gl-account.dto';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class CoaService {
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

  async create(dto: CreateGlAccountDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Validate parent account
      if (dto.parent_account_id) {
        const [parent] = await trx
          .select()
          .from(schema.glAccountMaster)
          .where(
            and(
              eq(schema.glAccountMaster.gl_account_id, dto.parent_account_id),
              eq(schema.glAccountMaster.tenant_id, tenantId)
            )
          )
          .limit(1);
        if (!parent) {
          throw new NotFoundException(`Parent GL account with ID '${dto.parent_account_id}' not found.`);
        }
        if (parent.company_id !== dto.company_id) {
          throw new BadRequestException('Parent account must belong to the same company.');
        }
      }

      // 3. Duplicate check for code within company
      const [existing] = await trx
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
      if (existing) {
        throw new ConflictException(`GL account code '${dto.account_code}' already exists in this company.`);
      }

      const accountId = randomUUID();
      const newAccount = {
        gl_account_id: accountId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        account_code: dto.account_code,
        account_name: dto.account_name,
        account_type: dto.account_type,
        parent_account_id: dto.parent_account_id || null,
        is_sub_account: !!dto.parent_account_id,
        is_reconciliation: dto.is_reconciliation || false,
        cost_center_required: dto.cost_center_required || false,
        dimension_required: dto.dimension_required || false,
        is_active: true,
        status: 'ACTIVE',
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.glAccountMaster).values(newAccount);

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'gl_account_master',
        entityId: accountId,
        newValues: newAccount,
      });

      return this.findOne(accountId, tenantId, trx);
    });
  }

  async update(accountId: string, dto: UpdateGlAccountDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const account = await this.findOne(accountId, tenantId, trx);

      const updateValues: Partial<typeof schema.glAccountMaster.$inferInsert> = {
        updated_by: userId || null,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      if (dto.account_name !== undefined) updateValues.account_name = dto.account_name;
      if (dto.is_active !== undefined) {
        updateValues.is_active = dto.is_active;
        updateValues.status = dto.is_active ? 'ACTIVE' : 'INACTIVE';
      }
      if (dto.cost_center_required !== undefined) updateValues.cost_center_required = dto.cost_center_required;
      if (dto.dimension_required !== undefined) updateValues.dimension_required = dto.dimension_required;

      await trx
        .update(schema.glAccountMaster)
        .set(updateValues)
        .where(eq(schema.glAccountMaster.gl_account_id, accountId));

      await this.auditService.log({
        tenantId,
        companyId: account.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'gl_account_master',
        entityId: accountId,
        oldValues: account,
        newValues: { ...account, ...updateValues },
      });

      return this.findOne(accountId, tenantId, trx);
    });
  }

  async delete(accountId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const account = await this.findOne(accountId, tenantId, trx);

      // Rule: Prevent deleting account with ledger transaction history
      const [hasLedger] = await trx
        .select()
        .from(schema.generalLedgerEntry)
        .where(
          and(
            eq(schema.generalLedgerEntry.gl_account_id, accountId),
            eq(schema.generalLedgerEntry.tenant_id, tenantId)
          )
        )
        .limit(1);
      if (hasLedger) {
        throw new BadRequestException('Cannot delete GL account with active ledger transaction history.');
      }

      // Rule: Prevent deleting parent account if it has active child accounts
      const [hasChildren] = await trx
        .select()
        .from(schema.glAccountMaster)
        .where(
          and(
            eq(schema.glAccountMaster.parent_account_id, accountId),
            eq(schema.glAccountMaster.tenant_id, tenantId),
            isNull(schema.glAccountMaster.deleted_at)
          )
        )
        .limit(1);
      if (hasChildren) {
        throw new BadRequestException('Cannot delete parent GL account with active sub-accounts.');
      }

      // Soft delete
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.glAccountMaster)
        .set({
          deleted_at: nowStr,
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.glAccountMaster.gl_account_id, accountId));

      await this.auditService.log({
        tenantId,
        companyId: account.company_id,
        userId,
        action: 'DELETE',
        entityName: 'gl_account_master',
        entityId: accountId,
        oldValues: account,
      });

      return { success: true, message: 'GL Account soft deleted successfully.' };
    });
  }

  async findOne(accountId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [account] = await dbClient
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.gl_account_id, accountId),
          eq(schema.glAccountMaster.tenant_id, tenantId),
          isNull(schema.glAccountMaster.deleted_at)
        )
      )
      .limit(1);

    if (!account) {
      throw new NotFoundException(`GL Account with ID '${accountId}' not found.`);
    }

    return account;
  }

  async findAll(query: QueryGlAccountDto, tenantId: string) {
    const conditions = [
      eq(schema.glAccountMaster.tenant_id, tenantId),
      isNull(schema.glAccountMaster.deleted_at)
    ];

    if (query.companyId) {
      conditions.push(eq(schema.glAccountMaster.company_id, query.companyId));
    }
    if (query.accountType) {
      conditions.push(eq(schema.glAccountMaster.account_type, query.accountType));
    }
    if (query.search) {
      conditions.push(
        like(schema.glAccountMaster.account_name, `%${query.search}%`)
      );
    }

    return this.db
      .select()
      .from(schema.glAccountMaster)
      .where(and(...conditions));
  }

  async getTree(companyId: string, tenantId: string) {
    const accounts = await this.db
      .select()
      .from(schema.glAccountMaster)
      .where(
        and(
          eq(schema.glAccountMaster.tenant_id, tenantId),
          eq(schema.glAccountMaster.company_id, companyId),
          isNull(schema.glAccountMaster.deleted_at)
        )
      );

    // Build hierarchical tree structure
    const map = new Map<string, any>();
    const roots: any[] = [];

    for (const acc of accounts) {
      map.set(acc.gl_account_id, { ...acc, children: [] });
    }

    for (const accNode of map.values()) {
      if (accNode.parent_account_id) {
        const parent = map.get(accNode.parent_account_id);
        if (parent) {
          parent.children.push(accNode);
        } else {
          roots.push(accNode);
        }
      } else {
        roots.push(accNode);
      }
    }

    return roots;
  }
}
