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
  IsArray, 
  IsEnum 
} from 'class-validator';
import { Type } from 'class-transformer';

export enum JournalType {
  GENERAL = 'GENERAL',
  PURCHASE = 'PURCHASE',
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export class CreateJournalLineDto {
  @ApiProperty({ description: 'Target GL Account UUID' })
  @IsUUID()
  @IsNotEmpty()
  gl_account_id: string;

  @ApiProperty({ description: 'Debit Amount', default: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  debit?: number;

  @ApiProperty({ description: 'Credit Amount', default: 0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  credit?: number;

  @ApiProperty({ description: 'Line memo description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Cost Center UUID', required: false })
  @IsUUID()
  @IsOptional()
  cost_center_id?: string;

  @ApiProperty({ description: 'Configurable dimension key-value tags', required: false, example: { "FARM": "FarmA" } })
  @IsOptional()
  dimension_values?: Record<string, string>;

  @ApiProperty({ description: 'Reference document type context', required: false })
  @IsString()
  @IsOptional()
  ref_doc_type?: string;

  @ApiProperty({ description: 'Reference document UUID', required: false })
  @IsUUID()
  @IsOptional()
  ref_doc_id?: string;
}

export class CreateJournalDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Journal number (auto-generated if empty)', required: false })
  @IsString()
  @IsOptional()
  journal_no?: string;

  @ApiProperty({ description: 'Journal type category', enum: JournalType })
  @IsEnum(JournalType)
  @IsNotEmpty()
  journal_type: JournalType;

  @ApiProperty({ description: 'Posting Date (YYYY-MM-DD)', example: '2026-07-27' })
  @IsDateString()
  @IsNotEmpty()
  posting_date: string;

  @ApiProperty({ description: 'Header notes memo', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'Journal posting lines', type: [CreateJournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}

export class QueryJournalDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
