import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReportQueryFilterDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'farm-uuid', required: false })
  @IsString()
  @IsOptional()
  farm_id?: string;

  @ApiProperty({ example: 'wh-uuid', required: false })
  @IsString()
  @IsOptional()
  warehouse_id?: string;

  @ApiProperty({ example: 'batch-uuid', required: false })
  @IsString()
  @IsOptional()
  batch_id?: string;

  @ApiProperty({ example: '2026-01-01T00:00:00Z', required: false })
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z', required: false })
  @IsString()
  @IsOptional()
  end_date?: string;
}

export class ExportReportDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'report-uuid' })
  @IsString()
  @IsNotEmpty()
  report_id: string;

  @ApiProperty({ example: 'PDF', description: 'PDF, XLSX, CSV' })
  @IsString()
  @IsNotEmpty()
  export_format: string;
}
