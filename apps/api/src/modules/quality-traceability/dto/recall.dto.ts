import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RecallSeverityEnum {
  CLASS_1_HIGH = 'CLASS_1_HIGH',
  CLASS_2_MEDIUM = 'CLASS_2_MEDIUM',
  CLASS_3_LOW = 'CLASS_3_LOW',
}

export class InitiateRecallDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'RECALL-2026-001' })
  @IsString()
  @IsNotEmpty()
  recall_number: string;

  @ApiProperty({ example: 'Potential salmonella contamination detected in feed lot' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ enum: RecallSeverityEnum, default: RecallSeverityEnum.CLASS_1_HIGH })
  @IsEnum(RecallSeverityEnum)
  @IsNotEmpty()
  severity: RecallSeverityEnum;

  @ApiProperty({ example: ['batch-uuid-1', 'batch-uuid-2'] })
  @IsArray()
  affected_batch_ids: string[];
}
