import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, eq, ne, isNull, like, or } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import * as masterSchema from '../../../core/database/master-schema';
import { MASTER_CONNECTION } from '../../../core/database/database.module';
import { CreateCompanyDto, UpdateCompanyDto, QueryCompanyDto } from './dto/company.dto';
import * as crypto from 'crypto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) =>
  date.toISOString().slice(0, 19).replace('T', ' ');

@Injectable()
export class CompanyService {
  constructor(
    private readonly cls: ClsService,
    @Inject(MASTER_CONNECTION)
    private readonly masterDb: MySql2Database<typeof masterSchema>,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async findByTenant(tenantId: string, query?: QueryCompanyDto) {
    const conditions: any[] = [
      eq(schema.companyMaster.tenant_id, tenantId),
      ne(schema.companyMaster.company_code, 'PLACEHOLDER'),
      isNull(schema.companyMaster.deleted_at),
    ];

    if (query) {
      if (query.isActive !== undefined) {
        conditions.push(eq(schema.companyMaster.is_active, query.isActive));
      }
      if (query.onboardingStatus !== undefined) {
        conditions.push(eq(schema.companyMaster.onboarding_status, query.onboardingStatus));
      }
      if (query.search) {
        conditions.push(
          or(
            like(schema.companyMaster.company_code, `%${query.search}%`),
            like(schema.companyMaster.company_name, `%${query.search}%`)
          )
        );
      }
    }

    const limit = query?.limit || 50;
    const offset = query?.offset || 0;

    return this.db
      .select()
      .from(schema.companyMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async findOne(companyId: string) {
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(
        eq(schema.companyMaster.company_id, companyId),
        isNull(schema.companyMaster.deleted_at)
      ))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found.`);
    }

    return company;
  }

  async create(dto: CreateCompanyDto, tenantId: string, userPayload?: any) {
    // Check plan limits in masterDb
    const [tenantMeta] = await this.masterDb
      .select()
      .from(masterSchema.tenantMaster)
      .where(eq(masterSchema.tenantMaster.tenant_id, tenantId))
      .limit(1);

    if (!tenantMeta) {
      throw new NotFoundException(`Tenant with ID '${tenantId}' not found.`);
    }

    const activeCompanies = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(
        ne(schema.companyMaster.company_code, 'PLACEHOLDER'),
        eq(schema.companyMaster.is_active, true),
      ));

    if (activeCompanies.length >= tenantMeta.max_companies) {
      throw new BadRequestException(
        `Company registration limit reached (${tenantMeta.max_companies}). Please upgrade your SaaS plan to create more companies.`
      );
    }

    // Check for duplicate company_code or company_name within tenant
    const existing = await this.db
      .select()
      .from(schema.companyMaster)
      .where(
        and(
          eq(schema.companyMaster.tenant_id, tenantId),
          or(
            eq(schema.companyMaster.company_code, dto.company_code.toUpperCase()),
            eq(schema.companyMaster.company_name, dto.company_name)
          ),
          isNull(schema.companyMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].company_code === dto.company_code.toUpperCase()) {
        throw new ConflictException(`Company with code '${dto.company_code}' already exists in this tenant.`);
      }
      throw new ConflictException(`Company with name '${dto.company_name}' already exists in this tenant.`);
    }

    // Get default language and currency if not specified or invalid UUID format
    let langId = dto.default_language_id;
    let currId = dto.base_currency_id;
    
    const isValidUuid = (val?: string) => 
      val && typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    if (!isValidUuid(langId)) {
      const [lang] = await this.db.select().from(schema.languageMaster).limit(1);
      langId = lang?.lang_id;
    }
    if (!isValidUuid(currId)) {
      const [curr] = await this.db.select().from(schema.currencyMaster).limit(1);
      currId = curr?.currency_id;
    }

    const companyId = crypto.randomUUID();

    return this.db.transaction(async (tx) => {
      // Create Company Master with COMPLETED onboarding status
      await tx.insert(schema.companyMaster).values({
        company_id: companyId,
        tenant_id: tenantId,
        company_code: dto.company_code,
        company_name: dto.company_name,
        company_display_name: dto.company_display_name || dto.company_name,
        company_type: dto.company_type,
        industry_type: dto.industry_type,
        base_currency_id: currId || '20000000-2000-2000-2000-200000000001',
        default_language_id: langId || '10000000-1000-1000-1000-100000000001',
        default_timezone_id: dto.default_timezone_id || 'Asia/Kolkata',
        country_id: dto.country_id,
        registration_no: dto.registration_no || null,
        tax_id: dto.tax_id || null,
        primary_color_hex: dto.primary_color_hex || '#1F4E79',
        onboarding_status: 'PENDING',
        is_active: true,
      });

      // Create default SUPER_ADMIN role for this company
      const roleId = crypto.randomUUID();
      await tx.insert(schema.roleMaster).values({
        role_id: roleId,
        company_id: companyId,
        role_code: 'SUPER_ADMIN',
        role_name: 'Super Administrator',
        role_description: 'Full administrative control over all company scopes',
        is_system_role: true,
      });

      // Seed all permissions for SUPER_ADMIN
      await tx.insert(schema.rolePermissions).values({
        role_id: roleId,
        module_code: 'ALL',
        resource: 'ALL',
        can_view: true,
        can_create: true,
        can_edit: true,
        can_delete: true,
        can_approve: true,
        can_export: true,
        can_print: true,
      });

      if (userPayload?.userId) {
        const existingAssignments = await tx
          .select({ assignId: schema.userCompanyAssignments.assign_id })
          .from(schema.userCompanyAssignments)
          .where(eq(schema.userCompanyAssignments.user_id, userPayload.userId));

        await tx.insert(schema.userCompanyAssignments).values({
          user_id: userPayload.userId,
          company_id: companyId,
          is_primary: existingAssignments.length === 0,
          assigned_by: userPayload.userId,
        });
        await tx.insert(schema.userRoleAssignment).values({
          user_id: userPayload.userId,
          role_id: roleId,
          assigned_by: userPayload.userId,
        });

        if (existingAssignments.length === 0) {
          await tx
            .update(schema.userMaster)
            .set({ company_id: companyId })
            .where(eq(schema.userMaster.user_id, userPayload.userId));
        }
      }

      // Create default MANAGER role for this company
      const managerRoleId = crypto.randomUUID();
      await tx.insert(schema.roleMaster).values({
        role_id: managerRoleId,
        company_id: companyId,
        role_code: 'MANAGER',
        role_name: 'Manager',
        role_description: 'General operational management and supervisor permissions',
        is_system_role: false,
      });
      // Seed permissions for MANAGER
      await tx.insert(schema.rolePermissions).values([
        { role_id: managerRoleId, module_code: 'POULTRY', resource: 'BATCH_CONTROL', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: true, can_export: true, can_print: true },
        { role_id: managerRoleId, module_code: 'POULTRY', resource: 'FEED_LOGS', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: true, can_export: true, can_print: true },
        { role_id: managerRoleId, module_code: 'ACCOUNTING', resource: 'LEDGER', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: false, can_export: true, can_print: true },
        { role_id: managerRoleId, module_code: 'FINANCE', resource: 'VALUATION', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: false, can_export: true, can_print: true },
        { role_id: managerRoleId, module_code: 'COMPANY', resource: 'SETTINGS', can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false, can_export: false, can_print: false },
      ]);

      // Create default ACCOUNTANT role for this company
      const accountantRoleId = crypto.randomUUID();
      await tx.insert(schema.roleMaster).values({
        role_id: accountantRoleId,
        company_id: companyId,
        role_code: 'ACCOUNTANT',
        role_name: 'Accountant',
        role_description: 'Accounting, ledgers, and financial valuation reports',
        is_system_role: false,
      });
      // Seed permissions for ACCOUNTANT
      await tx.insert(schema.rolePermissions).values([
        { role_id: accountantRoleId, module_code: 'ACCOUNTING', resource: 'LEDGER', can_view: true, can_create: true, can_edit: true, can_delete: true, can_approve: true, can_export: true, can_print: true },
        { role_id: accountantRoleId, module_code: 'FINANCE', resource: 'VALUATION', can_view: true, can_create: true, can_edit: true, can_delete: false, can_approve: true, can_export: true, can_print: true },
      ]);

      // Create default OPERATOR role for this company
      const operatorRoleId = crypto.randomUUID();
      await tx.insert(schema.roleMaster).values({
        role_id: operatorRoleId,
        company_id: companyId,
        role_code: 'OPERATOR',
        role_name: 'Operator',
        role_description: 'Daily operational tasks and farming log entry submissions',
        is_system_role: false,
      });
      // Seed permissions for OPERATOR
      await tx.insert(schema.rolePermissions).values([
        { role_id: operatorRoleId, module_code: 'POULTRY', resource: 'FEED_LOGS', can_view: true, can_create: true, can_edit: false, can_delete: false, can_approve: false, can_export: true, can_print: true },
        { role_id: operatorRoleId, module_code: 'POULTRY', resource: 'BATCH_CONTROL', can_view: true, can_create: false, can_edit: false, can_delete: false, can_approve: false, can_export: true, can_print: true },
      ]);

      // 1. Create Default Office Address
      await tx.insert(schema.companyAddress).values({
        company_id: companyId,
        address_type: 'REGISTERED',
        address_label: 'Registered Office',
        line1: 'Primary Office Block',
        city: dto.country_id === 'IND' ? 'Mumbai' : 'New York',
        state_id: '40000000-4000-4000-4000-400000000001',
        pincode: dto.country_id === 'IND' ? '400001' : '10001',
        country_id: dto.country_id || 'IND',
        is_active: true,
      });

      // 2. Create Default Primary Contact
      let userFullName = 'Tenant Administrator';
      if (userPayload?.userId) {
        const [u] = await tx
          .select()
          .from(schema.userMaster)
          .where(eq(schema.userMaster.user_id, userPayload.userId))
          .limit(1);
        if (u?.full_name) {
          userFullName = u.full_name;
        }
      }

      const contactId = crypto.randomUUID();
      await tx.insert(schema.companyContacts).values({
        contact_id: contactId,
        company_id: companyId,
        contact_type: 'PRIMARY',
        full_name: userFullName,
        email: userPayload?.email || 'admin@navfarm.com',
        phone_primary: '+919999999999',
        is_primary: true,
        receives_alerts: true,
        receives_reports: true,
        is_active: true,
      });

      // 3. Create Default Fiscal Configuration
      const fiscalId = crypto.randomUUID();
      const currentYear = new Date().getFullYear();
      await tx.insert(schema.companyFiscal).values({
        fiscal_id: fiscalId,
        company_id: companyId,
        fiscal_year_format: 'FY APR MAR',
        fiscal_start_month: 4,
        fiscal_start_day: 1,
        current_fiscal_year: `FY ${currentYear}-${(currentYear + 1).toString().slice(-2)}`,
        period_type: 'MONTHLY',
        accounting_standard: 'IND AS',
        depreciation_method: 'SLM',
        inventory_valuation: 'STANDARD',
        tax_audit_applicable: false,
        is_active: true,
      });

      // 4. Create default language configuration
      const langConfigId = crypto.randomUUID();
      await tx.insert(schema.companyLanguageConfig).values({
        config_id: langConfigId,
        company_id: companyId,
        lang_id: langId || '10000000-1000-1000-1000-100000000001',
        is_default: true,
        is_enabled: true,
        set_by: userPayload?.userId || null,
      });

      // 5. Create default currency configuration
      const currConfigId = crypto.randomUUID();
      await tx.insert(schema.companyCurrencyConfig).values({
        curr_config_id: currConfigId,
        company_id: companyId,
        currency_id: currId || '20000000-2000-2000-2000-200000000001',
        is_base: true,
        is_reporting: true,
        display_order: 1,
      });

      // 6. Enable standard default modules
      const defaultModules = ['FARM', 'INVENTORY', 'FINANCE', 'PROCUREMENT', 'SALES', 'HRMS'];
      const moduleInserts = defaultModules.map((modCode) => ({
        module_id: crypto.randomUUID(),
        company_id: companyId,
        module_code: modCode,
        is_active: true,
        activated_on: new Date().toISOString().split('T')[0],
      }));
      await tx.insert(schema.companyModules).values(moduleInserts);

      // 7. Seed only COMPANY_PROFILE step as COMPLETED in setupWizardLog
      const [profileStep] = await tx
        .select()
        .from(schema.setupStepMaster)
        .where(eq(schema.setupStepMaster.step_code, 'COMPANY_PROFILE'))
        .limit(1);

      if (profileStep) {
        await tx.insert(schema.setupWizardLog).values({
          log_id: crypto.randomUUID(),
          company_id: companyId,
          step_id: profileStep.step_id,
          status: 'COMPLETED',
          completed_at: toMysqlTimestamp(),
          completed_by: userPayload?.userId || null,
        });
      }

      const [company] = await tx
        .select()
        .from(schema.companyMaster)
        .where(eq(schema.companyMaster.company_id, companyId))
        .limit(1);

      return company;
    });
  }

  async update(companyId: string, dto: UpdateCompanyDto, tenantId?: string, userPayload?: any) {
    const company = await this.findOne(companyId);

    // Validate unique code / name if modified
    if (tenantId && (dto.company_code || dto.company_name)) {
      const codeOrName = [];
      if (dto.company_code) codeOrName.push(eq(schema.companyMaster.company_code, dto.company_code.toUpperCase()));
      if (dto.company_name) codeOrName.push(eq(schema.companyMaster.company_name, dto.company_name));

      const existing = await this.db
        .select()
        .from(schema.companyMaster)
        .where(
          and(
            eq(schema.companyMaster.tenant_id, tenantId),
            ne(schema.companyMaster.company_id, companyId),
            or(...codeOrName),
            isNull(schema.companyMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        if (dto.company_code && existing[0].company_code === dto.company_code.toUpperCase()) {
          throw new ConflictException(`Company with code '${dto.company_code}' already exists in this tenant.`);
        }
        throw new ConflictException(`Company with name '${dto.company_name}' already exists in this tenant.`);
      }
    }

    const updates: any = {
      updated_at: toMysqlTimestamp(),
      updated_by: userPayload?.userId || null,
    };

    if (dto.company_code !== undefined) updates.company_code = dto.company_code.toUpperCase();
    if (dto.company_name !== undefined) updates.company_name = dto.company_name;
    if (dto.company_display_name !== undefined) updates.company_display_name = dto.company_display_name;
    if (dto.company_type !== undefined) updates.company_type = dto.company_type;
    if (dto.industry_type !== undefined) updates.industry_type = dto.industry_type;
    if (dto.base_currency_id !== undefined) updates.base_currency_id = dto.base_currency_id;
    if (dto.default_language_id !== undefined) updates.default_language_id = dto.default_language_id;
    if (dto.country_id !== undefined) updates.country_id = dto.country_id;
    if (dto.default_timezone_id !== undefined) updates.default_timezone_id = dto.default_timezone_id;
    if (dto.registration_no !== undefined) updates.registration_no = dto.registration_no;
    if (dto.tax_id !== undefined) updates.tax_id = dto.tax_id;
    if (dto.primary_color_hex !== undefined) updates.primary_color_hex = dto.primary_color_hex;
    if (dto.onboarding_status !== undefined) updates.onboarding_status = dto.onboarding_status;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    await this.db
      .update(schema.companyMaster)
      .set(updates)
      .where(eq(schema.companyMaster.company_id, companyId));

    // Audit Log
    await this.auditService.log({
      tenantId: tenantId || company.tenant_id,
      companyId: companyId,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'company_master',
      entityId: companyId,
      oldValues: company,
      newValues: updates,
    });

    return this.findOne(companyId);
  }

  async remove(companyId: string, tenantId?: string, userPayload?: any) {
    const company = await this.findOne(companyId);
    const deletedTime = toMysqlTimestamp();

    // Soft-delete
    await this.db
      .update(schema.companyMaster)
      .set({
        is_active: false,
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.companyMaster.company_id, companyId));

    // Audit Log
    await this.auditService.log({
      tenantId: tenantId || company.tenant_id,
      companyId: companyId,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'company_master',
      entityId: companyId,
      oldValues: company,
      newValues: { is_active: false, deleted_at: deletedTime },
    });

    return { success: true, message: `Company '${company.company_name}' has been soft-deleted.` };
  }

  async restore(companyId: string, tenantId?: string, userPayload?: any) {
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(eq(schema.companyMaster.company_id, companyId))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found.`);
    }

    if (!company.deleted_at) {
      return company;
    }

    await this.db
      .update(schema.companyMaster)
      .set({
        is_active: true,
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.companyMaster.company_id, companyId));

    // Audit Log
    await this.auditService.log({
      tenantId: tenantId || company.tenant_id,
      companyId: companyId,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'company_master',
      entityId: companyId,
      newValues: { is_active: true, deleted_at: null },
    });

    return this.findOne(companyId);
  }
}
