import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePondDto {
  @ApiProperty({ example: 'POND-001' }) @IsString() @IsNotEmpty() pond_code: string;
  @ApiProperty({ example: 'Main Shrimp Pond 1' }) @IsString() @IsNotEmpty() pond_name: string;
  @ApiProperty({ example: 'EARTHEN', description: 'EARTHEN/CONCRETE/CAGE/RAS/BIOFLOC' }) @IsString() @IsOptional() pond_type?: string;
  @ApiProperty({ example: 5000, required: false, description: 'Area in sqm' }) @IsNumber() @IsOptional() area_sqm?: number;
  @ApiProperty({ example: 1.5, required: false, description: 'Depth in metres' }) @IsNumber() @IsOptional() depth_m?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() farm_id?: string;
  @ApiProperty({ example: 'BOREWELL', required: false }) @IsString() @IsOptional() water_source?: string;
  @ApiProperty({ example: 4, required: false }) @IsInt() @IsOptional() aerator_count?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class CreateTankDto {
  @ApiProperty({ example: 'TANK-001' }) @IsString() @IsNotEmpty() tank_code: string;
  @ApiProperty({ example: 'Grow-Out Tank A' }) @IsString() @IsNotEmpty() tank_name: string;
  @ApiProperty({ example: 'RAS', description: 'RAS/BIOFLOC/FLOW_THROUGH/RACEWAY' }) @IsString() @IsOptional() system_type?: string;
  @ApiProperty({ example: 25000, required: false, description: 'Capacity litres' }) @IsNumber() @IsOptional() capacity_litre?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() farm_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class StockPondDto {
  @ApiProperty({ example: 'SPECIES-UUID', required: false }) @IsString() @IsOptional() species_id?: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() stocking_date: string;
  @ApiProperty({ example: 50000, description: 'Number of fingerlings' }) @IsInt() fingerlings_qty: number;
  @ApiProperty({ example: 0.5, required: false, description: 'Avg fingerling weight grams' }) @IsNumber() @IsOptional() avg_fingerling_weight_g?: number;
  @ApiProperty({ example: 'XYZ Hatchery', required: false }) @IsString() @IsOptional() source?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() supplier_id?: string;
  @ApiProperty({ example: 2.5, required: false, description: 'Unit cost per fingerling' }) @IsNumber() @IsOptional() unit_cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class WaterQualityDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() log_date: string;
  @ApiProperty({ example: '08:00', required: false }) @IsString() @IsOptional() log_time?: string;
  @ApiProperty({ example: 7.8, required: false }) @IsNumber() @IsOptional() ph?: number;
  @ApiProperty({ example: 6.5, required: false, description: 'Dissolved Oxygen mg/L — ALERT < 5.0' }) @IsNumber() @IsOptional() do_mg_l?: number;
  @ApiProperty({ example: 28.5, required: false }) @IsNumber() @IsOptional() temperature_c?: number;
  @ApiProperty({ example: 0.25, required: false, description: 'Ammonia ppm — ALERT > 0.5' }) @IsNumber() @IsOptional() ammonia_ppm?: number;
  @ApiProperty({ example: 0.05, required: false }) @IsNumber() @IsOptional() nitrite_ppm?: number;
  @ApiProperty({ example: 20.0, required: false }) @IsNumber() @IsOptional() nitrate_ppm?: number;
  @ApiProperty({ example: 25.0, required: false, description: 'Turbidity NTU' }) @IsNumber() @IsOptional() turbidity_ntu?: number;
  @ApiProperty({ example: 15.0, required: false, description: 'Salinity ppt' }) @IsNumber() @IsOptional() salinity_ppt?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch_id?: string;
}

export class GrowthSampleDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() sample_date: string;
  @ApiProperty({ example: 30, required: false, description: 'Culture day since stocking' }) @IsInt() @IsOptional() culture_day?: number;
  @ApiProperty({ example: 50, description: 'Number of fish sampled' }) @IsInt() sample_count: number;
  @ApiProperty({ example: 18.5, description: 'Average body weight grams (ABW)' }) @IsNumber() avg_weight_g: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class MortalityEventDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() event_date: string;
  @ApiProperty({ example: 250, description: 'Number of dead fish' }) @IsInt() qty_dead: number;
  @ApiProperty({ example: 'LOW_DO', description: 'DISEASE/LOW_DO/TEMPERATURE/PREDATOR/UNKNOWN' }) @IsString() @IsNotEmpty() cause: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() remarks?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() action_taken?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch_id?: string;
}

export class DiseaseEventDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() event_date: string;
  @ApiProperty({ example: 'Lethargy, loss of appetite, white spots on body' }) @IsString() @IsNotEmpty() symptoms: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() diagnosis?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() pathogen?: string;
  @ApiProperty({ example: 'MODERATE', description: 'MILD/MODERATE/SEVERE/CRITICAL' }) @IsString() @IsOptional() severity?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() treatment_protocol?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() medicine_used?: string;
  @ApiProperty({ example: 14, required: false }) @IsInt() @IsOptional() withdrawal_days?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() vet_name?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch_id?: string;
}

export class PondTreatmentDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() treatment_date: string;
  @ApiProperty({ example: 'LIMING', description: 'DISINFECTION/LIMING/PROBIOTIC/ALGAECIDE' }) @IsString() @IsNotEmpty() purpose: string;
  @ApiProperty({ example: 'Agricultural Lime (CaCO3)' }) @IsString() @IsNotEmpty() chemical_name: string;
  @ApiProperty({ example: 250.0, required: false, description: 'Qty kg' }) @IsNumber() @IsOptional() qty_kg?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
