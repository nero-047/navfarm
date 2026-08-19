import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { EncryptionService } from '../encryption/encryption.service';

const SECRET_FIELDS = ['smtp_password', 'sms_api_key', 'push_fcm_key', 'webhook_secret'] as const;

@Injectable()
export class NotificationService {
  constructor(
    private readonly cls: ClsService,
    private readonly encryptionService: EncryptionService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  /**
   * Never returns the *_enc columns — these are true secrets (SMTP password, API keys,
   * webhook secret), not something like a bank account number where a last-4 partial
   * reveal is a normal UX convention. A boolean "is this configured" flag is the safer
   * masked representation here.
   */
  private maskConfig(config: typeof schema.notificationConfig.$inferSelect) {
    const { smtp_password_enc, sms_api_key_enc, push_fcm_key_enc, webhook_secret_enc, ...rest } = config;
    return {
      ...rest,
      smtp_password_configured: !!smtp_password_enc,
      sms_api_key_configured: !!sms_api_key_enc,
      push_fcm_key_configured: !!push_fcm_key_enc,
      webhook_secret_configured: !!webhook_secret_enc,
    };
  }

  private encryptSecretFields(data: Record<string, any>) {
    const encrypted: Record<string, any> = {};
    for (const field of SECRET_FIELDS) {
      if (data[field] !== undefined) {
        encrypted[`${field}_enc`] = data[field] ? this.encryptionService.encrypt(data[field]) : null;
      }
    }
    return encrypted;
  }

  async create(data: any) {
    const notifId = randomUUID();
    await this.db.insert(schema.notificationConfig).values({
      notif_id: notifId,
      company_id: data.company_id,
      channel: data.channel,
      is_enabled: data.is_enabled !== undefined ? data.is_enabled : true,
      smtp_host: data.smtp_host || null,
      smtp_port: data.smtp_port || null,
      smtp_user: data.smtp_user || null,
      from_email: data.from_email || null,
      from_name: data.from_name || null,
      sms_provider: data.sms_provider || null,
      sms_sender_id: data.sms_sender_id || null,
      webhook_url: data.webhook_url || null,
      ...this.encryptSecretFields(data),
    });

    return this.findOne(notifId);
  }

  async findByCompany(companyId: string) {
    const rows = await this.db
      .select()
      .from(schema.notificationConfig)
      .where(eq(schema.notificationConfig.company_id, companyId));

    return rows.map((row) => this.maskConfig(row));
  }

  /** Internal, unmasked fetch — only for callers that need the real *_enc values (e.g. sendTest). */
  private async findRaw(id: string) {
    const [config] = await this.db
      .select()
      .from(schema.notificationConfig)
      .where(eq(schema.notificationConfig.notif_id, id))
      .limit(1);

    if (!config) {
      throw new NotFoundException(`Notification config with ID '${id}' not found.`);
    }

    return config;
  }

  async findOne(id: string) {
    const config = await this.findRaw(id);
    return this.maskConfig(config);
  }

  async update(id: string, data: any) {
    await this.findRaw(id);

    const updates: Record<string, any> = { ...data };
    for (const field of SECRET_FIELDS) delete updates[field];

    await this.db
      .update(schema.notificationConfig)
      .set({ ...updates, ...this.encryptSecretFields(data) })
      .where(eq(schema.notificationConfig.notif_id, id));

    return this.findOne(id);
  }

  async remove(id: string) {
    const config = await this.findOne(id);

    await this.db
      .delete(schema.notificationConfig)
      .where(eq(schema.notificationConfig.notif_id, id));

    return config;
  }

  async getLogs(companyId: string) {
    return this.db
      .select()
      .from(schema.notificationLog)
      .where(eq(schema.notificationLog.company_id, companyId))
      .orderBy(schema.notificationLog.sent_at);
  }

  async sendTest(configId: string, recipient: string, message?: string) {
    const config = await this.findRaw(configId);

    const testMessage = message || `This is a test notification sent via ${config.channel} channel.`;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (config.channel === 'EMAIL') {
      try {
        const host = config.smtp_host || process.env.SMTP_HOST || 'smtp.mailtrap.io';
        const port = Number(config.smtp_port || process.env.SMTP_PORT || 2525);
        const user = config.smtp_user || process.env.SMTP_USER || '';
        const password = config.smtp_password_enc
          ? this.encryptionService.decrypt(config.smtp_password_enc)
          : process.env.SMTP_PASSWORD || '';
        const fromEmail = config.from_email || process.env.SMTP_FROM_EMAIL || 'no-reply@navfarm.com';
        const fromName = config.from_name || process.env.SMTP_FROM_NAME || 'NAVFarm Test';

        const transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: user && password ? { user, pass: password } : undefined,
        });

        await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: recipient,
          subject: 'NAVFarm — Test Connection Notification',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px;">
              <h3 style="color: #1F4E79; margin-top: 0;">NAVFarm Notification Engine</h3>
              <p>${testMessage}</p>
              <p style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; margin-top: 20px;">
                Test timestamp: ${now}
              </p>
            </div>
          `,
        });
      } catch (err) {
        console.error(`[SMTP Test Error] Failed to send test to ${recipient}:`, err);
        
        await this.db
          .update(schema.notificationConfig)
          .set({
            test_sent_at: now as any,
            test_status: 'FAILED',
          })
          .where(eq(schema.notificationConfig.notif_id, configId));

        // Insert notification log for FAILED email
        await this.db.insert(schema.notificationLog).values({
          log_id: randomUUID(),
          company_id: config.company_id,
          recipient,
          channel: config.channel,
          message: testMessage,
          status: 'FAILED',
          error_message: err.message || 'SMTP delivery failure',
        });

        throw new BadRequestException(`SMTP Test Delivery failed: ${err.message}`);
      }
    }

    await this.db
      .update(schema.notificationConfig)
      .set({
        test_sent_at: now as any,
        test_status: 'SUCCESS',
      })
      .where(eq(schema.notificationConfig.notif_id, configId));

    // Insert notification log for SUCCESS
    await this.db.insert(schema.notificationLog).values({
      log_id: randomUUID(),
      company_id: config.company_id,
      recipient,
      channel: config.channel,
      message: testMessage,
      status: 'SUCCESS',
    });

    return {
      success: true,
      channel: config.channel,
      recipient,
      message: testMessage,
      sentAt: now,
    };
  }
}
