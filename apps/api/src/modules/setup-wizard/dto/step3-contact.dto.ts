import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step3ContactDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'PRIMARY', description: 'Contact classification: PRIMARY / BILLING / OPERATIONS' })
  @IsString()
  @IsNotEmpty()
  contact_type: string;

  @ApiProperty({ example: 'Devendra Singh', description: 'Contact person full name' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'General Manager', description: 'Designation, job role', required: false })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty({ example: 'devendra@greenvalley.com', description: 'Contact email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+919999999991', description: 'Primary phone contact number' })
  @IsString()
  @IsNotEmpty()
  phone_primary: string;

  @ApiProperty({ example: true, description: 'Flag to send high priority alerts to this contact' })
  @IsBoolean()
  @IsOptional()
  receives_alerts?: boolean;
}
