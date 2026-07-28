import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNobLobConfigDto {
  @ApiProperty({ example: 'uuid-nob-01', required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ example: 'uuid-lob-05', required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ example: 'egg_grading_batch_required', description: 'Config key identifier' })
  @IsString()
  @IsNotEmpty()
  config_key: string;

  @ApiProperty({ example: 'TRUE', description: 'Config value as string' })
  @IsString()
  @IsNotEmpty()
  config_value: string;

  @ApiProperty({ example: 'BOOLEAN', description: 'BOOLEAN / VARCHAR / INTEGER / DECIMAL / JSON' })
  @IsString()
  @IsNotEmpty()
  data_type: string;
}

export class UpdateNobLobConfigDto {
  @ApiProperty({ example: 'DYNAMIC' })
  @IsString()
  @IsNotEmpty()
  config_value: string;
}
