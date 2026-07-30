import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { SetupWizardService } from '../src/modules/platform-identity/setup-wizard/setup-wizard.service';
import { SetupWizardController } from '../src/modules/platform-identity/setup-wizard/setup-wizard.controller';
import { FiscalService } from '../src/modules/finance-accounting/finance/services/fiscal.service';
import { AuditLogService } from '../src/modules/platform-identity/audit-log/audit-log.service';
import { OnboardingAccessGuard } from '../src/common/guards/onboarding-access.guard';

describe('RAK Company/Tenant Onboarding End-to-End Integration Suite', () => {
  let app: INestApplication;
  let wizardService: SetupWizardService;
  let fiscalService: FiscalService;
  let clsService: ClsService;

  const tenantId = 'tenant-test-1111';
  let companyId = 'company-test-2222';

  const mockCompanyDbStore: Record<string, any> = {};
  const mockLogsStore: Array<{ log_id: string; company_id: string; step_id: string; status: string; completed_at: string }> = [];
  const mockGeneralLedgerStore: Array<any> = [];

  const mockStepsMaster = [
    { step_id: 's1', step_code: 'COMPANY_PROFILE', step_name: 'Company profile', step_order: 1, is_mandatory: true },
    { step_id: 's2', step_code: 'ADDRESS', step_name: 'Address', step_order: 2, is_mandatory: true },
    { step_id: 's3', step_code: 'KEY_CONTACTS', step_name: 'Primary contacts', step_order: 3, is_mandatory: true },
    { step_id: 's4', step_code: 'DEFAULT_LANGUAGE', step_name: 'Language', step_order: 4, is_mandatory: true },
    { step_id: 's5', step_code: 'BASE_CURRENCY', step_name: 'Base currency', step_order: 5, is_mandatory: true },
    { step_id: 's6', step_code: 'TIMEZONE', step_name: 'Timezone', step_order: 6, is_mandatory: true },
    { step_id: 's7', step_code: 'FISCAL_YEAR', step_name: 'Fiscal & accounting', step_order: 7, is_mandatory: true },
    { step_id: 's8', step_code: 'ENABLE_MODULES', step_name: 'Enable modules', step_order: 8, is_mandatory: true },
    { step_id: 's9', step_code: 'ADMIN_USER', step_name: 'Administrator account', step_order: 9, is_mandatory: true },
    { step_id: 's15', step_code: 'SETUP_COMPLETE', step_name: 'Setup complete', step_order: 15, is_mandatory: false },
  ];

  const mockMasterDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation(() => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('language') || tableName.includes('languageMaster')) {
                return [{ lang_id: '10000000-1000-1000-1000-100000000001', lang_code: 'en', is_active: true }];
              }
              if (tableName.includes('currency') || tableName.includes('currencyMaster')) {
                return [{ currency_id: '20000000-2000-2000-2000-200000000001', iso_code: 'INR', is_active: true }];
              }
              return [{ max_companies: 5, tenant_id: tenantId }];
            }),
          })),
          limit: jest.fn().mockReturnValue([
            { planId: 'PLAN_PRO', max_companies: 5, tenant_id: tenantId },
          ]),
        };
      }),
    }),
  };

  function makeQueryPromise(data: any[]) {
    const p = Promise.resolve(data) as any;
    p.orderBy = jest.fn().mockImplementation(() => makeQueryPromise(data));
    p.limit = jest.fn().mockImplementation((n?: number) => makeQueryPromise(typeof n === 'number' ? data.slice(0, n) : data));
    return p;
  }

  const mockTenantDb: any = {
    transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTenantDb)),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation(() => {
            if (tableName.includes('general_ledger') || tableName.includes('generalLedger')) {
              return makeQueryPromise(mockGeneralLedgerStore);
            }
            if (tableName.includes('setup_wizard_log') || tableName.includes('setupWizardLog')) {
              return makeQueryPromise(mockLogsStore);
            }
            if (tableName.includes('setup_step_master') || tableName.includes('setupStepMaster')) {
              return makeQueryPromise(mockStepsMaster);
            }
            return makeQueryPromise([
              {
                company_id: companyId,
                tenant_id: tenantId,
                company_code: 'TESTCO',
                company_name: 'Test Poultry Farm',
                onboarding_status: mockCompanyDbStore.onboarding_status || 'PENDING',
              },
            ]);
          }),
          orderBy: jest.fn().mockImplementation(() => makeQueryPromise(mockStepsMaster)),
        };
      }),
    }),
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockImplementation((val: any) => {
        if (val.step_id) {
          mockLogsStore.push(val);
        }
        return Promise.resolve();
      }),
    }),
    update: jest.fn().mockReturnValue({
      set: jest.fn().mockImplementation((setObj: any) => ({
        where: jest.fn().mockImplementation(() => {
          Object.assign(mockCompanyDbStore, setObj);
          return Promise.resolve();
        }),
      })),
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue(Promise.resolve()),
    }),
  };

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-onboarding-jwt-token'),
    verifyAsync: jest.fn().mockResolvedValue({ tenantId, companyId, purpose: 'ONBOARDING_SETUP' }),
  };

  const mockAuditLogService = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const clsStore = new Map<string, any>();
    clsStore.set('tenantId', tenantId);
    clsStore.set('tenantDb', mockTenantDb);

    clsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SetupWizardController],
      providers: [
        SetupWizardService,
        FiscalService,
        OnboardingAccessGuard,
        { provide: ClsService, useValue: clsService },
        { provide: 'MASTER_CONNECTION', useValue: mockMasterDb },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    wizardService = moduleRef.get<SetupWizardService>(SetupWizardService);
    fiscalService = moduleRef.get<FiscalService>(FiscalService);
  });

  describe('1. Mandatory Step Gate Validation & Wizard Completion Flow', () => {
    it('should reject wizard completion when mandatory steps are pending', async () => {
      // Clean logs store
      mockLogsStore.length = 0;
      mockCompanyDbStore.onboarding_status = 'PENDING';

      await expect(wizardService.completeWizard(companyId)).rejects.toThrow(BadRequestException);
    });

    it('should calculate accurate onboarding progress percentage and next step', async () => {
      // Simulate steps 1 through 3 completed
      mockLogsStore.length = 0;
      mockLogsStore.push(
        { log_id: 'l1', company_id: companyId, step_id: 's1', status: 'COMPLETED', completed_at: '2026-07-30' },
        { log_id: 'l2', company_id: companyId, step_id: 's2', status: 'COMPLETED', completed_at: '2026-07-30' },
        { log_id: 'l3', company_id: companyId, step_id: 's3', status: 'COMPLETED', completed_at: '2026-07-30' },
      );

      const status = await wizardService.getWizardStatus(companyId);
      expect(status.totalMandatorySteps).toBe(9);
      expect(status.completedMandatorySteps).toBe(3);
      expect(status.progressPct).toBe(33);
      expect(status.nextStepCode).toBe('DEFAULT_LANGUAGE');
      expect(status.isCompleteReady).toBe(false);
    });

    it('should allow completion when all mandatory steps 1-9 are completed', async () => {
      // Complete steps 1-9
      mockLogsStore.length = 0;
      for (let i = 1; i <= 9; i++) {
        mockLogsStore.push({
          log_id: `l${i}`,
          company_id: companyId,
          step_id: `s${i}`,
          status: 'COMPLETED',
          completed_at: '2026-07-30',
        });
      }

      const result = await wizardService.completeWizard(companyId);
      expect(result.success).toBe(true);
      expect(result.onboarding_status).toBe('COMPLETED');
      expect(mockCompanyDbStore.onboarding_status).toBe('COMPLETED');
    });
  });

  describe('2. RAK Language Selection & Validation', () => {
    it('should update default language when valid RAK language ID is provided', async () => {
      const res = await wizardService.saveStep4Language(companyId, '10000000-1000-1000-1000-100000000001');
      expect(res.success).toBe(true);
      expect(res.language.lang_code).toBe('en');
    });

    it('should reject invalid language ID with NotFoundException', async () => {
      mockMasterDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(
        wizardService.saveStep4Language(companyId, 'invalid-lang-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Base Currency Transaction Locking', () => {
    it('should allow base currency update before financial transactions exist', async () => {
      mockGeneralLedgerStore.length = 0;
      const res = await wizardService.saveStep5Currency(companyId, '20000000-2000-2000-2000-200000000001');
      expect(res.success).toBe(true);
      expect(res.currency.iso_code).toBe('INR');
    });

    it('should lock base currency change after financial transaction is posted', async () => {
      mockGeneralLedgerStore.push({ entry_id: 'gl-001', company_id: companyId, amount: 500 });

      await expect(
        wizardService.saveStep5Currency(companyId, '20000000-2000-2000-2000-200000000001')
      ).rejects.toThrow(ForbiddenException);

      // Clean up for next tests
      mockGeneralLedgerStore.length = 0;
    });
  });

  describe('4. Fiscal Period Closing & Controlled Reopening', () => {
    it('should prevent reopening an accounting period if parent fiscal year is CLOSED', async () => {
      let callCount = 0;
      const mockFiscalTx: any = {
        transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockFiscalTx)),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockImplementation(() => ({
              limit: jest.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                  return [{ period_id: 'p-01', fiscal_year_id: 'fy-01', tenant_id: tenantId, company_id: companyId, period_name: 'April 2026' }];
                }
                return [{ fiscal_year_id: 'fy-01', year_code: 'FY2026', status: 'CLOSED' }];
              }),
            })),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(true),
          }),
        }),
      };

      clsService.set('tenantDb', mockFiscalTx);

      await expect(fiscalService.reopenPeriod('p-01', tenantId, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should reopen closed fiscal year under controlled admin action', async () => {
      const mockFiscalTx: any = {
        transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockFiscalTx)),
        select: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([
                { fiscal_year_id: 'fy-01', company_id: companyId, year_code: 'FY2026', status: 'CLOSED' },
              ]),
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(true),
          }),
        }),
      };

      clsService.set('tenantDb', mockFiscalTx);

      const res = await fiscalService.reopenFiscalYear('fy-01', tenantId, 'user-1');
      expect(res.success).toBe(true);
      expect(res.message).toContain('reopened successfully');
    });
  });
});
