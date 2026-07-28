import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateSchedulerJobDto } from '../dto/scheduler.dto';

@Injectable()
export class SchedulerEngineService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createJob(dto: CreateSchedulerJobDto, tenantId: string) {
    const jobId = randomUUID();
    const newJob = {
      job_id: jobId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      job_name: dto.job_name,
      job_group: dto.job_group || 'OPERATIONAL',
      cron_expression: dto.cron_expression,
      target_service: dto.target_service,
      target_method: dto.target_method,
      is_enabled: dto.is_enabled !== undefined ? dto.is_enabled : true,
    };

    await this.db.insert(schema.schedulerJob).values(newJob);
    return newJob;
  }

  async executeJob(jobId: string, tenantId: string) {
    const [job] = await this.db
      .select()
      .from(schema.schedulerJob)
      .where(
        and(
          eq(schema.schedulerJob.job_id, jobId),
          eq(schema.schedulerJob.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!job) {
      throw new NotFoundException(`Scheduler Job '${jobId}' not found.`);
    }

    const startTime = Date.now();
    let status = 'SUCCESS';
    let errorMessage: string | null = null;

    try {
      // Execute target method simulation
      await this.db
        .update(schema.schedulerJob)
        .set({
          last_run_at: new Date().toISOString(),
        })
        .where(eq(schema.schedulerJob.job_id, jobId));
    } catch (err: any) {
      status = 'FAILED';
      errorMessage = err.message || 'Execution error';
    }

    const duration = Date.now() - startTime;
    const historyId = randomUUID();
    const historyRecord = {
      history_id: historyId,
      job_id: jobId,
      status,
      execution_duration_ms: duration,
      error_message: errorMessage,
    };

    await this.db.insert(schema.schedulerHistory).values(historyRecord);

    return {
      job_id: jobId,
      status,
      duration_ms: duration,
      executed_at: new Date().toISOString(),
    };
  }

  async getJobs(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.schedulerJob)
      .where(
        and(
          eq(schema.schedulerJob.tenant_id, tenantId),
          eq(schema.schedulerJob.company_id, companyId)
        )
      );
  }

  async getJobHistory(jobId: string) {
    return this.db
      .select()
      .from(schema.schedulerHistory)
      .where(eq(schema.schedulerHistory.job_id, jobId));
  }
}
