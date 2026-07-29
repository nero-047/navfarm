import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@greenvalley.com', description: 'User account email for password reset' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'admin@greenvalley.com', description: 'User account email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Password reset token received via forgot password' })
  @IsString()
  @IsNotEmpty()
  reset_token: string;

  @ApiProperty({ example: 'NewSecurePassword123!', description: 'Minimum 8 characters' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;
}
