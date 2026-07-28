import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMODto {
  @ApiProperty({ example: 'MO-FEED-2026-001' }) @IsString() @IsNotEmpty() mo_no: string;
  @ApiProperty({ example: 'BOR-UUID' }) @IsString() @IsNotEmpty() bor_id: string;
  @ApiProperty({ example: 10.0, description: 'Planned quantity in metric tonnes' }) @IsNumber() planned_qty_mt: number;
  @ApiProperty({ example: '2026-07-29', required: false }) @IsString() @IsOptional() planned_start_date?: string;
  @ApiProperty({ example: '2026-07-30', required: false }) @IsString() @IsOptional() planned_end_date?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() target_warehouse_id?: string;
  @ApiProperty({ example: 'NORMAL', required: false }) @IsString() @IsOptional() priority?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class UpdateStageDto {
  @ApiProperty({ example: 'COMPLETED', description: 'IN_PROGRESS/COMPLETED/SKIPPED' }) @IsString() @IsNotEmpty() status: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() output_qty_mt?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() stage_loss_pct?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() remarks?: string;
}

export class QcInspectionDto {
  @ApiProperty({ example: '2026-07-30' }) @IsString() @IsNotEmpty() inspection_date: string;
  @ApiProperty({ example: 10.5, required: false, description: 'Moisture % (max 12%)' }) @IsNumber() @IsOptional() moisture_pct?: number;
  @ApiProperty({ example: 22.0, required: false, description: 'Protein %' }) @IsNumber() @IsOptional() protein_pct?: number;
  @ApiProperty({ example: 4.5, required: false, description: 'Fat %' }) @IsNumber() @IsOptional() fat_pct?: number;
  @ApiProperty({ example: 5.0, required: false, description: 'Fiber %' }) @IsNumber() @IsOptional() fiber_pct?: number;
  @ApiProperty({ example: 7.5, required: false, description: 'Ash %' }) @IsNumber() @IsOptional() ash_pct?: number;
  @ApiProperty({ example: 96.5, required: false, description: 'Pellet Durability Index %' }) @IsNumber() @IsOptional() pellet_durability_pct?: number;
  @ApiProperty({ example: 2.5, required: false, description: 'Aflatoxin ppb (max 10)' }) @IsNumber() @IsOptional() aflatoxin_ppb?: number;
  @ApiProperty({ example: 'PASS', description: 'PASS/FAIL/CONDITIONAL_PASS' }) @IsString() @IsNotEmpty() qc_result: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() rejection_reason?: string;
  @ApiProperty({ example: 'RELEASE', description: 'RELEASE/QUARANTINE/REWORK/DESTROY' }) @IsString() @IsNotEmpty() disposition: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() inspector?: string;
}

export class CreateDeliveryDto {
  @ApiProperty({ example: 'DN-2026-001' }) @IsString() @IsNotEmpty() delivery_no: string;
  @ApiProperty({ example: '2026-07-30' }) @IsString() @IsNotEmpty() delivery_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() customer_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() farm_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() feed_item_id?: string;
  @ApiProperty({ example: 5.0, description: 'Quantity in metric tonnes' }) @IsNumber() qty_mt: number;
  @ApiProperty({ example: 32000, required: false, description: 'Unit price per MT' }) @IsNumber() @IsOptional() unit_price?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() vehicle_no?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() driver_name?: string;
  @ApiProperty({ required: false, description: 'Warehouse UUID for inventory issue' }) @IsString() @IsOptional() warehouse_id?: string;
  @ApiProperty({ required: false, description: 'Location UUID within warehouse' }) @IsString() @IsOptional() location_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class IngredientPriceDto {
  @ApiProperty({ example: 'ITEM-UUID' }) @IsString() @IsNotEmpty() item_id: string;
  @ApiProperty({ example: '2026-07-01' }) @IsString() @IsNotEmpty() effective_date: string;
  @ApiProperty({ example: 18500, description: 'Price per metric tonne' }) @IsNumber() price_per_mt: number;
  @ApiProperty({ example: 'SPOT', description: 'SPOT/CONTRACT/AVERAGE' }) @IsString() @IsOptional() source?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() supplier_id?: string;
}

export class CostBreakdownDto {
  @ApiProperty({ example: 210000, description: 'Ingredient cost' }) @IsNumber() ingredient_cost: number;
  @ApiProperty({ example: 12000, required: false }) @IsNumber() @IsOptional() overhead_cost?: number;
  @ApiProperty({ example: 8000, required: false }) @IsNumber() @IsOptional() labour_cost?: number;
  @ApiProperty({ example: 5000, required: false }) @IsNumber() @IsOptional() energy_cost?: number;
  @ApiProperty({ example: 4000, required: false }) @IsNumber() @IsOptional() packaging_cost?: number;
  @ApiProperty({ example: 10.0, description: 'Actual produced qty MT' }) @IsNumber() produced_qty_mt: number;
}
