import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BatchStatusEnum {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  RELEASED = 'RELEASED',
  MATERIAL_ISSUED = 'MATERIAL_ISSUED',
  IN_PROGRESS = 'IN_PROGRESS',
  QUALITY_CHECK = 'QUALITY_CHECK',
  FINISHED = 'FINISHED',
  CLOSED = 'CLOSED',
}

export class CreateProductionBatchDto {
  @ApiProperty({ example: 'COMP-001', description: 'Company UUID' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'order-uuid', description: 'Production Order UUID (optional)', required: false })
  @IsString()
  @IsOptional()
  order_id?: string;

  @ApiProperty({ example: 'BATCH-2026-0801', description: 'Unique Batch Code' })
  @IsString()
  @IsNotEmpty()
  batch_no: string;

  @ApiProperty({ example: 'parent-batch-uuid', description: 'Parent Batch UUID for stage lineage', required: false })
  @IsString()
  @IsOptional()
  parent_batch_id?: string;

  @ApiProperty({ example: 'formula-uuid', description: 'Feed Formula / BOM Master UUID', required: false })
  @IsString()
  @IsOptional()
  formula_id?: string;

  @ApiProperty({ example: '50000000-5000-5000-5000-000000000001', description: 'NOB Master UUID (required when lob_id is set)', required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ example: '60000000-6000-6000-6000-000000000001', description: 'LOB Master UUID (required when nob_id is set)', required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ example: 'REARING', description: 'Batch stage (e.g. REARING, LAYING, SLAUGHTER)', required: false })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiProperty({ example: 'STANDARD', description: 'Costing method snapshot — STANDARD | FIFO | BIO_ASSET. Immutable once operational postings begin.', required: false, default: 'STANDARD' })
  @IsString()
  @IsOptional()
  costing_method?: string;

  @ApiProperty({ example: 'farm-uuid', description: 'Farm Master UUID', required: false })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiProperty({ example: 'shed-uuid', description: 'Shed Master UUID', required: false })
  @IsString()
  @IsOptional()
  shed_id?: string;

  @ApiProperty({ example: 'wh-uuid', description: 'Warehouse UUID' })
  @IsString()
  @IsNotEmpty()
  warehouse_id: string;

  @ApiProperty({ example: 'loc-uuid', description: 'Location UUID' })
  @IsString()
  @IsNotEmpty()
  location_id: string;

  @ApiProperty({ example: 500.0, description: 'Planned Batch Quantity' })
  @IsNumber()
  @IsNotEmpty()
  planned_qty: number;

  @ApiProperty({ example: 'Batch run notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateProductionBatchDto {
  @ApiProperty({ example: 'STANDARD', description: 'Costing method snapshot — STANDARD | FIFO | BIO_ASSET', required: false })
  @IsString()
  @IsOptional()
  costing_method?: string;

  @ApiProperty({ example: 'REARING', description: 'Batch stage', required: false })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiProperty({ example: 500.0, description: 'Planned Batch Quantity', required: false })
  @IsNumber()
  @IsOptional()
  planned_qty?: number;

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TransitionBatchStatusDto {
  @ApiProperty({ enum: BatchStatusEnum, description: 'Target lifecycle status' })
  @IsEnum(BatchStatusEnum)
  @IsNotEmpty()
  targetStatus: BatchStatusEnum;

  @ApiProperty({ example: 'Quality Check passed cleanly', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
