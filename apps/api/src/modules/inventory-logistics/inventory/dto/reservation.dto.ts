import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

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

  @ApiProperty({ description: 'Optional Lot UUID', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Optional Serial UUID', required: false })
  @IsUUID()
  @IsOptional()
  serial_id?: string;

  @ApiProperty({ description: 'Quantity to reserve', example: 10 })
  @IsNumber()
  @Min(0.0001)
  qty_reserved: number;

  @ApiProperty({ description: 'Reservation classification', example: 'SALES', enum: ['SALES', 'PRODUCTION', 'MANUAL'] })
  @IsString()
  @IsNotEmpty()
  reservation_type: string;

  @ApiProperty({ description: 'Reference document type', required: false })
  @IsString()
  @IsOptional()
  ref_doc_type?: string;

  @ApiProperty({ description: 'Reference document ID', required: false })
  @IsUUID()
  @IsOptional()
  ref_doc_id?: string;

  @ApiProperty({ description: 'Optional expiration timestamp (ISO)', required: false })
  @IsDateString()
  @IsOptional()
  expires_at?: string;
}

export class QueryReservationDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  itemId?: string;

  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @IsString()
  @IsOptional()
  status?: string; // ACTIVE, CONSUMED, RELEASED, EXPIRED
}
