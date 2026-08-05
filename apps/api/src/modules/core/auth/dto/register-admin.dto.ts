import { IsString, IsEmail, IsNotEmpty, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAdminDto {
  @ApiProperty({ example: 'admin@greenvalley.com', description: 'Admin login email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!', description: 'Minimum 8 characters' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password_hash: string;

  @ApiProperty({ example: 'Rajesh Kumar Sharma', description: 'Admin full name' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: '+919999999999', description: 'Optional contact number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the tenant group' })
  @IsUUID()
  @IsNotEmpty()
  tenant_id: string;

  @ApiProperty({ example: '456e4567-e89b-12d3-a456-426614174000', description: 'UUID of the company' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'Asia/Kolkata', description: 'Timezone identifier' })
  @IsString()
  @IsNotEmpty()
  timezone_pref_id: string;

  @ApiProperty({ example: 'STANDARD_USER', description: 'User role classification type', required: false })
  @IsString()
  @IsOptional()
  user_type?: string;
}
