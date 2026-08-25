import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsIn, IsInt, Min, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

const ANIMAL_TYPES = ['SOW', 'BOAR', 'GILT', 'PIGLET', 'COMMERCIAL_PIG'] as const;
const GENDERS = ['F', 'M'] as const;
const ENTRY_TYPES = ['PURCHASED_IMPORTED', 'PURCHASED_LOCAL', 'BORN_ON_FARM', 'TRANSFERRED_IN'] as const;
const STATUSES = ['ACTIVE', 'QUARANTINE', 'SICK', 'PREGNANT', 'LACTATING', 'DRY', 'CULLED', 'DEAD', 'SOLD', 'SLAUGHTERED'] as const;
export const DISPOSAL_TYPES = ['SOLD', 'SLAUGHTERED', 'DIED', 'TRANSFERRED'] as const;
const BREEDING_TIERS = ['GGP', 'GP', 'PS', 'COMMERCIAL'] as const;

export class CreateAnimalDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Nature of Business UUID scope' })
  @IsString()
  @IsNotEmpty()
  nob_id: string;

  @ApiProperty({ description: 'Line of Business UUID scope' })
  @IsString()
  @IsNotEmpty()
  lob_id: string;

  @ApiProperty({ description: 'Animal type', enum: ANIMAL_TYPES })
  @IsString()
  @IsIn(ANIMAL_TYPES)
  animal_type: string;

  @ApiProperty({ description: 'Breed UUID' })
  @IsUUID()
  @IsNotEmpty()
  breed_id: string;

  @ApiProperty({ description: 'Gender', enum: GENDERS })
  @IsString()
  @IsIn(GENDERS)
  gender: string;

  @ApiProperty({ description: 'Date of birth — omit if born on this farm and unknown or if imported/unknown', required: false })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ description: 'How this animal entered the register', enum: ENTRY_TYPES })
  @IsString()
  @IsIn(ENTRY_TYPES)
  entry_type: string;

  @ApiProperty({ description: 'Date animal arrived or was born on this farm' })
  @IsDateString()
  @IsNotEmpty()
  entry_date: string;

  @ApiProperty({ description: 'Goods Receipt UUID this animal arrived on — required if entry_type is PURCHASED_IMPORTED/PURCHASED_LOCAL', required: false })
  @IsUUID()
  @IsOptional()
  source_receipt_id?: string;

  @ApiProperty({ description: 'Batch UUID that produced this animal — required if entry_type is BORN_ON_FARM', required: false })
  @IsUUID()
  @IsOptional()
  source_batch_id?: string;

  @ApiProperty({ description: 'Item UUID (LIVING_ASSET catalogue entry) for this animal type' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'RFID ear tag number for scanning — unique if set', required: false })
  @IsString()
  @IsOptional()
  rfid_tag?: string;

  @ApiProperty({ description: 'Visual ear tag number', required: false })
  @IsString()
  @IsOptional()
  ear_tag?: string;

  @ApiProperty({ description: 'Father boar UUID — self-referential', required: false })
  @IsUUID()
  @IsOptional()
  sire_animal_id?: string;

  @ApiProperty({ description: 'Mother sow UUID — self-referential', required: false })
  @IsUUID()
  @IsOptional()
  dam_animal_id?: string;

  @ApiProperty({ description: 'Breeding-pyramid tier: GGP (nucleus), GP (grandparent), PS (parent stock), COMMERCIAL', enum: BREEDING_TIERS, required: false })
  @IsString()
  @IsIn(BREEDING_TIERS)
  @IsOptional()
  breeding_tier?: string;

  @ApiProperty({ description: 'Purchase price per animal' })
  @IsNumber()
  @IsNotEmpty()
  acquisition_cost: number;

  @ApiProperty({ description: 'Transport/import duty/quarantine charges per head for imported animals', required: false })
  @IsNumber()
  @IsOptional()
  landing_cost?: number;

  @ApiProperty({ description: 'Current production stage UUID', required: false })
  @IsUUID()
  @IsOptional()
  current_stage_id?: string;

  @ApiProperty({ description: 'Batch UUID this animal is currently in', required: false })
  @IsUUID()
  @IsOptional()
  current_batch_id?: string;

  @ApiProperty({ description: 'Current shed/pen location UUID', required: false })
  @IsUUID()
  @IsOptional()
  current_location_id?: string;

  @ApiProperty({ description: 'Date animal entered productive stage — first farrowing or PRODUCTIVE_SOW status', required: false })
  @IsDateString()
  @IsOptional()
  productive_life_start?: string;

  @ApiProperty({ description: 'Status', enum: STATUSES, required: false, default: 'ACTIVE' })
  @IsString()
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateAnimalDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  breed_id?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rfid_tag?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ear_tag?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  sire_animal_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  dam_animal_id?: string;

  @ApiProperty({ enum: BREEDING_TIERS, required: false })
  @IsString()
  @IsIn(BREEDING_TIERS)
  @IsOptional()
  breeding_tier?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  current_stage_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  current_batch_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  current_location_id?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  parity_count?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  total_piglets_born_live?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  total_piglets_weaned?: number;

  @ApiProperty({ description: 'Not ledger-derived yet — settable directly until per-animal bio-asset ledger integration exists', required: false })
  @IsNumber()
  @IsOptional()
  current_bio_asset_value?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  total_amortised?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  book_value?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  residual_value?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  amortisation_monthly?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  productive_life_start?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  expected_cull_date?: string;

  @ApiProperty({ required: false, enum: STATUSES })
  @IsString()
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DisposeAnimalDto {
  @ApiProperty({ description: 'How this animal left the register', enum: DISPOSAL_TYPES })
  @IsString()
  @IsIn(DISPOSAL_TYPES)
  disposal_type: string;

  @ApiProperty({ description: 'Date of sale/slaughter/death' })
  @IsDateString()
  @IsNotEmpty()
  disposal_date: string;

  @ApiProperty({ description: 'Sale/salvage value realised, if any', required: false })
  @IsNumber()
  @IsOptional()
  disposal_value?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryAnimalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  breedId?: string;

  @ApiProperty({ required: false, enum: ANIMAL_TYPES })
  @IsOptional()
  @IsString()
  animalType?: string;

  @ApiProperty({ required: false, enum: STATUSES })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  currentBatchId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  currentLocationId?: string;

  @ApiProperty({ description: 'Search animal_code, rfid_tag, or ear_tag', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Include disposed (is_active=false) animals', required: false, default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDisposed?: boolean;

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

export class TransitionAnimalStageDto {
  @ApiProperty({ description: 'Destination Stage UUID' })
  @IsUUID()
  @IsNotEmpty()
  to_stage_id: string;

  @ApiProperty({ description: 'Destination Location / Pen UUID (optional)', required: false })
  @IsUUID()
  @IsOptional()
  to_location_id?: string;

  @ApiProperty({ description: 'Destination Batch UUID (optional)', required: false })
  @IsUUID()
  @IsOptional()
  to_batch_id?: string;

  @ApiProperty({ description: 'Date of stage movement', example: '2026-08-19' })
  @IsDateString()
  @IsNotEmpty()
  transition_date: string;

  @ApiProperty({ description: 'Reason for transition / Trigger condition (e.g. PREGNANCY_CONFIRMED, WEANED, MANUAL)', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

