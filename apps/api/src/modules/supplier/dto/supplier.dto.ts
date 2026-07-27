import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Company UUID scope ownership', example: 'company-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Unique code representing the supplier', example: 'SUP-001' })
  @IsString()
  @IsNotEmpty()
  supplier_code: string;

  @ApiProperty({ description: 'Full legal name of the supplier', example: 'Feed Ingredients Corp Ltd' })
  @IsString()
  @IsNotEmpty()
  supplier_name: string;

  @ApiProperty({ description: 'Contact email address', required: false, example: 'orders@feedingredients.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Contact phone number', required: false, example: '+919999988888' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Government Tax Registration Number (e.g. VAT, GSTIN, EIN)', required: false, example: 'GSTIN123456789A' })
  @IsString()
  @IsOptional()
  tax_number?: string;

  @ApiProperty({ description: 'Standard billing terms', required: false, example: 'NET30' })
  @IsString()
  @IsOptional()
  payment_terms?: string;

  @ApiProperty({ description: 'Supplier street address line 1', required: false })
  @IsString()
  @IsOptional()
  address_line1?: string;

  @ApiProperty({ description: 'City', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'State', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'Country', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Postal area pincode', required: false })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateSupplierDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  supplier_code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  supplier_name?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tax_number?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  payment_terms?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address_line1?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  pincode?: string;

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

export class QuerySupplierDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search supplier code, name, or tax code', required: false })
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
