import { IsString, IsOptional, IsUUID, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Dr. Arjun Sharma', required: false })
  @IsString()
  @IsOptional()
  @Length(2, 200)
  full_name?: string;

  @ApiProperty({ example: '+91 99999 88888', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Genetics & Breeding', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 'Director', required: false })
  @IsString()
  @IsOptional()
  designation?: string;

  @ApiProperty({ example: '/uploads/avatar-123.png', required: false })
  @IsString()
  @IsOptional()
  profile_photo_url?: string;

  @ApiProperty({ description: 'Language master UUID', required: false })
  @IsUUID()
  @IsOptional()
  lang_pref_id?: string;

  @ApiProperty({ description: 'IANA timezone identifier', required: false })
  @IsString()
  @IsOptional()
  timezone_pref_id?: string;

  @ApiProperty({ example: 'hi', description: 'UI language code', required: false })
  @IsString()
  @IsOptional()
  @Length(2, 10)
  ui_language?: string;
}
