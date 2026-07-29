import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDashboardWidgetDto {
  @ApiProperty({ example: 'Inventory Valuation Trend' })
  @IsString()
  @IsNotEmpty()
  widget_title: string;

  @ApiProperty({ example: 'LINE_CHART', description: 'CARD, LINE_CHART, BAR_CHART, PIE_CHART, KPI_CARD, TABLE' })
  @IsString()
  @IsNotEmpty()
  widget_type: string;

  @ApiProperty({ example: 'report-uuid', required: false })
  @IsString()
  @IsOptional()
  report_id?: string;

  @ApiProperty({ example: { x: 0, y: 0, w: 6, h: 4 }, required: false })
  @IsObject()
  @IsOptional()
  layout_json?: Record<string, any>;
}

export class CreateDashboardDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'Executive Operations Overview' })
  @IsString()
  @IsNotEmpty()
  dashboard_name: string;

  @ApiProperty({ example: 'EXECUTIVE', description: 'EXECUTIVE, OPERATIONS, FINANCE, INVENTORY, PRODUCTION, POULTRY, QUALITY' })
  @IsString()
  @IsNotEmpty()
  dashboard_type: string;

  @ApiProperty({ type: [CreateDashboardWidgetDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDashboardWidgetDto)
  @IsOptional()
  widgets?: CreateDashboardWidgetDto[];
}
