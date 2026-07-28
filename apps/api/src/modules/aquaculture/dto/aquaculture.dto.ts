import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAquaBatchDto {
  @ApiProperty({ example: 'BATCH-FISH-2026-001' }) @IsString() @IsNotEmpty() batch_code: string;
  @ApiProperty({ example: 'uuid-lob-13' }) @IsString() @IsNotEmpty() lob_id: string;
  @ApiProperty({ example: 'uuid-item-fingerling' }) @IsString() @IsNotEmpty() species_item_id: string;
  @ApiProperty({ example: 'uuid-loc-pond1' }) @IsString() @IsNotEmpty() location_id: string;
  @ApiProperty({ example: '2026-01-15' }) @IsString() @IsNotEmpty() stocking_date: string;
  @ApiProperty({ example: 10000 }) @IsInt() fingerlings_qty: number;
  @ApiProperty({ example: 50000.0, description: 'NCA stocking cost' }) @IsNumber() @IsOptional() nca_stocking_cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AquaDailyEntryDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() entry_date: string;
  @ApiProperty({ example: 'CONS_FEED', description: 'CONS_FEED/DESC_WEIGHT/MORT_M' }) @IsString() @IsNotEmpty() entry_type: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() item_id?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() qty?: number;
  @ApiProperty({ example: 45.0, description: 'Sample weight in grams (for DESC_WEIGHT)', required: false }) @IsNumber() @IsOptional() sample_weight_g?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() unit_rate?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AquaHarvestDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() harvest_date: string;
  @ApiProperty({ example: 'PARTIAL', description: 'PARTIAL / FULL' }) @IsString() @IsNotEmpty() harvest_type: string;
  @ApiProperty({ example: 2000.0, description: 'Live fish kg harvested' }) @IsNumber() live_fish_kg: number;
  @ApiProperty({ example: 0.5, description: 'Average fish weight kg', required: false }) @IsNumber() @IsOptional() avg_weight_kg?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() lot_no?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AquaSlaughterDto {
  @ApiProperty({ example: 'uuid-aqua-batch-001' }) @IsString() @IsNotEmpty() source_batch_id: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() slaughter_date: string;
  @ApiProperty({ example: 7800.0, description: 'Input live fish kg' }) @IsNumber() input_kg: number;
  @ApiProperty({ example: 113100.0, description: 'Total input cost' }) @IsNumber() @IsOptional() input_cost?: number;
  @ApiProperty({ example: 12000.0, description: 'Overhead cost (ice, packaging, labour)' }) @IsNumber() @IsOptional() overhead_cost?: number;
  @ApiProperty({ example: 5460.0, description: 'Fillet kg output' }) @IsNumber() @IsOptional() fillet_kg?: number;
  @ApiProperty({ example: 70.0, description: 'Fillet cost split %' }) @IsNumber() @IsOptional() fillet_split_pct?: number;
  @ApiProperty({ example: 1170.0 }) @IsNumber() @IsOptional() meal_kg?: number;
  @ApiProperty({ example: 15.0 }) @IsNumber() @IsOptional() meal_split_pct?: number;
  @ApiProperty({ example: 780.0 }) @IsNumber() @IsOptional() skin_kg?: number;
  @ApiProperty({ example: 10.0 }) @IsNumber() @IsOptional() skin_split_pct?: number;
  @ApiProperty({ example: 'A', description: 'QC freshness grade' }) @IsString() @IsOptional() qc_freshness_grade?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
