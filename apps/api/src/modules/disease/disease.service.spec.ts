import { Test, TestingModule } from '@nestjs/testing';
import { DiseaseService } from './disease.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('DiseaseService', () => {
  let service: DiseaseService;
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
        DiseaseService,
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

    service = module.get<DiseaseService>(DiseaseService);
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
            disease_code: 'DIS01',
            disease_name: 'Newcastle Disease',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if disease code already exists in this company', async () => {
      // First select: finds company
      // Second select: finds duplicate disease code
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
              limit: jest.fn().mockResolvedValue([{ disease_code: 'DIS01' }]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            disease_code: 'DIS01',
            disease_name: 'Newcastle Disease',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create disease definition', async () => {
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
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ disease_code: 'DIS01', disease_name: 'Newcastle Disease' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(
        {
          company_id: 'comp-1',
          disease_code: 'DIS01',
          disease_name: 'Newcastle Disease',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.disease_code).toBe('DIS01');
    });
  });
});
