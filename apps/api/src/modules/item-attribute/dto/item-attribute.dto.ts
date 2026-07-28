import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemAttributeDefinitionDto {
  @ApiProperty({ example: 'uuid-nob-01', required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ example: 'uuid-lob-02', required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ example: 'PROTEIN_PCT' })
  @IsString()
  @IsNotEmpty()
  attribute_code: string;

  @ApiProperty({ example: 'Protein Percentage' })
  @IsString()
  @IsNotEmpty()
  attribute_name: string;

  @ApiProperty({ example: 'NUMBER', description: 'TEXT / NUMBER / DATE / BOOLEAN / LIST' })
  @IsString()
  @IsNotEmpty()
  data_type: string;

  @ApiProperty({ example: 'PCT', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: ['Grade A', 'Grade B', 'Grade C'], required: false })
  @IsArray()
  @IsOptional()
  list_values?: string[];

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  affects_costing?: boolean;
}

export class SetItemAttributeValueDto {
  @ApiProperty({ example: 'uuid-attr-001' })
  @IsString()
  @IsNotEmpty()
  attribute_id: string;

  @ApiProperty({ example: '18.5', description: 'Actual recorded value as string' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
