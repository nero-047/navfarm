import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PlaceChickBatchDto {
  @ApiProperty({ example: 'COMP-001', description: 'Company UUID' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'farm-001', description: 'Farm UUID' })
  @IsString()
  @IsNotEmpty()
  farm_id: string;

  @ApiProperty({ example: 'shed-001', description: 'Shed UUID' })
  @IsString()
  @IsNotEmpty()
  shed_id: string;

  @ApiProperty({ example: 'wh-001', description: 'Warehouse UUID' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-001', description: 'Location UUID' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'FLOCK-REAR-2026-01', description: 'Batch / Flock Code' })
  @IsString()
  @IsNotEmpty()
  batch_no: string;

  @ApiProperty({ example: 'breed-cobb500-uuid', required: false })
  @IsString()
  @IsOptional()
  breed_id?: string;

  @ApiProperty({ example: 'species-chicken-uuid', required: false })
  @IsString()
  @IsOptional()
  species_id?: string;

  @ApiProperty({ example: '2026-08-01', description: 'Placement Date' })
  @IsDateString()
  @IsNotEmpty()
  placement_date: string;

  @ApiProperty({ example: 10000, description: 'Initial Day-Old Chicks Placed' })
  @IsNumber()
  @IsNotEmpty()
  initial_bird_count: number;
}

export class RecordDailyRearingDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'farm-001' })
  @IsString()
  @IsNotEmpty()
  farm_id: string;

  @ApiProperty({ example: 'shed-001' })
  @IsString()
  @IsNotEmpty()
  shed_id: string;

  @ApiProperty({ example: 'poultry-batch-uuid' })
  @IsString()
  @IsNotEmpty()
  poultry_batch_id: string;

  @ApiProperty({ example: '2026-08-02' })
  @IsDateString()
  @IsNotEmpty()
  entry_date: string;

  @ApiProperty({ example: 'item-starter-feed-uuid', required: false })
  @IsString()
  @IsOptional()
  feed_item_id?: string;

  @ApiProperty({ example: 250.0, description: 'Feed Consumed (kg)', required: false })
  @IsNumber()
  @IsOptional()
  feed_consumed_kg?: number;

  @ApiProperty({ example: 500.0, description: 'Water Consumed (Liters)', required: false })
  @IsNumber()
  @IsOptional()
  water_consumed_liters?: number;

  @ApiProperty({ example: 5, description: 'Daily Mortality Count', required: false })
  @IsNumber()
  @IsOptional()
  mortality_count?: number;

  @ApiProperty({ example: 2, description: 'Daily Culling Count', required: false })
  @IsNumber()
  @IsOptional()
  culling_count?: number;

  @ApiProperty({ example: 45.0, description: 'Sample Weight per bird (grams)', required: false })
  @IsNumber()
  @IsOptional()
  avg_weight_grams?: number;

  @ApiProperty({ example: 32.5, description: 'Shed Temperature (C)', required: false })
  @IsNumber()
  @IsOptional()
  temperature_celsius?: number;

  @ApiProperty({ example: 65.0, description: 'Humidity (%)', required: false })
  @IsNumber()
  @IsOptional()
  humidity_pct?: number;

  @ApiProperty({ example: 'Starter feed day 2', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
