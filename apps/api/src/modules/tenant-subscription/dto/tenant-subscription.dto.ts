import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantSubscriptionDto {
  @ApiProperty({ example: 'PROFESSIONAL', description: 'STARTER / GROWTH / PROFESSIONAL / ENTERPRISE' })
  @IsString()
  @IsNotEmpty()
  plan_code: string;

  @ApiProperty({ example: { qr_enabled: true, api_access: true }, required: false })
  @IsObject()
  @IsOptional()
  feature_flags?: Record<string, boolean>;

  @ApiProperty({ example: 100.0, required: false })
  @IsNumber()
  @IsOptional()
  storage_limit_gb?: number;

  @ApiProperty({ example: 'PRIORITY', required: false })
  @IsString()
  @IsOptional()
  support_tier?: string;

  @ApiProperty({ example: '2026-01-01', required: false })
  @IsString()
  @IsOptional()
  plan_start_date?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsString()
  @IsOptional()
  plan_end_date?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  renewal_auto?: boolean;

  @ApiProperty({ example: 'BANK_TRANSFER', required: false })
  @IsString()
  @IsOptional()
  payment_method?: string;
}
