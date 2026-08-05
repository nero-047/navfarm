import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNotificationConfigDto {
  @ApiProperty({ description: 'Company UUID', example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Notification channel (EMAIL / SMS / PUSH / WHATSAPP / WEBHOOK)', example: 'EMAIL' })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiProperty({ description: 'Enable this channel', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;

  @ApiProperty({ description: 'SMTP hostname (for EMAIL)', required: false, example: 'smtp.sendgrid.net' })
  @IsString()
  @IsOptional()
  smtp_host?: string;

  @ApiProperty({ description: 'SMTP port', required: false, example: 587 })
  @IsInt()
  @IsOptional()
  smtp_port?: number;

  @ApiProperty({ description: 'SMTP username / API key', required: false })
  @IsString()
  @IsOptional()
  smtp_user?: string;

  @ApiProperty({ description: 'Encrypted SMTP password', required: false })
  @IsString()
  @IsOptional()
  smtp_password_enc?: string;

  @ApiProperty({ description: 'Sender email address', required: false, example: 'noreply@farm.com' })
  @IsString()
  @IsOptional()
  from_email?: string;

  @ApiProperty({ description: 'Sender display name', required: false, example: 'NAVFarm' })
  @IsString()
  @IsOptional()
  from_name?: string;

  @ApiProperty({ description: 'SMS provider (TWILIO / MSG91 / KALEYRA / SNS)', required: false })
  @IsString()
  @IsOptional()
  sms_provider?: string;

  @ApiProperty({ description: 'Encrypted SMS API key', required: false })
  @IsString()
  @IsOptional()
  sms_api_key_enc?: string;

  @ApiProperty({ description: 'SMS sender ID', required: false, example: 'NAVFRM' })
  @IsString()
  @IsOptional()
  sms_sender_id?: string;

  @ApiProperty({ description: 'Encrypted FCM server key (for Push)', required: false })
  @IsString()
  @IsOptional()
  push_fcm_key_enc?: string;

  @ApiProperty({ description: 'Webhook URL', required: false, example: 'https://hooks.slack.com/services/...' })
  @IsString()
  @IsOptional()
  webhook_url?: string;

  @ApiProperty({ description: 'Encrypted webhook signing secret', required: false })
  @IsString()
  @IsOptional()
  webhook_secret_enc?: string;
}

export class UpdateNotificationConfigDto {
  @ApiProperty({ description: 'Enable this channel', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;

  @ApiProperty({ description: 'SMTP hostname', required: false })
  @IsString()
  @IsOptional()
  smtp_host?: string;

  @ApiProperty({ description: 'SMTP port', required: false })
  @IsInt()
  @IsOptional()
  smtp_port?: number;

  @ApiProperty({ description: 'SMTP username', required: false })
  @IsString()
  @IsOptional()
  smtp_user?: string;

  @ApiProperty({ description: 'Encrypted SMTP password', required: false })
  @IsString()
  @IsOptional()
  smtp_password_enc?: string;

  @ApiProperty({ description: 'Sender email address', required: false })
  @IsString()
  @IsOptional()
  from_email?: string;

  @ApiProperty({ description: 'Sender display name', required: false })
  @IsString()
  @IsOptional()
  from_name?: string;

  @ApiProperty({ description: 'SMS provider', required: false })
  @IsString()
  @IsOptional()
  sms_provider?: string;

  @ApiProperty({ description: 'Encrypted SMS API key', required: false })
  @IsString()
  @IsOptional()
  sms_api_key_enc?: string;

  @ApiProperty({ description: 'SMS sender ID', required: false })
  @IsString()
  @IsOptional()
  sms_sender_id?: string;

  @ApiProperty({ description: 'Encrypted FCM server key', required: false })
  @IsString()
  @IsOptional()
  push_fcm_key_enc?: string;

  @ApiProperty({ description: 'Webhook URL', required: false })
  @IsString()
  @IsOptional()
  webhook_url?: string;

  @ApiProperty({ description: 'Encrypted webhook signing secret', required: false })
  @IsString()
  @IsOptional()
  webhook_secret_enc?: string;

  @ApiProperty({ description: 'Is Active flag', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class SendTestNotificationDto {
  @ApiProperty({ description: 'Notification config UUID', example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  @IsNotEmpty()
  configId: string;

  @ApiProperty({ description: 'Test recipient email/phone', example: 'test@farm.com' })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({ description: 'Optional test message body', required: false, example: 'This is a test notification from NAVFarm.' })
  @IsString()
  @IsOptional()
  message?: string;
}

export class QueryNotificationConfigDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ description: 'Filter by channel code', required: false, example: 'EMAIL' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({ description: 'Results per page', default: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: 'Pagination offset', default: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
