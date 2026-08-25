import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn, IsNumber, IsDateString } from 'class-validator';

export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const URGENCIES = ['HIGH', 'MEDIUM', 'LOW'] as const;

export class CreateApprovalRequestDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  operational_area_id?: string;

  @ApiProperty({ description: 'FEED_RATION, GRN_RECEIPT, STOCK_TRANSFER, STAGE_CLOSE, VET_DISPOSAL, or an LOB-specific type' })
  @IsString()
  @IsNotEmpty()
  doc_type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location_label?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batch_id?: string;

  @ApiProperty({ enum: URGENCIES, required: false })
  @IsOptional()
  @IsIn(URGENCIES as unknown as string[])
  urgency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  item_or_stage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  requested_qty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  cost_impact?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  justification?: string;
}

export class DecideApprovalDto {
  @ApiProperty({ required: false, description: 'Required when rejecting.' })
  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

export class QueryApprovalDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  company_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  operational_area_id?: string;

  @ApiProperty({ required: false, enum: APPROVAL_STATUSES })
  @IsOptional()
  @IsIn(APPROVAL_STATUSES as unknown as string[])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  doc_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  to_date?: string;
}
