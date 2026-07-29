import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import {
  CreateMODto, UpdateStageDto, QcInspectionDto, CreateDeliveryDto, IngredientPriceDto, CostBreakdownDto
} from '../dto/feed-production.dto';
import { GoodsIssueService } from '../../../inventory-logistics/inventory/services/goods-issue.service';
import { GoodsReceiptService } from '../../../inventory-logistics/inventory/services/goods-receipt.service';

const STAGES = [
  { name: 'GRINDING', seq: 1 },
  { name: 'MIXING', seq: 2 },
  { name: 'PELLETIZING', seq: 3 },
  { name: 'COOLING', seq: 4 },
  { name: 'PACKING', seq: 5 },
];

@Injectable()
export class FeedProductionV2Service {
  constructor(
    private readonly cls: ClsService,
    private readonly goodsIssueService: GoodsIssueService,
    private readonly goodsReceiptService: GoodsReceiptService,
  ) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  // ── MANUFACTURING ORDER ────────────────────────────────────────────────────
  async createMO(dto: CreateMODto, tenantId: string, companyId: string, userId: string) {
    const [exists] = await this.db.select().from(schema.feedManufacturingOrder)
      .where(and(eq(schema.feedManufacturingOrder.tenant_id, tenantId), eq(schema.feedManufacturingOrder.mo_no, dto.mo_no))).limit(1);
    if (exists) throw new ConflictException(`MO '${dto.mo_no}' already exists.`);

    const mo_id = randomUUID();
    const record = {
      mo_id, tenant_id: tenantId, company_id: companyId,
      mo_no: dto.mo_no, bor_id: dto.bor_id, formula_version_id: null,
      planned_qty_mt: String(dto.planned_qty_mt), actual_qty_mt: null, uom_id: null,
      planned_start_date: dto.planned_start_date || null, planned_end_date: dto.planned_end_date || null,
      actual_start_date: null, actual_end_date: null,
      target_warehouse_id: dto.target_warehouse_id || null,
      priority: dto.priority || 'NORMAL', current_stage: 'CREATED', mo_status: 'OPEN',
      production_batch_id: null, notes: dto.notes || null,
      created_by: userId, approved_by: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.feedManufacturingOrder).values(record);
    // Auto-create batch stages (FIX-038: configurable stages)
    const activeStages = ((dto as any).custom_stages && (dto as any).custom_stages.length > 0)
      ? (dto as any).custom_stages.map((name: string, idx: number) => ({ name: name.toUpperCase(), seq: idx + 1 }))
      : STAGES;

    const stageRows = activeStages.map((s: any) => ({
      stage_id: randomUUID(), tenant_id: tenantId, mo_id,
      stage_name: s.name, stage_seq: s.seq, status: 'PENDING',
      started_at: null, completed_at: null, duration_minutes: null,
      machine_id: null, operator: null, input_qty_mt: null,
      output_qty_mt: null, stage_loss_pct: null, remarks: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }));
    await this.db.insert(schema.feedBatchStage).values(stageRows);
    return { ...record, stages: stageRows, message: `MO ${dto.mo_no} created with ${STAGES.length} production stages.` };
  }

  async getMO(moId: string, tenantId: string) {
    const [mo] = await this.db.select().from(schema.feedManufacturingOrder)
      .where(and(eq(schema.feedManufacturingOrder.mo_id, moId), eq(schema.feedManufacturingOrder.tenant_id, tenantId))).limit(1);
    if (!mo) throw new NotFoundException(`MO '${moId}' not found.`);
    const stages = await this.db.select().from(schema.feedBatchStage).where(eq(schema.feedBatchStage.mo_id, moId));
    return { ...mo, stages };
  }

  async listMOs(tenantId: string) {
    return this.db.select().from(schema.feedManufacturingOrder)
      .where(eq(schema.feedManufacturingOrder.tenant_id, tenantId))
      .orderBy(desc(schema.feedManufacturingOrder.created_at));
  }

  async startMO(moId: string, tenantId: string) {
    await this.getMO(moId, tenantId);
    await this.db.update(schema.feedManufacturingOrder).set({
      mo_status: 'IN_PROGRESS', actual_start_date: new Date().toISOString().split('T')[0],
      current_stage: 'GRINDING', updated_at: new Date().toISOString(),
    }).where(eq(schema.feedManufacturingOrder.mo_id, moId));

    // Mark first stage as IN_PROGRESS
    await this.db.update(schema.feedBatchStage).set({
      status: 'IN_PROGRESS', started_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).where(and(eq(schema.feedBatchStage.mo_id, moId), eq(schema.feedBatchStage.stage_seq, 1)));

    return { moId, status: 'IN_PROGRESS', current_stage: 'GRINDING' };
  }

  async updateStage(stageId: string, dto: UpdateStageDto, tenantId: string) {
    const [stage] = await this.db.select().from(schema.feedBatchStage)
      .where(and(eq(schema.feedBatchStage.stage_id, stageId), eq(schema.feedBatchStage.tenant_id, tenantId))).limit(1);
    if (!stage) throw new NotFoundException(`Stage '${stageId}' not found.`);

    const now = new Date().toISOString();
    const duration = stage.started_at
      ? Math.round((new Date(now).getTime() - new Date(stage.started_at).getTime()) / 60000) : null;

    await this.db.update(schema.feedBatchStage).set({
      status: dto.status, completed_at: dto.status === 'COMPLETED' ? now : null,
      duration_minutes: duration,
      output_qty_mt: dto.output_qty_mt ? String(dto.output_qty_mt) : stage.output_qty_mt,
      stage_loss_pct: dto.stage_loss_pct ? String(dto.stage_loss_pct) : stage.stage_loss_pct,
      remarks: dto.remarks || null, updated_at: now,
    }).where(eq(schema.feedBatchStage.stage_id, stageId));

    // Auto-advance to next stage
    if (dto.status === 'COMPLETED') {
      const nextSeq = stage.stage_seq + 1;
      const nextStageName = STAGES.find(s => s.seq === nextSeq)?.name;
      if (nextStageName) {
        await this.db.update(schema.feedBatchStage).set({
          status: 'IN_PROGRESS', started_at: now, updated_at: now,
        }).where(and(eq(schema.feedBatchStage.mo_id, stage.mo_id || ''), eq(schema.feedBatchStage.stage_seq, nextSeq)));
        await this.db.update(schema.feedManufacturingOrder)
          .set({ current_stage: nextStageName, updated_at: now })
          .where(eq(schema.feedManufacturingOrder.mo_id, stage.mo_id || ''));
      } else {
        // All stages complete
        await this.db.update(schema.feedManufacturingOrder).set({
          current_stage: 'QUALITY_CHECK', updated_at: now,
        }).where(eq(schema.feedManufacturingOrder.mo_id, stage.mo_id || ''));
      }
    }
    return { stageId, status: dto.status, duration_minutes: duration };
  }

  // ── QC (FIX-005: auto-GR on PASS + FIX-029: quarantine on aflatoxin FAIL) ──
  async recordQcInspection(moId: string, dto: QcInspectionDto, tenantId: string, companyId?: string, userId?: string) {
    const inspection_id = randomUUID();
    // Auto-flag alerts
    const alerts: string[] = [];
    if (dto.moisture_pct && dto.moisture_pct > 12) alerts.push(`⚠️ Moisture too high: ${dto.moisture_pct}% (max 12%)`);
    if (dto.aflatoxin_ppb && dto.aflatoxin_ppb > 10) alerts.push(`🚨 Aflatoxin ${dto.aflatoxin_ppb} ppb exceeds 10 ppb limit!`);

    const record = {
      inspection_id, tenant_id: tenantId, mo_id: moId,
      inspection_date: dto.inspection_date,
      moisture_pct: dto.moisture_pct ? String(dto.moisture_pct) : null,
      protein_pct: dto.protein_pct ? String(dto.protein_pct) : null,
      fat_pct: dto.fat_pct ? String(dto.fat_pct) : null,
      fiber_pct: dto.fiber_pct ? String(dto.fiber_pct) : null,
      ash_pct: dto.ash_pct ? String(dto.ash_pct) : null,
      bulk_density_kg_m3: null, pellet_durability_pct: dto.pellet_durability_pct ? String(dto.pellet_durability_pct) : null,
      aflatoxin_ppb: dto.aflatoxin_ppb ? String(dto.aflatoxin_ppb) : null,
      qc_result: dto.qc_result, rejection_reason: dto.rejection_reason || null,
      disposition: dto.disposition, inspector: dto.inspector || null, lab_report_no: null,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.feedQcInspection).values(record);

    // Update MO based on QC result
    const nextStage = dto.qc_result === 'PASS' ? 'COMPLETED' : dto.qc_result === 'FAIL' ? 'QUALITY_REJECTED' : 'CONDITIONAL_RELEASE';
    await this.db.update(schema.feedManufacturingOrder).set({
      current_stage: nextStage, mo_status: dto.qc_result === 'PASS' ? 'COMPLETED' : 'IN_PROGRESS',
      actual_end_date: dto.qc_result === 'PASS' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    }).where(eq(schema.feedManufacturingOrder.mo_id, moId));

    let inventoryNote: string | null = null;

    // FIX-005: Auto-GR for produced feed when QC PASS
    if (dto.qc_result === 'PASS' && dto.feed_item_id && dto.warehouse_id && dto.location_id) {
      const [mo] = await this.db.select().from(schema.feedManufacturingOrder)
        .where(eq(schema.feedManufacturingOrder.mo_id, moId)).limit(1);
      const producedQtyKg = mo?.actual_qty_mt ? parseFloat(mo.actual_qty_mt) * 1000 : 0;
      if (producedQtyKg > 0) {
        try {
          const gr = await this.goodsReceiptService.create({
            company_id: companyId || mo?.company_id || '',
            receipt_type: 'PRODUCTION',
            warehouse_id: dto.warehouse_id,
            posting_date: dto.inspection_date,
            receipt_no: `GR-FEED-${mo?.mo_no || moId.slice(0, 8)}`,
            notes: `Auto-generated from Feed MO ${mo?.mo_no} QC PASS`,
            lines: [{
              item_id: dto.feed_item_id,
              location_id: dto.location_id,
              qty: producedQtyKg,
              uom_code: 'KG',
              unit_cost: 0,  // Will be updated by cost breakdown
            }],
          }, tenantId, userId || '');
          if (gr?.receipt_id) {
            await this.goodsReceiptService.post(gr.receipt_id, tenantId, userId || '');
            inventoryNote = `Auto-posted Goods Receipt ${gr.receipt_no} for ${producedQtyKg} KG of produced feed.`;
          }
        } catch (err: any) {
          inventoryNote = `Goods Receipt creation warning: ${err?.message || err}`;
        }
      }
    }

    // FIX-029: Auto-quarantine on aflatoxin FAIL
    if (dto.qc_result === 'FAIL' && dto.aflatoxin_ppb && dto.aflatoxin_ppb > 10 && dto.feed_item_id && dto.warehouse_id && dto.location_id && companyId) {
      try {
        await this.db.insert(schema.quarantineHold).values({
          tenant_id: tenantId,
          company_id: companyId,
          inspection_id: null,  // feedQcInspection is not the same as qcInspectionResult — FK mismatch
          item_id: dto.feed_item_id,
          warehouse_id: dto.warehouse_id,
          location_id: dto.location_id,
          hold_qty: '0',
          hold_reason: `Aflatoxin ${dto.aflatoxin_ppb} ppb exceeds 10 ppb safety limit. Feed batch quarantined.`,
          status: 'ON_HOLD',
        });
        alerts.push(`🔒 Feed batch auto-quarantined due to aflatoxin contamination.`);
      } catch (err: any) {
        alerts.push(`Quarantine hold warning: ${err?.message || err}`);
      }
    }

    return { ...record, alerts, inventoryNote, message: `QC ${dto.qc_result}: ${dto.disposition}` };
  }

  // ── INGREDIENT PRICE ──────────────────────────────────────────────────────
  async setIngredientPrice(dto: IngredientPriceDto, tenantId: string, userId: string) {
    const price_id = randomUUID();
    const record = {
      price_id, tenant_id: tenantId, item_id: dto.item_id,
      effective_date: dto.effective_date, price_per_mt: String(dto.price_per_mt),
      currency: 'INR', source: dto.source || 'SPOT',
      supplier_id: dto.supplier_id || null, notes: null,
      created_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.feedIngredientPrice).values(record);
    return record;
  }

  // ── COST BREAKDOWN ────────────────────────────────────────────────────────
  async calculateCost(moId: string, dto: CostBreakdownDto, tenantId: string) {
    const totalCost = dto.ingredient_cost + (dto.overhead_cost || 0) + (dto.labour_cost || 0) + (dto.energy_cost || 0) + (dto.packaging_cost || 0);
    const costPerMt = dto.produced_qty_mt > 0 ? totalCost / dto.produced_qty_mt : 0;
    const costPerKg = costPerMt / 1000;

    const breakdown_id = randomUUID();
    const record = {
      breakdown_id, tenant_id: tenantId, mo_id: moId,
      ingredient_cost: String(dto.ingredient_cost),
      overhead_cost: String(dto.overhead_cost || 0),
      labour_cost: String(dto.labour_cost || 0),
      energy_cost: String(dto.energy_cost || 0),
      packaging_cost: String(dto.packaging_cost || 0),
      total_cost: String(totalCost), produced_qty_mt: String(dto.produced_qty_mt),
      cost_per_mt: String(costPerMt.toFixed(4)), cost_per_kg: String(costPerKg.toFixed(4)),
      calculated_at: new Date().toISOString(), notes: null,
    };
    await this.db.insert(schema.feedCostBreakdown).values(record);
    // Update MO actual qty
    await this.db.update(schema.feedManufacturingOrder).set({
      actual_qty_mt: String(dto.produced_qty_mt), updated_at: new Date().toISOString(),
    }).where(eq(schema.feedManufacturingOrder.mo_id, moId));
    return { ...record, summary: `Cost/MT: ${costPerMt.toFixed(2)} | Cost/kg: ${costPerKg.toFixed(4)}` };
  }

  // ── DELIVERY ──────────────────────────────────────────────────────────────
  async createDelivery(moId: string, dto: CreateDeliveryDto, tenantId: string, companyId: string, userId: string) {
    const delivery_id = randomUUID();
    const totalValue = dto.unit_price ? dto.qty_mt * dto.unit_price : null;

    let giId: string | null = null;
    let inventoryNote = 'No inventory parameters provided. Create Goods Issue manually at /inventory/goods-issue if needed.';

    if (dto.feed_item_id && dto.warehouse_id && dto.location_id) {
      try {
        // FIX-034 (GAP-045): Resolve UoM (MT -> 1000kg, BAGS -> 50kg, KG -> 1kg)
        const uom = (dto as any).uom_code || 'MT';
        const qtyInKg = uom === 'BAGS' ? dto.qty_mt * 50 : uom === 'KG' ? dto.qty_mt : dto.qty_mt * 1000;

        const gi = await this.goodsIssueService.create({
          company_id: companyId,
          issue_type: 'SALES',
          warehouse_id: dto.warehouse_id,
          posting_date: dto.delivery_date,
          issue_no: `GI-FEED-${dto.delivery_no}`,
          notes: `Auto-generated for feed delivery ${dto.delivery_no} (${dto.qty_mt} ${uom})`,
          lines: [{
            item_id: dto.feed_item_id,
            location_id: dto.location_id,
            qty: qtyInKg,
            uom_code: 'KG',
          }],
        }, tenantId, userId);
        if (gi?.issue_id) {
          await this.goodsIssueService.post(gi.issue_id, tenantId, userId);
          giId = gi.issue_id;
          inventoryNote = `Auto-posted Goods Issue ${gi.issue_no} (ID: ${gi.issue_id}) for feed delivery.`;
        }
      } catch (err: any) {
        inventoryNote = `Goods Issue creation warning: ${err?.message || err}`;
      }
    }

    const record = {
      delivery_id, tenant_id: tenantId, company_id: companyId,
      delivery_no: dto.delivery_no, delivery_date: dto.delivery_date, mo_id: moId,
      customer_id: dto.customer_id || null, farm_id: dto.farm_id || null,
      feed_item_id: dto.feed_item_id || null, qty_mt: String(dto.qty_mt),
      unit_price: dto.unit_price ? String(dto.unit_price) : null,
      total_value: totalValue ? String(totalValue) : null,
      vehicle_no: dto.vehicle_no || null, driver_name: dto.driver_name || null,
      inventory_gi_id: giId, status: 'PENDING', notes: dto.notes || null,
      created_by: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.feedDeliveryNote).values(record);
    return {
      ...record,
      inventoryNote,
    };
  }

  async listDeliveries(tenantId: string) {
    return this.db.select().from(schema.feedDeliveryNote)
      .where(eq(schema.feedDeliveryNote.tenant_id, tenantId))
      .orderBy(desc(schema.feedDeliveryNote.delivery_date));
  }

  // ── KPI ───────────────────────────────────────────────────────────────────
  async getFeedKpi(tenantId: string) {
    const mos = await this.db.select().from(schema.feedManufacturingOrder).where(eq(schema.feedManufacturingOrder.tenant_id, tenantId));
    const completed = mos.filter(m => m.mo_status === 'COMPLETED');
    const totalProduced = completed.reduce((s, m) => s + Number(m.actual_qty_mt || 0), 0);

    const qcList = await this.db.select().from(schema.feedQcInspection).where(eq(schema.feedQcInspection.tenant_id, tenantId));
    const passCount = qcList.filter(q => q.qc_result === 'PASS').length;
    const qcPassRate = qcList.length > 0 ? (passCount / qcList.length) * 100 : 0;

    const costs = await this.db.select().from(schema.feedCostBreakdown).where(eq(schema.feedCostBreakdown.tenant_id, tenantId));
    const avgCostPerMt = costs.length > 0 ? costs.reduce((s, c) => s + Number(c.cost_per_mt || 0), 0) / costs.length : 0;

    return {
      kpis: {
        total_mos: mos.length,
        completed_mos: completed.length,
        in_progress_mos: mos.filter(m => m.mo_status === 'IN_PROGRESS').length,
        total_feed_produced_mt: parseFloat(totalProduced.toFixed(2)),
        qc_pass_rate_pct: parseFloat(qcPassRate.toFixed(2)),
        avg_cost_per_mt: parseFloat(avgCostPerMt.toFixed(2)),
        aflatoxin_alerts: qcList.filter(q => parseFloat(q.aflatoxin_ppb || '0') > 10).length,
      },
      calculated_at: new Date().toISOString(),
    };
  }

  // ── FIX-017 (GAP-017): Feed Return Note Processing ────────────────────────
  async createReturnNote(dto: any, tenantId: string, companyId?: string, userId?: string) {
    const returnId = randomUUID();
    const gr = await this.goodsReceiptService.create({
      company_id: companyId || 'COMP-001',
      receipt_type: 'RETURN',
      warehouse_id: dto.warehouse_id,
      posting_date: dto.return_date || new Date().toISOString().split('T')[0],
      receipt_no: `GR-RETURN-${returnId.slice(0, 8)}`,
      notes: `Feed Return Note ${dto.return_no} from Farm ${dto.farm_id}: ${dto.return_reason}`,
      lines: [{
        item_id: dto.feed_item_id,
        location_id: dto.location_id,
        qty: dto.qty_mt * 1000, // convert MT to KG for stock
        uom_code: 'KG',
        unit_cost: 0,
      }],
    }, tenantId, userId);

    if (gr?.receipt_id) {
      await this.goodsReceiptService.post(gr.receipt_id, tenantId, userId);
    }

    return {
      return_id: returnId,
      return_no: dto.return_no,
      farm_id: dto.farm_id,
      feed_item_id: dto.feed_item_id,
      qty_mt: dto.qty_mt,
      return_reason: dto.return_reason,
      goods_receipt_id: gr?.receipt_id,
      status: 'PROCESSED',
      processed_at: new Date().toISOString(),
    };
  }

  // ── FIX-018 (GAP-018): Feed Ingredient Stock Availability ───────────────
  async getIngredientInventory(tenantId: string) {
    const ingredients = await this.db.select().from(schema.feedIngredientPrice)
      .where(eq(schema.feedIngredientPrice.tenant_id, tenantId));
    const items = await this.db.select().from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.tenant_id, tenantId), eq(schema.itemMaster.item_type, 'RAW_MATERIAL')));
    const balances = await this.db.select().from(schema.inventoryBalance)
      .where(eq(schema.inventoryBalance.tenant_id, tenantId));

    return items.map(item => {
      const itemBalances = balances.filter(b => b.item_id === item.item_id);
      const totalStockKg = itemBalances.reduce((s, b) => s + Number(b.qty_on_hand || 0), 0);
      const price = ingredients.find(p => p.item_id === item.item_id);
      return {
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        qty_on_hand_kg: totalStockKg,
        qty_on_hand_mt: parseFloat((totalStockKg / 1000).toFixed(3)),
        price_per_mt: price ? Number(price.price_per_mt) : null,
        reorder_level_kg: item.reorder_level ? Number(item.reorder_level) : 1000,
        is_below_reorder: totalStockKg < (item.reorder_level ? Number(item.reorder_level) : 1000),
      };
    });
  }
}
