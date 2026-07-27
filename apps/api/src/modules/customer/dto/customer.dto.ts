import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Company UUID scope ownership', example: 'company-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Unique code representing the customer', example: 'CUST-001' })
  @IsString()
  @IsNotEmpty()
  customer_code: string;

  @ApiProperty({ description: 'Full name of the customer', example: 'John Doe Wholesalers' })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({ description: 'Contact email address', required: false, example: 'billing@johndoe.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Primary mobile number for notifications', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ description: 'Government Tax Registration Number (e.g. VAT, GSTIN, EIN)', required: false })
  @IsString()
  @IsOptional()
  tax_number?: string;

  @ApiProperty({ description: 'Approved credit limit amount', required: false })
  @IsNumber()
  @IsOptional()
  credit_limit?: number;

  @ApiProperty({ description: 'Customer street address line 1', required: false })
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

export class UpdateCustomerDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customer_code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  mobile?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tax_number?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  credit_limit?: number;

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

export class QueryCustomerDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search customer code, name, or mobile', required: false })
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
