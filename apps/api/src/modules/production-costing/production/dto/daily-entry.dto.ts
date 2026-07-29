import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordDailyProductionDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: '2026-08-05', description: 'Log Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  entry_date: string;

  @ApiProperty({ example: 100.0, description: 'Produced Quantity Today', required: false })
  @IsNumber()
  @IsOptional()
  produced_qty?: number;

  @ApiProperty({ example: 95.0, description: 'Consumed Quantity Today', required: false })
  @IsNumber()
  @IsOptional()
  consumed_qty?: number;

  @ApiProperty({ example: 2.0, description: 'Mortality / Loss Quantity', required: false })
  @IsNumber()
  @IsOptional()
  mortality_qty?: number;

  @ApiProperty({ example: 1.0, description: 'Scrap Quantity', required: false })
  @IsNumber()
  @IsOptional()
  scrap_qty?: number;

  @ApiProperty({ example: 15, description: 'Machine Downtime in Minutes', required: false })
  @IsNumber()
  @IsOptional()
  downtime_minutes?: number;

  @ApiProperty({ example: 'Normal shift operations', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
