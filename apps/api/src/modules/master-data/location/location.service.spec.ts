import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClsService } from 'nestjs-cls';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { LocationService } from './location.service';

describe('LocationService canonical hierarchy', () => {
  let service: LocationService;
  const selectResults: any[][] = [];
  const txInsert = jest.fn();
  const txUpdate = jest.fn();
  const audit = { log: jest.fn() };
  const numberSeries = { generateNext: jest.fn() };

  const makeSelectBuilder = (rows: any[]) => {
    const builder: any = {};
    builder.from = jest.fn(() => builder);
    builder.where = jest.fn(() => builder);
    builder.orderBy = jest.fn(() => builder);
    builder.offset = jest.fn(() => builder);
    builder.leftJoin = jest.fn(() => builder);
    builder.limit = jest.fn(async () => rows);
    builder.then = (resolve: (value: any[]) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(rows).then(resolve, reject);
    return builder;
  };

  const tx = { insert: txInsert, update: txUpdate };
  const db = {
    select: jest.fn(() => makeSelectBuilder(selectResults.shift() || [])),
    insert: jest.fn(),
    update: jest.fn(),
    transaction: jest.fn(async (callback: (executor: typeof tx) => unknown) => callback(tx)),
  };

  const company = { company_id: 'comp-1', tenant_id: 'tenant-1' };
  const farmType = {
    type_code: 'FARM', type_name: 'Farm', code_prefix: 'FARM',
    allowed_parent_types: [], company_id: null,
  };
  const shedType = {
    type_code: 'SHED', type_name: 'Shed / House', code_prefix: 'SHED',
    allowed_parent_types: ['FARM'], company_id: null,
  };
  const siloType = {
    type_code: 'SILO', type_name: 'Silo', code_prefix: 'SILO',
    allowed_parent_types: ['FARM'], company_id: null,
  };
  const uom = { uom_code: 'HEAD' };
  const series = { series_code: 'LOCATION_FARM' };

  beforeEach(async () => {
    selectResults.length = 0;
    jest.clearAllMocks();
    txInsert.mockImplementation(() => ({ values: jest.fn().mockResolvedValue({}) }));
    txUpdate.mockImplementation(() => ({ set: jest.fn(() => ({ where: jest.fn().mockResolvedValue({}) })) }));
    audit.log.mockResolvedValue({});
    numberSeries.generateNext.mockResolvedValue('FARM-001');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: ClsService, useValue: { get: jest.fn(() => db) } },
        { provide: AuditLogService, useValue: audit },
        { provide: NumberSeriesService, useValue: numberSeries },
      ],
    }).compile();
    service = module.get(LocationService);
  });

  it('requires company scope because numbering is per company', async () => {
    await expect(service.create({
      location_name: 'Main Farm', location_address: 'Farm Road', location_type: 'FARM',
      max_capacity: 100, capacity_uom: 'HEAD',
    }, 'tenant-1')).rejects.toThrow(ConflictException);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('generates FARM-001 and mirrors a root farm for legacy operational APIs', async () => {
    selectResults.push(
      [company], [farmType], [uom], [series],
      [{ location_id: 'loc-1', location_code: 'FARM-001', location_type: 'FARM', location_level: 1 }],
    );

    const result = await service.create({
      company_id: 'comp-1',
      location_code: 'USER-CANNOT-OVERRIDE',
      location_name: 'Main Farm', location_address: 'Farm Road', location_type: 'FARM',
      max_capacity: 100, capacity_uom: 'HEAD',
    }, 'tenant-1', { userId: 'user-1' });

    expect(numberSeries.generateNext).toHaveBeenCalledWith('LOCATION_FARM', 'tenant-1', 'comp-1');
    expect(txInsert).toHaveBeenCalledTimes(2);
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(result.location_code).toBe('FARM-001');
  });

  it('derives a shed level and legacy farm ancestry from its canonical parent', async () => {
    const parent = {
      location_id: 'farm-1', company_id: 'comp-1', location_type: 'FARM',
      location_level: 1, farm_id: 'farm-1', shed_id: null, warehouse_id: null,
    };
    selectResults.push(
      [company], [shedType], [parent], [uom], [{ series_code: 'LOCATION_SHED' }],
      [{ location_id: 'shed-1', location_code: 'SHED-001', location_type: 'SHED', location_level: 2 }],
    );
    numberSeries.generateNext.mockResolvedValue('SHED-001');

    const result = await service.create({
      company_id: 'comp-1', parent_location_id: 'farm-1',
      location_name: 'House A', location_address: 'Farm Road', location_type: 'SHED',
      max_capacity: 60, capacity_uom: 'HEAD',
    }, 'tenant-1');

    expect(result.location_level).toBe(2);
    expect(txInsert).toHaveBeenCalledTimes(2);
  });

  it('rejects a non-root type without a parent', async () => {
    selectResults.push([company], [shedType]);
    await expect(service.create({
      company_id: 'comp-1', location_name: 'House A', location_address: 'Farm Road',
      location_type: 'SHED', max_capacity: 60, capacity_uom: 'HEAD',
    }, 'tenant-1')).rejects.toThrow('requires a parent location');
  });

  it('rejects a parent outside the allowed type hierarchy', async () => {
    selectResults.push(
      [company], [shedType],
      [{ location_id: 'pen-1', company_id: 'comp-1', location_type: 'PEN', location_level: 2 }],
    );
    await expect(service.create({
      company_id: 'comp-1', parent_location_id: 'pen-1', location_name: 'House A',
      location_address: 'Farm Road', location_type: 'SHED', max_capacity: 60, capacity_uom: 'HEAD',
    }, 'tenant-1')).rejects.toThrow('must be created under FARM');
  });

  it('rejects a SILO until both template tracking fields are supplied', async () => {
    selectResults.push(
      [company], [siloType],
      [{ location_id: 'farm-1', company_id: 'comp-1', location_type: 'FARM', location_level: 1 }],
    );
    await expect(service.create({
      company_id: 'comp-1', parent_location_id: 'farm-1', location_name: 'Feed Silo',
      location_address: 'Farm Road', location_type: 'SILO', max_capacity: 2000, capacity_uom: 'KG',
    }, 'tenant-1')).rejects.toThrow(ConflictException);
  });

  it('keeps location type and generated identity immutable', async () => {
    selectResults.push([{
      location_id: 'loc-1', company_id: 'comp-1', location_code: 'FARM-001',
      location_type: 'FARM', location_level: 1, parent_location_id: null,
    }]);
    await expect(service.update('loc-1', { location_type: 'SHED' }, 'tenant-1'))
      .rejects.toThrow('Location Type cannot be changed');
  });

  it('does not deactivate a location that still has active children', async () => {
    selectResults.push(
      [{ location_id: 'farm-1', company_id: 'comp-1', location_name: 'Main Farm', location_type: 'FARM' }],
      [{ location_id: 'shed-1' }],
    );
    await expect(service.remove('farm-1', 'tenant-1')).rejects.toThrow(ConflictException);
  });

  it('reports an unknown company before any hierarchy work', async () => {
    selectResults.push([]);
    await expect(service.create({
      company_id: 'missing-company', location_name: 'Main Farm', location_address: 'Farm Road',
      location_type: 'FARM', max_capacity: 100, capacity_uom: 'HEAD',
    }, 'tenant-1')).rejects.toThrow(NotFoundException);
  });

  it('rejects switching an existing location to SILO', async () => {
    selectResults.push([{
      location_id: 'loc-1', company_id: 'comp-1', location_type: 'STORE',
      location_level: 1, parent_location_id: null,
    }]);
    await expect(service.update('loc-1', { location_type: 'SILO' }, 'tenant-1'))
      .rejects.toThrow('Location Type cannot be changed');
  });

  it('rejects an area_unit that does not resolve in uom_master', async () => {
    selectResults.push(
      [{ location_id: 'loc-1', tenant_id: 'tenant-1', company_id: 'comp-1', location_type: 'FARM', parent_location_id: null, location_level: 1 }],
      [farmType],
      [], // area_unit UOM lookup finds nothing
    );
    await expect(service.update('loc-1', { area_unit: 'BOGUS' }, 'tenant-1'))
      .rejects.toThrow(NotFoundException);
  });

  it('soft-deletes a location and writes an audit log entry', async () => {
    selectResults.push(
      [{ location_id: 'loc-1', tenant_id: 'tenant-1', company_id: 'comp-1', location_name: 'Pen 1', location_type: 'PEN' }],
      [], // no active children blocking the delete
    );

    const result = await service.remove('loc-1', 'tenant-1', { userId: 'user-1' });

    expect(txUpdate).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'DELETE', entityName: 'location_master', entityId: 'loc-1',
    }));
    expect(result.success).toBe(true);
  });

  it('restores a soft-deleted location and clears deleted_at', async () => {
    selectResults.push(
      [{ location_id: 'loc-1', company_id: 'comp-1', location_type: 'PEN', deleted_at: '2026-01-01 00:00:00' }],
      [{ location_id: 'loc-1', company_id: 'comp-1', location_type: 'PEN', deleted_at: null }],
    );

    const result = await service.restore('loc-1', 'tenant-1', { userId: 'user-1' });

    expect(txUpdate).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({
      action: 'RESTORE', entityName: 'location_master', entityId: 'loc-1',
    }));
    expect(result.deleted_at).toBeNull();
  });

  it('getLocationOccupancy aggregates headcounts, capacity utilization, and biosecurity status', async () => {
    selectResults.push(
      [{
        location: {
          location_id: 'loc-pen-1', location_code: 'PEN-01A', location_name: 'Pen 1A',
          location_type: 'PEN', max_capacity: '20.0000', capacity_uom: 'HEAD', shed_id: null,
          last_cleaned_date: null, last_disinfected_date: null,
        },
        farm: { farm_name: 'Main Farm' },
        shed: { shed_name: 'Grower Shed 1' },
      }],
      [
        { animal_id: 'a-1', current_location_id: 'loc-pen-1', status: 'ACTIVE' },
        { animal_id: 'a-2', current_location_id: 'loc-pen-1', status: 'QUARANTINE' },
      ],
      [], // no active batches
    );

    const res = await service.getLocationOccupancy('tenant-1', 'comp-1');

    expect(res).toHaveLength(1);
    expect(res[0].location_code).toBe('PEN-01A');
    expect(res[0].current_occupancy).toBe(2);
    expect(res[0].max_capacity).toBe(20);
    expect(res[0].utilization_pct).toBe(10); // 2 / 20 = 10%
    expect(res[0].biosecurity_status).toBe('QUARANTINE_ACTIVE');
    expect(res[0].sick_animal_count).toBe(1);
  });
});
