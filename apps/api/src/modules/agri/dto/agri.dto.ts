import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgriBatchDto {
  @ApiProperty({ example: 'BATCH-CROP-2026-001' })
  @IsString() @IsNotEmpty() batch_code: string;

  @ApiProperty({ example: 'uuid-lob-10', description: 'AGRI_FRUIT/AGRI_CROP/AGRI_SEEDS/AGRI_FLOWER' })
  @IsString() @IsNotEmpty() lob_id: string;

  @ApiProperty({ example: 'STANDARD', description: 'STANDARD / BIO_ASSET / FIFO' })
  @IsString() @IsNotEmpty() costing_method: string;

  @ApiProperty({ example: 'uuid-item-paddy' }) @IsString() @IsNotEmpty() crop_item_id: string;
  @ApiProperty({ example: 'uuid-loc-field1' }) @IsString() @IsNotEmpty() location_id: string;

  @ApiProperty({ example: 10.0, description: 'Area in acres (crop farming)', required: false })
  @IsNumber() @IsOptional() area_acres?: number;

  @ApiProperty({ example: 'PREMATURE', description: 'PREMATURE/MATURE for fruit farming', required: false })
  @IsString() @IsOptional() bio_asset_stage?: string;

  @ApiProperty({ example: 5, description: 'Premature years (fruit trees)', required: false })
  @IsInt() @IsOptional() premature_years?: number;

  @ApiProperty({ example: 90000.0, description: 'NCA cost for Bio Asset', required: false })
  @IsNumber() @IsOptional() nca_cost?: number;

  @ApiProperty({ example: 8000.0, description: 'Annual amortisation', required: false })
  @IsNumber() @IsOptional() annual_amortisation?: number;

  @ApiProperty({ example: 2026, required: false }) @IsInt() @IsOptional() season_year?: number;
  @ApiProperty({ example: '2026-06-01', required: false }) @IsString() @IsOptional() sowing_date?: string;
  @ApiProperty({ example: '2026-10-01', required: false }) @IsString() @IsOptional() expected_harvest_date?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AgriFieldInputDto {
  @ApiProperty({ example: '2026-07-01' }) @IsString() @IsNotEmpty() input_date: string;
  @ApiProperty({ example: 'CONS_OTHER', description: 'CONS_OTHER/OVHD_LABOR/CONS_MEDICINE' }) @IsString() @IsNotEmpty() entry_type: string;
  @ApiProperty({ example: 'uuid-item-fertiliser', required: false }) @IsString() @IsOptional() item_id?: string;
  @ApiProperty({ example: 300 }) @IsNumber() qty: number;
  @ApiProperty({ example: 'KG', required: false }) @IsString() @IsOptional() uom_id?: string;
  @ApiProperty({ example: 25.0, required: false }) @IsNumber() @IsOptional() unit_rate?: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}

export class AgriHarvestDto {
  @ApiProperty({ example: '2026-10-20' }) @IsString() @IsNotEmpty() harvest_date: string;
  @ApiProperty({ example: 'FULL', description: 'FULL / PARTIAL' }) @IsString() @IsNotEmpty() harvest_type: string;
  @ApiProperty({ example: 'uuid-item-paddy' }) @IsString() @IsNotEmpty() output_item_id: string;
  @ApiProperty({ example: 5200.0 }) @IsNumber() qty_harvested: number;
  @ApiProperty({ example: 'KG', required: false }) @IsString() @IsOptional() uom_id?: string;
  @ApiProperty({ example: 'PASS', description: 'QC result', required: false }) @IsString() @IsOptional() qc_result?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() notes?: string;
}
