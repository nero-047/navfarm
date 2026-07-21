import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Step8ModulesDto {
  @ApiProperty({ 
    type: [String], 
    example: ['MODULE_POULTRY', 'MODULE_LIVESTOCK'],
    description: 'Array of Nature of Business (NOB) module codes to enable' 
  })
  @IsArray()
  @IsString({ each: true })
  modules: string[];
}
