import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateTenantSubscriptionDto } from './dto/tenant-subscription.dto';

@Injectable()
export class TenantSubscriptionService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async upsertSubscription(tenantId: string, dto: CreateTenantSubscriptionDto) {
    const [existing] = await this.db
      .select()
      .from(schema.tenantSubscription)
      .where(eq(schema.tenantSubscription.tenant_id, tenantId))
      .limit(1);

    const record = {
      tenant_id: tenantId,
      plan_code: dto.plan_code,
      feature_flags: dto.feature_flags || {},
      storage_limit_gb: dto.storage_limit_gb ? String(dto.storage_limit_gb) : '5.00',
      support_tier: dto.support_tier || 'STANDARD',
      plan_start_date: dto.plan_start_date || null,
      plan_end_date: dto.plan_end_date || null,
      renewal_auto: dto.renewal_auto ?? true,
      payment_method: dto.payment_method || null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await this.db.update(schema.tenantSubscription).set(record).where(eq(schema.tenantSubscription.tenant_id, tenantId));
      return { ...existing, ...record, action: 'updated' };
    } else {
      const sub_id = randomUUID();
      await this.db.insert(schema.tenantSubscription).values({ sub_id, created_at: new Date().toISOString(), ...record });
      return { sub_id, ...record, action: 'created' };
    }
  }

  async getSubscription(tenantId: string) {
    const [sub] = await this.db
      .select()
      .from(schema.tenantSubscription)
      .where(eq(schema.tenantSubscription.tenant_id, tenantId))
      .limit(1);
    if (!sub) throw new NotFoundException(`No subscription found for tenant '${tenantId}'.`);
    return sub;
  }
}
