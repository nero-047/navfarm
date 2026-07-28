import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEggGradingBatchDto {
  @ApiProperty({ example: 'uuid-batch-lay-001' })
  @IsString()
  @IsNotEmpty()
  source_batch_id: string;

  @ApiProperty({ example: '2026-07-28' })
  @IsString()
  @IsNotEmpty()
  grading_date: string;

  @ApiProperty({ example: 10000, description: 'Total eggs input for grading' })
  @IsNumber()
  total_eggs_input: number;

  @ApiProperty({ example: 2000, description: 'XL grade quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_xl_qty?: number;

  @ApiProperty({ example: 4000, description: 'Large grade quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_l_qty?: number;

  @ApiProperty({ example: 2500, description: 'Medium grade quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_m_qty?: number;

  @ApiProperty({ example: 1000, description: 'Small grade quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_s_qty?: number;

  @ApiProperty({ example: 500, description: 'Reject quantity', required: false })
  @IsNumber()
  @IsOptional()
  grade_reject_qty?: number;

  @ApiProperty({ example: 'Grade quality normal for season', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
