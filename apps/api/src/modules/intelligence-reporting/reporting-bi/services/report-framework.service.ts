import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateReportCategoryDto, RegisterReportDefinitionDto } from '../dto/report-framework.dto';

@Injectable()
export class ReportFrameworkService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createCategory(dto: CreateReportCategoryDto) {
    const categoryId = randomUUID();
    const newRecord = {
      category_id: categoryId,
      category_code: dto.category_code,
      category_name: dto.category_name,
      description: dto.description || null,
    };

    await this.db.insert(schema.reportCategory).values(newRecord);
    return newRecord;
  }

  async registerReport(dto: RegisterReportDefinitionDto, tenantId: string) {
    const reportId = randomUUID();
    const newReport = {
      report_id: reportId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      category_id: dto.category_id,
      report_code: dto.report_code,
      report_name: dto.report_name,
      data_source_service: dto.data_source_service,
      required_permission: dto.required_permission || null,
    };

    await this.db.insert(schema.reportDefinition).values(newReport);
    return newReport;
  }

  async logReportExecution(reportId: string, companyId: string, tenantId: string, userId: string | null, params: any, durationMs: number) {
    const executionId = randomUUID();
    const executionRecord = {
      execution_id: executionId,
      report_id: reportId,
      tenant_id: tenantId,
      company_id: companyId,
      executed_by: userId || null,
      parameters_json: params || {},
      execution_duration_ms: durationMs,
      status: 'SUCCESS',
    };

    await this.db.insert(schema.reportExecution).values(executionRecord);
    return executionRecord;
  }

  async getReportDefinitions(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.reportDefinition)
      .where(
        and(
          eq(schema.reportDefinition.tenant_id, tenantId),
          eq(schema.reportDefinition.company_id, companyId)
        )
      );
  }
}
