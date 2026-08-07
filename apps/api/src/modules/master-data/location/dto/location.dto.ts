import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocationDto {
  @ApiProperty({ description: 'Company UUID scope', required: false })
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

  @ApiProperty({ description: 'Parent Farm UUID — set exactly one of farm_id/shed_id/warehouse_id', required: false })
  @IsUUID()
  @IsOptional()
  farm_id?: string;

  @ApiProperty({ description: 'Parent Shed UUID — set exactly one of farm_id/shed_id/warehouse_id', required: false })
  @IsUUID()
  @IsOptional()
  shed_id?: string;

  @ApiProperty({ description: 'Parent Warehouse UUID — set exactly one of farm_id/shed_id/warehouse_id', required: false })
  @IsUUID()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ description: 'Unique code for this location within company/tenant scope', example: 'LOC-A' })
  @IsString()
  @IsNotEmpty()
  location_code: string;

  @ApiProperty({ description: 'Full descriptive name of this location', example: 'Storage Area A' })
  @IsString()
  @IsNotEmpty()
  location_name: string;

  @ApiProperty({ description: 'Hierarchy level in hierarchy tree', default: 1 })
  @IsInt()
  @Min(1)
  location_level: number;

  @ApiProperty({ description: 'Location classification type', example: 'ROOM', enum: ['FARM', 'SHED', 'AREA', 'SECTION', 'ROOM', 'AISLE', 'SHELF'] })
  @IsString()
  @IsNotEmpty()
  location_type: string;

  @ApiProperty({ description: 'Parent Location UUID', required: false })
  @IsUUID()
  @IsOptional()
  parent_location_id?: string;

  @ApiProperty({ description: 'Size of the physical area', required: false })
  @IsNumber()
  @IsOptional()
  area_size?: number;

  @ApiProperty({ description: 'Unit of area size (e.g. SQFT, SQM)', required: false })
  @IsString()
  @IsOptional()
  area_unit?: string;

  @ApiProperty({ description: 'Maximum storage or bird/animal capacity limit', required: false })
  @IsNumber()
  @IsOptional()
  max_capacity?: number;

  @ApiProperty({ description: 'Capacity unit representation', required: false })
  @IsString()
  @IsOptional()
  capacity_uom?: string;

  @ApiProperty({ description: 'Current count representation', required: false })
  @IsNumber()
  @IsOptional()
  current_count?: number;

  @ApiProperty({ description: 'GPS coordinates latitude', required: false })
  @IsNumber()
  @IsOptional()
  gps_latitude?: number;

  @ApiProperty({ description: 'GPS coordinates longitude', required: false })
  @IsNumber()
  @IsOptional()
  gps_longitude?: number;

  @ApiProperty({ description: 'Storage conditions type descriptor', required: false })
  @IsString()
  @IsOptional()
  storage_type?: string;

  @ApiProperty({ description: 'Flag indicating if quarantine isolation is enforced', default: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_quarantine_zone?: boolean;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateLocationDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ description: 'Parent Farm UUID — set exactly one of farm_id/shed_id/warehouse_id', required: false })
  @IsUUID()
  @IsOptional()
  farm_id?: string;

  @ApiProperty({ description: 'Parent Shed UUID — set exactly one of farm_id/shed_id/warehouse_id', required: false })
  @IsUUID()
  @IsOptional()
  shed_id?: string;

  @ApiProperty({ description: 'Parent Warehouse UUID — set exactly one of farm_id/shed_id/warehouse_id', required: false })
  @IsUUID()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location_code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location_name?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  location_level?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location_type?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parent_location_id?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  area_size?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  area_unit?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  max_capacity?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  capacity_uom?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  current_count?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  gps_latitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  gps_longitude?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  storage_type?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_quarantine_zone?: boolean;

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

export class QueryLocationDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by parent farm UUID', required: false })
  @IsOptional()
  @IsUUID()
  farmId?: string;

  @ApiProperty({ description: 'Filter by parent shed UUID', required: false })
  @IsOptional()
  @IsUUID()
  shedId?: string;

  @ApiProperty({ description: 'Filter by linked warehouse UUID', required: false })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({ description: 'Filter by parent location UUID', required: false })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @ApiProperty({ description: 'Filter by location type', required: false })
  @IsOptional()
  @IsString()
  locationType?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search location code or name', required: false })
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
