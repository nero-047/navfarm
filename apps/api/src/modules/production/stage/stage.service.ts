import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateStageDto, UpdateStageDto, QueryStageDto } from './dto/stage.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

@Injectable()
export class StageService {
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

  /** AUTO_BY_DAY stages must specify which day to auto-move on. */
  private assertAutoMoveDayWhenAutoByDay(transitionTrigger: string, autoMoveOnDay?: number | null) {
    if (transitionTrigger === 'AUTO_BY_DAY' && autoMoveOnDay == null) {
      throw new ConflictException('auto_move_on_day is required when transition_trigger is AUTO_BY_DAY.');
    }
  }

  private async assertStageExists(stageId: string) {
    const [stage] = await this.db
      .select()
      .from(schema.stageMaster)
      .where(and(eq(schema.stageMaster.stage_id, stageId), isNull(schema.stageMaster.deleted_at)))
      .limit(1);
    if (!stage) {
      throw new NotFoundException(`Stage with ID '${stageId}' not found.`);
    }
  }

  async create(dto: CreateStageDto, tenantId: string, userPayload?: any) {
    const [nob] = await this.db
      .select()
      .from(schema.nobMaster)
      .where(eq(schema.nobMaster.nob_id, dto.nob_id))
      .limit(1);
    if (!nob) {
      throw new NotFoundException(`NOB with ID '${dto.nob_id}' not found.`);
    }

    const [lob] = await this.db
      .select()
      .from(schema.lobMaster)
      .where(eq(schema.lobMaster.lob_id, dto.lob_id))
      .limit(1);
    if (!lob) {
      throw new NotFoundException(`LOB with ID '${dto.lob_id}' not found.`);
    }

    this.assertAutoMoveDayWhenAutoByDay(dto.transition_trigger, dto.auto_move_on_day);

    if (dto.next_stage_id) await this.assertStageExists(dto.next_stage_id);
    if (dto.alt_next_stage_id) await this.assertStageExists(dto.alt_next_stage_id);

    const duplicateConditions = [
      eq(schema.stageMaster.tenant_id, tenantId),
      eq(schema.stageMaster.lob_id, dto.lob_id),
      eq(schema.stageMaster.stage_code, dto.stage_code.toUpperCase()),
      isNull(schema.stageMaster.deleted_at),
    ];
    if (dto.company_id) {
      duplicateConditions.push(eq(schema.stageMaster.company_id, dto.company_id));
    } else {
      duplicateConditions.push(isNull(schema.stageMaster.company_id));
    }

    const existing = await this.db
      .select()
      .from(schema.stageMaster)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Stage code '${dto.stage_code}' already exists for this LOB.`);
    }

    const stageId = randomUUID();
    const newStage = {
      stage_id: stageId,
      tenant_id: tenantId,
      company_id: dto.company_id || null,
      nob_id: dto.nob_id,
      lob_id: dto.lob_id,
      stage_code: dto.stage_code.toUpperCase(),
      stage_name: dto.stage_name,
      stage_category: dto.stage_category,
      stage_sequence: dto.stage_sequence,
      typical_duration_days: dto.typical_duration_days ?? null,
      min_days_before_move: dto.min_days_before_move ?? 0,
      transition_trigger: dto.transition_trigger,
      auto_move_on_day: dto.auto_move_on_day ?? null,
      next_stage_id: dto.next_stage_id || null,
      alt_next_stage_id: dto.alt_next_stage_id || null,
      alt_trigger_condition: dto.alt_trigger_condition || null,
      required_kpi_to_pass: dto.required_kpi_to_pass ? JSON.stringify(dto.required_kpi_to_pass) : null,
      data_entry_form: dto.data_entry_form || 'STANDARD',
      scheduler_auto_create: dto.scheduler_auto_create ?? true,
      show_on_animal_card: dto.show_on_animal_card ?? true,
      icon_code: dto.icon_code || null,
      stage_description: dto.stage_description || null,
      sort_order: dto.sort_order ?? null,
      is_system: false,
      is_active: true,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.stageMaster).values(newStage);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'stage_master',
      entityId: stageId,
      newValues: newStage,
    });

    return this.findOne(stageId);
  }

  async findOne(id: string) {
    const [stage] = await this.db
      .select()
      .from(schema.stageMaster)
      .where(and(eq(schema.stageMaster.stage_id, id), isNull(schema.stageMaster.deleted_at)))
      .limit(1);

    if (!stage) {
      throw new NotFoundException(`Stage with ID '${id}' not found.`);
    }

    return stage;
  }

  async findAll(query: QueryStageDto, tenantId: string) {
    // No isNull(deleted_at) filter — list view shows both Active/Inactive states (toggle switch) so a blocked row can be found again and restored.
    const conditions: any[] = [
      eq(schema.stageMaster.tenant_id, tenantId),
    ];

    if (query.companyId) {
      conditions.push(
        or(eq(schema.stageMaster.company_id, query.companyId), isNull(schema.stageMaster.company_id))
      );
    }
    if (query.nobId) conditions.push(eq(schema.stageMaster.nob_id, query.nobId));
    if (query.lobId) conditions.push(eq(schema.stageMaster.lob_id, query.lobId));
    if (query.stageCategory) conditions.push(eq(schema.stageMaster.stage_category, query.stageCategory));
    if (query.search) {
      conditions.push(
        or(
          like(schema.stageMaster.stage_code, `%${query.search}%`),
          like(schema.stageMaster.stage_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.stageMaster)
      .where(and(...conditions))
      .orderBy(schema.stageMaster.stage_sequence)
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateStageDto, tenantId: string, userPayload?: any) {
    const stage = await this.findOne(id);

    const effectiveTrigger = dto.transition_trigger ?? stage.transition_trigger;
    const effectiveAutoMoveDay = dto.auto_move_on_day !== undefined ? dto.auto_move_on_day : stage.auto_move_on_day;
    this.assertAutoMoveDayWhenAutoByDay(effectiveTrigger, effectiveAutoMoveDay as any);

    if (dto.next_stage_id) await this.assertStageExists(dto.next_stage_id);
    if (dto.alt_next_stage_id) await this.assertStageExists(dto.alt_next_stage_id);

    const updates: any = {
      updated_by: userPayload?.userId || null,
    };

    if (dto.stage_name !== undefined) updates.stage_name = dto.stage_name;
    if (dto.stage_category !== undefined) updates.stage_category = dto.stage_category;
    if (dto.stage_sequence !== undefined) updates.stage_sequence = dto.stage_sequence;
    if (dto.typical_duration_days !== undefined) updates.typical_duration_days = dto.typical_duration_days;
    if (dto.min_days_before_move !== undefined) updates.min_days_before_move = dto.min_days_before_move;
    if (dto.transition_trigger !== undefined) updates.transition_trigger = dto.transition_trigger;
    if (dto.auto_move_on_day !== undefined) updates.auto_move_on_day = dto.auto_move_on_day;
    if (dto.next_stage_id !== undefined) updates.next_stage_id = dto.next_stage_id;
    if (dto.alt_next_stage_id !== undefined) updates.alt_next_stage_id = dto.alt_next_stage_id;
    if (dto.alt_trigger_condition !== undefined) updates.alt_trigger_condition = dto.alt_trigger_condition;
    if (dto.required_kpi_to_pass !== undefined) updates.required_kpi_to_pass = JSON.stringify(dto.required_kpi_to_pass);
    if (dto.data_entry_form !== undefined) updates.data_entry_form = dto.data_entry_form;
    if (dto.scheduler_auto_create !== undefined) updates.scheduler_auto_create = dto.scheduler_auto_create;
    if (dto.show_on_animal_card !== undefined) updates.show_on_animal_card = dto.show_on_animal_card;
    if (dto.icon_code !== undefined) updates.icon_code = dto.icon_code;
    if (dto.stage_description !== undefined) updates.stage_description = dto.stage_description;
    if (dto.sort_order !== undefined) updates.sort_order = dto.sort_order;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    await this.db
      .update(schema.stageMaster)
      .set(updates)
      .where(eq(schema.stageMaster.stage_id, id));

    await this.auditService.log({
      tenantId,
      companyId: stage.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'stage_master',
      entityId: id,
      oldValues: stage,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const stage = await this.findOne(id);

    if (stage.is_system) {
      throw new BadRequestException(`Stage '${stage.stage_code}' is a system-seeded stage and cannot be deleted.`);
    }

    await this.db
      .update(schema.stageMaster)
      .set({
        is_active: false,
        deleted_at: new Date().toISOString().slice(0, 19).replace('T', ' ') as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.stageMaster.stage_id, id));

    await this.auditService.log({
      tenantId,
      companyId: stage.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'stage_master',
      entityId: id,
      oldValues: stage,
    });

    return { success: true, message: `Stage '${stage.stage_name}' has been deactivated.` };
  }
}
