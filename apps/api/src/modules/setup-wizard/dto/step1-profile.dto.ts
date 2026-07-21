import { IsString, IsNotEmpty, IsOptional, IsUUID, IsHexColor, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class Step1ProfileDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Tenant group UUID' })
  @IsUUID()
  @IsNotEmpty()
  tenant_id: string;

  @ApiProperty({ example: 'GVF', description: 'Short unique code for the company' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 20)
  company_code: string;

  @ApiProperty({ example: 'Green Valley Farms Pvt Ltd', description: 'Legal name of the company' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  company_name: string;

  @ApiProperty({ example: 'Green Valley Farms', description: 'Display name (defaults to legal name if blank)', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  @Length(0, 100)
  company_display_name?: string;

  @ApiProperty({ example: 'Pvt Ltd', description: 'Sole Proprietor / Partnership / Pvt Ltd / LLP / Trust / NGO / Co-operative' })
  @IsString()
  @IsNotEmpty()
  company_type: string;

  @ApiProperty({ example: 'Poultry Farming', description: 'Primary industry classification' })
  @IsString()
  @IsNotEmpty()
  industry_type: string;

  @ApiProperty({ example: 'U01403DL2023PTC123456', description: 'Registration certificate number', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  registration_no?: string;

  @ApiProperty({ example: '07AAAAA1111A1Z1', description: 'Tax registration number (GSTIN / TIN)', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiProperty({ example: 'STANDARD', description: 'Tax regime: STANDARD / COMPOSITION / EXEMPT', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  tax_regime?: string;

  @ApiProperty({ example: '2023-01-15', description: 'Date of incorporation', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  incorporation_date?: string;

  @ApiProperty({ example: 'https://greenvalleyfarms.in', description: 'Company website URL', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ example: 'greenvalleyfarms.in', description: 'Company email domain for auto-verification', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  email_domain?: string;

  @ApiProperty({ example: 'support@greenvalleyfarms.in', description: 'Public support email', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  support_email?: string;

  @ApiProperty({ example: '+91 11 2345 6789', description: 'Primary phone / landline', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  phone_primary?: string;

  @ApiProperty({ example: '#1F4E79', description: 'Hex code for brand colors', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsHexColor()
  @IsOptional()
  primary_color_hex?: string;

  @ApiProperty({ example: '/uploads/company-logo-123456.png', description: 'Company logo relative URL or absolute link', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  company_logo_url?: string;

  @ApiProperty({ example: '/uploads/company-logo-dark-123456.png', description: 'Company dark mode logo relative URL', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @IsOptional()
  company_logo_dark_url?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Company UUID if editing existing', required: false })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsUUID()
  @IsOptional()
  company_id?: string;
}
