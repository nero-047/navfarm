import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateSchedulerDto, UpdateSchedulerDto, QuerySchedulerDto } from './dto/scheduler.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => date.toISOString().slice(0, 19).replace('T', ' ');

@Injectable()
export class SchedulerService {
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

  async create(dto: CreateSchedulerDto, tenantId: string, userPayload?: any) {
    const existing = await this.db
      .select()
      .from(schema.schedulerMaster)
      .where(
        and(
          eq(schema.schedulerMaster.tenant_id, tenantId),
          eq(schema.schedulerMaster.scheduler_code, dto.scheduler_code.toUpperCase())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Scheduler code '${dto.scheduler_code}' already exists.`);
    }

    const schedulerId = randomUUID();

    await this.db.insert(schema.schedulerMaster).values({
      scheduler_id: schedulerId,
      tenant_id: tenantId,
      company_id: dto.company_id || null,
      nob_id: dto.nob_id,
      lob_id: dto.lob_id,
      scheduler_code: dto.scheduler_code.toUpperCase(),
      scheduler_name: dto.scheduler_name,
      duration_value: dto.duration_value,
      duration_unit: dto.duration_unit,
      breed_id: dto.breed_id || null,
      description: dto.description || null,
      created_by: userPayload?.userId || null,
    });

    await this.insertLines(schedulerId, dto.parameter_lines);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id || '',
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'scheduler_master',
      entityId: schedulerId,
      newValues: dto,
    });

    return this.findOne(schedulerId);
  }

  private async insertLines(schedulerId: string, lines: CreateSchedulerDto['parameter_lines']) {
    await this.db.insert(schema.schedulerParameterLine).values(
      lines.map((line) => ({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: line.parameter_id,
        period_no: line.period_no,
        period_from: line.period_from,
        period_to: line.period_to,
        period_label: line.period_label || null,
        expected_qty_override: line.expected_qty_override?.toString() || null,
        uom_override: line.uom_override || null,
        kpi_enabled: line.kpi_enabled ?? true,
        kpi_mode: line.kpi_mode || null,
        kpi_min_pct: line.kpi_min_pct?.toString() || null,
        kpi_max_pct: line.kpi_max_pct?.toString() || null,
        kpi_min_value: line.kpi_min_value?.toString() || null,
        kpi_max_value: line.kpi_max_value?.toString() || null,
        kpi_target_value: line.kpi_target_value?.toString() || null,
        critical_threshold_pct: line.critical_threshold_pct?.toString() || null,
        notify_in_app: line.notify_in_app ?? true,
        notify_push: line.notify_push ?? false,
        notify_email: line.notify_email ?? false,
        sort_order: line.sort_order ?? null,
        notes: line.notes || null,
      }))
    );
  }

  async findOne(id: string) {
    const [scheduler] = await this.db
      .select()
      .from(schema.schedulerMaster)
      .where(eq(schema.schedulerMaster.scheduler_id, id))
      .limit(1);

    if (!scheduler) {
      throw new NotFoundException(`Scheduler with ID '${id}' not found.`);
    }

    const parameterLines = await this.db
      .select()
      .from(schema.schedulerParameterLine)
      .where(eq(schema.schedulerParameterLine.scheduler_id, id));

    return { ...scheduler, parameter_lines: parameterLines };
  }

  async findAll(query: QuerySchedulerDto, tenantId: string) {
    const conditions: any[] = [eq(schema.schedulerMaster.tenant_id, tenantId)];

    if (query.companyId) conditions.push(eq(schema.schedulerMaster.company_id, query.companyId));
    if (query.nobId) conditions.push(eq(schema.schedulerMaster.nob_id, query.nobId));
    if (query.lobId) conditions.push(eq(schema.schedulerMaster.lob_id, query.lobId));
    if (query.search) {
      conditions.push(
        or(
          like(schema.schedulerMaster.scheduler_code, `%${query.search}%`),
          like(schema.schedulerMaster.scheduler_name, `%${query.search}%`)
        )!
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.schedulerMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateSchedulerDto, tenantId: string, userPayload?: any) {
    const scheduler = await this.findOne(id);
    if (scheduler.is_locked) {
      throw new BadRequestException(
        `Scheduler '${scheduler.scheduler_code}' is locked — an ACTIVE batch is already using it. Create a new scheduler to change the plan.`
      );
    }

    await this.db
      .update(schema.schedulerMaster)
      .set({
        scheduler_name: dto.scheduler_name ?? scheduler.scheduler_name,
        description: dto.description ?? scheduler.description,
        is_active: dto.is_active ?? scheduler.is_active,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.schedulerMaster.scheduler_id, id));

    if (dto.parameter_lines) {
      await this.db.delete(schema.schedulerParameterLine).where(eq(schema.schedulerParameterLine.scheduler_id, id));
      await this.insertLines(id, dto.parameter_lines);
    }

    await this.auditService.log({
      tenantId,
      companyId: scheduler.company_id || '',
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'scheduler_master',
      entityId: id,
      oldValues: scheduler,
      newValues: dto,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const scheduler = await this.findOne(id);
    if (scheduler.is_locked) {
      throw new BadRequestException(`Scheduler '${scheduler.scheduler_code}' is locked and cannot be deactivated.`);
    }

    await this.db
      .update(schema.schedulerMaster)
      .set({ is_active: false, updated_at: toMysqlTimestamp() })
      .where(eq(schema.schedulerMaster.scheduler_id, id));

    await this.auditService.log({
      tenantId,
      companyId: scheduler.company_id || '',
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'scheduler_master',
      entityId: id,
      oldValues: scheduler,
    });

    return { success: true, message: `Scheduler '${scheduler.scheduler_code}' has been deactivated.` };
  }
}
