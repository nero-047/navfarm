import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('LocationService', () => {
  let service: LocationService;
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
        LocationService,
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

    service = module.get<LocationService>(LocationService);
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
            location_code: 'LOC01',
            location_name: 'Location 1',
            location_level: 1,
            location_type: 'ROOM',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if location code already exists in this company scope', async () => {
      // First select: finds company
      // Second select: finds duplicate location code
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
              limit: jest.fn().mockResolvedValue([{ location_code: 'LOC01' }]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            company_id: 'comp-1',
            location_code: 'LOC01',
            location_name: 'Location 1',
            location_level: 1,
            location_type: 'ROOM',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create location', async () => {
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
              limit: jest.fn().mockResolvedValue([{ location_code: 'LOC01', location_name: 'Location 1' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(
        {
          company_id: 'comp-1',
          location_code: 'LOC01',
          location_name: 'Location 1',
          location_level: 1,
          location_type: 'ROOM',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.location_code).toBe('LOC01');
    });
  });
});
