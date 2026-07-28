import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateParameterDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() nob_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() lob_id?: string;
  @ApiProperty({ example: 'CONS_FEED_GROWER' }) @IsString() @IsNotEmpty() parameter_code: string;
  @ApiProperty({ example: 'Grower Feed Consumption' }) @IsString() @IsNotEmpty() parameter_name: string;
  @ApiProperty({ example: 'CONSUMPTION', description: 'CONSUMPTION/OUTPUT/DESCRIPTIVE/OVERHEAD/RESOURCE/QC' }) @IsString() @IsNotEmpty() parameter_type: string;
  @ApiProperty({ example: 'CONS_FEED', required: false }) @IsString() @IsOptional() entry_type_code?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() item_id?: string;
  @ApiProperty({ example: 'KG', required: false }) @IsString() @IsOptional() default_uom?: string;
  @ApiProperty({ example: 'PER_UNIT', description: 'PER_UNIT/PER_BATCH/FORMULA/MANUAL' }) @IsString() @IsNotEmpty() qty_method: string;
  @ApiProperty({ example: 0.2, required: false }) @IsNumber() @IsOptional() default_qty_per_unit?: number;
  @ApiProperty({ example: 500.0, required: false }) @IsNumber() @IsOptional() default_qty_per_batch?: number;
  @ApiProperty({ example: 'head_count * 0.2', required: false }) @IsString() @IsOptional() qty_formula?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ example: false }) @IsBoolean() @IsOptional() is_mandatory?: boolean;
}

export class BatchParameterEntryDto {
  @ApiProperty({ example: 'uuid-param-001' }) @IsString() @IsNotEmpty() parameter_id: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() entry_date: string;
  @ApiProperty({ example: 1980, required: false }) @IsNumber() @IsOptional() actual_qty?: number;
  @ApiProperty({ example: '2.15', description: 'For DESCRIPTIVE type (weight, temp etc)', required: false }) @IsString() @IsOptional() actual_value?: string;
  @ApiProperty({ example: 20.0, required: false }) @IsNumber() @IsOptional() unit_rate?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
