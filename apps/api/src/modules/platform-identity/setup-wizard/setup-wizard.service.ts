import { Injectable, OnModuleInit, Inject, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import * as masterSchema from '../../../core/database/master-schema';
import { MASTER_CONNECTION } from '../../../core/database/database.module';
import { Step1ProfileDto } from './dto/step1-profile.dto';
import { Step2AddressDto } from './dto/step2-address.dto';
import { Step3ContactDto } from './dto/step3-contact.dto';
import { Step7FiscalDto } from './dto/step7-fiscal.dto';
import { Step9AdminUserDto } from './dto/step9-admin.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class SetupWizardService implements OnModuleInit {
  constructor(
    @Inject(MASTER_CONNECTION)
    private readonly masterDb: MySql2Database<typeof masterSchema>,
    private readonly cls: ClsService,
    private readonly auditLogService: AuditLogService,
    private readonly jwtService: JwtService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private get activeTenantId(): string {
    const tenantId = this.cls.get<string>('tenantId');
    if (!tenantId) {
      throw new ForbiddenException('Tenant context is required for onboarding.');
    }
    return tenantId;
  }

  private async assertCompanyInActiveTenant(companyId: string) {
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(
        eq(schema.companyMaster.company_id, companyId),
        eq(schema.companyMaster.tenant_id, this.activeTenantId),
      ))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company profile with ID '${companyId}' was not found in the active tenant.`);
    }
    return company;
  }

  async onModuleInit() {
    try {
      await this.masterDb
        .select({ planId: masterSchema.planMaster.plan_id })
        .from(masterSchema.planMaster)
        .limit(1);
    } catch {
      console.warn(
        'NAVFarm databases are not initialized. Run `pnpm nx db-bootstrap api` before using database-backed routes.',
      );
    }
  }

  async startOnboarding(dto: Step1ProfileDto) {
    if (dto.company_id) {
      throw new BadRequestException('Use PUT /setup/wizard/step-1 with the onboarding access token to update a company profile.');
    }

    const company = await this.saveStep1Profile(dto);
    const onboardingAccessToken = await this.jwtService.signAsync({
      purpose: 'ONBOARDING_SETUP',
      tenantId: company.tenant_id,
      companyId: company.company_id,
    }, { expiresIn: '4h' });

    return { ...company, onboarding_access_token: onboardingAccessToken };
  }

  async updateStep1Profile(dto: Step1ProfileDto) {
    if (!dto.company_id) {
      throw new BadRequestException('company_id is required when updating the company profile.');
    }
    await this.assertCompanyInActiveTenant(dto.company_id);
    return this.saveStep1Profile(dto);
  }

  private async saveStep1Profile(dto: Step1ProfileDto) {
    if (dto.tenant_id !== this.activeTenantId) {
      throw new ForbiddenException('Company setup must use the active tenant context.');
    }

    const existing = dto.company_id
      ? await this.db
          .select()
          .from(schema.companyMaster)
          .where(and(
            eq(schema.companyMaster.company_id, dto.company_id),
            eq(schema.companyMaster.tenant_id, this.activeTenantId),
          ))
          .limit(1)
      : await this.db
          .select()
          .from(schema.companyMaster)
          .where(and(
            eq(schema.companyMaster.tenant_id, dto.tenant_id),
            eq(schema.companyMaster.company_code, dto.company_code.toUpperCase()),
          ))
          .limit(1);

    if (!dto.company_id && existing.length > 0) {
      throw new ConflictException(`Company with code '${dto.company_code.toUpperCase()}' already exists in this tenant.`);
    }

    return this.db.transaction(async (tx) => {
      let company;
      if (existing.length > 0) {
        // Update
        await tx
          .update(schema.companyMaster)
          .set({
            company_code: dto.company_code.toUpperCase(),
            company_name: dto.company_name,
            company_display_name: dto.company_display_name || dto.company_name,
            company_type: dto.company_type,
            industry_type: dto.industry_type,
            registration_no: dto.registration_no,
            tax_id: dto.tax_id,
            tax_regime: dto.tax_regime || 'STANDARD',
            incorporation_date: dto.incorporation_date,
            website: dto.website,
            email_domain: dto.email_domain,
            support_email: dto.support_email,
            phone_primary: dto.phone_primary,
            company_logo_url: dto.company_logo_url,
            company_logo_dark_url: dto.company_logo_dark_url,
            primary_color_hex: dto.primary_color_hex || '#1F4E79',
          })
          .where(eq(schema.companyMaster.company_id, existing[0].company_id));

        [company] = await tx
          .select()
          .from(schema.companyMaster)
          .where(eq(schema.companyMaster.company_id, existing[0].company_id))
          .limit(1);
      } else {
        // Check plan limits in masterDb
        const [tenantMeta] = await this.masterDb
          .select()
          .from(masterSchema.tenantMaster)
          .where(eq(masterSchema.tenantMaster.tenant_id, dto.tenant_id))
          .limit(1);

        if (!tenantMeta) {
          throw new NotFoundException(`Tenant with ID '${dto.tenant_id}' not found.`);
        }

        const activeCompanies = await tx
          .select()
          .from(schema.companyMaster)
          .where(eq(schema.companyMaster.tenant_id, dto.tenant_id));

        if (activeCompanies.length >= tenantMeta.max_companies) {
          throw new BadRequestException(
            `Company registration limit reached (${tenantMeta.max_companies}). Please upgrade your SaaS plan to create more companies.`
          );
        }

        // Create - Drizzle schema fields base_currency_id, default_language_id, default_timezone_id, country_id are NOT NULL.
        // During step 1, we pass nil UUID placeholder references and update them in step 4, 5, 6.
        const companyId = randomUUID();
        const NIL_UUID = '00000000-0000-0000-0000-000000000000';
        await tx
          .insert(schema.companyMaster)
          .values({
            company_id: companyId,
            tenant_id: dto.tenant_id,
            company_code: dto.company_code.toUpperCase(),
            company_name: dto.company_name,
            company_display_name: dto.company_display_name || dto.company_name,
            company_type: dto.company_type,
            industry_type: dto.industry_type,
            registration_no: dto.registration_no,
            tax_id: dto.tax_id,
            tax_regime: dto.tax_regime || 'STANDARD',
            incorporation_date: dto.incorporation_date,
            website: dto.website,
            email_domain: dto.email_domain,
            support_email: dto.support_email,
            phone_primary: dto.phone_primary,
            company_logo_url: dto.company_logo_url,
            company_logo_dark_url: dto.company_logo_dark_url,
            primary_color_hex: dto.primary_color_hex || '#1F4E79',
            base_currency_id: NIL_UUID,
            default_language_id: NIL_UUID,
            default_timezone_id: NIL_UUID,
            country_id: NIL_UUID,
            onboarding_status: 'PENDING',
          });

        [company] = await tx
          .select()
          .from(schema.companyMaster)
          .where(eq(schema.companyMaster.company_id, companyId))
          .limit(1);
      }

      try {
        await this.auditLogService.log({
          tenantId: company.tenant_id,
          companyId: company.company_id,
          action: existing.length > 0 ? 'UPDATE_COMPANY' : 'CREATE_COMPANY',
          entityName: 'COMPANY',
          entityId: company.company_id,
          newValues: dto,
        }, tx);
      } catch (e) {
        console.error('Failed to log company configuration audit event:', e);
      }

      await this.logStepCompletion(tx, company.company_id, 'COMPANY_PROFILE');
      return company;
    });
  }

  async saveStep2Address(dto: Step2AddressDto) {
    await this.assertCompanyInActiveTenant(dto.company_id);
    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(schema.companyAddress)
        .where(eq(schema.companyAddress.company_id, dto.company_id))
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(schema.companyAddress)
          .set({
            address_type: dto.address_type,
            address_label: dto.address_label,
            line1: dto.line1,
            line2: dto.line2,
            city: dto.city,
            state_id: dto.state_id,
            country_id: dto.country_id,
            pincode: dto.pincode,
            gps_latitude: dto.gps_latitude?.toString() || null,
            gps_longitude: dto.gps_longitude?.toString() || null,
          })
          .where(eq(schema.companyAddress.company_id, dto.company_id));
      } else {
        await tx.insert(schema.companyAddress).values({
          company_id: dto.company_id,
          address_type: dto.address_type,
          address_label: dto.address_label,
          line1: dto.line1,
          line2: dto.line2,
          city: dto.city,
          state_id: dto.state_id,
          country_id: dto.country_id,
          pincode: dto.pincode,
          gps_latitude: dto.gps_latitude?.toString(),
          gps_longitude: dto.gps_longitude?.toString(),
          is_primary: true,
        });
      }

      await this.logStepCompletion(tx, dto.company_id, 'ADDRESS');
    });
    return { success: true };
  }

  async saveStep3Contact(dto: Step3ContactDto) {
    await this.assertCompanyInActiveTenant(dto.company_id);
    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(schema.companyContacts)
        .where(eq(schema.companyContacts.company_id, dto.company_id))
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(schema.companyContacts)
          .set({
            contact_type: dto.contact_type,
            full_name: dto.full_name,
            designation: dto.designation,
            email: dto.email,
            phone_primary: dto.phone_primary,
            phone_secondary: dto.phone_secondary,
            receives_alerts: dto.receives_alerts || false,
            receives_reports: dto.receives_reports || false,
          })
          .where(eq(schema.companyContacts.company_id, dto.company_id));
      } else {
        await tx.insert(schema.companyContacts).values({
          company_id: dto.company_id,
          contact_type: dto.contact_type,
          full_name: dto.full_name,
          designation: dto.designation,
          email: dto.email,
          phone_primary: dto.phone_primary,
          phone_secondary: dto.phone_secondary,
          receives_alerts: dto.receives_alerts || false,
          receives_reports: dto.receives_reports || false,
          is_primary: true,
        });
      }

      await this.logStepCompletion(tx, dto.company_id, 'KEY_CONTACTS');
    });
    return { success: true };
  }

  async saveStep4Language(companyId: string, langId: string) {
    await this.assertCompanyInActiveTenant(companyId);
    
    // Validate language exists
    const [lang] = await this.masterDb
      .select()
      .from(masterSchema.languageMaster)
      .where(and(eq(masterSchema.languageMaster.lang_id, langId), eq(masterSchema.languageMaster.is_active, true)))
      .limit(1);

    if (!lang) {
      throw new NotFoundException(`Language with ID '${langId}' was not found or is inactive.`);
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.companyMaster)
        .set({ default_language_id: langId })
        .where(eq(schema.companyMaster.company_id, companyId));

      await this.logStepCompletion(tx, companyId, 'DEFAULT_LANGUAGE');
    });
    return { success: true, language: lang };
  }

  async saveStep5Currency(companyId: string, currencyId: string) {
    await this.assertCompanyInActiveTenant(companyId);
    
    // Validate currency exists
    const [curr] = await this.masterDb
      .select()
      .from(masterSchema.currencyMaster)
      .where(and(eq(masterSchema.currencyMaster.currency_id, currencyId), eq(masterSchema.currencyMaster.is_active, true)))
      .limit(1);

    if (!curr) {
      throw new NotFoundException(`Currency with ID '${currencyId}' was not found or is inactive.`);
    }

    // Lock base currency after first financial transaction
    const [postedTx] = await this.db
      .select()
      .from(schema.generalLedgerEntry)
      .where(eq(schema.generalLedgerEntry.company_id, companyId))
      .limit(1);

    if (postedTx) {
      throw new ForbiddenException('Base currency cannot be changed after financial transactions have been posted to the general ledger.');
    }

    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.companyMaster)
        .set({ base_currency_id: currencyId })
        .where(eq(schema.companyMaster.company_id, companyId));

      await this.logStepCompletion(tx, companyId, 'BASE_CURRENCY');
    });
    return { success: true, currency: curr };
  }

  async saveStep6Timezone(companyId: string, timezoneId: string, countryId: string) {
    await this.assertCompanyInActiveTenant(companyId);
    await this.db.transaction(async (tx) => {
      await tx
        .update(schema.companyMaster)
        .set({ default_timezone_id: timezoneId, country_id: countryId })
        .where(eq(schema.companyMaster.company_id, companyId));

      await this.logStepCompletion(tx, companyId, 'TIMEZONE');
    });
    return { success: true };
  }

  async saveStep7Fiscal(dto: Step7FiscalDto) {
    await this.assertCompanyInActiveTenant(dto.company_id);
    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(schema.companyFiscal)
        .where(eq(schema.companyFiscal.company_id, dto.company_id))
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(schema.companyFiscal)
          .set({
            fiscal_year_format: dto.fiscal_year_format,
            fiscal_start_month: dto.fiscal_start_month,
            fiscal_start_day: dto.fiscal_start_day,
            fiscal_end_day: dto.fiscal_end_day || 31,
            current_fiscal_year: dto.current_fiscal_year,
            period_type: dto.period_type,
            accounting_standard: dto.accounting_standard,
            depreciation_method: dto.depreciation_method || 'SLM',
            inventory_valuation: dto.inventory_valuation,
            gst_filing_frequency: dto.gst_filing_frequency,
            tax_audit_applicable: dto.tax_audit_applicable || false,
            decimal_places: dto.decimal_places ?? 2,
          })
          .where(eq(schema.companyFiscal.company_id, dto.company_id));
      } else {
        await tx.insert(schema.companyFiscal).values({
          company_id: dto.company_id,
          fiscal_year_format: dto.fiscal_year_format,
          fiscal_start_month: dto.fiscal_start_month,
          fiscal_start_day: dto.fiscal_start_day,
          fiscal_end_day: dto.fiscal_end_day || 31,
          current_fiscal_year: dto.current_fiscal_year,
          period_type: dto.period_type,
          accounting_standard: dto.accounting_standard,
          depreciation_method: dto.depreciation_method || 'SLM',
          inventory_valuation: dto.inventory_valuation,
          gst_filing_frequency: dto.gst_filing_frequency,
          tax_audit_applicable: dto.tax_audit_applicable || false,
          decimal_places: dto.decimal_places ?? 2,
        });
      }

      await this.logStepCompletion(tx, dto.company_id, 'FISCAL_YEAR');
    });
    return { success: true };
  }

  async saveStep8Modules(companyId: string, modules: string[]) {
    await this.assertCompanyInActiveTenant(companyId);
    const modulesList = modules || [];
    await this.db.transaction(async (tx) => {
      // Clear old module configs
      await tx.delete(schema.companyModules).where(eq(schema.companyModules.company_id, companyId));

      if (modulesList.length > 0) {
        const moduleInserts = modulesList.map((modCode) => ({
          module_id: randomUUID(),
          company_id: companyId,
          module_code: modCode,
          is_active: true,
          activated_on: new Date().toISOString().split('T')[0],
        }));

        await tx.insert(schema.companyModules).values(moduleInserts);
      }

      await this.logStepCompletion(tx, companyId, 'ENABLE_MODULES');
    });
    return { success: true };
  }

  async saveStep9AdminUser(dto: Step9AdminUserDto) {
    const company = await this.assertCompanyInActiveTenant(dto.company_id);
    await this.db.transaction(async (tx) => {
      await this.logStepCompletion(tx, dto.company_id, 'ADMIN_USER');
    });
    return { success: true, message: `Administrator user '${dto.full_name}' linked for company ${company.company_name}.` };
  }

  async getWizardStatus(companyId: string) {
    const company = await this.assertCompanyInActiveTenant(companyId);
    const steps = await this.db
      .select()
      .from(schema.setupStepMaster)
      .orderBy(schema.setupStepMaster.step_order);

    const logs = await this.db
      .select()
      .from(schema.setupWizardLog)
      .where(eq(schema.setupWizardLog.company_id, companyId));

    const logsList = Array.isArray(logs) ? logs : [];
    const mappedSteps = steps.map((step) => {
      const stepLog = logsList.find((l) => l.step_id === step.step_id || l.step_code === step.step_code);
      return {
        stepCode: step.step_code,
        stepName: step.step_name,
        stepOrder: step.step_order,
        isMandatory: step.is_mandatory,
        status: stepLog ? stepLog.status : 'PENDING',
        completedAt: stepLog ? stepLog.completed_at : null,
      };
    });

    const mandatorySteps = mappedSteps.filter(s => s.isMandatory && s.stepOrder <= 9);
    const completedMandatoryCount = mandatorySteps.filter(s => s.status === 'COMPLETED').length;
    const progressPct = Math.round((completedMandatoryCount / mandatorySteps.length) * 100);
    const nextStep = mappedSteps.find(s => s.isMandatory && s.stepOrder <= 9 && s.status !== 'COMPLETED');

    return {
      companyId,
      companyCode: company.company_code,
      companyName: company.company_name,
      onboardingStatus: company.onboarding_status,
      totalMandatorySteps: mandatorySteps.length,
      completedMandatorySteps: completedMandatoryCount,
      progressPct,
      nextStepCode: nextStep ? nextStep.stepCode : null,
      isCompleteReady: completedMandatoryCount === mandatorySteps.length,
      steps: mappedSteps,
    };
  }

  async completeWizard(companyId: string) {
    await this.assertCompanyInActiveTenant(companyId);
    const wizardStatus = await this.getWizardStatus(companyId);
    const stepsList = Array.isArray(wizardStatus) ? wizardStatus : wizardStatus.steps;

    const pendingMandatory = stepsList.filter(
      (s) => s.isMandatory && s.stepOrder <= 9 && s.status !== 'COMPLETED',
    );

    if (pendingMandatory.length > 0) {
      const names = pendingMandatory.map((s) => s.stepName || s.stepCode).join(', ');
      throw new BadRequestException(
        `Onboarding wizard cannot be completed. The following mandatory steps are pending: ${names}`,
      );
    }

    // Mark company onboarding as completed
    await this.db
      .update(schema.companyMaster)
      .set({ onboarding_status: 'COMPLETED' })
      .where(eq(schema.companyMaster.company_id, companyId));

    // Mark the final completion step as completed in log
    await this.logStepCompletion(this.db, companyId, 'SETUP_COMPLETE');

    return {
      success: true,
      onboarding_status: 'COMPLETED',
      message: 'Onboarding setup wizard successfully completed. Dashboard unlocked.',
    };
  }

  // Internal Helper to log completions
  private async logStepCompletion(tx: any, companyId: string, stepCode: string) {
    const [step] = await tx
      .select()
      .from(schema.setupStepMaster)
      .where(eq(schema.setupStepMaster.step_code, stepCode))
      .limit(1);

    if (!step) return;

    const existingLog = await tx
      .select()
      .from(schema.setupWizardLog)
      .where(and(eq(schema.setupWizardLog.company_id, companyId), eq(schema.setupWizardLog.step_id, step.step_id)))
      .limit(1);

    if (existingLog.length > 0) {
      await tx
        .update(schema.setupWizardLog)
        .set({ status: 'COMPLETED', completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19) })
        .where(eq(schema.setupWizardLog.log_id, existingLog[0].log_id));
    } else {
      await tx.insert(schema.setupWizardLog).values({
        log_id: randomUUID(),
        company_id: companyId,
        step_id: step.step_id,
        status: 'COMPLETED',
        completed_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
    }
  }

  async listNobs(tenantId?: string) {
    const nobs = await this.masterDb
      .select()
      .from(masterSchema.nobMaster)
      .where(eq(masterSchema.nobMaster.is_active, true));
    if (!tenantId) return nobs;

    const [tenant] = await this.masterDb
      .select({ allowedNobIds: masterSchema.tenantMaster.allowed_nob_ids })
      .from(masterSchema.tenantMaster)
      .where(eq(masterSchema.tenantMaster.tenant_id, tenantId))
      .limit(1);
    if (!tenant?.allowedNobIds?.length) return nobs;
    const allowed = new Set(tenant.allowedNobIds);
    return nobs.filter((nob) => allowed.has(nob.nob_id));
  }

  async listLobs(nobId: string, tenantId?: string) {
    const lobs = await this.masterDb
      .select()
      .from(masterSchema.lobMaster)
      .where(and(eq(masterSchema.lobMaster.nob_id, nobId), eq(masterSchema.lobMaster.is_active, true)))
      .orderBy(masterSchema.lobMaster.sort_order);
    if (!tenantId) return lobs;

    const [tenant] = await this.masterDb
      .select({ allowedLobIds: masterSchema.tenantMaster.allowed_lob_ids })
      .from(masterSchema.tenantMaster)
      .where(eq(masterSchema.tenantMaster.tenant_id, tenantId))
      .limit(1);
    if (!tenant?.allowedLobIds?.length) return lobs;
    const allowed = new Set(tenant.allowedLobIds);
    return lobs.filter((lob) => allowed.has(lob.lob_id));
  }

  async getCompanySetupDetails(companyId: string) {
    await this.assertCompanyInActiveTenant(companyId);
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(eq(schema.companyMaster.company_id, companyId))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company profile with ID '${companyId}' not found.`);
    }

    const [address] = await this.db
      .select()
      .from(schema.companyAddress)
      .where(eq(schema.companyAddress.company_id, companyId))
      .limit(1);

    const [contact] = await this.db
      .select()
      .from(schema.companyContacts)
      .where(eq(schema.companyContacts.company_id, companyId))
      .limit(1);

    const [fiscal] = await this.db
      .select()
      .from(schema.companyFiscal)
      .where(eq(schema.companyFiscal.company_id, companyId))
      .limit(1);

    const modules = await this.db
      .select()
      .from(schema.companyModules)
      .where(eq(schema.companyModules.company_id, companyId));

    return {
      company,
      address: address || null,
      contact: contact || null,
      fiscal: fiscal || null,
      modules: modules.map(m => m.module_code)
    };
  }

  async createNob(data: any) {
    const nobId = data.nob_id || randomUUID();
    await this.masterDb.insert(masterSchema.nobMaster).values({
      ...data,
      nob_id: nobId
    });
    const [newNob] = await this.masterDb.select().from(masterSchema.nobMaster).where(eq(masterSchema.nobMaster.nob_id, nobId)).limit(1);
    return newNob;
  }

  async updateNob(id: string, data: any) {
    await this.masterDb
      .update(masterSchema.nobMaster)
      .set(data)
      .where(eq(masterSchema.nobMaster.nob_id, id));
    
    const [updatedNob] = await this.masterDb.select().from(masterSchema.nobMaster).where(eq(masterSchema.nobMaster.nob_id, id)).limit(1);
    return updatedNob;
  }

  async deleteNob(id: string) {
    const [deletedNob] = await this.masterDb.select().from(masterSchema.nobMaster).where(eq(masterSchema.nobMaster.nob_id, id)).limit(1);
    
    await this.masterDb
      .delete(masterSchema.nobMaster)
      .where(eq(masterSchema.nobMaster.nob_id, id));
    
    return deletedNob;
  }

  async createLob(data: any) {
    const lobId = data.lob_id || randomUUID();
    await this.masterDb.insert(masterSchema.lobMaster).values({
      ...data,
      lob_id: lobId
    });
    const [newLob] = await this.masterDb.select().from(masterSchema.lobMaster).where(eq(masterSchema.lobMaster.lob_id, lobId)).limit(1);
    return newLob;
  }

  async updateLob(id: string, data: any) {
    await this.masterDb
      .update(masterSchema.lobMaster)
      .set(data)
      .where(eq(masterSchema.lobMaster.lob_id, id));
    
    const [updatedLob] = await this.masterDb.select().from(masterSchema.lobMaster).where(eq(masterSchema.lobMaster.lob_id, id)).limit(1);
    return updatedLob;
  }

  async deleteLob(id: string) {
    const [deletedLob] = await this.masterDb.select().from(masterSchema.lobMaster).where(eq(masterSchema.lobMaster.lob_id, id)).limit(1);
    
    await this.masterDb
      .delete(masterSchema.lobMaster)
      .where(eq(masterSchema.lobMaster.lob_id, id));
    
    return deletedLob;
  }

  async listCountries() {
    return [
      { country_id: 'IND', country_name: 'India', iso2: 'IN', iso3: 'IND', phone_code: '+91', default_currency: 'INR' },
      { country_id: 'AO', country_name: 'Angola', iso2: 'AO', iso3: 'AGO', phone_code: '+244', default_currency: 'AOA' },
      { country_id: 'USA', country_name: 'United States', iso2: 'US', iso3: 'USA', phone_code: '+1', default_currency: 'USD' },
      { country_id: 'UAE', country_name: 'United Arab Emirates', iso2: 'AE', iso3: 'ARE', phone_code: '+971', default_currency: 'AED' },
      { country_id: 'GBR', country_name: 'United Kingdom', iso2: 'GB', iso3: 'GBR', phone_code: '+44', default_currency: 'GBP' },
      { country_id: 'NGA', country_name: 'Nigeria', iso2: 'NG', iso3: 'NGA', phone_code: '+234', default_currency: 'NGN' },
      { country_id: 'KEN', country_name: 'Kenya', iso2: 'KE', iso3: 'KEN', phone_code: '+254', default_currency: 'KES' },
      { country_id: 'ZAF', country_name: 'South Africa', iso2: 'ZA', iso3: 'ZAF', phone_code: '+27', default_currency: 'ZAR' },
    ];
  }

  async listStates(countryId?: string) {
    const allStates: Record<string, Array<{ state_id: string; state_name: string; country_id: string }>> = {
      IND: [
        { state_id: 'IND-MH', state_name: 'Maharashtra', country_id: 'IND' },
        { state_id: 'IND-UP', state_name: 'Uttar Pradesh', country_id: 'IND' },
        { state_id: 'IND-DL', state_name: 'Delhi', country_id: 'IND' },
        { state_id: 'IND-KA', state_name: 'Karnataka', country_id: 'IND' },
        { state_id: 'IND-TN', state_name: 'Tamil Nadu', country_id: 'IND' },
        { state_id: 'IND-GJ', state_name: 'Gujarat', country_id: 'IND' },
        { state_id: 'IND-PB', state_name: 'Punjab', country_id: 'IND' },
        { state_id: 'IND-HR', state_name: 'Haryana', country_id: 'IND' },
      ],
      AO: [
        { state_id: 'AO-LUA', state_name: 'Luanda', country_id: 'AO' },
        { state_id: 'AO-BGO', state_name: 'Bengo', country_id: 'AO' },
        { state_id: 'AO-BGU', state_name: 'Benguela', country_id: 'AO' },
        { state_id: 'AO-BIE', state_name: 'Bié', country_id: 'AO' },
        { state_id: 'AO-CAB', state_name: 'Cabinda', country_id: 'AO' },
        { state_id: 'AO-HUA', state_name: 'Huambo', country_id: 'AO' },
        { state_id: 'AO-HUI', state_name: 'Huíla', country_id: 'AO' },
      ],
      USA: [
        { state_id: 'US-CA', state_name: 'California', country_id: 'USA' },
        { state_id: 'US-TX', state_name: 'Texas', country_id: 'USA' },
        { state_id: 'US-NY', state_name: 'New York', country_id: 'USA' },
        { state_id: 'US-FL', state_name: 'Florida', country_id: 'USA' },
        { state_id: 'US-IL', state_name: 'Illinois', country_id: 'USA' },
      ],
      UAE: [
        { state_id: 'UAE-DXB', state_name: 'Dubai', country_id: 'UAE' },
        { state_id: 'UAE-AUH', state_name: 'Abu Dhabi', country_id: 'UAE' },
        { state_id: 'UAE-SHJ', state_name: 'Sharjah', country_id: 'UAE' },
      ],
    };

    if (countryId && allStates[countryId]) {
      return allStates[countryId];
    }
    return Object.values(allStates).flat();
  }
}
