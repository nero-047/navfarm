import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordEggProductionDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'poultry-batch-uuid' })
  @IsString()
  @IsNotEmpty()
  poultry_batch_id: string;

  @ApiProperty({ example: 'wh-main-uuid', description: 'Warehouse to receive eggs into' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-egg-uuid', description: 'Location to receive eggs into' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'item-egg-grade-a-uuid', description: 'Egg Item UUID for inventory' })
  @IsString()
  @IsNotEmpty()
  egg_item_id: string;

  @ApiProperty({ example: 'uom-piece-uuid', description: 'Egg UoM UUID' })
  @IsString()
  @IsNotEmpty()
  uom_id: string;

  @ApiProperty({ example: '2026-08-05' })
  @IsDateString()
  @IsNotEmpty()
  log_date: string;

  @ApiProperty({ example: 8500, description: 'Good Commercial Eggs' })
  @IsNumber()
  @IsNotEmpty()
  good_eggs: number;

  @ApiProperty({ example: 120, description: 'Cracked Eggs', required: false })
  @IsNumber()
  @IsOptional()
  cracked_eggs?: number;

  @ApiProperty({ example: 80, description: 'Dirty Eggs', required: false })
  @IsNumber()
  @IsOptional()
  dirty_eggs?: number;

  @ApiProperty({ example: 50, description: 'Double Yolk Eggs', required: false })
  @IsNumber()
  @IsOptional()
  double_yolk?: number;
}
