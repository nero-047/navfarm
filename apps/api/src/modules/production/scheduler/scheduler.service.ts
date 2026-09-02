import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateSchedulerDto, UpdateSchedulerDto, QuerySchedulerDto } from './dto/scheduler.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => date.toISOString().slice(0, 19).replace('T', ' ');

/** breed_lifecycle_stages.period_from/to are in calc_unit; scheduler_parameter_line's are day-of-batch. */
const toDays = (value: number, calcUnit: string): number => {
  if (calcUnit === 'WEEK') return value * 7;
  if (calcUnit === 'MONTH') return value * 30; // approximation — no calendar-month lookup at this layer
  return value;
};

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

  /**
   * Suggests parameter_lines for a new scheduler from breed_lifecycle_stages — a
   * read-only helper the caller reviews/edits before calling create(), not an
   * automatic insert. LOB-agnostic by design: matches parameter_master rows by
   * (nob_id, lob_id, parameter_type, item_id) rather than any piggery-specific
   * code, so it works for any breed/LOB that has lifecycle-stage data.
   *
   * Deliberately does not touch kpi_lower_limit/kpi_upper_limit — those bound an
   * unspecified single metric per stage row in the spec's own model, and forcing
   * them onto one parameter line here would be guessing which one. Returns an
   * empty array (not an error) when the breed has no lifecycle-stage data yet,
   * which today is every breed — see breed_lifecycle_stages seeding notes.
   */
  async suggestParameterLines(breedId: string, nobId: string, lobId: string, tenantId: string) {
    const lifecycleRows = await this.db
      .select({ lifecycle: schema.breedLifecycleStages, stage: schema.stageMaster })
      .from(schema.breedLifecycleStages)
      .innerJoin(schema.stageMaster, eq(schema.breedLifecycleStages.stage_id, schema.stageMaster.stage_id))
      .where(
        and(
          eq(schema.breedLifecycleStages.breed_id, breedId),
          eq(schema.breedLifecycleStages.tenant_id, tenantId),
          eq(schema.breedLifecycleStages.is_active, true)
        )
      )
      .orderBy(schema.breedLifecycleStages.period_from);

    if (lifecycleRows.length === 0) return [];

    const params = await this.db
      .select()
      .from(schema.parameterMaster)
      .where(
        and(
          eq(schema.parameterMaster.nob_id, nobId),
          eq(schema.parameterMaster.lob_id, lobId),
          eq(schema.parameterMaster.is_active, true)
        )
      );

    const findParam = (type: string, itemId?: string | null) =>
      (itemId && params.find((p) => p.parameter_type === type && p.item_id === itemId)) ||
      params.find((p) => p.parameter_type === type && !p.item_id) ||
      params.find((p) => p.parameter_type === type);

    const lines: any[] = [];
    let periodNo = 1;

    for (const { lifecycle, stage } of lifecycleRows) {
      const periodFrom = toDays(lifecycle.period_from, lifecycle.calc_unit);
      const periodTo = toDays(lifecycle.period_to, lifecycle.calc_unit);

      if (lifecycle.feed_qty_per_head_per_day_kg) {
        const feedParam = findParam('CONSUMPTION', lifecycle.feed_item_id);
        if (feedParam) {
          lines.push({
            parameter_id: feedParam.parameter_id,
            period_no: periodNo++,
            period_from: periodFrom,
            period_to: periodTo,
            period_label: stage.stage_name,
            stage_code: stage.stage_code,
            expected_qty_override: Number(lifecycle.feed_qty_per_head_per_day_kg),
            uom_override: feedParam.default_uom || 'KG',
            kpi_enabled: false,
            notes: 'Auto-suggested from breed_lifecycle_stages — review before saving.',
          });
        }
      }

      if (lifecycle.std_mortality_rate_pct) {
        const mortParam = findParam('MORTALITY');
        if (mortParam) {
          lines.push({
            parameter_id: mortParam.parameter_id,
            period_no: periodNo++,
            period_from: periodFrom,
            period_to: periodTo,
            period_label: stage.stage_name,
            stage_code: stage.stage_code,
            kpi_enabled: true,
            kpi_target_value: Number(lifecycle.std_mortality_rate_pct),
            notes: 'Target mortality rate % for display — actual entries are headcount, not directly comparable without population size.',
          });
        }
      }

      const outputQty = lifecycle.std_output_qty ?? lifecycle.std_body_weight_kg;
      if (outputQty) {
        const outputParam = findParam('OUTPUT', lifecycle.output_item_id);
        if (outputParam) {
          lines.push({
            parameter_id: outputParam.parameter_id,
            period_no: periodNo++,
            period_from: periodFrom,
            period_to: periodTo,
            period_label: stage.stage_name,
            stage_code: stage.stage_code,
            expected_qty_override: Number(outputQty),
            uom_override: lifecycle.output_uom || outputParam.default_uom || undefined,
            kpi_enabled: false,
            notes: 'Auto-suggested from breed_lifecycle_stages — review before saving.',
          });
        }
      }
    }

    return lines;
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
      batch_start_from: dto.batch_start_from || null,
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
        occurrence: line.occurrence || null,
        stage_code: line.stage_code || null,
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

    const rows = await this.db
      .select()
      .from(schema.schedulerMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);

    // Returning the bare rows here widened findAll's type to a union missing
    // line_count / stages_covered / batch_count — the very fields it adds.
    if (rows.length === 0) return [];

    /**
     * What each scheduler actually plans, and whether anything uses it.
     *
     * The list previously carried code, name, duration, active and locked —
     * nothing about the thing you choose a scheduler *for*. Stage coverage in
     * particular is the distinction between a plan that applies throughout and
     * one scoped to a single stage, which is otherwise only visible by opening
     * the scheduler and reading its lines.
     */
    const schedulerIds = rows.map((r) => r.scheduler_id);

    const lines = await this.db
      .select({
        scheduler_id: schema.schedulerParameterLine.scheduler_id,
        stage_code: schema.schedulerParameterLine.stage_code,
      })
      .from(schema.schedulerParameterLine)
      .where(inArray(schema.schedulerParameterLine.scheduler_id, schedulerIds));

    const batches = await this.db
      .select({ scheduler_id: schema.batchHeader.scheduler_id })
      .from(schema.batchHeader)
      .where(inArray(schema.batchHeader.scheduler_id, schedulerIds));

    const lineCount = new Map<string, number>();
    const stages = new Map<string, string[]>();
    // A line with no stage_code runs in every stage, which is a property of the
    // scheduler worth surfacing rather than an absent value.
    const unscoped = new Set<string>();
    for (const line of lines) {
      lineCount.set(line.scheduler_id, (lineCount.get(line.scheduler_id) ?? 0) + 1);
      if (!line.stage_code) {
        unscoped.add(line.scheduler_id);
        continue;
      }
      const seen = stages.get(line.scheduler_id) ?? [];
      if (!seen.includes(line.stage_code)) seen.push(line.stage_code);
      stages.set(line.scheduler_id, seen);
    }

    const batchCount = new Map<string, number>();
    for (const b of batches) {
      if (!b.scheduler_id) continue;
      batchCount.set(b.scheduler_id, (batchCount.get(b.scheduler_id) ?? 0) + 1);
    }

    return rows.map((r) => ({
      ...r,
      line_count: lineCount.get(r.scheduler_id) ?? 0,
      stages_covered: stages.get(r.scheduler_id) ?? [],
      applies_to_all_stages: unscoped.has(r.scheduler_id),
      batch_count: batchCount.get(r.scheduler_id) ?? 0,
    }));
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
        batch_start_from: dto.batch_start_from ?? scheduler.batch_start_from,
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
