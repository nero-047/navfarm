import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateEggGradingBatchDto } from './dto/egg-grading.dto';

@Injectable()
export class EggGradingService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createGradingBatch(dto: CreateEggGradingBatchDto, tenantId: string, companyId: string, userId: string) {
    const id = randomUUID();
    const record = {
      grading_id: id,
      tenant_id: tenantId,
      company_id: companyId,
      source_batch_id: dto.source_batch_id,
      grading_date: dto.grading_date,
      total_eggs_input: String(dto.total_eggs_input),
      grade_xl_qty: String(dto.grade_xl_qty ?? 0),
      grade_l_qty: String(dto.grade_l_qty ?? 0),
      grade_m_qty: String(dto.grade_m_qty ?? 0),
      grade_s_qty: String(dto.grade_s_qty ?? 0),
      grade_reject_qty: String(dto.grade_reject_qty ?? 0),
      graded_by: userId,
      notes: dto.notes || null,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.eggGradingBatch).values(record);
    return record;
  }

  async getGradingForBatch(batchId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.eggGradingBatch)
      .where(
        and(
          eq(schema.eggGradingBatch.source_batch_id, batchId),
          eq(schema.eggGradingBatch.tenant_id, tenantId)
        )
      );
  }
}
