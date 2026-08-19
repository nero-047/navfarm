import { Test, TestingModule } from '@nestjs/testing';
import { TimezoneService } from './timezone.service';
import { ClsService } from 'nestjs-cls';

describe('TimezoneService', () => {
  let service: TimezoneService;

  const mockDbSelect = jest.fn();
  const mockDbInsert = jest.fn();
  const mockDbUpdate = jest.fn();
  const mockDbDelete = jest.fn();

  const mockDb = {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
  };

  beforeEach(async () => {
    mockDbSelect.mockReset();
    mockDbInsert.mockReset();
    mockDbUpdate.mockReset();
    mockDbDelete.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [TimezoneService, { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } }],
    }).compile();

    service = module.get<TimezoneService>(TimezoneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('listTimezones() returns only active timezones', async () => {
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ tz_code: 'Asia/Kolkata' }]) }),
    });

    const result = await service.listTimezones();

    expect(result).toEqual([{ tz_code: 'Asia/Kolkata' }]);
  });

  it('createTimezone() inserts then returns the new row', async () => {
    mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ tz_code: 'UTC' }]) }) }),
    });

    const result = await service.createTimezone({ tz_code: 'UTC', tz_name: 'UTC', utc_offset: '+00:00', offset_minutes: 0 });

    expect(mockDbInsert).toHaveBeenCalled();
    expect(result).toEqual({ tz_code: 'UTC' });
  });

  it('deleteTimezone() returns the deleted row and issues a delete', async () => {
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ tz_id: 'tz-1' }]) }) }),
    });
    mockDbDelete.mockReturnValue({ where: jest.fn().mockResolvedValue({}) });

    const result = await service.deleteTimezone('tz-1');

    expect(mockDbDelete).toHaveBeenCalled();
    expect(result).toEqual({ tz_id: 'tz-1' });
  });
});
