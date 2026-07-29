import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';
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
