import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum CostingMethodEnum {
  STANDARD = 'STANDARD',
  FIFO = 'FIFO',
  WEIGHTED_AVG = 'WEIGHTED_AVG',
  BIOLOGICAL_ASSET = 'BIOLOGICAL_ASSET',
}

export enum CostTypeEnum {
  DIRECT_MATERIAL = 'DIRECT_MATERIAL',
  DIRECT_LABOR = 'DIRECT_LABOR',
  INDIRECT_OVERHEAD = 'INDIRECT_OVERHEAD',
  FREIGHT = 'FREIGHT',
  DUTY = 'DUTY',
}

export class CreateCostingProfileDto {
  @ApiProperty({ example: 'COMP-001', description: 'Company UUID' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'item-uuid', required: false })
  @IsString()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ example: 'item-cat-uuid', required: false })
  @IsString()
  @IsOptional()
  item_category_id?: string;

  @ApiProperty({ enum: CostingMethodEnum, default: CostingMethodEnum.FIFO })
  @IsEnum(CostingMethodEnum)
  @IsNotEmpty()
  costing_method: CostingMethodEnum;

  @ApiProperty({ example: 12.50, description: 'Predefined Standard Cost', default: 0 })
  @IsNumber()
  @IsOptional()
  standard_cost?: number;

  @ApiProperty({ example: '2026-08-01', description: 'Effective From Date' })
  @IsDateString()
  @IsNotEmpty()
  effective_from: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsDateString()
  @IsOptional()
  effective_to?: string;
}

export class CreateCostComponentDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'DIRECT_LABOR_LINE' })
  @IsString()
  @IsNotEmpty()
  component_code: string;

  @ApiProperty({ example: 'Direct Factory Labor Cost' })
  @IsString()
  @IsNotEmpty()
  component_name: string;

  @ApiProperty({ enum: CostTypeEnum, default: CostTypeEnum.DIRECT_LABOR })
  @IsEnum(CostTypeEnum)
  @IsNotEmpty()
  cost_type: CostTypeEnum;

  @ApiProperty({ example: 'gl-account-uuid', required: false })
  @IsString()
  @IsOptional()
  gl_account_id?: string;
}
