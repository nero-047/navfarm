import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BarcodeTypeEnum {
  GS1_128 = 'GS1_128',
  QR_CODE = 'QR_CODE',
  EAN_13 = 'EAN_13',
}

export enum EntityTypeEnum {
  BATCH = 'BATCH',
  LOT = 'LOT',
  PRODUCT = 'PRODUCT',
  DISPATCH = 'DISPATCH',
}

export class GenerateQrBarcodeDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ enum: BarcodeTypeEnum, default: BarcodeTypeEnum.QR_CODE })
  @IsEnum(BarcodeTypeEnum)
  @IsNotEmpty()
  barcode_type: BarcodeTypeEnum;

  @ApiProperty({ enum: EntityTypeEnum, default: EntityTypeEnum.BATCH })
  @IsEnum(EntityTypeEnum)
  @IsNotEmpty()
  entity_type: EntityTypeEnum;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  entity_id: string;

  @ApiProperty({ example: { farm_name: 'Green Valley', lot_no: 'LOT-100' }, required: false })
  @IsObject()
  @IsOptional()
  payload_metadata?: Record<string, any>;
}
