import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { RecordWeightDto, RecordMortalityDto } from '../dto/growth-tracking.dto';

@Injectable()
export class GrowthTrackingService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async recordWeight(dto: RecordWeightDto, tenantId: string) {
    const weightId = randomUUID();
    const newRecord = {
      weight_id: weightId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      sample_count: dto.sample_count,
      average_weight_grams: dto.average_weight_grams.toFixed(4),
      target_weight_grams: dto.target_weight_grams ? dto.target_weight_grams.toFixed(4) : null,
      daily_gain_grams: dto.daily_gain_grams ? dto.daily_gain_grams.toFixed(4) : null,
    };

    await this.db.insert(schema.weightRecord).values(newRecord);
    return newRecord;
  }

  async getWeightHistory(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.weightRecord)
      .where(
        and(
          eq(schema.weightRecord.tenant_id, tenantId),
          eq(schema.weightRecord.batch_id, batchId)
        )
      );
  }

  async recordMortality(dto: RecordMortalityDto, tenantId: string) {
    const mortalityId = randomUUID();
    const newRecord = {
      mortality_id: mortalityId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      mortality_count: dto.mortality_count,
      cull_count: dto.cull_count || 0,
      disease_id: dto.disease_id || null,
      reason: dto.reason || null,
      cost_impact: '0.0000',
    };

    await this.db.insert(schema.mortalityRecord).values(newRecord);
    return newRecord;
  }

  async getMortalityHistory(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.mortalityRecord)
      .where(
        and(
          eq(schema.mortalityRecord.tenant_id, tenantId),
          eq(schema.mortalityRecord.batch_id, batchId)
        )
      );
  }
}
