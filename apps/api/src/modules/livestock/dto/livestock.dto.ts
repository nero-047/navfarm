import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLivestockBatchDto {
  @ApiProperty({ example: 'BATCH-COW-2026-001' })
  @IsString() @IsNotEmpty()
  batch_code: string;

  @ApiProperty({ example: 'uuid-lob-06', description: 'LOB: LVS_COW / LVS_PIGGERY / LVS_GOAT' })
  @IsString() @IsNotEmpty()
  lob_id: string;

  @ApiProperty({ example: 'BIO_ASSET', description: 'BIO_ASSET / STANDARD' })
  @IsString() @IsNotEmpty()
  costing_method: string;

  @ApiProperty({ example: 20, description: 'Opening quantity (head count)' })
  @IsNumber()
  opening_qty: number;

  @ApiProperty({ example: 'uuid-item-heifer' })
  @IsString() @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 'uuid-loc-farm1' })
  @IsString() @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 25000.0, description: 'Purchase cost per head (NCA for Bio Asset)' })
  @IsNumber()
  @IsOptional()
  nca_purchase_cost?: number;

  @ApiProperty({ example: 5000.0, description: 'Residual value at end of useful life' })
  @IsNumber() @IsOptional()
  residual_value?: number;

  @ApiProperty({ example: 60, description: 'Useful life in months' })
  @IsInt() @IsOptional()
  useful_life_months?: number;

  @ApiProperty({ example: '2026-01-01' })
  @IsString() @IsNotEmpty()
  placement_date: string;

  @ApiProperty({ example: '2028-01-01', description: 'Expected maturity date', required: false })
  @IsString() @IsOptional()
  maturity_date?: string;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  notes?: string;
}

export class LivestockDailyEntryDto {
  @ApiProperty({ example: '2026-07-28' })
  @IsString() @IsNotEmpty()
  entry_date: string;

  @ApiProperty({ example: 'CONS_FEED', description: 'CONS_FEED / CONS_MEDICINE / OVHD_LABOR / DESC_WEIGHT / MORT_M' })
  @IsString() @IsNotEmpty()
  entry_type: string;

  @ApiProperty({ example: 'uuid-item-cattle-feed', required: false })
  @IsString() @IsOptional()
  item_id?: string;

  @ApiProperty({ example: 120, required: false })
  @IsNumber() @IsOptional()
  qty?: number;

  @ApiProperty({ example: 'KG', required: false })
  @IsString() @IsOptional()
  uom_id?: string;

  @ApiProperty({ example: 3.0, required: false })
  @IsNumber() @IsOptional()
  unit_rate?: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  notes?: string;
}

export class MilkHarvestDto {
  @ApiProperty({ example: '2026-07-28' })
  @IsString() @IsNotEmpty()
  record_date: string;

  @ApiProperty({ example: 100.5, description: 'Total litres produced today' })
  @IsNumber()
  litres_produced: number;

  @ApiProperty({ example: 25.0, description: 'Market rate per litre', required: false })
  @IsNumber() @IsOptional()
  unit_rate?: number;

  @ApiProperty({ example: 3.8, description: 'Fat %', required: false })
  @IsNumber() @IsOptional()
  fat_pct?: number;

  @ApiProperty({ example: 8.5, description: 'SNF %', required: false })
  @IsNumber() @IsOptional()
  snf_pct?: number;
}

export class OffspringRecordDto {
  @ApiProperty({ example: '2026-07-28' })
  @IsString() @IsNotEmpty()
  record_date: string;

  @ApiProperty({ example: 'PIGLET', description: 'PIGLET / KID / CALF / LAMB' })
  @IsString() @IsNotEmpty()
  offspring_type: string;

  @ApiProperty({ example: 12, description: 'Total born' })
  @IsInt()
  qty_born: number;

  @ApiProperty({ example: 11, description: 'Alive at birth', required: false })
  @IsInt() @IsOptional()
  qty_alive?: number;

  @ApiProperty({ example: 1.2, description: 'Average birth weight kg', required: false })
  @IsNumber() @IsOptional()
  avg_birth_weight_kg?: number;

  @ApiProperty({ required: false })
  @IsString() @IsOptional()
  notes?: string;
}

export class AmortisationRunDto {
  @ApiProperty({ example: 7, description: 'Month number (1-12)' })
  @IsInt()
  period_month: number;

  @ApiProperty({ example: 2026, description: 'Year' })
  @IsInt()
  period_year: number;
}

export class FairValueUpdateDto {
  @ApiProperty({ example: '2026-07-28' })
  @IsString() @IsNotEmpty()
  update_date: string;

  @ApiProperty({ example: 28000.0, description: 'Current market value per head' })
  @IsNumber()
  fair_value_per_unit: number;
}
