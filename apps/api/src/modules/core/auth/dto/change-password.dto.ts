import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPass@123' })
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @ApiProperty({ example: 'NewPass@456' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  new_password: string;
}
