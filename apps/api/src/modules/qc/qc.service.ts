import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateQcTemplateDto, RecordQcInspectionDto, ReleaseQuarantineDto } from './dto/qc.dto';

@Injectable()
export class QcService {
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

  async createTemplate(dto: CreateQcTemplateDto, tenantId: string, userId?: string) {
    const templateId = randomUUID();
    const newTemplate = {
      template_id: templateId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      template_code: dto.template_code,
      template_name: dto.template_name,
      item_category_id: dto.item_category_id || null,
      min_acceptable_value: dto.min_acceptable_value !== undefined ? dto.min_acceptable_value.toFixed(4) : null,
      max_acceptable_value: dto.max_acceptable_value !== undefined ? dto.max_acceptable_value.toFixed(4) : null,
      uom_id: dto.uom_id || null,
    };

    await this.db.insert(schema.qcParameterTemplate).values(newTemplate);
    return newTemplate;
  }

  async recordInspection(dto: RecordQcInspectionDto, tenantId: string, userId?: string) {
    let status = 'PASSED';

    if (dto.template_id) {
      const [tpl] = await this.db
        .select()
        .from(schema.qcParameterTemplate)
        .where(
          and(
            eq(schema.qcParameterTemplate.template_id, dto.template_id),
            eq(schema.qcParameterTemplate.tenant_id, tenantId)
          )
        )
        .limit(1);

      if (tpl) {
        const val = dto.measured_value;
        const min = tpl.min_acceptable_value ? parseFloat(tpl.min_acceptable_value) : null;
        const max = tpl.max_acceptable_value ? parseFloat(tpl.max_acceptable_value) : null;

        if ((min !== null && val < min) || (max !== null && val > max)) {
          status = 'QUARANTINE';
        }
      }
    }

    const inspectionId = randomUUID();
    const newInspection = {
      inspection_id: inspectionId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      template_id: dto.template_id || null,
      item_id: dto.item_id,
      batch_id: dto.batch_id || null,
      lot_number: dto.lot_number || null,
      measured_value: dto.measured_value.toFixed(4),
      inspection_status: status,
      inspected_by: userId || null,
      notes: dto.notes || null,
    };

    await this.db.insert(schema.qcInspectionResult).values(newInspection);

    // Create Quarantine Hold record if inspection failed or was placed on quarantine
    if (status === 'QUARANTINE' && dto.warehouse_id && dto.location_id && dto.hold_qty) {
      const holdId = randomUUID();
      await this.db.insert(schema.quarantineHold).values({
        hold_id: holdId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        inspection_id: inspectionId,
        item_id: dto.item_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        hold_qty: dto.hold_qty.toFixed(4),
        hold_reason: dto.notes || 'Failed QC parameter limits',
        status: 'ON_HOLD',
      });
    }

    return newInspection;
  }

  async releaseQuarantine(dto: ReleaseQuarantineDto, tenantId: string, userId?: string) {
    const [hold] = await this.db
      .select()
      .from(schema.quarantineHold)
      .where(
        and(
          eq(schema.quarantineHold.hold_id, dto.hold_id),
          eq(schema.quarantineHold.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!hold) {
      throw new NotFoundException(`Quarantine Hold '${dto.hold_id}' not found.`);
    }

    await this.db
      .update(schema.quarantineHold)
      .set({
        status: dto.action.toUpperCase() === 'RELEASED' ? 'RELEASED' : 'REJECTED',
        released_by: userId || null,
        released_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(schema.quarantineHold.hold_id, dto.hold_id));

    return { hold_id: dto.hold_id, status: dto.action.toUpperCase() };
  }

  async getTemplates(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.qcParameterTemplate)
      .where(
        and(
          eq(schema.qcParameterTemplate.tenant_id, tenantId),
          eq(schema.qcParameterTemplate.company_id, companyId)
        )
      );
  }

  async getQuarantineHolds(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.quarantineHold)
      .where(
        and(
          eq(schema.quarantineHold.tenant_id, tenantId),
          eq(schema.quarantineHold.company_id, companyId)
        )
      );
  }
}
