import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class Step9AdminUserDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  company_id!: string;

  @ApiProperty({ description: 'Admin Full Name' })
  @IsString()
  @IsNotEmpty()
  full_name!: string;

  @ApiProperty({ description: 'Admin Email Address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Admin Phone Number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Admin User ID', required: false })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
