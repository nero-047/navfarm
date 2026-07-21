import { IsString, IsNotEmpty, IsOptional, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step7FiscalDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'FY APR MAR', description: 'Fiscal calendar format label' })
  @IsString()
  @IsNotEmpty()
  fiscal_year_format: string;

  @ApiProperty({ example: 4, description: 'Calendar start month index (1=Jan, 4=Apr)' })
  @IsInt()
  @Min(1)
  @Max(12)
  fiscal_start_month: number;

  @ApiProperty({ example: 1, description: 'Calendar start day index' })
  @IsInt()
  @Min(1)
  @Max(31)
  fiscal_start_day: number;

  @ApiProperty({ example: '2026-27', description: 'Active fiscal year label' })
  @IsString()
  @IsNotEmpty()
  current_fiscal_year: string;

  @ApiProperty({ example: 'MONTHLY', description: 'Accounting closing cycle period' })
  @IsString()
  @IsNotEmpty()
  period_type: string;

  @ApiProperty({ example: 'IND AS', description: 'IND AS / IFRS / US GAAP / Local GAAP' })
  @IsString()
  @IsNotEmpty()
  accounting_standard: string;

  @ApiProperty({ example: 'STANDARD', description: 'STANDARD COSTING / FIFO / Weighted Average' })
  @IsString()
  @IsNotEmpty()
  inventory_valuation: string;
}
