import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { InitiateRecallDto } from '../dto/recall.dto';

@Injectable()
export class RecallManagementService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async initiateRecall(dto: InitiateRecallDto, tenantId: string, userId?: string) {
    const recallId = randomUUID();
    const newRecall = {
      recall_id: recallId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      recall_number: dto.recall_number,
      reason: dto.reason,
      severity: dto.severity,
      status: 'STOCK_BLOCKED',
      initiated_by: userId || null,
    };

    await this.db.insert(schema.recallManagement).values(newRecall);

    // Block affected inventory & record affected batches
    for (const batchId of dto.affected_batch_ids) {
      const holdId = randomUUID();
      await this.db.insert(schema.quarantineHold).values({
        hold_id: holdId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        item_id: 'recalled-item',
        warehouse_id: 'recalled-warehouse',
        location_id: 'recalled-location',
        hold_qty: '0.0000',
        hold_reason: `Product Recall ${dto.recall_number}: ${dto.reason}`,
        status: 'ON_HOLD',
      });

      await this.db.insert(schema.recallAffectedBatch).values({
        affected_id: randomUUID(),
        recall_id: recallId,
        batch_id: batchId,
        blocked_qty: '0.0000',
        quarantine_hold_id: holdId,
      });
    }

    return newRecall;
  }

  async getRecalls(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.recallManagement)
      .where(
        and(
          eq(schema.recallManagement.tenant_id, tenantId),
          eq(schema.recallManagement.company_id, companyId)
        )
      );
  }
}
