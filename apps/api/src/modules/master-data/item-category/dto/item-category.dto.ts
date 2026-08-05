import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemCategoryDto {
  @ApiProperty({ description: 'Company UUID scope (null means tenant-wide global template)', required: false, example: 'company-uuid-here' })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Unique category code', example: 'FEED' })
  @IsString()
  @IsNotEmpty()
  category_code: string;

  @ApiProperty({ description: 'Descriptive name of the category', example: 'Animal Feed Products' })
  @IsString()
  @IsNotEmpty()
  category_name: string;

  @ApiProperty({ description: 'Parent Category UUID (for hierarchy mapping)', required: false })
  @IsUUID()
  @IsOptional()
  parent_category_id?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateItemCategoryDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category_code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category_name?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  parent_category_id?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVE'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  extension_config?: any;
}

export class QueryItemCategoryDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by parent category UUID', required: false })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search category code or name', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Results per page', default: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: 'Pagination offset', default: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
