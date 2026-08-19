import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsDateString, IsNumber } from 'class-validator';

export class RecordMedicationDto {
  @ApiProperty({ description: 'Item UUID (MEDICINE or VACCINE catalogue entry administered)' })
  @IsUUID()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({ description: 'Date the dose was administered' })
  @IsDateString()
  @IsNotEmpty()
  administered_date: string;

  @ApiProperty({ description: 'Dose quantity given', required: false })
  @IsNumber()
  @IsOptional()
  dose_qty?: number;

  @ApiProperty({ description: 'UOM for dose_qty', required: false })
  @IsString()
  @IsOptional()
  uom?: string;

  @ApiProperty({ description: 'Vet or handler who administered the dose — free text, not necessarily a system user', required: false })
  @IsString()
  @IsOptional()
  administered_by?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
