import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBorDto {
  @ApiProperty({ example: 'BOR-2025-001' }) @IsString() @IsNotEmpty() bor_code: string;
  @ApiProperty({ example: 1, description: 'Version number' }) @IsInt() version: number;
  @ApiProperty({ example: 'Broiler Grower Feed 26% CP' }) @IsString() @IsNotEmpty() bor_name: string;
  @ApiProperty({ example: 'uuid-item-broiler-feed-grower' }) @IsString() @IsNotEmpty() output_item_id: string;
  @ApiProperty({ example: 1000, description: 'Target output qty (kg)' }) @IsNumber() output_qty: number;
  @ApiProperty({ example: 'uuid-uom-kg', required: false }) @IsString() @IsOptional() output_uom_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AddBorIngredientDto {
  @ApiProperty({ example: 1, description: 'Line number' }) @IsInt() line_no: number;
  @ApiProperty({ example: 'uuid-item-maize' }) @IsString() @IsNotEmpty() item_id: string;
  @ApiProperty({ example: 520, description: 'Std qty per BOR output qty (e.g. 520 kg maize per 1000 kg feed)' }) @IsNumber() std_qty: number;
  @ApiProperty({ example: 'uuid-uom-kg', required: false }) @IsString() @IsOptional() uom_id?: string;
  @ApiProperty({ example: 52.0, description: 'Percentage of output (e.g. 52%)' }) @IsNumber() @IsOptional() pct_of_output?: number;
  @ApiProperty({ example: 18.5, description: 'Standard unit rate', required: false }) @IsNumber() @IsOptional() std_unit_rate?: number;
}

export class SetBorNutritionDto {
  @ApiProperty({ example: 22.5, description: 'Crude protein %', required: false }) @IsNumber() @IsOptional() crude_protein_pct?: number;
  @ApiProperty({ example: 5.0, description: 'Crude fat %', required: false }) @IsNumber() @IsOptional() crude_fat_pct?: number;
  @ApiProperty({ example: 4.2, description: 'Crude fibre %', required: false }) @IsNumber() @IsOptional() crude_fibre_pct?: number;
  @ApiProperty({ example: 12.0, description: 'Moisture %', required: false }) @IsNumber() @IsOptional() moisture_pct?: number;
  @ApiProperty({ example: 7.5, description: 'Ash %', required: false }) @IsNumber() @IsOptional() ash_pct?: number;
  @ApiProperty({ example: 3050, description: 'ME kcal/kg', required: false }) @IsNumber() @IsOptional() metabolisable_energy_kcal_kg?: number;
  @ApiProperty({ example: 0.9, description: 'Calcium %', required: false }) @IsNumber() @IsOptional() calcium_pct?: number;
  @ApiProperty({ example: 0.45, description: 'Phosphorus %', required: false }) @IsNumber() @IsOptional() phosphorus_pct?: number;
}

export class CreateFeedProductionBatchDto {
  @ApiProperty({ example: 'FP-2026-001' }) @IsString() @IsNotEmpty() fp_batch_code: string;
  @ApiProperty({ example: 'uuid-bor-001', description: 'Bill of Recipe to use' }) @IsString() @IsNotEmpty() bor_id: string;
  @ApiProperty({ example: 5000, description: 'Planned output qty kg' }) @IsNumber() planned_output_qty: number;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() production_date: string;
  @ApiProperty({ example: 'uuid-loc-feedmill1' }) @IsString() @IsNotEmpty() location_id: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordFeedProductionInputDto {
  @ApiProperty({ example: 'uuid-bor-line-001', description: 'BOR line reference', required: false }) @IsString() @IsOptional() bor_line_id?: string;
  @ApiProperty({ example: 'uuid-item-maize' }) @IsString() @IsNotEmpty() item_id: string;
  @ApiProperty({ example: 2650, description: 'Actual qty used' }) @IsNumber() actual_qty: number;
  @ApiProperty({ example: 'uuid-uom-kg', required: false }) @IsString() @IsOptional() uom_id?: string;
  @ApiProperty({ example: 18.5, description: 'Actual unit rate', required: false }) @IsNumber() @IsOptional() unit_rate?: number;
}

export class CloseFeedProductionBatchDto {
  @ApiProperty({ example: 4980, description: 'Actual output qty produced' }) @IsNumber() actual_output_qty: number;
  @ApiProperty({ example: 5.5, description: 'Total resource/labour cost', required: false }) @IsNumber() @IsOptional() total_resource_cost?: number;
  @ApiProperty({ example: 3.2, description: 'Total overhead cost per kg', required: false }) @IsNumber() @IsOptional() total_overhead_cost?: number;
}
