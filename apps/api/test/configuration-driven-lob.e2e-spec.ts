import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, BadRequestException, NotFoundException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { NobLobConfigService } from '../src/modules/master-data/nob-lob-config/nob-lob-config.service';

describe('Phase 4: Configuration-Driven RAK Master Data & NOB/LOB Suite', () => {
  let app: INestApplication;
  let service: NobLobConfigService;
  let clsService: ClsService;

  const mockLobMaster: Record<string, any> = {
    'lob-plt-01': {
      lob_id: 'lob-plt-01',
      nob_id: 'nob-poultry',
      lob_code: 'PLT_LAYING',
      lob_name: 'Poultry Laying',
      costing_method_allowed: 'STANDARD',
      qc_required: 'YES',
      qr_required: 'YES',
      traceability_required: 'YES',
      scheduler_copy_allowed: 'YES',
      extension_config: {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true,
        qc_required: true,
        qr_required: true,
        traceability_level: 'BATCH',
        scheduler_required: true,
        resource_required: true,
        stages: ['BROODING', 'GROWING', 'LAYING'],
        enabled_modules: ['POULTRY', 'INVENTORY', 'COSTING', 'QUALITY'],
      },
    },
    'lob-lvs-01': {
      lob_id: 'lob-lvs-01',
      nob_id: 'nob-livestock',
      lob_code: 'LVS_MILKING',
      lob_name: 'Dairy / Milking',
      costing_method_allowed: 'BIO_ASSET',
      qc_required: 'YES',
      qr_required: 'NO',
      traceability_required: 'YES',
      scheduler_copy_allowed: 'YES',
      extension_config: {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true,
        qc_required: true,
        qr_required: false,
        traceability_level: 'SERIAL',
        scheduler_required: true,
        resource_required: true,
        stages: ['CALF', 'HEIFER', 'LACTATING', 'DRY'],
        enabled_modules: ['LIVESTOCK', 'INVENTORY', 'COSTING', 'QUALITY'],
      },
    },
  };

  const mockNobMaster: Record<string, any> = {
    'nob-poultry': { nob_id: 'nob-poultry', nob_code: 'POULTRY', nob_name: 'Poultry' },
    'nob-livestock': { nob_id: 'nob-livestock', nob_code: 'LIVESTOCK', nob_name: 'Livestock' },
  };

  const mockOverrides: Array<{ config_id: string; nob_id: string | null; lob_id: string | null; config_key: string; config_value: string }> = [];

  const mockTenantDb: any = {
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockImplementation((table: any) => {
        const tableName = typeof table === 'string' ? table : (table?._?.name || table?.[Symbol.for('drizzle:Name')] || '');
        return {
          where: jest.fn().mockImplementation((cond: any) => ({
            limit: jest.fn().mockImplementation(() => {
              if (tableName.includes('lob') || tableName.includes('lobMaster')) {
                // Return matched lob from mockLobMaster if possible
                return Object.values(mockLobMaster).slice(0, 1);
              }
              if (tableName.includes('nob') || tableName.includes('nobMaster')) {
                return Object.values(mockNobMaster).slice(0, 1);
              }
              return [];
            }),
          })),
        };
      }),
    }),
  };

  beforeEach(async () => {
    const clsStore = new Map<string, any>();
    clsStore.set('tenantDb', mockTenantDb);

    clsService = {
      set: jest.fn((k, v) => clsStore.set(k, v)),
      get: jest.fn((k) => clsStore.get(k)),
    } as any;

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NobLobConfigService,
        { provide: ClsService, useValue: clsService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    service = moduleRef.get<NobLobConfigService>(NobLobConfigService);
  });

  describe('1. Effective LOB Config Resolution', () => {
    it('should resolve effective LOB configuration with costing methods, stages, and traceability rules', async () => {
      // Mock lob lookup for lob-plt-01
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockLobMaster['lob-plt-01']]),
          }),
        }),
      });

      // Mock nob lookup
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNobMaster['nob-poultry']]),
          }),
        }),
      });

      // Mock overrides query
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await service.getEffectiveLobConfig('lob-plt-01');
      expect(result.lob_code).toBe('PLT_LAYING');
      expect(result.nob_code).toBe('POULTRY');
      expect(result.effective_config.costing_methods).toContain('STANDARD');
      expect(result.effective_config.qc_required).toBe(true);
      expect(result.effective_config.stages).toEqual(['BROODING', 'GROWING', 'LAYING']);
    });
  });

  describe('2. Costing Method Rule Enforcement', () => {
    it('should validate and allow allowed costing method for LOB', async () => {
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockLobMaster['lob-lvs-01']]),
          }),
        }),
      });
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNobMaster['nob-livestock']]),
          }),
        }),
      });
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const isValid = await service.validateCostingMethod('lob-lvs-01', 'BIO_ASSET');
      expect(isValid).toBe(true);
    });

    it('should reject unpermitted costing method with BadRequestException', async () => {
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockLobMaster['lob-plt-01']]),
          }),
        }),
      });
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockNobMaster['nob-poultry']]),
          }),
        }),
      });
      mockTenantDb.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.validateCostingMethod('lob-plt-01', 'UNSUPPORTED_METHOD')).rejects.toThrow(BadRequestException);
    });
  });
});
