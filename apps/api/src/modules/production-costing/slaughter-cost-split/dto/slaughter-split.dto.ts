import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SlaughterSplitProductDto {
  @ApiProperty({ example: 'FILLET', description: 'Product code' }) @IsString() @IsNotEmpty() product_code: string;
  @ApiProperty({ example: 'Fish Fillet' }) @IsString() @IsNotEmpty() product_name: string;
  @ApiProperty({ example: 70.0, description: 'Cost allocation %' }) @IsNumber() split_pct: number;
  @ApiProperty({ example: 'uuid-item-fillet', required: false }) @IsString() @IsOptional() output_item_id?: string;
}

export class ConfigureSlaughterSplitDto {
  @ApiProperty({ example: 'uuid-lob-aqua-slaughter', description: 'LOB ID this split applies to' })
  @IsString() @IsNotEmpty() lob_id: string;

  @ApiProperty({ example: 'DYNAMIC', description: 'FIXED / DYNAMIC' })
  @IsString() @IsNotEmpty() split_method: string;

  @ApiProperty({ type: [SlaughterSplitProductDto], description: 'Product split lines (must sum to 100%)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlaughterSplitProductDto)
  products: SlaughterSplitProductDto[];
}

export class ApplySlaughterSplitDto {
  @ApiProperty({ example: 'uuid-lob-aqua-slaughter' }) @IsString() @IsNotEmpty() lob_id: string;
  @ApiProperty({ example: 8000, description: 'Total input kg (live weight)' }) @IsNumber() input_kg: number;
  @ApiProperty({ example: 140000, description: 'Total cost to split' }) @IsNumber() total_cost: number;
}
