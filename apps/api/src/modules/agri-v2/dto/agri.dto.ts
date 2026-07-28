import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFieldDto {
  @ApiProperty({ example: 'FIELD-A-001' }) @IsString() @IsNotEmpty() field_code: string;
  @ApiProperty({ example: 'North Block A' }) @IsString() @IsNotEmpty() field_name: string;
  @ApiProperty({ example: 12.5, description: 'Area in acres' }) @IsNumber() area_acres: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() farm_id?: string;
  @ApiProperty({ example: 'LOAM', required: false }) @IsString() @IsOptional() soil_type?: string;
  @ApiProperty({ example: 6.5, required: false }) @IsNumber() @IsOptional() soil_ph?: number;
  @ApiProperty({ example: 17.123456, required: false }) @IsNumber() @IsOptional() gps_lat?: number;
  @ApiProperty({ example: 78.456789, required: false }) @IsNumber() @IsOptional() gps_long?: number;
  @ApiProperty({ example: 'DRIP', required: false, description: 'DRIP/SPRINKLER/FLOOD/RAINFED' }) @IsString() @IsOptional() irrigation_type?: string;
  @ApiProperty({ example: 'BOREWELL', required: false }) @IsString() @IsOptional() water_source?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class SoilAnalysisDto {
  @ApiProperty({ example: '2026-07-01' }) @IsString() @IsNotEmpty() test_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() lab_name?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() report_no?: string;
  @ApiProperty({ example: 6.5, required: false }) @IsNumber() @IsOptional() ph?: number;
  @ApiProperty({ example: 180.0, required: false, description: 'N kg/ha' }) @IsNumber() @IsOptional() nitrogen_kg_ha?: number;
  @ApiProperty({ example: 45.0, required: false, description: 'P kg/ha' }) @IsNumber() @IsOptional() phosphorus_kg_ha?: number;
  @ApiProperty({ example: 220.0, required: false, description: 'K kg/ha' }) @IsNumber() @IsOptional() potassium_kg_ha?: number;
  @ApiProperty({ example: 2.3, required: false }) @IsNumber() @IsOptional() organic_matter_pct?: number;
  @ApiProperty({ example: 0.48, required: false, description: 'Electrical conductivity dS/m' }) @IsNumber() @IsOptional() ec_ds_m?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() recommendations?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() next_test_due?: string;
}

export class CreateCropPlanDto {
  @ApiProperty({ example: 'FIELD-001-UUID' }) @IsString() @IsNotEmpty() field_id: string;
  @ApiProperty({ example: 'KHARIF-2026' }) @IsString() @IsNotEmpty() season: string;
  @ApiProperty({ example: 'CROP-ITEM-UUID', required: false }) @IsString() @IsOptional() crop_item_id?: string;
  @ApiProperty({ example: 'IR-64', required: false }) @IsString() @IsOptional() crop_variety?: string;
  @ApiProperty({ example: 'DIRECT_SEED', required: false }) @IsString() @IsOptional() sowing_method?: string;
  @ApiProperty({ example: '2026-06-15', required: false }) @IsString() @IsOptional() planned_sowing_date?: string;
  @ApiProperty({ example: '2026-10-15', required: false }) @IsString() @IsOptional() planned_harvest_date?: string;
  @ApiProperty({ example: 6500, required: false, description: 'Target yield kg/acre' }) @IsNumber() @IsOptional() target_yield_kg_acre?: number;
  @ApiProperty({ example: 25.0, required: false, description: 'Total seed qty kg' }) @IsNumber() @IsOptional() seed_qty_kg?: number;
  @ApiProperty({ example: 2.0, required: false, description: 'Seed rate kg/acre' }) @IsNumber() @IsOptional() seed_rate_kg_acre?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class UpdateCalendarActivityDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() actual_date: string;
  @ApiProperty({ example: 'DONE', description: 'DONE/SKIPPED' }) @IsString() @IsNotEmpty() status: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() cost_actual?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() remarks?: string;
}

export class IrrigationLogDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() irrigation_date: string;
  @ApiProperty({ example: 'DRIP', required: false }) @IsString() @IsOptional() method?: string;
  @ApiProperty({ example: 4.5, required: false, description: 'Duration hours' }) @IsNumber() @IsOptional() duration_hrs?: number;
  @ApiProperty({ example: 12500, required: false, description: 'Volume litres' }) @IsNumber() @IsOptional() volume_litre?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() remarks?: string;
}

export class FertilizerAppDto {
  @ApiProperty({ example: '2026-07-10' }) @IsString() @IsNotEmpty() app_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() fertilizer_item_id?: string;
  @ApiProperty({ example: 'Urea 46%' }) @IsString() @IsNotEmpty() fertilizer_name: string;
  @ApiProperty({ example: 125.0, description: 'Qty in kg' }) @IsNumber() qty_kg: number;
  @ApiProperty({ example: 'BASAL', required: false, description: 'BASAL/TILLERING/FLOWERING/GRAIN_FILL' }) @IsString() @IsOptional() growth_stage?: string;
  @ApiProperty({ example: 'BROADCAST', required: false }) @IsString() @IsOptional() method?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() cost?: number;
  @ApiProperty({ required: false, description: 'Warehouse UUID for inventory issue' }) @IsString() @IsOptional() warehouse_id?: string;
  @ApiProperty({ required: false, description: 'Location UUID within warehouse' }) @IsString() @IsOptional() location_id?: string;
}

export class PesticideAppDto {
  @ApiProperty({ example: '2026-07-15' }) @IsString() @IsNotEmpty() app_date: string;
  @ApiProperty({ example: 'INSECT', description: 'INSECT/FUNGAL/WEED/BACTERIAL' }) @IsString() @IsNotEmpty() pest_type: string;
  @ApiProperty({ example: 'Brown Plant Hopper', required: false }) @IsString() @IsOptional() pest_name?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() pesticide_item_id?: string;
  @ApiProperty({ example: 'Chlorpyrifos 20% EC' }) @IsString() @IsNotEmpty() pesticide_name: string;
  @ApiProperty({ example: 2.5, description: 'Qty litres' }) @IsNumber() qty_litre: number;
  @ApiProperty({ example: '1:100', required: false }) @IsString() @IsOptional() dilution_ratio?: string;
  @ApiProperty({ example: 14, description: 'Pre-Harvest Interval days' }) @IsInt() @IsNotEmpty() phi_days: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() cost?: number;
  @ApiProperty({ required: false, description: 'Warehouse UUID for inventory issue' }) @IsString() @IsOptional() warehouse_id?: string;
  @ApiProperty({ required: false, description: 'Location UUID within warehouse' }) @IsString() @IsOptional() location_id?: string;
}

export class CreateHarvestPlanDto {
  @ApiProperty({ example: '2026-10-20' }) @IsString() @IsNotEmpty() target_harvest_date: string;
  @ApiProperty({ example: 78000, required: false, description: 'Expected yield kg' }) @IsNumber() @IsOptional() expected_yield_kg?: number;
  @ApiProperty({ example: 'MECHANICAL', required: false }) @IsString() @IsOptional() harvest_method?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordHarvestDto {
  @ApiProperty({ example: 78500, description: 'Actual yield kg' }) @IsNumber() actual_yield_kg: number;
  @ApiProperty({ example: 6280, description: 'Sale price per kg', required: false }) @IsNumber() @IsOptional() sale_price_per_kg?: number;
  @ApiProperty({ example: 250000, description: 'Total production cost', required: false }) @IsNumber() @IsOptional() total_production_cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() inventory_gr_id?: string;
  @ApiProperty({ required: false, description: 'Warehouse UUID for harvest receipt' }) @IsString() @IsOptional() warehouse_id?: string;
  @ApiProperty({ required: false, description: 'Location UUID within warehouse' }) @IsString() @IsOptional() location_id?: string;
}

export class ResourceAssignmentDto {
  @ApiProperty({ required: false }) @IsString() @IsOptional() activity_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() resource_id?: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() assigned_date: string;
  @ApiProperty({ example: 8.0, required: false }) @IsNumber() @IsOptional() hours_planned?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() rate_per_hour?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
