import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { AuditLogService } from '../../../platform-identity/audit-log/audit-log.service';
import { CreateProductionBatchDto, BatchStatusEnum } from '../dto/production-batch.dto';
import { RecordDailyProductionDto } from '../dto/daily-entry.dto';
import { AddResourceUsageDto } from '../dto/resource-usage.dto';
import { QueryProductionDto } from '../dto/query-production.dto';

@Injectable()
export class ProductionBatchService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createBatch(dto: CreateProductionBatchDto, tenantId: string, userId?: string) {
    // 1. Validate uniqueness of batch_no
    const [existing] = await this.db
      .select()
      .from(schema.productionBatch)
      .where(
        and(
          eq(schema.productionBatch.tenant_id, tenantId),
          eq(schema.productionBatch.company_id, dto.company_id),
          eq(schema.productionBatch.batch_no, dto.batch_no),
          isNull(schema.productionBatch.deleted_at)
        )
      )
      .limit(1);

    if (existing) {
      throw new BadRequestException(`Production Batch '${dto.batch_no}' already exists in this company.`);
    }

    const batchId = randomUUID();
    const newBatch = {
      batch_id: batchId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      order_id: dto.order_id || null,
      batch_no: dto.batch_no,
      parent_batch_id: dto.parent_batch_id || null,
      formula_id: dto.formula_id || null,
      farm_id: dto.farm_id || null,
      shed_id: dto.shed_id || null,
      warehouse_id: dto.warehouse_id,
      location_id: dto.location_id,
      planned_qty: dto.planned_qty.toFixed(4),
      actual_qty: '0.0000',
      scrap_qty: '0.0000',
      status: 'DRAFT',
      notes: dto.notes || null,
      created_by: userId || null,
    };

    await this.db.insert(schema.productionBatch).values(newBatch);

    // Initialize WIP Record
    await this.db.insert(schema.productionWip).values({
      wip_id: randomUUID(),
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: batchId,
      material_cost: '0.0000',
      labor_cost: '0.0000',
      machine_cost: '0.0000',
      overhead_cost: '0.0000',
      total_wip_cost: '0.0000',
      completion_pct: '0.00',
    });

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId,
      action: 'CREATE',
      entityName: 'production_batch',
      entityId: batchId,
      newValues: newBatch,
    });

    return newBatch;
  }

  async findBatchById(batchId: string, tenantId: string) {
    const [batch] = await this.db
      .select()
      .from(schema.productionBatch)
      .where(
        and(
          eq(schema.productionBatch.batch_id, batchId),
          eq(schema.productionBatch.tenant_id, tenantId),
          isNull(schema.productionBatch.deleted_at)
        )
      )
      .limit(1);

    if (!batch) {
      throw new NotFoundException(`Production Batch '${batchId}' not found.`);
    }

    return batch;
  }

  async findAllBatches(query: QueryProductionDto, tenantId: string) {
    const conditions = [
      eq(schema.productionBatch.tenant_id, tenantId),
      isNull(schema.productionBatch.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.productionBatch.company_id, query.companyId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.productionBatch.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.productionBatch.status, query.status));
    }

    const limit = query.limit ? Number(query.limit) : 50;
    const offset = query.offset ? Number(query.offset) : 0;

    return this.db
      .select()
      .from(schema.productionBatch)
      .where(and(...conditions))
      .orderBy(desc(schema.productionBatch.created_at))
      .limit(limit)
      .offset(offset);
  }

  // --- LIFE-CYCLE STATE MACHINE TRANSITIONS ---

  async transitionStatus(batchId: string, targetStatus: BatchStatusEnum, tenantId: string, userId?: string, notes?: string) {
    const batch = await this.findBatchById(batchId, tenantId);
    const current = batch.status as BatchStatusEnum;

    // State machine validation rules
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['PLANNED', 'RELEASED'],
      PLANNED: ['RELEASED', 'DRAFT'],
      RELEASED: ['MATERIAL_ISSUED', 'IN_PROGRESS'],
      MATERIAL_ISSUED: ['IN_PROGRESS'],
      IN_PROGRESS: ['QUALITY_CHECK', 'FINISHED'],
      QUALITY_CHECK: ['FINISHED', 'IN_PROGRESS'],
      FINISHED: ['CLOSED'],
      CLOSED: [], // Controlled reopen
    };

    if (!allowedTransitions[current]?.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid Batch status transition from '${current}' to '${targetStatus}'.`
      );
    }

    const updates: Partial<typeof schema.productionBatch.$inferInsert> = {
      status: targetStatus,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    if (targetStatus === BatchStatusEnum.IN_PROGRESS && !batch.start_time) {
      updates.start_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    if (targetStatus === BatchStatusEnum.FINISHED || targetStatus === BatchStatusEnum.CLOSED) {
      if (!batch.end_time) {
        updates.end_time = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    await this.db
      .update(schema.productionBatch)
      .set(updates)
      .where(eq(schema.productionBatch.batch_id, batchId));

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId,
      action: 'UPDATE',
      entityName: 'production_batch',
      entityId: batchId,
      oldValues: { status: current },
      newValues: { status: targetStatus, notes },
    });

    return this.findBatchById(batchId, tenantId);
  }

  // --- DAILY PRODUCTION LOGS ---

  async addDailyEntry(dto: RecordDailyProductionDto, tenantId: string, userId?: string) {
    const batch = await this.findBatchById(dto.batch_id, tenantId);

    if (batch.status === 'CLOSED') {
      throw new BadRequestException('Cannot record daily production log for a CLOSED batch.');
    }

    const entryId = randomUUID();
    const newEntry = {
      entry_id: entryId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      entry_date: dto.entry_date,
      produced_qty: (dto.produced_qty || 0).toFixed(4),
      consumed_qty: (dto.consumed_qty || 0).toFixed(4),
      mortality_qty: (dto.mortality_qty || 0).toFixed(4),
      scrap_qty: (dto.scrap_qty || 0).toFixed(4),
      downtime_minutes: dto.downtime_minutes || 0,
      notes: dto.notes || null,
      created_by: userId || null,
    };

    await this.db.insert(schema.productionDailyEntry).values(newEntry);

    // Update actual produced / scrap quantities on batch
    const currentActual = parseFloat(batch.actual_qty);
    const currentScrap = parseFloat(batch.scrap_qty);
    const newActual = currentActual + (dto.produced_qty || 0);
    const newScrap = currentScrap + (dto.scrap_qty || 0);

    await this.db
      .update(schema.productionBatch)
      .set({
        actual_qty: newActual.toFixed(4),
        scrap_qty: newScrap.toFixed(4),
      })
      .where(eq(schema.productionBatch.batch_id, dto.batch_id));

    return newEntry;
  }

  // --- RESOURCE USAGE LOGGING ---

  async addResourceUsage(dto: AddResourceUsageDto, tenantId: string, userId?: string) {
    const batch = await this.findBatchById(dto.batch_id, tenantId);

    if (batch.status === 'CLOSED') {
      throw new BadRequestException('Cannot record resource usage for a CLOSED batch.');
    }

    const totalCost = dto.actual_hours * dto.hourly_rate;
    const usageId = randomUUID();
    const newUsage = {
      usage_id: usageId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      resource_id: dto.resource_id,
      usage_type: dto.usage_type,
      planned_hours: (dto.planned_hours || 0).toFixed(2),
      actual_hours: dto.actual_hours.toFixed(2),
      hourly_rate: dto.hourly_rate.toFixed(4),
      total_cost: totalCost.toFixed(4),
    };

    await this.db.insert(schema.productionResourceUsage).values(newUsage);

    // Update WIP Resource Costs (Labor / Machine / Overhead)
    const [wip] = await this.db
      .select()
      .from(schema.productionWip)
      .where(eq(schema.productionWip.batch_id, dto.batch_id))
      .limit(1);

    if (wip) {
      let laborCost = parseFloat(wip.labor_cost);
      let machineCost = parseFloat(wip.machine_cost);
      let overheadCost = parseFloat(wip.overhead_cost);

      if (dto.usage_type === 'LABOR') laborCost += totalCost;
      else if (dto.usage_type === 'MACHINE') machineCost += totalCost;
      else overheadCost += totalCost;

      const totalWip = parseFloat(wip.material_cost) + laborCost + machineCost + overheadCost;

      await this.db
        .update(schema.productionWip)
        .set({
          labor_cost: laborCost.toFixed(4),
          machine_cost: machineCost.toFixed(4),
          overhead_cost: overheadCost.toFixed(4),
          total_wip_cost: totalWip.toFixed(4),
        })
        .where(eq(schema.productionWip.batch_id, dto.batch_id));
    }

    return newUsage;
  }
}
