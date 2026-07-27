import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMedicineDto {
  @ApiProperty({ description: 'Company UUID scope ownership', example: 'company-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Item Master UUID link', example: 'item-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Chemical composition details', required: false, example: 'Amoxicillin 10% w/w' })
  @IsString()
  @IsOptional()
  composition?: string;

  @ApiProperty({ description: 'Dosage and administration guideline details', required: false })
  @IsString()
  @IsOptional()
  dosage_guideline?: string;

  @ApiProperty({ description: 'Withdrawal period in days before slaughter/harvest', required: false, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  withdrawal_period_days?: number;

  @ApiProperty({ description: 'Route of drug administration', required: false, example: 'ORAL', enum: ['ORAL', 'INJECTION', 'WATER', 'TOPICAL'] })
  @IsString()
  @IsOptional()
  route_of_administration?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateMedicineDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  composition?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  dosage_guideline?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  withdrawal_period_days?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  route_of_administration?: string;

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

export class QueryMedicineDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by item UUID link', required: false })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search composition or dosage', required: false })
  @IsOptional()
  @IsString()
  search?: string;

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
