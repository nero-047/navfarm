import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { MASTER_CONNECTION } from '../../../core/database/database.module';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CompanyService', () => {
  let service: CompanyService;
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
        CompanyService,
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue(mockDb),
          },
        },
        {
          provide: MASTER_CONNECTION,
          useValue: mockDb,
        },
        {
          provide: AuditLogService,
          useValue: {
            log: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    clsService = module.get<ClsService>(ClsService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if company code or name already exists', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ company_code: 'GREENVALLEY' }]),
          }),
        }),
      });

      await expect(
        service.create(
          {
            company_code: 'GREENVALLEY',
            company_name: 'Green Valley Farms',
            company_type: 'PROPRIETORSHIP',
            industry_type: 'POULTRY',
            base_currency_id: 'curr-1',
            default_language_id: 'lang-1',
            default_timezone_id: 'UTC',
            country_id: 'IND',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if company not found or soft deleted', async () => {
      mockDbSelect.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await expect(service.findOne('company-123')).rejects.toThrow(NotFoundException);
    });
  });
});
