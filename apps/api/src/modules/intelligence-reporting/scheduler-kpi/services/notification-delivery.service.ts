import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';

@Injectable()
export class NotificationDeliveryService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async dispatchNotification(
    companyId: string,
    userId: string | null,
    title: string,
    body: string,
    channel: string = 'IN_APP',
    tenantId: string
  ) {
    const notificationId = randomUUID();
    const newNotification = {
      notification_id: notificationId,
      tenant_id: tenantId,
      company_id: companyId,
      user_id: userId || null,
      channel,
      title,
      body,
      is_read: false,
    };

    await this.db.insert(schema.notificationHistory).values(newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.notificationHistory)
      .where(
        and(
          eq(schema.notificationHistory.tenant_id, tenantId),
          eq(schema.notificationHistory.user_id, userId)
        )
      );
  }

  async markAsRead(notificationId: string, tenantId: string) {
    await this.db
      .update(schema.notificationHistory)
      .set({ is_read: true })
      .where(
        and(
          eq(schema.notificationHistory.notification_id, notificationId),
          eq(schema.notificationHistory.tenant_id, tenantId)
        )
      );

    return { notification_id: notificationId, is_read: true };
  }
}
