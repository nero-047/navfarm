import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemTypeDto {
  @ApiProperty({ description: 'Company UUID scope (null means tenant-wide global type)', required: false, example: 'company-uuid-here' })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Unique item type code. Optional when a number series is configured for item types — the code is generated then.', required: false, example: 'RAW_MATERIAL' })
  @IsString()
  @IsOptional()
  type_code?: string;

  @ApiProperty({ description: 'Descriptive name of the item type', example: 'Raw Material' })
  @IsString()
  @IsNotEmpty()
  type_name: string;

  @ApiProperty({ description: 'Prefix an ITEM_<type_code> series uses instead of its own prefix when generating item codes for this type. Defaults to the type_code itself when omitted.', required: false, example: 'RAW' })
  @IsString()
  @IsOptional()
  code_prefix?: string;

  @ApiProperty({ description: 'Explanation of what this item type is used for', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

// No type_code, exactly as UpdateLocationTypeDto has none: item_master.item_type
// stores the code as a plain string with no foreign key, and item.service.ts
// gates withdrawal_days on the literals 'MEDICINE'/'VACCINE', so renaming a code
// after create would silently detach every existing and future item from that
// food-safety rule. The code is immutable once the type exists.
export class UpdateItemTypeDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  code_prefix?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  type_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

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

export class QueryItemTypeDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search type code or name', required: false })
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
