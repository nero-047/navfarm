import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsNumber, IsDateString, Min } from 'class-validator';

export class CreateLotDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Lot/Batch number code', example: 'LOT-2026-07-A' })
  @IsString()
  @IsNotEmpty()
  lot_code: string;

  @ApiProperty({ description: 'Manufacturing Date (YYYY-MM-DD)', required: false, example: '2026-07-01' })
  @IsDateString()
  @IsOptional()
  mfg_date?: string;

  @ApiProperty({ description: 'Expiration Date (YYYY-MM-DD)', required: false, example: '2027-07-01' })
  @IsDateString()
  @IsOptional()
  expiry_date?: string;

  @ApiProperty({ description: 'Initial batch quantity', example: 100 })
  @IsNumber()
  @Min(0)
  qty_initial: number;
}

export class CreateSerialDto {
  @ApiProperty({ description: 'Company UUID scope' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Item UUID' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Optional Lot UUID grouping', required: false })
  @IsUUID()
  @IsOptional()
  lot_id?: string;

  @ApiProperty({ description: 'Unique Serial Number', example: 'SN-987654321' })
  @IsString()
  @IsNotEmpty()
  serial_no: string;

  @ApiProperty({ description: 'Warranty Expiry Date (YYYY-MM-DD)', required: false, example: '2028-07-01' })
  @IsDateString()
  @IsOptional()
  warranty_expiry_date?: string;
}

export class QueryLotDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  itemId?: string;

  @IsString()
  @IsOptional()
  search?: string;
}

export class QuerySerialDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsUUID()
  @IsOptional()
  itemId?: string;

  @IsUUID()
  @IsOptional()
  lotId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
