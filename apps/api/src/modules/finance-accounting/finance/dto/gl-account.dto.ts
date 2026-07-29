import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUUID, 
  IsBoolean, 
  IsEnum 
} from 'class-validator';

export enum GlAccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export class CreateGlAccountDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Unique ledger account code', example: '11000' })
  @IsString()
  @IsNotEmpty()
  account_code: string;

  @ApiProperty({ description: 'Account Name', example: 'Cash on Hand' })
  @IsString()
  @IsNotEmpty()
  account_name: string;

  @ApiProperty({ description: 'Financial Statement account type classification', enum: GlAccountType })
  @IsEnum(GlAccountType)
  @IsNotEmpty()
  account_type: GlAccountType;

  @ApiProperty({ description: 'Optional Parent account UUID for hierarchical rollup', required: false })
  @IsUUID()
  @IsOptional()
  parent_account_id?: string;

  @ApiProperty({ description: 'Is sub-ledger reconciliation account', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_reconciliation?: boolean;

  @ApiProperty({ description: 'Is Cost Center input required on GL posting line', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  cost_center_required?: boolean;

  @ApiProperty({ description: 'Is Dimension values input required on GL posting line', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  dimension_required?: boolean;
}

export class UpdateGlAccountDto {
  @ApiProperty({ description: 'Account Name', required: false })
  @IsString()
  @IsOptional()
  account_name?: string;

  @ApiProperty({ description: 'Active Status', default: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: 'Is Cost Center required', required: false })
  @IsBoolean()
  @IsOptional()
  cost_center_required?: boolean;

  @ApiProperty({ description: 'Is Dimension required', required: false })
  @IsBoolean()
  @IsOptional()
  dimension_required?: boolean;
}

export class QueryGlAccountDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsEnum(GlAccountType)
  @IsOptional()
  accountType?: GlAccountType;

  @IsString()
  @IsOptional()
  search?: string;
}
