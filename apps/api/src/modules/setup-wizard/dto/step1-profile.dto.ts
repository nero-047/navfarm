import { IsString, IsNotEmpty, IsOptional, IsUUID, IsHexColor, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
  @IsString()
  @IsOptional()
  registration_no?: string;

  @ApiProperty({ example: '07AAAAA1111A1Z1', description: 'Tax registration number (GSTIN / TIN)', required: false })
  @IsString()
  @IsOptional()
  tax_id?: string;

  @ApiProperty({ example: '#1F4E79', description: 'Hex code for brand colors', required: false })
  @IsHexColor()
  @IsOptional()
  primary_color_hex?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Company UUID if editing existing', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;
}
