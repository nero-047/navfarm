import { IsString, IsEmail, IsNotEmpty, IsOptional, Matches, Length, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupTenantDto {
  @ApiProperty({ example: 'gvf', description: 'Unique subdomain code (lowercase alphanumeric or hyphens, 3-20 chars)' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^[a-z0-9-]+$/i, { message: 'Subdomain code must contain only letters, numbers, and hyphens.' })
  tenant_code: string;

  @ApiProperty({ example: 'Green Valley Farms', description: 'Legal tenant name' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  tenant_name: string;

  @ApiProperty({ example: 'SME', description: 'Tenant classification: INDIVIDUAL / SME / ENTERPRISE', required: false })
  @IsString()
  @IsOptional()
  tenant_type?: string;

  @ApiProperty({ example: 'PLAN_PRO', description: 'Plan code to register', required: false })
  @IsString()
  @IsOptional()
  plan_id?: string;

  @ApiProperty({ example: 'billing@greenvalley.com', description: 'Primary contact email for invoicing' })
  @IsEmail()
  @IsNotEmpty()
  billing_email: string;

  @ApiProperty({ example: 'Admin User', description: 'Initial Tenant Administrator full name' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  admin_name: string;

  @ApiProperty({ example: 'admin@subdomain.com', description: 'Initial Tenant Administrator email address' })
  @IsEmail()
  @IsNotEmpty()
  admin_email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Initial Tenant Administrator password' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100, { message: 'Administrator password must be at least 8 characters long.' })
  admin_password: string;

  @ApiProperty({ example: ['nob-uuid-1'], description: 'List of permitted NOB IDs for this tenant', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_nob_ids?: string[];

  @ApiProperty({ example: ['lob-uuid-1'], description: 'List of permitted LOB IDs for this tenant', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_lob_ids?: string[];
}
