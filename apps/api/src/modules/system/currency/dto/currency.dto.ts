import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsOptional, IsDateString } from 'class-validator';

/**
 * Every property here carried only @ApiProperty, which is Swagger metadata and
 * not a validator. With the global pipe's whitelist + forbidNonWhitelisted, an
 * undecorated property is non-whitelisted, so POST /currency/rate rejected the
 * exact four fields its own controller reads — "property fromCurrencyId should
 * not exist". The endpoint could never be called successfully, which is why
 * nothing in the frontend used it.
 */
export class UpdateExchangeRateDto {
  @ApiProperty({ 
    description: 'From currency UUID', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  // @IsString, not @IsUUID: the platform currency ids are hand-assigned
  // sentinels (20000000-2000-...), which are not v4 UUIDs and fail @IsUUID.
  // company.dto.ts's base_currency_id already settled this the same way.
  @IsString()
  fromCurrencyId: string;

  @ApiProperty({ 
    description: 'To currency UUID', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  @IsString()
  toCurrencyId: string;

  @ApiProperty({ 
    description: 'Currency conversion conversion rate factor multiplier', 
    example: 83.45 
  })
  @IsNumber()
  @IsPositive()
  rate: number;

  @ApiProperty({ 
    description: 'Source rate description tag', 
    required: false, 
    default: 'MANUAL', 
    example: 'MANUAL' 
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ description: 'Date the rate applies from. Defaults to today. BBP-1 §1.1 has Finance entering the USD/ZWL rate manually, and a dated table is what lets a past period be restated.', required: false, example: '2026-09-06' })
  @IsDateString()
  @IsOptional()
  rateDate?: string;
}

export class CreateCurrencyDto {
  @ApiProperty({ description: 'Three character standard ISO currency code', example: 'USD' })
  iso_code: string;

  @ApiProperty({ description: 'Official currency code name display label', example: 'US Dollar' })
  currency_name: string;

  @ApiProperty({ description: 'Standard currency display symbol prefix/suffix text', example: '$' })
  symbol: string;

  @ApiProperty({ description: 'Formatting symbol alignment layout orientation', default: 'PREFIX', example: 'PREFIX' })
  symbol_position?: string;

  @ApiProperty({ description: 'Standard decimal places calculation rounding accuracy depth config', default: 2, example: 2 })
  decimal_places?: number;

  @ApiProperty({ description: 'Flag marking currency as system default', default: false, example: false })
  is_system_default?: boolean;
}

export class UpdateCurrencyDto {
  @ApiProperty({ description: 'Three character standard ISO currency code', required: false, example: 'USD' })
  iso_code?: string;

  @ApiProperty({ description: 'Official currency code name display label', required: false, example: 'US Dollar' })
  currency_name?: string;

  @ApiProperty({ description: 'Standard currency display symbol prefix/suffix text', required: false, example: '$' })
  symbol?: string;

  @ApiProperty({ description: 'Formatting symbol alignment layout orientation', required: false, example: 'PREFIX' })
  symbol_position?: string;

  @ApiProperty({ description: 'Standard decimal places calculation rounding accuracy depth config', required: false, example: 2 })
  decimal_places?: number;

  @ApiProperty({ description: 'Flag marking currency as system default', required: false, example: false })
  is_system_default?: boolean;

  @ApiProperty({ description: 'Is Active flag status', required: false, example: true })
  is_active?: boolean;
}
