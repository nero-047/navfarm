import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DefineKpiDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'KPI-FCR-01' })
  @IsString()
  @IsNotEmpty()
  kpi_code: string;

  @ApiProperty({ example: 'Feed Conversion Ratio (FCR)' })
  @IsString()
  @IsNotEmpty()
  kpi_name: string;

  @ApiProperty({ example: 'POULTRY', description: 'PRODUCTION, INVENTORY, FINANCE, POULTRY, QUALITY' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'RATIO', default: 'RATIO' })
  @IsString()
  @IsOptional()
  unit_of_measure?: string;

  @ApiProperty({ example: 1.4, description: 'Max value for green zone', required: false })
  @IsNumber()
  @IsOptional()
  green_max?: number;

  @ApiProperty({ example: 1.6, description: 'Max value for yellow zone', required: false })
  @IsNumber()
  @IsOptional()
  yellow_max?: number;

  @ApiProperty({ example: 1.8, description: 'Min value for red zone', required: false })
  @IsNumber()
  @IsOptional()
  red_min?: number;
}
