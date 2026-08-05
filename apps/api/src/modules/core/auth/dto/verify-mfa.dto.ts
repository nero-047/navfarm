import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMfaDto {
  @ApiProperty({ example: 'admin@greenvalley.com', description: 'User login email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit TOTP validation code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
