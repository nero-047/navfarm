import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
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
      // Selects in order: company found, farm found, duplicate location code found
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
              limit: jest.fn().mockResolvedValue([{ farm_id: 'farm-1' }]),
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
            farm_id: 'farm-1',
            location_code: 'LOC01',
            location_name: 'Location 1',
            location_address: '123 Farm Road',
            location_level: 1,
            location_type: 'ROOM',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully create location', async () => {
      // Selects in order: company found, farm found, no duplicate code, findOne() after insert
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
              limit: jest.fn().mockResolvedValue([{ farm_id: 'farm-1' }]),
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
          farm_id: 'farm-1',
          location_code: 'LOC01',
          location_name: 'Location 1',
          location_address: '123 Farm Road',
          location_level: 1,
          location_type: 'ROOM',
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.location_code).toBe('LOC01');
    });

    it('should reject a SILO location missing silo_capacity_kg / silo_reorder_days', async () => {
      // Selects in order: farm found (the SILO check throws before the duplicate-code check runs)
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ farm_id: 'farm-1' }]),
          }),
        }),
      });

      await expect(
        service.create(
          {
            farm_id: 'farm-1',
            location_code: 'SLO01',
            location_name: 'Silo 1',
            location_address: '123 Farm Road',
            location_level: 3,
            location_type: 'SILO',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should accept a valid SILO location with silo fields set', async () => {
      // Selects in order: farm found, no duplicate code, findOne() after insert
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ farm_id: 'farm-1' }]),
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
              limit: jest.fn().mockResolvedValue([{ location_code: 'SLO01', location_name: 'Silo 1' }]),
            }),
          }),
        });

      mockDbInsert.mockReturnValue({
        values: jest.fn().mockResolvedValue({}),
      });

      const result = await service.create(
        {
          farm_id: 'farm-1',
          location_code: 'SLO01',
          location_name: 'Silo 1',
          location_address: '123 Farm Road',
          location_level: 3,
          location_type: 'SILO',
          silo_capacity_kg: 2000,
          silo_reorder_days: 3,
        },
        'tenant-123',
        { userId: 'user-1' },
      );

      expect(mockDbInsert).toHaveBeenCalled();
      expect(result.location_code).toBe('SLO01');
    });

    it('should reject an area_unit that does not resolve in uom_master', async () => {
      // Selects in order: farm found, UOM not found
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ farm_id: 'farm-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      await expect(
        service.create(
          {
            farm_id: 'farm-1',
            location_code: 'LOC02',
            location_name: 'Location 2',
            location_address: '123 Farm Road',
            location_level: 1,
            location_type: 'ROOM',
            area_unit: 'BOGUS',
          },
          'tenant-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should reject switching an existing location to SILO without silo fields', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([
              { location_id: 'loc-1', farm_id: 'farm-1', location_type: 'ROOM', silo_capacity_kg: null, silo_reorder_days: null },
            ]),
          }),
        }),
      });

      await expect(
        service.update('loc-1', { location_type: 'SILO' }, 'tenant-123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a location and write an audit log entry', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ location_id: 'loc-1', location_name: 'Location 1', company_id: 'comp-1' }]),
          }),
        }),
      });
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await service.remove('loc-1', 'tenant-123', { userId: 'user-1' });

      expect(mockDbUpdate).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('restore', () => {
    it('should clear deleted_at on a soft-deleted location', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ location_id: 'loc-1', deleted_at: '2026-01-01 00:00:00', company_id: 'comp-1' }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue([{ location_id: 'loc-1', deleted_at: null }]),
            }),
          }),
        });
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue({}),
        }),
      });

      const result = await service.restore('loc-1', 'tenant-123', { userId: 'user-1' });

      expect(mockDbUpdate).toHaveBeenCalled();
      expect(auditLogService.log).toHaveBeenCalled();
      expect(result.deleted_at).toBeNull();
    });
  });

  describe('getLocationOccupancy', () => {
    it('aggregates live animal and batch headcounts with capacity and biosecurity checks', async () => {
      // 1. Locations
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([
                {
                  location: {
                    location_id: 'loc-pen-1',
                    location_code: 'PEN-01A',
                    location_name: 'Pen 1A',
                    location_type: 'PEN',
                    max_capacity: '20.0000',
                    capacity_uom: 'HEAD',
                  },
                  farm: { farm_name: 'Main Farm' },
                  shed: { shed_name: 'Grower Shed 1' },
                },
              ]),
            }),
          }),
        }),
      });

      // 2. Animals
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            { animal_id: 'a-1', current_location_id: 'loc-pen-1', status: 'ACTIVE' },
            { animal_id: 'a-2', current_location_id: 'loc-pen-1', status: 'QUARANTINE' },
          ]),
        }),
      });

      // 3. Batches
      mockDbSelect.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const res = await service.getLocationOccupancy('tenant-123', 'comp-1');

      expect(res).toHaveLength(1);
      expect(res[0].location_code).toBe('PEN-01A');
      expect(res[0].current_occupancy).toBe(2);
      expect(res[0].max_capacity).toBe(20);
      expect(res[0].utilization_pct).toBe(10); // 2 / 20 = 10%
      expect(res[0].biosecurity_status).toBe('QUARANTINE_ACTIVE');
      expect(res[0].sick_animal_count).toBe(1);
    });
  });
});

