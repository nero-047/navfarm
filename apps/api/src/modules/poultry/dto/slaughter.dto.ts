import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordSlaughterYieldDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'poultry-batch-uuid' })
  @IsString()
  @IsNotEmpty()
  poultry_batch_id: string;

  @ApiProperty({ example: 'wh-plant-uuid' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-fg-meat-uuid' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'item-whole-bird-uuid', description: 'Finished Meat Item UUID' })
  @IsString()
  @IsNotEmpty()
  meat_item_id: string;

  @ApiProperty({ example: 'uom-kg-uuid' })
  @IsString()
  @IsNotEmpty()
  uom_id: string;

  @ApiProperty({ example: '2026-08-25' })
  @IsDateString()
  @IsNotEmpty()
  slaughter_date: string;

  @ApiProperty({ example: 5000, description: 'Live Birds Received at Plant' })
  @IsNumber()
  @IsNotEmpty()
  live_birds_received: number;

  @ApiProperty({ example: 10500.0, description: 'Total Live Weight (kg)' })
  @IsNumber()
  @IsNotEmpty()
  total_live_weight_kg: number;

  @ApiProperty({ example: 7875.0, description: 'Total Dressed Meat Weight (kg)' })
  @IsNumber()
  @IsNotEmpty()
  dressed_weight_kg: number;
}
