import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsBoolean, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

const PARAM_TYPES = ['NUMERIC', 'BOOLEAN', 'GRADE'] as const;

export class CreateQcParameterDto {
  @ApiProperty({ description: 'Company UUID scope (omit for a tenant-wide template)', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Line of Business UUID this parameter applies to' })
  @IsString()
  @IsNotEmpty()
  lob_id: string;

  @ApiProperty({ description: 'Unique parameter code', example: 'QC_BIRD_WEIGHT' })
  @IsString()
  @IsNotEmpty()
  param_code: string;

  @ApiProperty({ description: 'Display name', example: 'Live Bird Weight at Slaughter' })
  @IsString()
  @IsNotEmpty()
  param_name: string;

  @ApiProperty({ description: 'Parameter type', enum: PARAM_TYPES })
  @IsString()
  @IsNotEmpty()
  @IsIn(PARAM_TYPES)
  param_type: string;

  @ApiProperty({ description: 'Unit of measure (NUMERIC)', required: false })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiProperty({ description: 'Minimum acceptable value (NUMERIC)', required: false })
  @IsNumber()
  @IsOptional()
  min_value?: number;

  @ApiProperty({ description: 'Maximum acceptable value (NUMERIC)', required: false })
  @IsNumber()
  @IsOptional()
  max_value?: number;

  @ApiProperty({ description: 'What constitutes PASS', required: false })
  @IsString()
  @IsOptional()
  pass_criteria?: string;

  @ApiProperty({ description: 'What constitutes FAIL', required: false })
  @IsString()
  @IsOptional()
  fail_criteria?: string;

  @ApiProperty({ description: 'Grade scale definitions (GRADE type), e.g. { "A": "2.0-2.5kg" }', required: false })
  @IsOptional()
  grade_scale?: Record<string, string>;

  @ApiProperty({ description: 'Must this parameter pass for overall QC to pass?', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;
}

export class UpdateQcParameterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  param_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  min_value?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  max_value?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  pass_criteria?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fail_criteria?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  grade_scale?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class QueryQcParameterDto {
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
