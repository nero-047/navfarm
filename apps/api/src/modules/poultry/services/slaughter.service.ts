import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { ProductionBatchService } from '../../production/services/production-batch.service';
import { BatchMaterialService } from '../../production/services/batch-material.service';
import { RecordSlaughterYieldDto } from '../dto/slaughter.dto';

@Injectable()
export class SlaughterService {
  constructor(
    private readonly cls: ClsService,
    private readonly productionBatchService: ProductionBatchService,
    private readonly batchMaterialService: BatchMaterialService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async recordSlaughterYield(dto: RecordSlaughterYieldDto, tenantId: string, userId?: string) {
    const [pBatch] = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(
        and(
          eq(schema.poultryBatch.poultry_batch_id, dto.poultry_batch_id),
          eq(schema.poultryBatch.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!pBatch) {
      throw new NotFoundException(`Poultry Batch '${dto.poultry_batch_id}' not found.`);
    }

    // Calculate Dressing Yield % = (Dressed Weight / Live Weight) * 100
    const yieldPct = dto.total_live_weight_kg > 0 ? (dto.dressed_weight_kg / dto.total_live_weight_kg) * 100 : 0;

    // 1. Post Finished Meat Receipt into inventory via Phase 3 Inventory Engine
    const outputRes = await this.batchMaterialService.receiveBatchOutput(
      {
        company_id: dto.company_id,
        batch_id: pBatch.production_batch_id,
        item_id: dto.meat_item_id,
        uom_id: dto.uom_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        output_type: 'FINISHED_GOOD' as any,
        qty: dto.dressed_weight_kg,
        cost_split_pct: 100,
      },
      tenantId,
      userId
    );

    // 2. Record Slaughter yield entry
    const slaughterId = randomUUID();
    const newSlaughter = {
      slaughter_id: slaughterId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      poultry_batch_id: dto.poultry_batch_id,
      slaughter_date: dto.slaughter_date,
      live_birds_received: dto.live_birds_received,
      total_live_weight_kg: dto.total_live_weight_kg.toFixed(4),
      dressed_weight_kg: dto.dressed_weight_kg.toFixed(4),
      yield_pct: yieldPct.toFixed(2),
      goods_receipt_id: outputRes.output.goods_receipt_id,
    };

    await this.db.insert(schema.poultrySlaughter).values(newSlaughter);

    // 3. Mark poultry_batch status as COMPLETED
    await this.db
      .update(schema.poultryBatch)
      .set({
        status: 'COMPLETED',
      })
      .where(eq(schema.poultryBatch.poultry_batch_id, dto.poultry_batch_id));

    return newSlaughter;
  }
}
