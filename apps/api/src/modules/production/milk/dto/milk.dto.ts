import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

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
  // The console appends the active company as `companyId`; the global pipe runs
  // forbidNonWhitelisted, so an undeclared param 400s the whole list request and
  // the page renders an empty state over data that exists. Accepted as an alias
  // of company_id below.
  @ApiProperty({ required: false, description: 'Active company scope (camelCase alias of company_id)' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

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

  // Every other list endpoint paginates; these three did not declare it, so a
  // screen adding pagination would 400 the whole request.
  @ApiProperty({ description: 'Results per page', default: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: 'Pagination offset', default: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
