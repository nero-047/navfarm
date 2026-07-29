import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAnimalDto {
  @ApiProperty({ example: 'HERD-001-UUID' }) @IsString() @IsNotEmpty() herd_id: string;
  @ApiProperty({ example: 'ET-2026-001', description: 'Unique ear tag' }) @IsString() @IsNotEmpty() ear_tag: string;
  @ApiProperty({ example: 'RFID-00A1B2', required: false }) @IsString() @IsOptional() rfid_tag?: string;
  @ApiProperty({ example: 'Bessie', required: false }) @IsString() @IsOptional() animal_name?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() species_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() breed_id?: string;
  @ApiProperty({ example: 'FEMALE', description: 'MALE/FEMALE/CASTRATED' }) @IsString() @IsNotEmpty() sex: string;
  @ApiProperty({ example: '2024-03-15', required: false }) @IsString() @IsOptional() date_of_birth?: string;
  @ApiProperty({ example: 'PURCHASED', description: 'PURCHASED/BORN_ON_FARM/IMPORTED' }) @IsString() @IsNotEmpty() origin: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() dam_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() sire_id?: string;
  @ApiProperty({ example: '2026-01-10', required: false }) @IsString() @IsOptional() purchase_date?: string;
  @ApiProperty({ example: 25000, required: false }) @IsNumber() @IsOptional() purchase_cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() supplier_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() current_location_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordWeightDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() weigh_date: string;
  @ApiProperty({ example: 425.5 }) @IsNumber() weight_kg: number;
  @ApiProperty({ example: 3.5, description: 'Body Condition Score (1.0-5.0)', required: false }) @IsNumber() @IsOptional() body_condition_score?: number;
  @ApiProperty({ example: 'SCALE', required: false }) @IsString() @IsOptional() method?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordVaccinationDto {
  @ApiProperty({ example: 'FMD Trivalent' }) @IsString() @IsNotEmpty() vaccine_name: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() medicine_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() disease_id?: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() vaccination_date: string;
  @ApiProperty({ example: 2.0, required: false }) @IsNumber() @IsOptional() dose_ml?: number;
  @ApiProperty({ example: 'IM', required: false }) @IsString() @IsOptional() route?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() batch_no?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() expiry_date?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() next_due_date?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() vet_name?: string;
  @ApiProperty({ example: 45.0, required: false }) @IsNumber() @IsOptional() cost_per_dose?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordTreatmentDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() treatment_date: string;
  @ApiProperty({ example: 'Mastitis', required: false }) @IsString() @IsOptional() diagnosis?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() disease_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() medicine_id?: string;
  @ApiProperty({ example: '10ml twice daily', required: false }) @IsString() @IsOptional() dosage?: string;
  @ApiProperty({ example: 'IM', required: false }) @IsString() @IsOptional() route?: string;
  @ApiProperty({ example: 5, required: false }) @IsNumber() @IsOptional() duration_days?: number;
  @ApiProperty({ example: 7, required: false }) @IsNumber() @IsOptional() withdrawal_period_days?: number;
  @ApiProperty({ example: 'Dr. Patel', required: false }) @IsString() @IsOptional() vet_name?: string;
  @ApiProperty({ example: 1200, required: false }) @IsNumber() @IsOptional() treatment_cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordMovementDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() movement_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() from_location_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() to_location_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() from_herd_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() to_herd_id?: string;
  @ApiProperty({ example: 'GRAZING', description: 'SALE/GRAZING/TREATMENT/WEANING/TRANSFER' }) @IsString() @IsNotEmpty() reason: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() movement_weight_kg?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordBreedingDto {
  @ApiProperty({ example: '2026-07-01' }) @IsString() @IsNotEmpty() breeding_date: string;
  @ApiProperty({ example: 'AI', description: 'AI/NATURAL/EMBRYO_TRANSFER' }) @IsString() @IsNotEmpty() method: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() sire_animal_id?: string;
  @ApiProperty({ example: 'HF-SEMEN-2026-009', required: false }) @IsString() @IsOptional() sire_code?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() sire_breed?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() technician?: string;
  @ApiProperty({ example: 1500, required: false }) @IsNumber() @IsOptional() cost?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class ConfirmPregnancyDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() pd_date: string;
  @ApiProperty({ example: 'POSITIVE', description: 'POSITIVE/NEGATIVE/INCONCLUSIVE' }) @IsString() @IsNotEmpty() pd_result: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() expected_calving_date?: string;
}

export class RecordCalvingDto {
  @ApiProperty({ example: '2026-10-15' }) @IsString() @IsNotEmpty() calving_date: string;
  @ApiProperty({ example: 'NORMAL', description: 'NORMAL/ASSISTED/VET_REQUIRED/CAESARIAN' }) @IsString() @IsOptional() calving_ease?: string;
  @ApiProperty({ example: 1 }) @IsNumber() calves_born: number;
  @ApiProperty({ example: 1 }) @IsNumber() calves_alive: number;
  @ApiProperty({ example: 38.5, required: false }) @IsNumber() @IsOptional() avg_birth_weight_kg?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() dam_condition_post?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class RecordMilkProductionDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() record_date: string;
  @ApiProperty({ example: 'AM', description: 'AM/PM/TOTAL' }) @IsString() @IsOptional() session?: string;
  @ApiProperty({ example: 18.5 }) @IsNumber() litres: number;
  @ApiProperty({ example: 3.8, required: false }) @IsNumber() @IsOptional() fat_pct?: number;
  @ApiProperty({ example: 8.5, required: false }) @IsNumber() @IsOptional() snf_pct?: number;
  @ApiProperty({ example: 3.2, required: false }) @IsNumber() @IsOptional() protein_pct?: number;
  @ApiProperty({ example: 180000, description: 'Somatic Cell Count', required: false }) @IsNumber() @IsOptional() somatic_cell_count?: number;
  @ApiProperty({ example: 32.0, description: 'Price per litre', required: false }) @IsNumber() @IsOptional() unit_rate?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() group_id?: string;
}

export class RecordMortalityDto {
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() death_date: string;
  @ApiProperty({ example: 'DISEASE', description: 'DISEASE/ACCIDENT/NATURAL/UNKNOWN' }) @IsString() @IsNotEmpty() cause_of_death: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() disease_id?: string;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() weight_at_death_kg?: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() salvage_value?: number;
  @ApiProperty({ example: 'BURIED', description: 'BURIED/CREMATED/RENDERING/SOLD_CULL', required: false }) @IsString() @IsOptional() disposal_method?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AnimalPurchaseDto {
  @ApiProperty({ example: 'PO-CATTLE-2026-001' }) @IsString() @IsNotEmpty() purchase_no: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() purchase_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() supplier_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() herd_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() species_id?: string;
  @ApiProperty({ example: 10 }) @IsNumber() qty_purchased: number;
  @ApiProperty({ example: 380.0, required: false }) @IsNumber() @IsOptional() avg_weight_kg?: number;
  @ApiProperty({ example: 28000 }) @IsNumber() unit_cost: number;
  @ApiProperty({ example: 5000, required: false }) @IsNumber() @IsOptional() transport_cost?: number;
  @ApiProperty({ example: 21, required: false }) @IsNumber() @IsOptional() quarantine_days?: number;
  @ApiProperty({ required: false, description: 'Warehouse UUID for inventory receipt' }) @IsString() @IsOptional() warehouse_id?: string;
  @ApiProperty({ required: false, description: 'Location UUID within warehouse' }) @IsString() @IsOptional() location_id?: string;
  @ApiProperty({ required: false, description: 'Item UUID for inventory receipt' }) @IsString() @IsOptional() item_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AnimalSaleDto {
  @ApiProperty({ example: 'SO-CATTLE-2026-001' }) @IsString() @IsNotEmpty() sale_no: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() sale_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() customer_id?: string;
  @ApiProperty({ example: 'LIVE', description: 'LIVE/SLAUGHTER/BREEDING' }) @IsString() @IsNotEmpty() sale_type: string;
  @ApiProperty({ example: 5 }) @IsNumber() qty_sold: number;
  @ApiProperty({ example: 425.0, required: false }) @IsNumber() @IsOptional() avg_weight_kg?: number;
  @ApiProperty({ example: 35000 }) @IsNumber() unit_price: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() transport_cost?: number;
  @ApiProperty({ required: false, description: 'Warehouse UUID for inventory issue' }) @IsString() @IsOptional() warehouse_id?: string;
  @ApiProperty({ required: false, description: 'Location UUID within warehouse' }) @IsString() @IsOptional() location_id?: string;
  @ApiProperty({ required: false, description: 'Item UUID for inventory issue' }) @IsString() @IsOptional() item_id?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class GrazingScheduleDto {
  @ApiProperty({ example: 'Pasture Block A' }) @IsString() @IsNotEmpty() field_name: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() location_id?: string;
  @ApiProperty({ example: '2026-07-28' }) @IsString() @IsNotEmpty() from_date: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() to_date?: string;
  @ApiProperty({ example: 5.5, required: false }) @IsNumber() @IsOptional() area_acres?: number;
  @ApiProperty({ example: 2500, description: 'Estimated biomass kg', required: false }) @IsNumber() @IsOptional() estimated_biomass_kg?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
