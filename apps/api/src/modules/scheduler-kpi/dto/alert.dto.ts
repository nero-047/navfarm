import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OperatorEnum {
  GT = 'GT',
  LT = 'LT',
  EQ = 'EQ',
  GTE = 'GTE',
  LTE = 'LTE',
}

export enum AlertSeverityEnum {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export class CreateAlertRuleDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'High Mortality Trigger' })
  @IsString()
  @IsNotEmpty()
  rule_name: string;

  @ApiProperty({ example: 'MORTALITY_RECORDED' })
  @IsString()
  @IsNotEmpty()
  event_type: string;

  @ApiProperty({ example: 'daily_mortality_rate' })
  @IsString()
  @IsNotEmpty()
  metric_name: string;

  @ApiProperty({ enum: OperatorEnum, default: OperatorEnum.GT })
  @IsEnum(OperatorEnum)
  @IsNotEmpty()
  operator: OperatorEnum;

  @ApiProperty({ example: 1.5, description: 'Threshold percentage or count' })
  @IsNumber()
  @IsNotEmpty()
  threshold_value: number;

  @ApiProperty({ enum: AlertSeverityEnum, default: AlertSeverityEnum.CRITICAL })
  @IsEnum(AlertSeverityEnum)
  @IsNotEmpty()
  severity: AlertSeverityEnum;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_enabled?: boolean;
}
