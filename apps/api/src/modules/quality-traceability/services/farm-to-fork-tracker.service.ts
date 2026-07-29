import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

/**
 * FIX-006 (GAP-009): Farm-to-Fork Tracker rewritten for multi-vertical support.
 * Previously only queried productionBatch + poultryBatch.
 * Now queries across all verticals: Poultry, Livestock, Aquaculture, Agriculture, Feed Production.
 */
@Injectable()
export class FarmToForkTrackerService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async getFarmToForkJourney(batchId: string, tenantId: string) {
    // 1. Core production batch (universal anchor)
    const [pBatch] = await this.db
      .select()
      .from(schema.productionBatch)
      .where(
        and(
          eq(schema.productionBatch.batch_id, batchId),
          eq(schema.productionBatch.tenant_id, tenantId)
        )
      )
      .limit(1);

    // 2. Poultry vertical
    const [poultry] = pBatch
      ? await this.db.select().from(schema.poultryBatch)
          .where(eq(schema.poultryBatch.production_batch_id, batchId)).limit(1)
      : [null];

    // 3. Livestock V2 vertical — search by herd_id (batchId may be a herd_id)
    let livestockHerd: any = null;
    try {
      const [herd] = await this.db.select().from(schema.lvsHerd)
        .where(and(eq(schema.lvsHerd.tenant_id, tenantId), eq(schema.lvsHerd.herd_id, batchId))).limit(1);
      livestockHerd = herd || null;
    } catch { /* not a livestock batch */ }

    // 4. Aquaculture V2 vertical — search by batch_id
    let aquaBatch: any = null;
    try {
      const [ab] = await this.db.select().from(schema.aquaBatch)
        .where(and(eq(schema.aquaBatch.tenant_id, tenantId), eq(schema.aquaBatch.batch_id, batchId))).limit(1);
      aquaBatch = ab || null;
    } catch { /* not an aqua batch */ }

    // 5. Agriculture V2 — crop plan may be linked via batch
    let agriPlan: any = null;
    try {
      const [ap] = await this.db.select().from(schema.agriCropPlan)
        .where(and(eq(schema.agriCropPlan.tenant_id, tenantId), eq(schema.agriCropPlan.plan_id, batchId))).limit(1);
      agriPlan = ap || null;
    } catch { /* not an agri plan */ }

    // 6. Feed Production V2 — MO linked via mo_id or production_batch_id
    let feedMO: any = null;
    try {
      const [fm] = await this.db.select().from(schema.feedManufacturingOrder)
        .where(and(eq(schema.feedManufacturingOrder.tenant_id, tenantId), eq(schema.feedManufacturingOrder.mo_id, batchId))).limit(1);
      feedMO = fm || null;
    } catch { /* not a feed MO */ }

    // 7. Traceability events
    const [trace] = await this.db
      .select()
      .from(schema.batchTraceability)
      .where(eq(schema.batchTraceability.batch_id, batchId))
      .limit(1);

    const events = trace
      ? await this.db.select().from(schema.traceabilityEvent).where(eq(schema.traceabilityEvent.trace_id, trace.trace_id))
      : [];

    // 8. Determine vertical type
    let verticalType = 'UNKNOWN';
    if (poultry) verticalType = 'POULTRY';
    else if (livestockHerd) verticalType = 'LIVESTOCK';
    else if (aquaBatch) verticalType = 'AQUACULTURE';
    else if (agriPlan) verticalType = 'AGRICULTURE';
    else if (feedMO) verticalType = 'FEED_PRODUCTION';
    else if (pBatch) verticalType = 'PRODUCTION';

    // 9. Quality inspections linked to this batch
    const qualityInspections = await this.db.select().from(schema.qualityInspection)
      .where(and(eq(schema.qualityInspection.tenant_id, tenantId), eq(schema.qualityInspection.batch_id, batchId)))
      .catch(() => []);

    return {
      vertical_type: verticalType,
      production_batch: pBatch || null,
      // Vertical-specific data
      poultry_flock: poultry || null,
      livestock_herd: livestockHerd || null,
      aqua_batch: aquaBatch || null,
      agri_crop_plan: agriPlan || null,
      feed_manufacturing_order: feedMO || null,
      // Traceability
      lineage_trace: trace || null,
      journey_timeline: events,
      quality_inspections: qualityInspections || [],
    };
  }
}
