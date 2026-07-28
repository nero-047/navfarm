import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductionOrderDto {
  @ApiProperty({ example: 'COMP-001', description: 'Company UUID' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'PO-2026-001', description: 'Production Order Number' })
  @IsString()
  @IsNotEmpty()
  order_no: string;

  @ApiProperty({ example: 'item-finished-good-uuid', description: 'Target Finished Good Item UUID' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 'wh-main-uuid', description: 'Destination Warehouse UUID' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-fg-uuid', description: 'Destination Location UUID' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 1000.0, description: 'Planned Production Quantity' })
  @IsNumber()
  @IsNotEmpty()
  planned_qty: number;

  @ApiProperty({ example: 'uom-kg-uuid', description: 'Unit of Measure UUID' })
  @IsString()
  @IsNotEmpty()
  uom_id: string;

  @ApiProperty({ example: '2026-08-01', description: 'Scheduled Start Date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ example: '2026-08-15', description: 'Scheduled End Date (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiProperty({ example: 'cost-center-uuid', description: 'Cost Center UUID', required: false })
  @IsString()
  @IsOptional()
  cost_center_id?: string;

  @ApiProperty({ example: { PROJECT: 'BATCH-ALPHA' }, description: 'Reporting Dimensions', required: false })
  @IsObject()
  @IsOptional()
  dimension_values?: Record<string, string>;

  @ApiProperty({ example: 'Standard feed manufacturing run', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateProductionOrderDto {
  @ApiProperty({ example: 1200.0, required: false })
  @IsNumber()
  @IsOptional()
  planned_qty?: number;

  @ApiProperty({ example: '2026-08-02', required: false })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({ example: '2026-08-18', required: false })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiProperty({ example: 'Updated production run notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
