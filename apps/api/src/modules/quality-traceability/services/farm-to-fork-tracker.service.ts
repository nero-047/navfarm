import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

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

    if (!pBatch) {
      throw new NotFoundException(`Production Batch '${batchId}' not found for Farm-to-Fork journey lookup.`);
    }

    const [poultry] = await this.db
      .select()
      .from(schema.poultryBatch)
      .where(eq(schema.poultryBatch.production_batch_id, batchId))
      .limit(1);

    const [trace] = await this.db
      .select()
      .from(schema.batchTraceability)
      .where(eq(schema.batchTraceability.batch_id, batchId))
      .limit(1);

    const events = trace
      ? await this.db.select().from(schema.traceabilityEvent).where(eq(schema.traceabilityEvent.trace_id, trace.trace_id))
      : [];

    return {
      production_batch: pBatch,
      poultry_flock: poultry || null,
      lineage_trace: trace || null,
      journey_timeline: events,
    };
  }
}
