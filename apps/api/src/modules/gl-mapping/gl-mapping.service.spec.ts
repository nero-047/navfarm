import { Test, TestingModule } from '@nestjs/testing';
import { GlMappingService } from './gl-mapping.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('GlMappingService', () => {
  let service: GlMappingService;
  let clsService: ClsService;
  let auditLogService: AuditLogService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlMappingService,
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue(mockDb),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<GlMappingService>(GlMappingService);
    clsService = module.get<ClsService>(ClsService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if company does not exist', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // company not found
          }),
        }),
      });

      await expect(
        service.create(
          {
            company_id: 'non-existent-comp',
            transaction_type: 'PURCHASE',
            debit_gl_account_id: 'gl-1',
            credit_gl_account_id: 'gl-2',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if debit G/L Account does not exist', async () => {
      // First select: finds company
      // Second select: does not find debit G/L Account
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // debit gl not found
            }),
          }),
        });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            transaction_type: 'PURCHASE',
            debit_gl_account_id: 'non-existent-debit-gl',
            credit_gl_account_id: 'gl-2',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should successfully create mapping rule', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ company_id: 'comp-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ gl_account_id: 'gl-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ gl_account_id: 'gl-2' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]), // no duplicates
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ mapping_id: 'map-1', transaction_type: 'PURCHASE' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(
        {
          company_id: 'comp-1',
          transaction_type: 'PURCHASE',
          debit_gl_account_id: 'gl-1',
          credit_gl_account_id: 'gl-2',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.transaction_type).toBe('PURCHASE');
    });
  });
});
