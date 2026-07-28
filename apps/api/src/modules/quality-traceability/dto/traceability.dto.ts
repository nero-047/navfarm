import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecordTraceabilityEventDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'batch-uuid' })
  @IsString()
  @IsNotEmpty()
  batch_id: string;

  @ApiProperty({ example: 'parent-batch-uuid', required: false })
  @IsString()
  @IsOptional()
  parent_batch_id?: string;

  @ApiProperty({ example: 'farm-uuid', required: false })
  @IsString()
  @IsOptional()
  origin_farm_id?: string;

  @ApiProperty({ example: 'shed-uuid', required: false })
  @IsString()
  @IsOptional()
  origin_shed_id?: string;

  @ApiProperty({ example: 'FEED-LOT-2026-05', required: false })
  @IsString()
  @IsOptional()
  feed_batch_no?: string;

  @ApiProperty({ example: 'MED-LOT-2026-02', required: false })
  @IsString()
  @IsOptional()
  medicine_batch_no?: string;

  @ApiProperty({ example: 'EGG_HARVEST', description: 'PLACEMENT, FEEDING, MEDICATION, EGG_HARVEST, SLAUGHTER, PACKAGING, DISPATCH' })
  @IsString()
  @IsNotEmpty()
  event_type: string;

  @ApiProperty({ example: 'loc-shed-01', required: false })
  @IsString()
  @IsOptional()
  source_location_id?: string;

  @ApiProperty({ example: 'loc-wh-01', required: false })
  @IsString()
  @IsOptional()
  destination_location_id?: string;

  @ApiProperty({ example: { qty: 8500, grade: 'A' }, required: false })
  @IsObject()
  @IsOptional()
  event_details?: Record<string, any>;
}
