import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, ArrayMinSize, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

const DISPOSITIONS = ['ACCEPT', 'REJECT', 'REWORK', 'QUARANTINE', 'CONDITIONAL_ACCEPT'] as const;

export class QcParamResultInput {
  @ApiProperty({ description: 'QC Parameter UUID' })
  @IsUUID()
  @IsNotEmpty()
  param_id: string;

  @ApiProperty({ description: 'Recorded value — number for NUMERIC, "true"/"false" for BOOLEAN, grade code for GRADE', example: '2.15' })
  @IsString()
  @IsNotEmpty()
  actual_value: string;

  @ApiProperty({ description: 'Grade assigned (GRADE type parameters)', required: false })
  @IsString()
  @IsOptional()
  grade_assigned?: string;

  @ApiProperty({ description: 'Inspector note on this parameter', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateQcDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Source (production) Batch UUID being inspected' })
  @IsUUID()
  @IsNotEmpty()
  source_batch_id: string;

  @ApiProperty({ description: 'Batch Output Line UUID this inspection covers', required: false })
  @IsUUID()
  @IsOptional()
  output_line_id?: string;

  @ApiProperty({ description: 'Inspection date', example: '2026-08-07' })
  @IsString()
  @IsNotEmpty()
  qc_date: string;

  @ApiProperty({ description: 'Total quantity submitted for inspection', example: 9750 })
  @IsNumber()
  @IsNotEmpty()
  total_qty_received: number;

  @ApiProperty({ description: 'Quantity that passed', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  pass_qty?: number;

  @ApiProperty({ description: 'Quantity that failed', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  fail_qty?: number;

  @ApiProperty({ description: 'Quantity on hold for recheck', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  hold_qty?: number;

  @ApiProperty({ description: 'Grade A quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_a_qty?: number;

  @ApiProperty({ description: 'Grade B quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_b_qty?: number;

  @ApiProperty({ description: 'Grade C quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_c_qty?: number;

  @ApiProperty({ description: 'Final disposition decision', enum: DISPOSITIONS })
  @IsString()
  @IsNotEmpty()
  @IsIn(DISPOSITIONS)
  disposition: string;

  @ApiProperty({ description: 'Inspector notes', required: false })
  @IsString()
  @IsOptional()
  qc_notes?: string;

  @ApiProperty({ description: 'Per-parameter results', type: [QcParamResultInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QcParamResultInput)
  results: QcParamResultInput[];
}

export class QueryQcDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  sourceBatchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  outputLineId?: string;

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
