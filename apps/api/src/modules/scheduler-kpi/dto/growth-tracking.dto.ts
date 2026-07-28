import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordWeightDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 50, description: 'Number of sample birds weighed' })
  @IsNumber()
  @IsNotEmpty()
  sample_count: number;

  @ApiProperty({ example: 1850.5, description: 'Average weight in grams' })
  @IsNumber()
  @IsNotEmpty()
  average_weight_grams: number;

  @ApiProperty({ example: 1900.0, required: false })
  @IsNumber()
  @IsOptional()
  target_weight_grams?: number;

  @ApiProperty({ example: 65.2, required: false })
  @IsNumber()
  @IsOptional()
  daily_gain_grams?: number;
}

export class RecordMortalityDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 12, description: 'Mortality count' })
  @IsNumber()
  @IsNotEmpty()
  mortality_count: number;

  @ApiProperty({ example: 2, default: 0 })
  @IsNumber()
  @IsOptional()
  cull_count?: number;

  @ApiProperty({ example: 'disease-uuid', required: false })
  @IsString()
  @IsOptional()
  disease_id?: string;

  @ApiProperty({ example: 'Heat stress during peak afternoon', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
