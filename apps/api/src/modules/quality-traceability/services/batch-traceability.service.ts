import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { RecordTraceabilityEventDto } from '../dto/traceability.dto';

@Injectable()
export class BatchTraceabilityService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async recordTraceabilityEvent(dto: RecordTraceabilityEventDto, tenantId: string) {
    let [trace] = await this.db
      .select()
      .from(schema.batchTraceability)
      .where(
        and(
          eq(schema.batchTraceability.batch_id, dto.batch_id),
          eq(schema.batchTraceability.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!trace) {
      const traceId = randomUUID();
      const newTrace = {
        trace_id: traceId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        batch_id: dto.batch_id,
        parent_batch_id: dto.parent_batch_id || null,
        origin_farm_id: dto.origin_farm_id || null,
        origin_shed_id: dto.origin_shed_id || null,
        feed_batch_no: dto.feed_batch_no || null,
        medicine_batch_no: dto.medicine_batch_no || null,
      };
      await this.db.insert(schema.batchTraceability).values(newTrace);
      trace = newTrace as any;
    }

    const eventId = randomUUID();
    const newEvent = {
      event_id: eventId,
      trace_id: trace.trace_id,
      event_type: dto.event_type,
      source_location_id: dto.source_location_id || null,
      destination_location_id: dto.destination_location_id || null,
      event_details: dto.event_details || {},
    };

    await this.db.insert(schema.traceabilityEvent).values(newEvent);
    return newEvent;
  }

  async getBatchGenealogy(batchId: string, tenantId: string) {
    const [trace] = await this.db
      .select()
      .from(schema.batchTraceability)
      .where(
        and(
          eq(schema.batchTraceability.batch_id, batchId),
          eq(schema.batchTraceability.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!trace) {
      throw new NotFoundException(`Traceability lineage for batch '${batchId}' not found.`);
    }

    const events = await this.db
      .select()
      .from(schema.traceabilityEvent)
      .where(eq(schema.traceabilityEvent.trace_id, trace.trace_id));

    return {
      ...trace,
      events,
    };
  }
}
