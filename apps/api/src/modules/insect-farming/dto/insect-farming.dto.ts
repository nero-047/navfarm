import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInsectBatchDto {
  @ApiProperty({ example: 'BATCH-BEE-2026-001' }) @IsString() @IsNotEmpty() batch_code: string;
  @ApiProperty({ example: 'uuid-lob-15' }) @IsString() @IsNotEmpty() lob_id: string;
  @ApiProperty({ example: 'BEE', description: 'BEE / BSF' }) @IsString() @IsNotEmpty() insect_type: string;
  @ApiProperty({ example: 'uuid-loc-apiary1' }) @IsString() @IsNotEmpty() location_id: string;
  @ApiProperty({ example: 50, description: 'Number of hives/units' }) @IsInt() hive_count: number;
  @ApiProperty({ example: 3000.0, description: 'Cost per hive' }) @IsNumber() hive_cost_per_unit: number;
  @ApiProperty({ example: '2026-01-01' }) @IsString() @IsNotEmpty() setup_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class InsectDailyEntryDto {
  @ApiProperty({ example: '2026-07-01' }) @IsString() @IsNotEmpty() entry_date: string;
  @ApiProperty({ example: 'CONS_FEED', description: 'CONS_FEED/OVHD_LABOR/OVHD_OTHER' }) @IsString() @IsNotEmpty() entry_type: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() item_id?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() qty?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() uom_id?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() unit_rate?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class InsectHarvestDto {
  @ApiProperty({ example: '2026-06-15' }) @IsString() @IsNotEmpty() harvest_date: string;
  @ApiProperty({ example: 'uuid-item-honey-raw' }) @IsString() @IsNotEmpty() main_product_item_id: string;
  @ApiProperty({ example: 875.0, description: 'Main product quantity kg' }) @IsNumber() main_qty_kg: number;
  @ApiProperty({ example: 95.0, description: 'Main product cost split %' }) @IsNumber() @IsOptional() main_split_pct?: number;
  @ApiProperty({ example: 'uuid-item-beeswax', required: false }) @IsString() @IsOptional() byproduct_item_id?: string;
  @ApiProperty({ example: 45.0, required: false }) @IsNumber() @IsOptional() byproduct_qty_kg?: number;
  @ApiProperty({ example: 5.0, required: false }) @IsNumber() @IsOptional() byproduct_split_pct?: number;
  @ApiProperty({ example: 16.5, description: 'Moisture %', required: false }) @IsNumber() @IsOptional() moisture_pct?: number;
  @ApiProperty({ example: 'PASS', required: false }) @IsString() @IsOptional() qc_result?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
