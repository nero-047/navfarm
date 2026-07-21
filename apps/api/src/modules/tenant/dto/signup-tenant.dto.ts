import { IsString, IsEmail, IsNotEmpty, IsOptional, IsAlphanumeric, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupTenantDto {
  @ApiProperty({ example: 'gvf', description: 'Unique subdomain code (alphanumeric, 3-20 chars)' })
  @IsAlphanumeric()
  @IsNotEmpty()
  @Length(3, 20)
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
  admin_name: string;

  @ApiProperty({ example: 'admin@subdomain.com', description: 'Initial Tenant Administrator email address' })
  @IsEmail()
  @IsNotEmpty()
  admin_email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Initial Tenant Administrator password' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 100)
  admin_password: string;
}
