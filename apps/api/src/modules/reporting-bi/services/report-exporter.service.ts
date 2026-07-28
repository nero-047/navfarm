import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class ReportExporterService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async exportReport(
    companyId: string,
    reportId: string,
    exportFormat: string,
    tenantId: string,
    userId?: string
  ) {
    const executionId = randomUUID();
    await this.db.insert(schema.reportExecution).values({
      execution_id: executionId,
      report_id: reportId,
      tenant_id: tenantId,
      company_id: companyId,
      executed_by: userId || null,
      parameters_json: { format: exportFormat },
      execution_duration_ms: 120,
      status: 'SUCCESS',
    });

    const exportId = randomUUID();
    const fileName = `NAVFarm_Report_${reportId}_${Date.now()}.${exportFormat.toLowerCase()}`;
    const filePath = `/exports/${tenantId}/${companyId}/${fileName}`;

    const exportRecord = {
      export_id: exportId,
      execution_id: executionId,
      export_format: exportFormat,
      file_path: filePath,
      file_name: fileName,
      file_size_bytes: 1024 * 45, // 45 KB simulated export file
    };

    await this.db.insert(schema.reportExport).values(exportRecord);

    return {
      ...exportRecord,
      download_url: `https://api.navfarm.com/reporting/download/${exportId}`,
    };
  }
}
