import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReportCategoryDto {
  @ApiProperty({ example: 'CAT-INV-01' })
  @IsString()
  @IsNotEmpty()
  category_code: string;

  @ApiProperty({ example: 'Inventory & Stock Analytics' })
  @IsString()
  @IsNotEmpty()
  category_name: string;

  @ApiProperty({ example: 'Warehouse stock movement, FIFO valuation, and lot aging reports', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class RegisterReportDefinitionDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ example: 'REP-INV-001' })
  @IsString()
  @IsNotEmpty()
  report_code: string;

  @ApiProperty({ example: 'Stock Valuation & FIFO Layers Report' })
  @IsString()
  @IsNotEmpty()
  report_name: string;

  @ApiProperty({ example: 'InventoryReportService' })
  @IsString()
  @IsNotEmpty()
  data_source_service: string;

  @ApiProperty({ example: 'REPORTING:INVENTORY:view', required: false })
  @IsString()
  @IsOptional()
  required_permission?: string;
}
