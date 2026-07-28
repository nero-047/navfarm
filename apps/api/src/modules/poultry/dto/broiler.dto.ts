import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBroilerBatchDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'farm-broiler-uuid' })
  @IsString()
  @IsNotEmpty()
  farm_id: string;

  @ApiProperty({ example: 'shed-broiler-uuid' })
  @IsString()
  @IsNotEmpty()
  shed_id: string;

  @ApiProperty({ example: 'wh-broiler-uuid' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-broiler-uuid' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'BROILER-2026-B1' })
  @IsString()
  @IsNotEmpty()
  batch_no: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  @IsNotEmpty()
  placement_date: string;

  @ApiProperty({ example: 15000, description: 'Broiler Chicks Placed' })
  @IsNumber()
  @IsNotEmpty()
  initial_bird_count: number;
}
