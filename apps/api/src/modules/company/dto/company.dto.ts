import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsNumber, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'GREENVALLEY', description: 'Unique company code' })
  @IsString()
  @IsNotEmpty()
  company_code: string;

  @ApiProperty({ example: 'Green Valley Farms Pvt Ltd', description: 'Legal entity name' })
  @IsString()
  @IsNotEmpty()
  company_name: string;

  @ApiProperty({ example: 'Green Valley', description: 'Display/brand name', required: false })
  @IsString()
  @IsOptional()
  company_display_name?: string;

  @ApiProperty({ example: 'Pvt Ltd', description: 'Company classification' })
  @IsString()
  @IsNotEmpty()
  company_type: string;

  @ApiProperty({ example: 'Poultry Farming', description: 'Primary industry type' })
  @IsString()
  @IsNotEmpty()
  industry_type: string;

  @ApiProperty({ example: '20000000-2000-2000-2000-200000000001', description: 'Base currency UUID', required: false })
  @IsString()
  @IsOptional()
  base_currency_id?: string;

  @ApiProperty({ example: '10000000-1000-1000-1000-100000000001', description: 'Default language UUID', required: false })
  @IsString()
  @IsOptional()
  default_language_id?: string;

  @ApiProperty({ example: 'IND', description: 'Operating country code' })
  @IsString()
  @IsNotEmpty()
  country_id: string;

  @ApiProperty({ example: 'Asia/Kolkata', description: 'Timezone', required: false })
  @IsString()
  @IsOptional()
  default_timezone_id?: string;

  @ApiProperty({ example: 'GSTIN12345', description: 'Tax registration ID', required: false })
  @IsString()
  @IsOptional()
  registration_no?: string;

  @ApiProperty({ example: 'TAXID12345', description: 'Tax ID', required: false })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiProperty({ example: '#1F4E79', description: 'Brand primary hex color', required: false })
  @IsString()
  @IsOptional()
  primary_color_hex?: string;
}

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Company code', required: false })
  @IsString()
  @IsOptional()
  company_code?: string;

  @ApiProperty({ description: 'Legal entity name', required: false })
  @IsString()
  @IsOptional()
  company_name?: string;

  @ApiProperty({ description: 'Display/brand name', required: false })
  @IsString()
  @IsOptional()
  company_display_name?: string;

  @ApiProperty({ description: 'Company classification', required: false })
  @IsString()
  @IsOptional()
  company_type?: string;

  @ApiProperty({ description: 'Primary industry', required: false })
  @IsString()
  @IsOptional()
  industry_type?: string;

  @ApiProperty({ description: 'Base currency UUID', required: false })
  @IsUUID()
  @IsOptional()
  base_currency_id?: string;

  @ApiProperty({ description: 'Default language UUID', required: false })
  @IsUUID()
  @IsOptional()
  default_language_id?: string;

  @ApiProperty({ description: 'Operating country code', required: false })
  @IsString()
  @IsOptional()
  country_id?: string;

  @ApiProperty({ description: 'Timezone', required: false })
  @IsString()
  @IsOptional()
  default_timezone_id?: string;

  @ApiProperty({ description: 'Tax registration ID', required: false })
  @IsString()
  @IsOptional()
  registration_no?: string;

  @ApiProperty({ description: 'Tax ID', required: false })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiProperty({ description: 'Brand primary hex color', required: false })
  @IsString()
  @IsOptional()
  primary_color_hex?: string;

  @ApiProperty({ description: 'Onboarding status', required: false })
  @IsString()
  @IsOptional()
  onboarding_status?: string;

  @ApiProperty({ description: 'Active status', required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
