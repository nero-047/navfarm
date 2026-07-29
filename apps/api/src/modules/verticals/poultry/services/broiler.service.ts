import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, sum } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { RearingService } from './rearing.service';
import { CreateBroilerBatchDto } from '../dto/broiler.dto';

@Injectable()
export class BroilerService {
  constructor(
    private readonly cls: ClsService,
    private readonly rearingService: RearingService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createBroilerBatch(dto: CreateBroilerBatchDto, tenantId: string, userId?: string) {
    return this.rearingService.placeChickBatch(
      {
        company_id: dto.company_id,
        farm_id: dto.farm_id,
        shed_id: dto.shed_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        batch_no: dto.batch_no,
        placement_date: dto.placement_date,
        initial_bird_count: dto.initial_bird_count,
      },
      tenantId,
      userId
    );
  }

  async calculateFcr(poultryBatchId: string, tenantId: string) {
    const [pBatch] = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(
        and(
          eq(schema.poultryBatch.poultry_batch_id, poultryBatchId),
          eq(schema.poultryBatch.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!pBatch) {
      throw new NotFoundException(`Poultry batch '${poultryBatchId}' not found.`);
    }

    // Sum total feed consumed from daily entries
    const entries = await this.db
      .select()
      .from(schema.poultryDailyEntry)
      .where(eq(schema.poultryDailyEntry.poultry_batch_id, poultryBatchId));

    const totalFeedKg = entries.reduce((acc, e) => acc + parseFloat(e.feed_consumed_kg), 0);

    // Get last average body weight
    const lastEntry = entries[entries.length - 1];
    const avgWeightGrams = lastEntry ? parseFloat(lastEntry.avg_weight_grams) : 0;
    const totalWeightKg = (pBatch.current_bird_count * avgWeightGrams) / 1000;

    // FCR = Total Feed Consumed (kg) / Total Weight Gain (kg)
    const fcr = totalWeightKg > 0 ? totalFeedKg / totalWeightKg : 0;

    // Update KPI
    await this.db
      .update(schema.poultryKpi)
      .set({
        fcr: fcr.toFixed(2),
      })
      .where(eq(schema.poultryKpi.poultry_batch_id, poultryBatchId));

    return {
      poultry_batch_id: poultryBatchId,
      total_feed_consumed_kg: totalFeedKg,
      current_live_birds: pBatch.current_bird_count,
      avg_weight_grams: avgWeightGrams,
      total_weight_kg: totalWeightKg,
      fcr: parseFloat(fcr.toFixed(2)),
    };
  }
}
