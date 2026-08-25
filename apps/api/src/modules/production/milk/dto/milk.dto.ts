import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsNumber, IsDateString, Min } from 'class-validator';

export const MILK_SESSIONS = ['MORNING', 'EVENING', 'BULK'] as const;

export class RecordMilkDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'The milking herd batch this yield belongs to' })
  @IsUUID()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ required: false, description: 'Set for a per-cow record; omit for a bulk/parlour record' })
  @IsOptional()
  @IsUUID()
  animal_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  operational_area_id?: string;

  @ApiProperty({ example: '2026-08-25' })
  @IsDateString()
  @IsNotEmpty()
  log_date: string;

  @ApiProperty({ enum: MILK_SESSIONS })
  @IsIn(MILK_SESSIONS as unknown as string[])
  session: string;

  @ApiProperty({ description: 'Litres produced in this session' })
  @IsNumber()
  @Min(0)
  quantity_litres: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fat_pct?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  snf_pct?: number;

  @ApiProperty({ required: false, description: 'Somatic cell count per mL' })
  @IsOptional()
  @IsNumber()
  scc_count?: number;

  @ApiProperty({ required: false, description: 'Bulk milk cooler temperature (°C)' })
  @IsOptional()
  @IsNumber()
  bmc_temperature_c?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class QueryMilkDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batch_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  animal_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  operational_area_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  log_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}
