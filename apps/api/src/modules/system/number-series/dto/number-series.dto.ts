import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsIn, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

const RESET_FREQUENCIES = ['YEARLY', 'MONTHLY', 'NEVER'] as const;

export class CreateNumberSeriesDto {
  @ApiProperty({ description: 'Company UUID scope (omit for a tenant-wide series)', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Nature of Business UUID scope (omit for shared)', required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ description: 'Line of Business UUID scope (omit for all LOBs under the NOB)', required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ description: 'Unique series code, referenced by callers of generateNext()', example: 'BATCH' })
  @IsString()
  @IsNotEmpty()
  series_code: string;

  @ApiProperty({ description: 'Display name', example: 'Batch Number' })
  @IsString()
  @IsNotEmpty()
  series_name: string;

  @ApiProperty({ description: 'What kind of document this series numbers', example: 'BATCH' })
  @IsString()
  @IsNotEmpty()
  document_type: string;

  @ApiProperty({ description: 'Fixed prefix, e.g. "BATCH" or "PIG-ITM"', required: false })
  @IsString()
  @IsOptional()
  prefix?: string;

  @ApiProperty({ description: 'Date segment format, e.g. "YYYY" — omit for no date segment', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  date_format?: string;

  @ApiProperty({ description: 'Segment separator', required: false, default: '-' })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  separator?: string;

  @ApiProperty({ description: 'Zero-padded sequence digit count', example: 6 })
  @IsInt()
  @Min(1)
  seq_length: number;

  @ApiProperty({ description: 'When the sequence resets', enum: RESET_FREQUENCIES, default: 'NEVER', required: false })
  @IsString()
  @IsOptional()
  @IsIn(RESET_FREQUENCIES)
  reset_frequency?: string;

  @ApiProperty({ description: 'Allow a user to type their own code instead of generating one', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  allow_manual?: boolean;
}

export class UpdateNumberSeriesDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  series_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  document_type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  prefix?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  date_format?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1)
  separator?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  @Min(1)
  seq_length?: number;

  @ApiProperty({ required: false, enum: RESET_FREQUENCIES })
  @IsString()
  @IsOptional()
  @IsIn(RESET_FREQUENCIES)
  reset_frequency?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allow_manual?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class QueryNumberSeriesDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentType?: string;

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
