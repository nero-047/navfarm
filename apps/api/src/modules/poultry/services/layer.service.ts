import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { ProductionBatchService } from '../../production/services/production-batch.service';
import { BatchMaterialService } from '../../production/services/batch-material.service';
import { RecordEggProductionDto } from '../dto/layer.dto';

@Injectable()
export class LayerService {
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

  async recordEggProduction(dto: RecordEggProductionDto, tenantId: string, userId?: string) {
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

    const totalEggs = dto.good_eggs + (dto.cracked_eggs || 0) + (dto.dirty_eggs || 0) + (dto.double_yolk || 0);

    // Calculate Hen Day Production % (HDP %)
    const liveHens = pBatch.current_bird_count;
    const hdpPct = liveHens > 0 ? (totalEggs / liveHens) * 100 : 0;

    // 1. Automatically receive good commercial eggs into inventory via Phase 3 Inventory Engine
    let goodsReceiptId: string | null = null;

    if (dto.good_eggs > 0) {
      const outputRes = await this.batchMaterialService.receiveBatchOutput(
        {
          company_id: dto.company_id,
          batch_id: pBatch.production_batch_id,
          item_id: dto.egg_item_id,
          uom_id: dto.uom_id,
          warehouse_id: dto.warehouse_id,
          location_id: dto.location_id,
          output_type: 'FINISHED_GOOD' as any,
          qty: dto.good_eggs,
          cost_split_pct: 100,
        },
        tenantId,
        userId
      );
      goodsReceiptId = outputRes.output.goods_receipt_id;
    }

    // 2. Record Egg Production record
    const logId = randomUUID();
    const newLog = {
      egg_log_id: logId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      poultry_batch_id: dto.poultry_batch_id,
      log_date: dto.log_date,
      good_eggs: dto.good_eggs,
      cracked_eggs: dto.cracked_eggs || 0,
      dirty_eggs: dto.dirty_eggs || 0,
      double_yolk: dto.double_yolk || 0,
      total_eggs: totalEggs,
      hdp_pct: hdpPct.toFixed(2),
      goods_receipt_id: goodsReceiptId,
    };

    await this.db.insert(schema.poultryEggProduction).values(newLog);

    // 3. Update KPI HDP %
    await this.db
      .update(schema.poultryKpi)
      .set({
        hdp_pct: hdpPct.toFixed(2),
      })
      .where(eq(schema.poultryKpi.poultry_batch_id, dto.poultry_batch_id));

    return newLog;
  }
}
