import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordEggSettingDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'farm-hatchery-uuid' })
  @IsString()
  @IsNotEmpty()
  farm_id: string;

  @ApiProperty({ example: 'shed-incubator-uuid' })
  @IsString()
  @IsNotEmpty()
  shed_id: string;

  @ApiProperty({ example: 'wh-hatchery-uuid' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-incubator-uuid' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'HATCH-SET-2026-01' })
  @IsString()
  @IsNotEmpty()
  batch_no: string;

  @ApiProperty({ example: '2026-08-01', description: 'Setting Date' })
  @IsDateString()
  @IsNotEmpty()
  setting_date: string;

  @ApiProperty({ example: 50000, description: 'Total Hatching Eggs Set' })
  @IsNumber()
  @IsNotEmpty()
  eggs_set_qty: number;
}

export class RecordHatchResultDto {
  @ApiProperty({ example: 'poultry-batch-uuid' })
  @IsString()
  @IsNotEmpty()
  poultry_batch_id: string;

  @ApiProperty({ example: '2026-08-22', description: 'Hatch Completion Date' })
  @IsDateString()
  @IsNotEmpty()
  hatch_date: string;

  @ApiProperty({ example: 46000, description: 'Fertile Eggs Candled (Day 18)' })
  @IsNumber()
  @IsNotEmpty()
  candled_fertile_qty: number;

  @ApiProperty({ example: 43500, description: 'Saleable Day-Old Chicks Hatched' })
  @IsNumber()
  @IsNotEmpty()
  chicks_hatched_qty: number;

  @ApiProperty({ example: 2500, description: 'Hatch Loss / Dead in Shell' })
  @IsNumber()
  @IsOptional()
  hatch_loss_qty?: number;
}
