import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVaccinationScheduleDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 'disease-uuid', required: false })
  @IsString()
  @IsOptional()
  disease_id?: string;

  @ApiProperty({ example: 'med-uuid', required: false })
  @IsString()
  @IsOptional()
  medicine_id?: string;

  @ApiProperty({ example: '2026-08-15T08:00:00Z' })
  @IsString()
  @IsNotEmpty()
  due_date: string;

  @ApiProperty({ example: 'user-uuid', required: false })
  @IsString()
  @IsOptional()
  assigned_to?: string;
}

export class CreateFeedScheduleDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 'feed-formula-uuid', required: false })
  @IsString()
  @IsOptional()
  feed_formula_id?: string;

  @ApiProperty({ example: 450.5, description: 'Scheduled quantity in KG' })
  @IsNumber()
  @IsNotEmpty()
  scheduled_qty: number;

  @ApiProperty({ example: '08:00', description: 'Scheduled time' })
  @IsString()
  @IsNotEmpty()
  scheduled_time: string;
}
