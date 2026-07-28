import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RevaluateItemCostDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 15.00, description: 'New Standard / Weighted Avg Cost' })
  @IsNumber()
  @IsNotEmpty()
  new_cost: number;

  @ApiProperty({ example: 'Market price adjustment for Q3 raw material' })
  @IsString()
  @IsNotEmpty()
  change_reason: string;
}
