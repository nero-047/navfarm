import { ApiProperty } from '@nestjs/swagger';

export class UpdateExchangeRateDto {
  @ApiProperty({ 
    description: 'From currency UUID', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  fromCurrencyId: string;

  @ApiProperty({ 
    description: 'To currency UUID', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  toCurrencyId: string;

  @ApiProperty({ 
    description: 'Currency conversion conversion rate factor multiplier', 
    example: 83.45 
  })
  rate: number;

  @ApiProperty({ 
    description: 'Source rate description tag', 
    required: false, 
    default: 'MANUAL', 
    example: 'MANUAL' 
  })
  source?: string;
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
