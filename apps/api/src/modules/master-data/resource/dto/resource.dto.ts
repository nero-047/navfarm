import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateResourceDto {
  @ApiProperty({ description: 'Company UUID scope ownership' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Unique code representing the resource', example: 'LBR-01' })
  @IsString()
  @IsNotEmpty()
  resource_code: string;

  @ApiProperty({ description: 'Full name/description of the resource', example: 'Senior Laborer' })
  @IsString()
  @IsNotEmpty()
  resource_name: string;

  @ApiProperty({ description: 'Resource category', example: 'LABOR', enum: ['LABOR', 'EQUIPMENT', 'VEHICLE'] })
  @IsString()
  @IsNotEmpty()
  resource_type: string;

  @ApiProperty({ description: 'Operating capacity count/limit', required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ description: 'Operational units', required: false, example: 'HOURS' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ description: 'Standard billing cost rate per unit', required: false })
  @IsNumber()
  @IsOptional()
  cost_rate?: number;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateResourceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resource_code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resource_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resource_type?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cost_rate?: number;

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

export class QueryResourceDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by resource type category', required: false })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search resource code or name', required: false })
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

export class CreateMaintenanceLogDto {
  @ApiProperty({ description: 'Maintenance service date', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  maintenance_date: string;

  @ApiProperty({ description: 'Type of maintenance', example: 'PREVENTIVE', enum: ['PREVENTIVE', 'BREAKDOWN', 'CALIBRATION'] })
  @IsString()
  @IsNotEmpty()
  maintenance_type: string;

  @ApiProperty({ description: 'Service remarks/notes', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Cost incurred', required: false })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiProperty({ description: 'Technician/vendor name performing service', required: false })
  @IsString()
  @IsOptional()
  performed_by?: string;

  @ApiProperty({ description: 'Service status', default: 'COMPLETED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateMaintenanceLogDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  maintenance_date?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  maintenance_type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  performed_by?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  extension_config?: any;
}
