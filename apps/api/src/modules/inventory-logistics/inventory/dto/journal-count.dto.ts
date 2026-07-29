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

export class InventoryJournalLineDto {
  @ApiProperty({ description: 'Warehouse UUID' })
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ description: 'Location UUID' })
  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Optional existing Lot UUID (for negative/exact entries)', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Optional existing Serial UUID (for negative/exact entries)', required: false })
  @IsUUID()
  @IsOptional()
  serial_id?: string;

  @ApiProperty({ description: 'Journal quantity (positive for receipt, negative for issue)', example: 10 })
  @IsNumber()
  qty: number;

  @ApiProperty({ description: 'Unit cost associated with entry', example: 5 })
  @IsNumber()
  @Min(0)
  unit_cost: number;

  @ApiProperty({ description: 'Audit reason code', example: 'CORRECTION' })
  @IsString()
  @IsNotEmpty()
  reason_code: string;
}

export class CreateInventoryJournalDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Journal Number (auto-generated if omitted)', required: false, example: 'JNL-2026-0001' })
  @IsString()
  @IsOptional()
  journal_no?: string;

  @ApiProperty({ description: 'Posting Date (YYYY-MM-DD)', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  posting_date: string;

  @ApiProperty({ description: 'General notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Journal lines details', type: [InventoryJournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryJournalLineDto)
  lines: InventoryJournalLineDto[];
}

export class InventoryCountLineDto {
  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Location UUID within warehouse' })
  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ description: 'Optional existing Lot UUID', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Optional existing Serial UUID', required: false })
  @IsUUID()
  @IsOptional()
  serial_id?: string;

  @ApiProperty({ description: 'Physical quantity counted', example: 45 })
  @IsNumber()
  @Min(0)
  qty_counted: number;

  @ApiProperty({ description: 'Unit cost to use in case of positive variance', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unit_cost?: number;

  @ApiProperty({ description: 'Audit reason code if variance occurs', required: false, example: 'COUNT_DISCREPANCY' })
  @IsString()
  @IsOptional()
  reason_code?: string;
}

export class CreateInventoryCountDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Inventory Count Number (auto-generated if omitted)', required: false, example: 'CNT-2026-0001' })
  @IsString()
  @IsOptional()
  count_no?: string;

  @ApiProperty({ description: 'Warehouse UUID audited' })
  @IsUUID()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ description: 'Physical Count Date (YYYY-MM-DD)', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  count_date: string;

  @ApiProperty({ description: 'General notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Physical count lines detail', type: [InventoryCountLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryCountLineDto)
  lines: InventoryCountLineDto[];
}

export class QueryInventoryJournalDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

export class QueryInventoryCountDto {
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
