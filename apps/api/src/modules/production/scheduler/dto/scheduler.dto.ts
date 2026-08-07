import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

const DURATION_UNITS = ['DAY', 'WEEK', 'MONTH'] as const;
const KPI_MODES = ['PCT', 'VALUE'] as const;

export class SchedulerParameterLineInput {
  @ApiProperty({ description: 'Parameter UUID' })
  @IsUUID()
  @IsNotEmpty()
  parameter_id: string;

  @ApiProperty({ description: 'Sequence number within the scheduler', example: 1 })
  @IsInt()
  @IsNotEmpty()
  period_no: number;

  @ApiProperty({ description: 'Start day-of-batch for this period', example: 1 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  period_from: number;

  @ApiProperty({ description: 'End day-of-batch for this period', example: 7 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  period_to: number;

  @ApiProperty({ description: 'Human label', required: false, example: 'Week 1 - Starter' })
  @IsString()
  @IsOptional()
  period_label?: string;

  @ApiProperty({ description: "Override the parameter's default expected quantity for this period", required: false })
  @IsNumber()
  @IsOptional()
  expected_qty_override?: number;

  @ApiProperty({ description: "Override the parameter's default UOM for this period", required: false })
  @IsString()
  @IsOptional()
  uom_override?: string;

  @ApiProperty({ description: 'Enable KPI monitoring for this line?', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  kpi_enabled?: boolean;

  @ApiProperty({ description: 'KPI comparison mode', enum: KPI_MODES, required: false })
  @IsString()
  @IsOptional()
  @IsIn(KPI_MODES)
  kpi_mode?: string;

  @ApiProperty({ description: 'PCT mode: minimum acceptable % of expected', required: false, example: 90 })
  @IsNumber()
  @IsOptional()
  kpi_min_pct?: number;

  @ApiProperty({ description: 'PCT mode: maximum acceptable % of expected', required: false, example: 110 })
  @IsNumber()
  @IsOptional()
  kpi_max_pct?: number;

  @ApiProperty({ description: 'VALUE mode: absolute minimum', required: false })
  @IsNumber()
  @IsOptional()
  kpi_min_value?: number;

  @ApiProperty({ description: 'VALUE mode: absolute maximum', required: false })
  @IsNumber()
  @IsOptional()
  kpi_max_value?: number;

  @ApiProperty({ description: 'Ideal target value, for reporting/display', required: false })
  @IsNumber()
  @IsOptional()
  kpi_target_value?: number;

  @ApiProperty({ description: 'Deviation % beyond which severity escalates from WARNING to CRITICAL (PCT mode only)', required: false, example: 20 })
  @IsNumber()
  @IsOptional()
  critical_threshold_pct?: number;

  @ApiProperty({ description: 'Show breaches in the in-app Alert Center?', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  notify_in_app?: boolean;

  @ApiProperty({ description: 'Intent flag only — no push integration exists yet', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  notify_push?: boolean;

  @ApiProperty({ description: 'Intent flag only — no email integration exists yet', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  notify_email?: boolean;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateSchedulerDto {
  @ApiProperty({ description: 'Company UUID scope (omit for a tenant-wide template)', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Nature of Business UUID scope' })
  @IsString()
  @IsNotEmpty()
  nob_id: string;

  @ApiProperty({ description: 'Line of Business UUID scope' })
  @IsString()
  @IsNotEmpty()
  lob_id: string;

  @ApiProperty({ description: 'Unique scheduler code', example: 'SCH-PLT-CB-42D' })
  @IsString()
  @IsNotEmpty()
  scheduler_code: string;

  @ApiProperty({ description: 'Display name', example: 'Broiler 42-Day Standard' })
  @IsString()
  @IsNotEmpty()
  scheduler_name: string;

  @ApiProperty({ description: 'Duration value', example: 42 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  duration_value: number;

  @ApiProperty({ description: 'Duration unit', enum: DURATION_UNITS })
  @IsString()
  @IsNotEmpty()
  @IsIn(DURATION_UNITS)
  duration_unit: string;

  @ApiProperty({ description: 'Breed UUID (optional — breed-specific scheduler)', required: false })
  @IsUUID()
  @IsOptional()
  breed_id?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Period-wise parameter lines', type: [SchedulerParameterLineInput] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SchedulerParameterLineInput)
  parameter_lines: SchedulerParameterLineInput[];
}

export class UpdateSchedulerDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  scheduler_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: 'Replaces all existing lines when provided (rejected once locked)', required: false, type: [SchedulerParameterLineInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SchedulerParameterLineInput)
  @IsOptional()
  parameter_lines?: SchedulerParameterLineInput[];
}

export class QuerySchedulerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lobId?: string;

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
