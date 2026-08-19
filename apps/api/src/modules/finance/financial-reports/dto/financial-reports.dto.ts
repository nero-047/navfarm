import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class TrialBalanceQueryDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Report as-of date (inclusive)', example: '2026-08-06' })
  @IsDateString()
  @IsNotEmpty()
  asOfDate: string;
}

export class BalanceSheetQueryDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Report as-of date (inclusive)', example: '2026-08-06' })
  @IsDateString()
  @IsNotEmpty()
  asOfDate: string;
}

export class ProfitLossQueryDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Period start date (inclusive)', example: '2026-04-01' })
  @IsDateString()
  @IsNotEmpty()
  dateFrom: string;

  @ApiProperty({ description: 'Period end date (inclusive)', example: '2026-08-06' })
  @IsDateString()
  @IsNotEmpty()
  dateTo: string;
}

export class BioAssetRollForwardQueryDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Period start date (inclusive)', example: '2026-01-01' })
  @IsDateString()
  @IsNotEmpty()
  dateFrom: string;

  @ApiProperty({ description: 'Period end date (inclusive)', example: '2026-12-31' })
  @IsDateString()
  @IsNotEmpty()
  dateTo: string;
}

export class HerdAnalyticsQueryDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}

export class BatchCostVarianceQueryDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiPropertyOptional({ description: 'Optional Batch UUID filter' })
  @IsOptional()
  @IsUUID()
  batchId?: string;
}


