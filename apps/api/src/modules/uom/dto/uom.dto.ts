import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUomDto {
  @ApiProperty({ description: 'Short code for the UOM', example: 'KG' })
  @IsString()
  @IsNotEmpty()
  uom_code: string;

  @ApiProperty({ description: 'Full descriptive name', example: 'Kilogram' })
  @IsString()
  @IsNotEmpty()
  uom_name: string;

  @ApiProperty({ description: 'UOM Type classification', example: 'WEIGHT', enum: ['WEIGHT', 'VOLUME', 'COUNT', 'AREA', 'TIME', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  uom_type: string;

  @ApiProperty({ description: 'Allowed decimal places for transaction quantities', example: 3, default: 0 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  decimal_places?: number;

  @ApiProperty({ description: 'Is this the base unit for conversions of this type?', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_base_uom?: boolean;

  @ApiProperty({ description: 'Company UUID (null means global tenant-wide UOM)', required: false, example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Flexible custom config extensions in JSON format', required: false, example: '{"symbol":"kg"}' })
  @IsOptional()
  extension_config?: any;
}

export class UpdateUomDto {
  @ApiProperty({ description: 'Short code for the UOM', required: false, example: 'KG' })
  @IsString()
  @IsOptional()
  uom_code?: string;

  @ApiProperty({ description: 'Full descriptive name', required: false, example: 'Kilogram' })
  @IsString()
  @IsOptional()
  uom_name?: string;

  @ApiProperty({ description: 'UOM Type classification', required: false, example: 'WEIGHT' })
  @IsString()
  @IsOptional()
  uom_type?: string;

  @ApiProperty({ description: 'Allowed decimal places', required: false, example: 3 })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  decimal_places?: number;

  @ApiProperty({ description: 'Is this the base unit?', required: false, example: false })
  @IsBoolean()
  @IsOptional()
  is_base_uom?: boolean;

  @ApiProperty({ description: 'Active status indicator', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: 'Status description', required: false, example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVE'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Flexible custom config', required: false })
  @IsOptional()
  extension_config?: any;
}

export class QueryUomDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ description: 'Filter by UOM type', required: false, example: 'WEIGHT' })
  @IsOptional()
  @IsString()
  uomType?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search term for code or name', required: false })
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

export class CreateUomConversionDto {
  @ApiProperty({ description: 'Item UUID (null means a generic conversion factor)', required: false })
  @IsUUID()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ description: 'From UOM code', example: 'TONNE' })
  @IsString()
  @IsNotEmpty()
  from_uom: string;

  @ApiProperty({ description: 'To UOM code', example: 'KG' })
  @IsString()
  @IsNotEmpty()
  to_uom: string;

  @ApiProperty({ description: 'Multiplier conversion factor: From * Factor = To', example: 1000.00000000 })
  @IsNumber()
  @IsNotEmpty()
  conversion_factor: number;

  @ApiProperty({ description: 'Effective start date', example: '2026-01-01' })
  @IsString()
  @IsNotEmpty()
  effective_from: string;

  @ApiProperty({ description: 'Effective end date', required: false, example: '2027-12-31' })
  @IsString()
  @IsOptional()
  effective_to?: string;

  @ApiProperty({ description: 'Company UUID for the conversion scope', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;
}

export class UpdateUomConversionDto {
  @ApiProperty({ description: 'Conversion factor multiplier', required: false })
  @IsNumber()
  @IsOptional()
  conversion_factor?: number;

  @ApiProperty({ description: 'Effective start date', required: false })
  @IsString()
  @IsOptional()
  effective_from?: string;

  @ApiProperty({ description: 'Effective end date', required: false })
  @IsString()
  @IsOptional()
  effective_to?: string;

  @ApiProperty({ description: 'Is active status', required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: 'Status description', required: false, example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;
}
