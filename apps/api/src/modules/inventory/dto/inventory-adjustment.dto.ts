import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateInventoryAdjustmentDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Inventory Adjustment Number (auto-generated if omitted)', required: false, example: 'ADJ-2026-0001' })
  @IsString()
  @IsOptional()
  adjustment_no?: string;

  @ApiProperty({ description: 'Warehouse UUID' })
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ description: 'Location UUID within warehouse' })
  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ description: 'Posting Date (YYYY-MM-DD)', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  posting_date: string;

  @ApiProperty({ description: 'Adjustment direction type', example: 'POSITIVE', enum: ['POSITIVE', 'NEGATIVE'] })
  @IsString()
  @IsNotEmpty()
  adjustment_type: string;

  @ApiProperty({ description: 'Audit reason code explaining the adjustment', example: 'DAMAGED_GOODS' })
  @IsString()
  @IsNotEmpty()
  reason_code: string;

  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Adjusting quantity', example: 10 })
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @ApiProperty({ description: 'Unit of Measure code', example: 'KG' })
  @IsString()
  @IsNotEmpty()
  uom_code: string;

  @ApiProperty({ description: 'Unit cost (required/used for POSITIVE adjustments)', required: false, example: 5.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_cost?: number;

  @ApiProperty({ description: 'Existing Lot UUID (required for NEGATIVE adjustment if lot tracked)', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Existing Serial UUID (required for NEGATIVE adjustment if serial tracked)', required: false })
  @IsUUID()
  @IsOptional()
  serial_id?: string;

  @ApiProperty({ description: 'New Lot code (used for POSITIVE lot receipt)', required: false })
  @IsString()
  @IsOptional()
  lot_no?: string;

  @ApiProperty({ description: 'New Serial number (used for POSITIVE serial receipt)', required: false })
  @IsString()
  @IsOptional()
  serial_no?: string;

  @ApiProperty({ description: 'Manufacturing Date (for new Lot registration)', required: false })
  @IsDateString()
  @IsOptional()
  mfg_date?: string;

  @ApiProperty({ description: 'Expiration Date (for new Lot registration)', required: false })
  @IsDateString()
  @IsOptional()
  expiry_date?: string;

  @ApiProperty({ description: 'General notes/rationale', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryInventoryAdjustmentDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  status?: string; // DRAFT, POSTED, etc.

  @IsString()
  @IsOptional()
  search?: string;
}
