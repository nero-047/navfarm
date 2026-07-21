import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditLogDto {
  @ApiProperty({ 
    description: 'Filter by Tenant ID (Platform System Admins only, others are auto-scoped)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ 
    description: 'Filter by Company ID', 
    required: false 
  })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ 
    description: 'Filter by User ID who performed the action', 
    required: false 
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ 
    description: 'Filter by action code', 
    required: false, 
    example: 'UPDATE' 
  })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ 
    description: 'Filter by target table entity name', 
    required: false, 
    example: 'company_master' 
  })
  @IsOptional()
  @IsString()
  entityName?: string;

  @ApiProperty({ 
    description: 'Filter starting from date (ISO string)', 
    required: false, 
    example: '2026-06-01T00:00:00.000Z' 
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ 
    description: 'Filter ending at date (ISO string)', 
    required: false, 
    example: '2026-07-01T23:59:59.000Z' 
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ 
    description: 'Limit counts per page', 
    default: 50, 
    required: false, 
    example: 50 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ 
    description: 'Pagination offset index count', 
    default: 0, 
    required: false, 
    example: 0 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
