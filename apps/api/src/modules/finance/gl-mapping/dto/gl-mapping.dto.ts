import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGlMappingDto {
  @ApiProperty({ description: 'Company UUID scope ownership', example: 'company-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Optional Item Category UUID link for scoped category mapping rules', required: false })
  @IsUUID()
  @IsOptional()
  item_category_id?: string;

  @ApiProperty({ description: 'The inventory ledger transaction type', example: 'PURCHASE', enum: ['PURCHASE', 'CONSUMPTION', 'OUTPUT', 'SALE', 'ADJUSTMENT', 'MORTALITY', 'VARIANCE'] })
  @IsString()
  @IsNotEmpty()
  transaction_type: string;

  @ApiProperty({ description: 'G/L account to debit', required: false })
  @IsUUID()
  @IsOptional()
  debit_gl_account_id?: string;

  @ApiProperty({ description: 'G/L account to credit', required: false })
  @IsUUID()
  @IsOptional()
  credit_gl_account_id?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateGlMappingDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  item_category_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  transaction_type?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  debit_gl_account_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  credit_gl_account_id?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVE'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  extension_config?: any;
}

export class QueryGlMappingDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by item category UUID', required: false })
  @IsOptional()
  @IsUUID()
  itemCategoryId?: string;

  @ApiProperty({ description: 'Filter by inventory transaction type', required: false })
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

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
