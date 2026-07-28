import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum OutputTypeEnum {
  FINISHED_GOOD = 'FINISHED_GOOD',
  BY_PRODUCT = 'BY_PRODUCT',
  SCRAP = 'SCRAP',
  WASTE = 'WASTE',
}

export class AddBatchInputDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 'item-raw-material-uuid' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 'uom-kg-uuid' })
  @IsString()
  @IsNotEmpty()
  uom_id: string;

  @ApiProperty({ example: 'wh-main-uuid' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-raw-uuid' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'lot-batch-uuid', required: false })
  @IsString()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ example: 'serial-uuid', required: false })
  @IsString()
  @IsOptional()
  serial_id?: string;

  @ApiProperty({ example: 100.0, description: 'Planned Quantity' })
  @IsNumber()
  @IsNotEmpty()
  planned_qty: number;

  @ApiProperty({ example: 105.0, description: 'Actual Quantity Consumed', required: false })
  @IsNumber()
  @IsOptional()
  actual_qty?: number;
}

export class RecordBatchOutputDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 'item-fg-uuid' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 'uom-kg-uuid' })
  @IsString()
  @IsNotEmpty()
  uom_id: string;

  @ApiProperty({ example: 'wh-main-uuid' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-fg-uuid' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 'lot-fg-uuid', required: false })
  @IsString()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ enum: OutputTypeEnum, default: OutputTypeEnum.FINISHED_GOOD })
  @IsEnum(OutputTypeEnum)
  @IsNotEmpty()
  output_type: OutputTypeEnum;

  @ApiProperty({ example: 480.0, description: 'Quantity Produced' })
  @IsNumber()
  @IsNotEmpty()
  qty: number;

  @ApiProperty({ example: 100.0, description: 'Cost Allocation Percentage (e.g., 85% for Finished Good, 15% for By-Product)', default: 100.0 })
  @IsNumber()
  @IsOptional()
  cost_split_pct?: number;
}
