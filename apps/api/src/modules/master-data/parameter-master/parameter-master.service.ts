import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateParameterDto, BatchParameterEntryDto } from './dto/parameter-master.dto';

@Injectable()
export class ParameterMasterService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createParameter(dto: CreateParameterDto, tenantId: string) {
    const parameter_id = randomUUID();
    const record = {
      parameter_id, tenant_id: tenantId,
      nob_id: dto.nob_id || null, lob_id: dto.lob_id || null,
      parameter_code: dto.parameter_code, parameter_name: dto.parameter_name,
      parameter_type: dto.parameter_type, entry_type_code: dto.entry_type_code || null,
      item_id: dto.item_id || null, default_uom: dto.default_uom || null,
      qty_method: dto.qty_method,
      default_qty_per_unit: dto.default_qty_per_unit ? String(dto.default_qty_per_unit) : null,
      default_qty_per_batch: dto.default_qty_per_batch ? String(dto.default_qty_per_batch) : null,
      qty_formula: dto.qty_formula || null, description: dto.description || null,
      is_mandatory: dto.is_mandatory ?? false, is_active: true,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.parameterMaster).values(record);
    return record;
  }

  async listParameters(tenantId: string) {
    return this.db.select().from(schema.parameterMaster)
      .where(and(eq(schema.parameterMaster.is_active, true)));
  }

  async submitBatchEntry(batchId: string, dto: BatchParameterEntryDto, userId: string) {
    const log_id = randomUUID();
    const amount = (dto.actual_qty || 0) * (dto.unit_rate || 0);
    const record = {
      log_id, batch_id: batchId, parameter_id: dto.parameter_id,
      entry_date: dto.entry_date,
      actual_qty: dto.actual_qty ? String(dto.actual_qty) : null,
      actual_value: dto.actual_value || null,
      unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      amount: String(amount), notes: dto.notes || null,
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.batchParameterLog).values(record);
    return record;
  }

  async getBatchEntries(batchId: string) {
    return this.db.select().from(schema.batchParameterLog)
      .where(eq(schema.batchParameterLog.batch_id, batchId));
  }
}
