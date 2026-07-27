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

export class TransferOrderLineDto {
  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Source location UUID within source warehouse' })
  @IsUUID()
  @IsNotEmpty()
  from_location_id: string;

  @ApiProperty({ description: 'Destination location UUID within target warehouse' })
  @IsUUID()
  @IsNotEmpty()
  to_location_id: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 5 })
  @IsNumber()
  @Min(0.0001)
  qty: number;

  @ApiProperty({ description: 'Unit of Measure code', example: 'KG' })
  @IsString()
  @IsNotEmpty()
  uom_code: string;

  @ApiProperty({ description: 'Lot UUID if lot tracked', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Serial UUID if serial tracked', required: false })
  @IsUUID()
  @IsOptional()
  serial_id?: string;
}

export class CreateTransferOrderDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Transfer Order Number (auto-generated if omitted)', required: false, example: 'TO-2026-0001' })
  @IsString()
  @IsOptional()
  transfer_no?: string;

  @ApiProperty({ description: 'Source warehouse UUID' })
  @IsUUID()
  @IsNotEmpty()
  from_warehouse_id: string;

  @ApiProperty({ description: 'Target destination warehouse UUID' })
  @IsUUID()
  @IsNotEmpty()
  to_warehouse_id: string;

  @ApiProperty({ description: 'Posting Date (YYYY-MM-DD)', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  posting_date: string;

  @ApiProperty({ description: 'General notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Transfer lines detail', type: [TransferOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferOrderLineDto)
  lines: TransferOrderLineDto[];
}

export class QueryTransferOrderDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  fromWarehouseId?: string;

  @IsUUID()
  @IsOptional()
  toWarehouseId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
