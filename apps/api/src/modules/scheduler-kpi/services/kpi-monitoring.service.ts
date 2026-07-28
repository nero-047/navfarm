import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { DefineKpiDto } from '../dto/kpi.dto';

@Injectable()
export class KpiMonitoringService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async defineKpi(dto: DefineKpiDto, tenantId: string) {
    const kpiId = randomUUID();
    const newKpi = {
      kpi_id: kpiId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      kpi_code: dto.kpi_code,
      kpi_name: dto.kpi_name,
      category: dto.category,
      unit_of_measure: dto.unit_of_measure || 'PCT',
    };

    await this.db.insert(schema.kpiDefinition).values(newKpi);

    const thresholdId = randomUUID();
    await this.db.insert(schema.kpiThreshold).values({
      threshold_id: thresholdId,
      kpi_id: kpiId,
      green_max: dto.green_max ? dto.green_max.toFixed(4) : null,
      yellow_max: dto.yellow_max ? dto.yellow_max.toFixed(4) : null,
      red_min: dto.red_min ? dto.red_min.toFixed(4) : null,
    });

    return newKpi;
  }

  async evaluateKpi(kpiId: string, metricValue: number, tenantId: string) {
    const [kpi] = await this.db
      .select()
      .from(schema.kpiDefinition)
      .where(
        and(
          eq(schema.kpiDefinition.kpi_id, kpiId),
          eq(schema.kpiDefinition.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!kpi) {
      throw new NotFoundException(`KPI '${kpiId}' not found.`);
    }

    const [threshold] = await this.db
      .select()
      .from(schema.kpiThreshold)
      .where(eq(schema.kpiThreshold.kpi_id, kpiId))
      .limit(1);

    let zone = 'GREEN';
    if (threshold) {
      const yellowMax = threshold.yellow_max ? parseFloat(threshold.yellow_max) : null;
      const redMin = threshold.red_min ? parseFloat(threshold.red_min) : null;

      if (redMin !== null && metricValue >= redMin) {
        zone = 'RED';
      } else if (yellowMax !== null && metricValue > yellowMax) {
        zone = 'YELLOW';
      }
    }

    const resultId = randomUUID();
    const resultRecord = {
      result_id: resultId,
      kpi_id: kpiId,
      metric_value: metricValue.toFixed(4),
      zone,
    };

    await this.db.insert(schema.kpiResult).values(resultRecord);
    return resultRecord;
  }

  async getKpis(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.kpiDefinition)
      .where(
        and(
          eq(schema.kpiDefinition.tenant_id, tenantId),
          eq(schema.kpiDefinition.company_id, companyId)
        )
      );
  }
}
