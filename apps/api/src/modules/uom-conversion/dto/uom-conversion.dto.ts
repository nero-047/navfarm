import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUomConversionDto {
  @ApiProperty({ example: 'uuid-item-feed', description: 'Item ID for item-specific conversion (null = UOM type level)' })
  @IsString()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ example: 'BAG' })
  @IsString()
  @IsNotEmpty()
  from_uom: string;

  @ApiProperty({ example: 'KG' })
  @IsString()
  @IsNotEmpty()
  to_uom: string;

  @ApiProperty({ example: 50.0, description: 'Multiply from_uom qty to get to_uom qty (e.g. 1 BAG × 50 = 50 KG)' })
  @IsNumber()
  conversion_factor: number;

  @ApiProperty({ example: '2026-01-01', description: 'Effective from date' })
  @IsString()
  @IsNotEmpty()
  effective_from: string;

  @ApiProperty({ example: '2026-12-31', description: 'Effective to date (null = current)', required: false })
  @IsString()
  @IsOptional()
  effective_to?: string;
}

export class UpdateUomConversionDto {
  @ApiProperty({ example: 55.0 })
  @IsNumber()
  @IsOptional()
  conversion_factor?: number;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsString()
  @IsOptional()
  effective_to?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
