import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InspectionStatusEnum {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  QUARANTINE = 'QUARANTINE',
}

export class CreateQcTemplateDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'QC-EGG-WEIGHT' })
  @IsString()
  @IsNotEmpty()
  template_code: string;

  @ApiProperty({ example: 'Egg Weight Quality Inspection' })
  @IsString()
  @IsNotEmpty()
  template_name: string;

  @ApiProperty({ example: 'item-cat-uuid', required: false })
  @IsString()
  @IsOptional()
  item_category_id?: string;

  @ApiProperty({ example: 50.0, required: false })
  @IsNumber()
  @IsOptional()
  min_acceptable_value?: number;

  @ApiProperty({ example: 70.0, required: false })
  @IsNumber()
  @IsOptional()
  max_acceptable_value?: number;

  @ApiProperty({ example: 'uom-grams', required: false })
  @IsString()
  @IsOptional()
  uom_id?: string;
}

export class RecordQcInspectionDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'template-uuid', required: false })
  @IsString()
  @IsOptional()
  template_id?: string;

  @ApiProperty({ example: 'item-uuid' })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ example: 'batch-uuid', required: false })
  @IsString()
  @IsOptional()
  batch_id?: string;

  @ApiProperty({ example: 'LOT-2026-001', required: false })
  @IsString()
  @IsOptional()
  lot_number?: string;

  @ApiProperty({ example: 58.5, description: 'Measured value' })
  @IsNumber()
  @IsNotEmpty()
  measured_value: number;

  @ApiProperty({ example: 'wh-quarantine', required: false })
  @IsString()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ example: 'loc-hold-01', required: false })
  @IsString()
  @IsOptional()
  location_id?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @IsOptional()
  hold_qty?: number;

  @ApiProperty({ example: 'Sub-standard egg weight', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReleaseQuarantineDto {
  @ApiProperty({ example: 'hold-uuid' })
  @IsString()
  @IsNotEmpty()
  hold_id: string;

  @ApiProperty({ example: 'RELEASED', description: 'RELEASED or REJECTED' })
  @IsString()
  @IsNotEmpty()
  action: string;
}
