import { ApiProperty } from '@nestjs/swagger';

export class CreateCostingMethodDto {
  @ApiProperty({ description: 'Unique costing method code', example: 'FIFO' })
  method_code: string;

  @ApiProperty({ description: 'Display name', example: 'FIFO Layer Costing' })
  method_name: string;

  @ApiProperty({ description: 'YES = auto-post variance entries at batch close', example: 'NO' })
  variance_auto: string;

  @ApiProperty({ description: 'TRUE = FIFO layer per lot receipt', default: false, required: false })
  layer_tracking?: boolean;

  @ApiProperty({ description: 'TRUE = supports IAS 41 biological asset accounting', default: false, required: false })
  bio_asset_support?: boolean;

  @ApiProperty({ description: 'TRUE = fair value revaluation allowed', default: false, required: false })
  fair_value_option?: boolean;

  @ApiProperty({ description: 'TRUE = amortisation posting allowed', default: false, required: false })
  amort_option?: boolean;

  @ApiProperty({ description: 'Method description and accounting treatment', required: false })
  description?: string;
}

export class UpdateCostingMethodDto {
  @ApiProperty({ required: false })
  method_name?: string;

  @ApiProperty({ required: false })
  variance_auto?: string;

  @ApiProperty({ required: false })
  layer_tracking?: boolean;

  @ApiProperty({ required: false })
  bio_asset_support?: boolean;

  @ApiProperty({ required: false })
  fair_value_option?: boolean;

  @ApiProperty({ required: false })
  amort_option?: boolean;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  is_active?: boolean;
}
