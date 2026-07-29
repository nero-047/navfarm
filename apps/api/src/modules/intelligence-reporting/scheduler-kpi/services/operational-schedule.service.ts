import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateVaccinationScheduleDto, CreateFeedScheduleDto } from '../dto/operational-schedule.dto';

@Injectable()
export class OperationalScheduleService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createVaccinationSchedule(dto: CreateVaccinationScheduleDto, tenantId: string) {
    const scheduleId = randomUUID();
    const newRecord = {
      schedule_id: scheduleId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      disease_id: dto.disease_id || null,
      medicine_id: dto.medicine_id || null,
      due_date: dto.due_date,
      assigned_to: dto.assigned_to || null,
      status: 'SCHEDULED',
    };

    await this.db.insert(schema.vaccinationSchedule).values(newRecord);
    return newRecord;
  }

  async completeVaccination(scheduleId: string, tenantId: string) {
    const [schedule] = await this.db
      .select()
      .from(schema.vaccinationSchedule)
      .where(
        and(
          eq(schema.vaccinationSchedule.schedule_id, scheduleId),
          eq(schema.vaccinationSchedule.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!schedule) {
      throw new NotFoundException(`Vaccination schedule '${scheduleId}' not found.`);
    }

    await this.db
      .update(schema.vaccinationSchedule)
      .set({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .where(eq(schema.vaccinationSchedule.schedule_id, scheduleId));

    return {
      ...schedule,
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    };
  }

  async getVaccinationSchedules(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.vaccinationSchedule)
      .where(
        and(
          eq(schema.vaccinationSchedule.tenant_id, tenantId),
          eq(schema.vaccinationSchedule.company_id, companyId)
        )
      );
  }

  async createFeedSchedule(dto: CreateFeedScheduleDto, tenantId: string) {
    const feedScheduleId = randomUUID();
    const newRecord = {
      feed_schedule_id: feedScheduleId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      feed_formula_id: dto.feed_formula_id || null,
      scheduled_qty: dto.scheduled_qty.toFixed(4),
      scheduled_time: dto.scheduled_time,
      status: 'PENDING',
    };

    await this.db.insert(schema.feedSchedule).values(newRecord);
    return newRecord;
  }

  async getFeedSchedules(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.feedSchedule)
      .where(
        and(
          eq(schema.feedSchedule.tenant_id, tenantId),
          eq(schema.feedSchedule.company_id, companyId)
        )
      );
  }
}
