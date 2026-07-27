import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUUID, 
  IsNumber, 
  IsDateString, 
  Min, 
  ValidateNested, 
  IsArray 
} from 'class-validator';
import { Type } from 'class-transformer';

export class GoodsReceiptLineDto {
  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Storage Location UUID within warehouse' })
  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ description: 'Quantity received', example: 15.5 })
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @ApiProperty({ description: 'Unit of Measure code', example: 'KG' })
  @IsString()
  @IsNotEmpty()
  uom_code: string;

  @ApiProperty({ description: 'Unit cost of item', example: 12.5 })
  @IsNumber()
  @Min(0)
  unit_cost: number;

  @ApiProperty({ description: 'Lot code if lot tracked', required: false, example: 'LOT-123' })
  @IsString()
  @IsOptional()
  lot_no?: string;

  @ApiProperty({ description: 'Serial number if serial tracked', required: false, example: 'SN-987' })
  @IsString()
  @IsOptional()
  serial_no?: string;

  @ApiProperty({ description: 'Manufacturing Date (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  mfg_date?: string;

  @ApiProperty({ description: 'Expiry Date (YYYY-MM-DD)', required: false })
  @IsDateString()
  @IsOptional()
  expiry_date?: string;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Goods Receipt Number (auto-generated if omitted)', required: false, example: 'GR-2026-0001' })
  @IsString()
  @IsOptional()
  receipt_no?: string;

  @ApiProperty({ description: 'Receipt classification', example: 'PURCHASE', enum: ['MANUAL', 'PURCHASE', 'PRODUCTION', 'ADJUSTMENT', 'TRANSFER'] })
  @IsString()
  @IsNotEmpty()
  receipt_type: string;

  @ApiProperty({ description: 'Warehouse UUID receiving the goods' })
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ description: 'Posting Date (YYYY-MM-DD)', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  posting_date: string;

  @ApiProperty({ description: 'General notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Receipt lines detail', type: [GoodsReceiptLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsReceiptLineDto)
  lines: GoodsReceiptLineDto[];
}

export class QueryGoodsReceiptDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
