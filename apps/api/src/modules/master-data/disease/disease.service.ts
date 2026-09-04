import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateDiseaseDto, UpdateDiseaseDto, QueryDiseaseDto } from './dto/disease.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class DiseaseService {
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

  async create(dto: CreateDiseaseDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Check duplicate disease code within the company scope
    const existing = await this.db
      .select()
      .from(schema.diseaseMaster)
      .where(
        and(
          eq(schema.diseaseMaster.tenant_id, tenantId),
          eq(schema.diseaseMaster.company_id, dto.company_id),
          eq(schema.diseaseMaster.disease_code, dto.disease_code.toUpperCase()),
          isNull(schema.diseaseMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Disease definition with code '${dto.disease_code}' already exists in this company.`);
    }

    const diseaseId = randomUUID();
    const newDisease = {
      disease_id: diseaseId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      disease_code: dto.disease_code.toUpperCase(),
      disease_name: dto.disease_name,
      scientific_name: dto.scientific_name || null,
      symptoms: dto.symptoms || null,
      treatment_guideline: dto.treatment_guideline || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.diseaseMaster).values(newDisease);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'disease_master',
      entityId: diseaseId,
      newValues: newDisease,
    });

    return this.findOne(diseaseId);
  }

  async findOne(id: string) {
    const [disease] = await this.db
      .select()
      .from(schema.diseaseMaster)
      .where(and(eq(schema.diseaseMaster.disease_id, id), isNull(schema.diseaseMaster.deleted_at)))
      .limit(1);

    if (!disease) {
      throw new NotFoundException(`Disease with ID '${id}' not found.`);
    }

    return disease;
  }

  async findAll(query: QueryDiseaseDto, tenantId: string) {
    // No isNull(deleted_at) filter — list view shows both Active/Inactive states (toggle switch) so a blocked row can be found again and restored.
    const conditions: any[] = [
      eq(schema.diseaseMaster.tenant_id, tenantId),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.diseaseMaster.company_id, query.companyId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.diseaseMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.diseaseMaster.disease_code, `%${query.search}%`),
          like(schema.diseaseMaster.disease_name, `%${query.search}%`),
          like(schema.diseaseMaster.symptoms, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.diseaseMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateDiseaseDto, tenantId: string, userPayload?: any) {
    const disease = await this.findOne(id);

    if (dto.disease_code && dto.disease_code.toUpperCase() !== disease.disease_code) {
      const existing = await this.db
        .select()
        .from(schema.diseaseMaster)
        .where(
          and(
            eq(schema.diseaseMaster.tenant_id, tenantId),
            eq(schema.diseaseMaster.company_id, disease.company_id),
            eq(schema.diseaseMaster.disease_code, dto.disease_code.toUpperCase()),
            ne(schema.diseaseMaster.disease_id, id),
            isNull(schema.diseaseMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Disease definition with code '${dto.disease_code}' already exists in this company.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.disease_code !== undefined) updates.disease_code = dto.disease_code.toUpperCase();
    if (dto.disease_name !== undefined) updates.disease_name = dto.disease_name;
    if (dto.scientific_name !== undefined) updates.scientific_name = dto.scientific_name;
    if (dto.symptoms !== undefined) updates.symptoms = dto.symptoms;
    if (dto.treatment_guideline !== undefined) updates.treatment_guideline = dto.treatment_guideline;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.diseaseMaster)
      .set(updates)
      .where(eq(schema.diseaseMaster.disease_id, id));

    await this.auditService.log({
      tenantId,
      companyId: disease.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'disease_master',
      entityId: id,
      oldValues: disease,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const disease = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.diseaseMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.diseaseMaster.disease_id, id));

    await this.auditService.log({
      tenantId,
      companyId: disease.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'disease_master',
      entityId: id,
      oldValues: disease,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Disease '${disease.disease_name}' has been soft-deleted.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [disease] = await this.db
      .select()
      .from(schema.diseaseMaster)
      .where(eq(schema.diseaseMaster.disease_id, id))
      .limit(1);

    if (!disease) {
      throw new NotFoundException(`Disease with ID '${id}' not found.`);
    }

    if (!disease.deleted_at) {
      return disease;
    }

    await this.db
      .update(schema.diseaseMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.diseaseMaster.disease_id, id));

    await this.auditService.log({
      tenantId,
      companyId: disease.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'disease_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
