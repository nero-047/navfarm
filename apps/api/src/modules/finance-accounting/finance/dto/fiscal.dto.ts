import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsUUID, 
  IsDateString 
} from 'class-validator';

export class CreateFiscalYearDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Year identifier code', example: 'FY2026' })
  @IsString()
  @IsNotEmpty()
  year_code: string;

  @ApiProperty({ description: 'Fiscal year start date (YYYY-MM-DD)', example: '2026-04-01' })
  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @ApiProperty({ description: 'Fiscal year end date (YYYY-MM-DD)', example: '2027-03-31' })
  @IsDateString()
  @IsNotEmpty()
  end_date: string;
}

export class QueryFiscalYearDto {
  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
