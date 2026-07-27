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

export class GoodsIssueLineDto {
  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Storage Location UUID within warehouse' })
  @IsUUID()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ description: 'Quantity to issue', example: 5 })
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @ApiProperty({ description: 'Unit of Measure code', example: 'KG' })
  @IsString()
  @IsNotEmpty()
  uom_code: string;

  @ApiProperty({ description: 'Existing Lot UUID (if lot tracked)', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Existing Serial UUID (if serial tracked)', required: false })
  @IsUUID()
  @IsOptional()
  serial_id?: string;
}

export class CreateGoodsIssueDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Goods Issue Number (auto-generated if omitted)', required: false, example: 'GI-2026-0001' })
  @IsString()
  @IsOptional()
  issue_no?: string;

  @ApiProperty({ description: 'Issue classification', example: 'CONSUMPTION', enum: ['CONSUMPTION', 'SALES', 'TRANSFER', 'ADJUSTMENT'] })
  @IsString()
  @IsNotEmpty()
  issue_type: string;

  @ApiProperty({ description: 'Warehouse UUID issuing the goods' })
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

  @ApiProperty({ description: 'Issue lines detail', type: [GoodsIssueLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GoodsIssueLineDto)
  lines: GoodsIssueLineDto[];
}

export class QueryGoodsIssueDto {
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
