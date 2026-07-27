import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateMedicineDto, UpdateMedicineDto, QueryMedicineDto } from './dto/medicine.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class MedicineService {
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

  async create(dto: CreateMedicineDto, tenantId: string, userPayload?: any) {
    // 1. Verify company exists
    const [company] = await this.db
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);

    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Verify item exists and is active
    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.item_id, dto.item_id), isNull(schema.itemMaster.deleted_at)))
      .limit(1);

    if (!item) {
      throw new NotFoundException(`Item with ID '${dto.item_id}' not found.`);
    }

    // 3. Verify no duplicate medicine entry for the same item within the company
    const existing = await this.db
      .select()
      .from(schema.medicineMaster)
      .where(
        and(
          eq(schema.medicineMaster.tenant_id, tenantId),
          eq(schema.medicineMaster.company_id, dto.company_id),
          eq(schema.medicineMaster.item_id, dto.item_id),
          isNull(schema.medicineMaster.deleted_at)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Medicine profile for Item with ID '${dto.item_id}' already exists.`);
    }

    const medicineId = randomUUID();
    const newMedicine = {
      medicine_id: medicineId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      item_id: dto.item_id,
      composition: dto.composition || null,
      dosage_guideline: dto.dosage_guideline || null,
      withdrawal_period_days: dto.withdrawal_period_days ?? 0,
      route_of_administration: dto.route_of_administration || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.medicineMaster).values(newMedicine);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'medicine_master',
      entityId: medicineId,
      newValues: newMedicine,
    });

    return this.findOne(medicineId);
  }

  async findOne(id: string) {
    const [medicine] = await this.db
      .select()
      .from(schema.medicineMaster)
      .where(and(eq(schema.medicineMaster.medicine_id, id), isNull(schema.medicineMaster.deleted_at)))
      .limit(1);

    if (!medicine) {
      throw new NotFoundException(`Medicine with ID '${id}' not found.`);
    }

    return medicine;
  }

  async findAll(query: QueryMedicineDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.medicineMaster.tenant_id, tenantId),
      isNull(schema.medicineMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.medicineMaster.company_id, query.companyId));
    }
    if (query.itemId) {
      conditions.push(eq(schema.medicineMaster.item_id, query.itemId));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.medicineMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.medicineMaster.composition, `%${query.search}%`),
          like(schema.medicineMaster.route_of_administration, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.medicineMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateMedicineDto, tenantId: string, userPayload?: any) {
    const medicine = await this.findOne(id);

    if (dto.item_id && dto.item_id !== medicine.item_id) {
      // Verify item exists
      const [item] = await this.db
        .select()
        .from(schema.itemMaster)
        .where(and(eq(schema.itemMaster.item_id, dto.item_id), isNull(schema.itemMaster.deleted_at)))
        .limit(1);

      if (!item) {
        throw new NotFoundException(`Item with ID '${dto.item_id}' not found.`);
      }

      // Check duplicate
      const existing = await this.db
        .select()
        .from(schema.medicineMaster)
        .where(
          and(
            eq(schema.medicineMaster.tenant_id, tenantId),
            eq(schema.medicineMaster.company_id, medicine.company_id),
            eq(schema.medicineMaster.item_id, dto.item_id),
            ne(schema.medicineMaster.medicine_id, id),
            isNull(schema.medicineMaster.deleted_at)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Medicine profile for Item with ID '${dto.item_id}' already exists.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.item_id !== undefined) updates.item_id = dto.item_id;
    if (dto.composition !== undefined) updates.composition = dto.composition;
    if (dto.dosage_guideline !== undefined) updates.dosage_guideline = dto.dosage_guideline;
    if (dto.withdrawal_period_days !== undefined) updates.withdrawal_period_days = dto.withdrawal_period_days;
    if (dto.route_of_administration !== undefined) updates.route_of_administration = dto.route_of_administration;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.medicineMaster)
      .set(updates)
      .where(eq(schema.medicineMaster.medicine_id, id));

    await this.auditService.log({
      tenantId,
      companyId: medicine.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'medicine_master',
      entityId: id,
      oldValues: medicine,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const medicine = await this.findOne(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.medicineMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.medicineMaster.medicine_id, id));

    await this.auditService.log({
      tenantId,
      companyId: medicine.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'medicine_master',
      entityId: id,
      oldValues: medicine,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Medicine profile soft-deleted successfully.` };
  }

  async restore(id: string, tenantId: string, userPayload?: any) {
    const [medicine] = await this.db
      .select()
      .from(schema.medicineMaster)
      .where(eq(schema.medicineMaster.medicine_id, id))
      .limit(1);

    if (!medicine) {
      throw new NotFoundException(`Medicine profile with ID '${id}' not found.`);
    }

    if (!medicine.deleted_at) {
      return medicine;
    }

    await this.db
      .update(schema.medicineMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.medicineMaster.medicine_id, id));

    await this.auditService.log({
      tenantId,
      companyId: medicine.company_id,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'medicine_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOne(id);
  }
}
