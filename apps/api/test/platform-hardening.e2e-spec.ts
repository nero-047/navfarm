import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClsService } from 'nestjs-cls';
import { TenantMiddleware } from '../src/common/middlewares/tenant.middleware';
import { OnboardingAccessGuard } from '../src/common/guards/onboarding-access.guard';
import { QrPublicController } from '../src/modules/quality-traceability/controllers/qr-public.controller';
import { QrBarcodeEngineService } from '../src/modules/quality-traceability/services/qr-barcode-engine.service';
import { PostingEngineService } from '../src/modules/finance-accounting/finance/services/posting-engine.service';
import { LedgerService } from '../src/modules/finance-accounting/finance/services/ledger.service';

describe('Platform Hardening & Consistency Integration Suite', () => {
  let app: INestApplication;
  let clsService: ClsService;
  let postingEngineService: PostingEngineService;
  let onboardingGuard: OnboardingAccessGuard;

  const mockMasterDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockImplementation(() => [
      {
        tenant_id: 'tenant-1111-1111',
        tenant_code: 'tenant1',
        is_active: true,
        db_host: 'localhost',
        db_port: 3306,
        db_name: 'tenant_db_1',
        db_user: 'root',
      },
    ]),
  };

  const mockConnectionManager = {
    getTenantConnection: jest.fn().mockResolvedValue({
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
    }),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockLedgerService = {
    postEntry: jest.fn().mockResolvedValue({ entry_id: 'entry-123' }),
  };

  beforeEach(async () => {
    const clsStore = new Map<string, any>();
    clsService = {
      set: jest.fn((key: string, val: any) => clsStore.set(key, val)),
      get: jest.fn((key: string) => clsStore.get(key)),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [QrPublicController],
      providers: [
        PostingEngineService,
        OnboardingAccessGuard,
        { provide: ClsService, useValue: clsService },
        { provide: LedgerService, useValue: mockLedgerService },
        { provide: QrBarcodeEngineService, useValue: { getPublicTraceability: jest.fn().mockResolvedValue({
          qr_code: 'NAV-QR-123',
          product_name: 'Navfarm Dressed Poultry',
          batch_number: 'BATCH-001',
          production_stage: 'PACKAGED',
          quality_verification: 'PASSED_AND_VERIFIED',
        })} },
        { provide: 'MASTER_CONNECTION', useValue: mockMasterDb },
        { provide: 'ConnectionManagerService', useValue: mockConnectionManager },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    postingEngineService = moduleRef.get<PostingEngineService>(PostingEngineService);
    onboardingGuard = moduleRef.get<OnboardingAccessGuard>(OnboardingAccessGuard);
  });

  describe('1. Tenant Isolation & Middleware Hardening', () => {
    it('should throw ForbiddenException if x-tenant-id header does not match JWT token tenant claim', async () => {
      const middleware = new TenantMiddleware(clsService, mockMasterDb as any, mockConnectionManager as any);
      const req: any = {
        headers: {
          'x-tenant-id': 'tenant-aaaa-aaaa',
          authorization: 'Bearer header.eyJ0ZW5hbnRJZCI6InRlbmFudC1iYmJiLWJiYmIifQ.signature',
        },
        originalUrl: '/api/v1/farm',
      };
      const res: any = {};
      const next = jest.fn();

      await expect(middleware.use(req, res, next)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for protected endpoints missing x-tenant-id', async () => {
      const middleware = new TenantMiddleware(clsService, mockMasterDb as any, mockConnectionManager as any);
      const req: any = {
        headers: {},
        originalUrl: '/api/v1/farm',
      };
      const res: any = {};
      const next = jest.fn();

      await expect(middleware.use(req, res, next)).rejects.toThrow(BadRequestException);
    });

    it('should allow public QR endpoint without x-tenant-id or Authorization header', async () => {
      const middleware = new TenantMiddleware(clsService, mockMasterDb as any, mockConnectionManager as any);
      const req: any = {
        headers: {},
        originalUrl: '/api/v1/quality/qr/public/NAV-QR-12345',
      };
      const res: any = {};
      const next = jest.fn();

      await middleware.use(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('2. Onboarding Token Alignment', () => {
    it('should authorize request using x-onboarding-token header', async () => {
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        purpose: 'ONBOARDING_SETUP',
        tenantId: 'tenant-1111-1111',
        companyId: 'company-2222',
      });
      clsService.set('tenantId', 'tenant-1111-1111');

      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { 'x-onboarding-token': 'valid-onboarding-token' },
            body: { company_id: 'company-2222' },
          }),
        }),
      };

      const result = await onboardingGuard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should reject invalid or missing onboarding tokens with UnauthorizedException', async () => {
      const mockExecutionContext: any = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      };

      await expect(onboardingGuard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('3. GL Mapping Specificity & Double-Entry Atomicity', () => {
    it('should reject specific GL rule when required context is absent', async () => {
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            mapping_id: 'rule-specific',
            tenant_id: 't-1',
            company_id: 'c-1',
            transaction_type: 'PURCHASE',
            nob_id: 'nob-poultry',
            lob_id: 'lob-slaughter',
            debit_gl_account_id: '1100',
            credit_gl_account_id: '2100',
            is_active: true,
          },
        ]),
      };

      // Call postAutomaticEntry WITHOUT nob_id or lob_id context (context is absent)
      await expect(
        postingEngineService.postAutomaticEntry(
          {
            company_id: 'c-1',
            transaction_type: 'PURCHASE',
            amount: 500,
            posting_date: '2026-07-30',
            ref_doc_type: 'GRN',
            ref_doc_id: 'grn-001',
          },
          't-1',
          'user-1',
          mockTx
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should post debit and credit inside a single database transaction', async () => {
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([
          {
            mapping_id: 'rule-global',
            tenant_id: 't-1',
            company_id: 'c-1',
            transaction_type: 'PURCHASE',
            nob_id: null,
            lob_id: null,
            debit_gl_account_id: '1100-INV',
            credit_gl_account_id: '2100-AP',
            is_active: true,
          },
        ]),
      };

      const result = await postingEngineService.postAutomaticEntry(
        {
          company_id: 'c-1',
          transaction_type: 'PURCHASE',
          amount: 1000,
          posting_date: '2026-07-30',
          ref_doc_type: 'GRN',
          ref_doc_id: 'grn-002',
        },
        't-1',
        'user-1',
        mockTx
      );

      expect(result.success).toBe(true);
      expect(mockLedgerService.postEntry).toHaveBeenCalledTimes(2);
      // Debit entry check
      expect(mockLedgerService.postEntry).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ gl_account_id: '1100-INV', debit: 1000, credit: 0 }),
        't-1',
        'user-1',
        mockTx
      );
      // Credit entry check
      expect(mockLedgerService.postEntry).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ gl_account_id: '2100-AP', debit: 0, credit: 1000 }),
        't-1',
        'user-1',
        mockTx
      );
    });
  });
});
