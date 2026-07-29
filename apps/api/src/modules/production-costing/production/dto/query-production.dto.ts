import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProductionDto {
  @ApiProperty({ example: 'COMP-001', required: false })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiProperty({ example: 'wh-uuid', required: false })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiProperty({ example: 'PLANNED', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: '2026-08-01', required: false })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-08-31', required: false })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  offset?: number;
}
