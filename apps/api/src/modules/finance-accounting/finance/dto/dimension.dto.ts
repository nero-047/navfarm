import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUUID, 
  IsBoolean 
} from 'class-validator';

export class CreateDimensionDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Dimension Code (e.g. FARM, PROJECT)', example: 'FARM' })
  @IsString()
  @IsNotEmpty()
  dimension_code: string;

  @ApiProperty({ description: 'Dimension display name', example: 'Poultry Farm Location' })
  @IsString()
  @IsNotEmpty()
  dimension_name: string;
}

export class CreateDimensionValueDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Financial Dimension UUID link' })
  @IsUUID()
  @IsNotEmpty()
  dimension_id: string;

  @ApiProperty({ description: 'Value Code (e.g. FarmA, FarmB)', example: 'FarmA' })
  @IsString()
  @IsNotEmpty()
  value_code: string;

  @ApiProperty({ description: 'Value Name', example: 'Central Broiler Farm' })
  @IsString()
  @IsNotEmpty()
  value_name: string;
}

export class QueryDimensionDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

export class QueryDimensionValueDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  dimensionId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
