import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UsageTypeEnum {
  LABOR = 'LABOR',
  MACHINE = 'MACHINE',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  OVERHEAD = 'OVERHEAD',
}

export class AddResourceUsageDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 'resource-uuid', description: 'Resource Master UUID' })
  @IsString()
  @IsNotEmpty()
  resource_id: string;

  @ApiProperty({ enum: UsageTypeEnum, default: UsageTypeEnum.LABOR })
  @IsEnum(UsageTypeEnum)
  @IsNotEmpty()
  usage_type: UsageTypeEnum;

  @ApiProperty({ example: 8.0, description: 'Planned Hours' })
  @IsNumber()
  @IsOptional()
  planned_hours?: number;

  @ApiProperty({ example: 8.5, description: 'Actual Hours Used' })
  @IsNumber()
  @IsNotEmpty()
  actual_hours: number;

  @ApiProperty({ example: 25.0, description: 'Hourly Cost Rate' })
  @IsNumber()
  @IsNotEmpty()
  hourly_rate: number;
}
