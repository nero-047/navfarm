import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @ApiProperty({ 
    description: 'Unique string identifier for the plan', 
    example: 'PLAN_PRO' 
  })
  @IsString()
  @IsNotEmpty()
  plan_id: string;

  @ApiProperty({ 
    description: 'Display name of the pricing plan', 
    example: 'Pro Plan' 
  })
  @IsString()
  @IsNotEmpty()
  plan_name: string;

  @ApiProperty({ 
    description: 'Base pricing amount', 
    example: 199.00 
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ 
    description: 'Billing cycle frequency', 
    enum: ['MONTHLY', 'ANNUAL'],
    default: 'MONTHLY',
    example: 'MONTHLY' 
  })
  @IsString()
  @IsNotEmpty()
  billing_cycle: string;

  @ApiProperty({ 
    description: 'Maximum number of company profiles allowed under the tenant', 
    default: 1,
    example: 3 
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  max_companies: number;

  @ApiProperty({ 
    description: 'Maximum number of active users allowed under the tenant', 
    default: 5,
    example: 10 
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  max_users: number;

  @ApiProperty({ 
    description: 'Available file and document storage limit in GB', 
    default: 5.00,
    example: 10.00 
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  storage_limit_gb: number;

  @ApiProperty({ 
    description: 'Key-value feature toggle flags configuration object', 
    default: {},
    example: { qr_traceability: true } 
  })
  @IsObject()
  @IsOptional()
  feature_flags: Record<string, any>;

  @ApiProperty({ 
    description: 'Flag indicating whether this plan is open to new subscriptions', 
    default: true,
    example: true 
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdatePlanDto {
  @ApiProperty({ description: 'Display name of the pricing plan', required: false, example: 'Pro Plan' })
  @IsString()
  @IsOptional()
  plan_name?: string;

  @ApiProperty({ description: 'Base pricing amount', required: false, example: 199.00 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ description: 'Billing cycle frequency', required: false, example: 'MONTHLY' })
  @IsString()
  @IsOptional()
  billing_cycle?: string;

  @ApiProperty({ description: 'Maximum number of company profiles allowed under the tenant', required: false, example: 3 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  max_companies?: number;

  @ApiProperty({ description: 'Maximum number of active users allowed under the tenant', required: false, example: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  max_users?: number;

  @ApiProperty({ description: 'Available file and document storage limit in GB', required: false, example: 10.00 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  storage_limit_gb?: number;

  @ApiProperty({ description: 'Key-value feature toggle flags configuration object', required: false, example: { qr_traceability: true } })
  @IsObject()
  @IsOptional()
  feature_flags?: Record<string, any>;

  @ApiProperty({ description: 'Flag indicating whether this plan is open to new subscriptions', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
