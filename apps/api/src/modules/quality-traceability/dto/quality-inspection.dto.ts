import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RecordParameterResultDto {
  @ApiProperty({ example: 'param-uuid' })
  @IsString()
  @IsNotEmpty()
  parameter_id: string;

  @ApiProperty({ example: 11.5, description: 'Measured parameter value' })
  @IsNumber()
  @IsNotEmpty()
  measured_value: number;
}

export class ExecuteQualityInspectionDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'plan-uuid', required: false })
  @IsString()
  @IsOptional()
  plan_id?: string;

  @ApiProperty({ example: 'batch-uuid', required: false })
  @IsString()
  @IsOptional()
  batch_id?: string;

  @ApiProperty({ example: 'LOT-2026-001', required: false })
  @IsString()
  @IsOptional()
  lot_number?: string;

  @ApiProperty({ example: 1.0, description: 'Sample size' })
  @IsNumber()
  @IsNotEmpty()
  sample_size: number;

  @ApiProperty({ type: [RecordParameterResultDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordParameterResultDto)
  results: RecordParameterResultDto[];

  @ApiProperty({ example: 'wh-quarantine', required: false })
  @IsString()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ example: 'loc-hold-01', required: false })
  @IsString()
  @IsOptional()
  location_id?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  hold_qty?: number;
}
