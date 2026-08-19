import { ApiProperty } from '@nestjs/swagger';

export class CreateCountryDto {
  @ApiProperty({ description: 'ISO 3166-1 alpha-2 code', example: 'IN' })
  iso2: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-3 code', example: 'IND' })
  iso3: string;

  @ApiProperty({ description: 'Full country name', example: 'India' })
  country_name: string;

  @ApiProperty({ description: 'International dialing code', required: false, example: '+91' })
  phone_code?: string;

  @ApiProperty({ description: 'Default timezone UUID', required: false })
  default_tz_id?: string;

  @ApiProperty({ description: 'Default currency UUID', required: false })
  default_currency_id?: string;

  @ApiProperty({ description: 'Flag emoji', required: false, example: '🇮🇳' })
  flag_emoji?: string;
}

export class UpdateCountryDto {
  @ApiProperty({ required: false })
  iso2?: string;

  @ApiProperty({ required: false })
  iso3?: string;

  @ApiProperty({ required: false })
  country_name?: string;

  @ApiProperty({ required: false })
  phone_code?: string;

  @ApiProperty({ required: false })
  default_tz_id?: string;

  @ApiProperty({ required: false })
  default_currency_id?: string;

  @ApiProperty({ required: false })
  flag_emoji?: string;

  @ApiProperty({ required: false })
  is_active?: boolean;
}

export class CreateStateDto {
  @ApiProperty({ description: 'Short state code, unique per country', example: 'MH' })
  state_code: string;

  @ApiProperty({ description: 'Full state name', example: 'Maharashtra' })
  state_name: string;
}

export class UpdateStateDto {
  @ApiProperty({ required: false })
  state_code?: string;

  @ApiProperty({ required: false })
  state_name?: string;

  @ApiProperty({ required: false })
  is_active?: boolean;
}
