import { Test, TestingModule } from '@nestjs/testing';
import { CostingMethodService } from './costing-method.service';
import { ClsService } from 'nestjs-cls';
import { BadRequestException } from '@nestjs/common';

describe('CostingMethodService', () => {
  let service: CostingMethodService;

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
      providers: [CostingMethodService, { provide: ClsService, useValue: { get: jest.fn().mockReturnValue(mockDb) } }],
    }).compile();

    service = module.get<CostingMethodService>(CostingMethodService);
  });

  it('listCostingMethods() returns only active methods', async () => {
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ method_code: 'STANDARD' }]) }),
    });

    const result = await service.listCostingMethods();

    expect(result).toEqual([{ method_code: 'STANDARD' }]);
  });

  it('createCostingMethod() inserts then returns the new row', async () => {
    mockDbInsert.mockReturnValue({ values: jest.fn().mockResolvedValue({}) });
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ method_code: 'FIFO' }]) }) }),
    });

    const result = await service.createCostingMethod({ method_code: 'FIFO', method_name: 'FIFO', variance_auto: 'NO' });

    expect(mockDbInsert).toHaveBeenCalled();
    expect(result).toEqual({ method_code: 'FIFO' });
  });

  it('deleteCostingMethod() rejects a system method', async () => {
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ method_code: 'STANDARD', is_system: true }]) }) }),
    });

    await expect(service.deleteCostingMethod('STANDARD')).rejects.toThrow(BadRequestException);
    expect(mockDbDelete).not.toHaveBeenCalled();
  });

  it('deleteCostingMethod() allows deleting a non-system method', async () => {
    mockDbSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ method_code: 'CUSTOM', is_system: false }]) }) }),
    });
    mockDbDelete.mockReturnValue({ where: jest.fn().mockResolvedValue({}) });

    const result = await service.deleteCostingMethod('CUSTOM');

    expect(mockDbDelete).toHaveBeenCalled();
    expect(result).toEqual({ method_code: 'CUSTOM', is_system: false });
  });
});
