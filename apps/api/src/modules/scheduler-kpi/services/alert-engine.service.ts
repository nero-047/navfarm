import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateAlertRuleDto } from '../dto/alert.dto';

@Injectable()
export class AlertEngineService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createAlertRule(dto: CreateAlertRuleDto, tenantId: string) {
    const ruleId = randomUUID();
    const newRule = {
      rule_id: ruleId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      rule_name: dto.rule_name,
      event_type: dto.event_type,
      metric_name: dto.metric_name,
      operator: dto.operator,
      threshold_value: dto.threshold_value.toFixed(4),
      severity: dto.severity,
      is_enabled: dto.is_enabled !== undefined ? dto.is_enabled : true,
    };

    await this.db.insert(schema.alertRule).values(newRule);
    return newRule;
  }

  async evaluateAndTriggerAlert(companyId: string, ruleId: string, measuredValue: number, tenantId: string) {
    const [rule] = await this.db
      .select()
      .from(schema.alertRule)
      .where(
        and(
          eq(schema.alertRule.rule_id, ruleId),
          eq(schema.alertRule.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!rule || !rule.is_enabled) {
      return null;
    }

    const threshold = parseFloat(rule.threshold_value);
    let triggered = false;

    switch (rule.operator) {
      case 'GT':
        triggered = measuredValue > threshold;
        break;
      case 'LT':
        triggered = measuredValue < threshold;
        break;
      case 'EQ':
        triggered = measuredValue === threshold;
        break;
      case 'GTE':
        triggered = measuredValue >= threshold;
        break;
      case 'LTE':
        triggered = measuredValue <= threshold;
        break;
    }

    if (!triggered) {
      return null;
    }

    const alertId = randomUUID();
    const alertInstance = {
      alert_id: alertId,
      rule_id: ruleId,
      tenant_id: tenantId,
      company_id: companyId,
      severity: rule.severity,
      message: `Alert '${rule.rule_name}' triggered: ${rule.metric_name} value ${measuredValue} breached threshold ${threshold}.`,
      status: 'ACTIVE',
    };

    await this.db.insert(schema.alertEvent).values(alertInstance);
    return alertInstance;
  }

  async getActiveAlerts(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.alertEvent)
      .where(
        and(
          eq(schema.alertEvent.tenant_id, tenantId),
          eq(schema.alertEvent.company_id, companyId),
          eq(schema.alertEvent.status, 'ACTIVE')
        )
      );
  }

  async acknowledgeAlert(alertId: string, tenantId: string, userId?: string) {
    const [alert] = await this.db
      .select()
      .from(schema.alertEvent)
      .where(
        and(
          eq(schema.alertEvent.alert_id, alertId),
          eq(schema.alertEvent.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!alert) {
      throw new NotFoundException(`Alert '${alertId}' not found.`);
    }

    await this.db
      .update(schema.alertEvent)
      .set({
        status: 'ACKNOWLEDGED',
        acknowledged_by: userId || null,
      })
      .where(eq(schema.alertEvent.alert_id, alertId));

    return {
      ...alert,
      status: 'ACKNOWLEDGED',
      acknowledged_by: userId || null,
    };
  }
}
