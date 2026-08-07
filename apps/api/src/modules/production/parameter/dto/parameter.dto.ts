import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsBoolean, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

const PARAMETER_TYPES = ['CONSUMPTION', 'MORTALITY', 'OUTPUT', 'OVERHEAD', 'OBSERVATION'] as const;
const QTY_METHODS = ['PER_UNIT', 'PER_BATCH', 'MANUAL_AT_ENTRY'] as const;

export class CreateParameterDto {
  @ApiProperty({ description: 'Company UUID scope (omit for a tenant-wide template)', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Nature of Business UUID scope', required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ description: 'Line of Business UUID scope', required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ description: 'Unique parameter code', example: 'PARAM-CONS-FEED-STARTER' })
  @IsString()
  @IsNotEmpty()
  parameter_code: string;

  @ApiProperty({ description: 'Display name', example: 'Starter Feed Consumption' })
  @IsString()
  @IsNotEmpty()
  parameter_name: string;

  @ApiProperty({ description: 'Parameter type', enum: PARAMETER_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(PARAMETER_TYPES)
  parameter_type: string;

  @ApiProperty({ description: 'Item UUID (required for CONSUMPTION/OUTPUT)', required: false })
  @IsUUID()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ description: 'Resource UUID (optional, for OVERHEAD — labor/equipment)', required: false })
  @IsUUID()
  @IsOptional()
  resource_id?: string;

  @ApiProperty({ description: 'Default unit of measure', required: false })
  @IsString()
  @IsOptional()
  default_uom?: string;

  @ApiProperty({ description: 'How expected quantity is calculated', enum: QTY_METHODS })
  @IsString()
  @IsNotEmpty()
  @IsIn(QTY_METHODS)
  qty_method: string;

  @ApiProperty({ description: 'Default expected quantity per batch opening unit per day (PER_UNIT method)', required: false })
  @IsNumber()
  @IsOptional()
  default_qty_per_unit?: number;

  @ApiProperty({ description: 'Default fixed expected quantity for the whole batch (PER_BATCH method)', required: false })
  @IsNumber()
  @IsOptional()
  default_qty_per_batch?: number;

  @ApiProperty({ description: 'Description / guidance for farm staff', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Must this be filled on every relevant entry?', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;
}

export class UpdateParameterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  parameter_name?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  resource_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  default_uom?: string;

  @ApiProperty({ required: false, enum: QTY_METHODS })
  @IsString()
  @IsOptional()
  @IsIn(QTY_METHODS)
  qty_method?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  default_qty_per_unit?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  default_qty_per_batch?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class QueryParameterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parameterType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
