import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { ExecuteQualityInspectionDto } from '../dto/quality-inspection.dto';

@Injectable()
export class QualityInspectionService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async executeInspection(dto: ExecuteQualityInspectionDto, tenantId: string, userId?: string) {
    let overallStatus = 'PASSED';
    const parameterResults: Array<{ parameter_id: string; measured_value: number; pass_fail_status: string }> = [];

    // Evaluate each parameter result
    for (const r of dto.results) {
      const [param] = await this.db
        .select()
        .from(schema.qualityParameter)
        .where(eq(schema.qualityParameter.parameter_id, r.parameter_id))
        .limit(1);

      let passStatus = 'PASS';
      if (param) {
        const val = r.measured_value;
        const min = param.min_value ? parseFloat(param.min_value) : null;
        const max = param.max_value ? parseFloat(param.max_value) : null;

        if ((min !== null && val < min) || (max !== null && val > max)) {
          passStatus = 'FAIL';
          if (param.is_mandatory) {
            overallStatus = 'QUARANTINE';
          }
        }
      }

      parameterResults.push({
        parameter_id: r.parameter_id,
        measured_value: r.measured_value,
        pass_fail_status: passStatus,
      });
    }

    const inspectionId = randomUUID();
    const newInspection = {
      inspection_id: inspectionId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      plan_id: dto.plan_id || null,
      batch_id: dto.batch_id || null,
      lot_number: dto.lot_number || null,
      sample_size: dto.sample_size.toFixed(4),
      overall_result: overallStatus,
      inspected_by: userId || null,
    };

    await this.db.insert(schema.qualityInspection).values(newInspection);

    // Save parameter results
    for (const pr of parameterResults) {
      await this.db.insert(schema.qualityResult).values({
        result_id: randomUUID(),
        inspection_id: inspectionId,
        parameter_id: pr.parameter_id,
        measured_value: pr.measured_value.toFixed(4),
        pass_fail_status: pr.pass_fail_status,
      });
    }

    // Auto-create Quarantine Hold if overall result is QUARANTINE
    // FIX-026 (GAP-035): Use dto.item_id instead of dto.plan_id for correct item tracking
    if (overallStatus === 'QUARANTINE' && dto.warehouse_id && dto.location_id && dto.hold_qty) {
      await this.db.insert(schema.quarantineHold).values({
        hold_id: randomUUID(),
        tenant_id: tenantId,
        company_id: dto.company_id,
        inspection_id: inspectionId,
        item_id: dto.item_id || dto.plan_id || 'quality-item',
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        hold_qty: dto.hold_qty.toFixed(4),
        hold_reason: 'Failed mandatory Quality Plan parameter limits',
        status: 'ON_HOLD',
      });
    }

    return {
      ...newInspection,
      parameter_results: parameterResults,
    };
  }

  async getInspectionById(inspectionId: string, tenantId: string) {
    const [inspection] = await this.db
      .select()
      .from(schema.qualityInspection)
      .where(
        and(
          eq(schema.qualityInspection.inspection_id, inspectionId),
          eq(schema.qualityInspection.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!inspection) {
      throw new NotFoundException(`Quality Inspection '${inspectionId}' not found.`);
    }

    const results = await this.db
      .select()
      .from(schema.qualityResult)
      .where(eq(schema.qualityResult.inspection_id, inspectionId));

    return {
      ...inspection,
      results,
    };
  }

  async validateQCPassed(batchId: string, tenantId: string): Promise<boolean> {
    const inspections = await this.db
      .select()
      .from(schema.qualityInspection)
      .where(
        and(
          eq(schema.qualityInspection.batch_id, batchId),
          eq(schema.qualityInspection.tenant_id, tenantId)
        )
      );

    if (inspections.length === 0) {
      return false;
    }

    const hasPassed = inspections.some(i => i.overall_result === 'PASSED');
    const hasQuarantine = inspections.some(i => i.overall_result === 'QUARANTINE' || i.overall_result === 'FAILED');

    return hasPassed && !hasQuarantine;
  }

  async releaseQuarantineHold(holdId: string, disposition: 'RELEASED' | 'REJECTED' | 'SCRAPPED', tenantId: string, notes?: string) {
    const [hold] = await this.db
      .select()
      .from(schema.quarantineHold)
      .where(
        and(
          eq(schema.quarantineHold.hold_id, holdId),
          eq(schema.quarantineHold.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!hold) {
      throw new NotFoundException(`Quarantine Hold '${holdId}' not found.`);
    }

    await this.db
      .update(schema.quarantineHold)
      .set({
        status: disposition,
        released_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(schema.quarantineHold.hold_id, holdId));

    return {
      ...hold,
      status: disposition,
      released_at: new Date().toISOString(),
    };
  }

  async getInspections(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.qualityInspection)
      .where(
        and(
          eq(schema.qualityInspection.tenant_id, tenantId),
          eq(schema.qualityInspection.company_id, companyId)
        )
      );
  }
}
