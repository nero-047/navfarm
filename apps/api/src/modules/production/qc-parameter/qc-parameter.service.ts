import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateQcParameterDto, UpdateQcParameterDto, QueryQcParameterDto } from './dto/qc-parameter.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

@Injectable()
export class QcParameterService {
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

  async create(dto: CreateQcParameterDto, tenantId: string, userPayload?: any) {
    const existing = await this.db
      .select()
      .from(schema.qcParameterMaster)
      .where(
        and(
          eq(schema.qcParameterMaster.tenant_id, tenantId),
          eq(schema.qcParameterMaster.param_code, dto.param_code.toUpperCase())
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`QC parameter code '${dto.param_code}' already exists.`);
    }

    const paramId = randomUUID();

    await this.db.insert(schema.qcParameterMaster).values({
      param_id: paramId,
      tenant_id: tenantId,
      company_id: dto.company_id || null,
      lob_id: dto.lob_id,
      param_code: dto.param_code.toUpperCase(),
      param_name: dto.param_name,
      param_type: dto.param_type,
      uom: dto.uom || null,
      min_value: dto.min_value?.toString() || null,
      max_value: dto.max_value?.toString() || null,
      pass_criteria: dto.pass_criteria || null,
      fail_criteria: dto.fail_criteria || null,
      grade_scale: dto.grade_scale || null,
      is_mandatory: dto.is_mandatory ?? true,
      created_by: userPayload?.userId || null,
    });

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id || '',
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'qc_parameter_master',
      entityId: paramId,
      newValues: dto,
    });

    return this.findOne(paramId);
  }

  async findOne(id: string) {
    const [param] = await this.db
      .select()
      .from(schema.qcParameterMaster)
      .where(eq(schema.qcParameterMaster.param_id, id))
      .limit(1);

    if (!param) {
      throw new NotFoundException(`QC parameter with ID '${id}' not found.`);
    }

    return param;
  }

  async findAll(query: QueryQcParameterDto, tenantId: string) {
    const conditions: any[] = [eq(schema.qcParameterMaster.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(or(eq(schema.qcParameterMaster.company_id, query.companyId), isNull(schema.qcParameterMaster.company_id))!);
    }
    if (query.lobId) conditions.push(eq(schema.qcParameterMaster.lob_id, query.lobId));
    if (query.search) {
      conditions.push(
        or(
          like(schema.qcParameterMaster.param_code, `%${query.search}%`),
          like(schema.qcParameterMaster.param_name, `%${query.search}%`)
        )!
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.qcParameterMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateQcParameterDto, tenantId: string, userPayload?: any) {
    const param = await this.findOne(id);

    await this.db
      .update(schema.qcParameterMaster)
      .set({
        param_name: dto.param_name ?? param.param_name,
        uom: dto.uom ?? param.uom,
        min_value: dto.min_value !== undefined ? dto.min_value.toString() : param.min_value,
        max_value: dto.max_value !== undefined ? dto.max_value.toString() : param.max_value,
        pass_criteria: dto.pass_criteria ?? param.pass_criteria,
        fail_criteria: dto.fail_criteria ?? param.fail_criteria,
        grade_scale: dto.grade_scale ?? param.grade_scale,
        is_mandatory: dto.is_mandatory ?? param.is_mandatory,
        is_active: dto.is_active ?? param.is_active,
      })
      .where(eq(schema.qcParameterMaster.param_id, id));

    await this.auditService.log({
      tenantId,
      companyId: param.company_id || '',
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'qc_parameter_master',
      entityId: id,
      oldValues: param,
      newValues: dto,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const param = await this.findOne(id);

    await this.db
      .update(schema.qcParameterMaster)
      .set({ is_active: false })
      .where(eq(schema.qcParameterMaster.param_id, id));

    await this.auditService.log({
      tenantId,
      companyId: param.company_id || '',
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'qc_parameter_master',
      entityId: id,
      oldValues: param,
    });

    return { success: true, message: `QC parameter '${param.param_code}' has been deactivated.` };
  }
}
