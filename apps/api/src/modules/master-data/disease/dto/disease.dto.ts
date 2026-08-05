import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiseaseDto {
  @ApiProperty({ description: 'Company UUID scope ownership', example: 'company-uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ description: 'Unique code representing the disease definition', example: 'DIS-ND' })
  @IsString()
  @IsNotEmpty()
  disease_code: string;

  @ApiProperty({ description: 'Common name of the disease', example: 'Newcastle Disease' })
  @IsString()
  @IsNotEmpty()
  disease_name: string;

  @ApiProperty({ description: 'Scientific taxonomic name', required: false, example: 'Avian paramyxovirus 1' })
  @IsString()
  @IsOptional()
  scientific_name?: string;

  @ApiProperty({ description: 'Common clinical symptoms', required: false })
  @IsString()
  @IsOptional()
  symptoms?: string;

  @ApiProperty({ description: 'Treatment protocol and guidelines', required: false })
  @IsString()
  @IsOptional()
  treatment_guideline?: string;

  @ApiProperty({ description: 'Flexible custom config configurations in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateDiseaseDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  disease_code?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  disease_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  scientific_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  symptoms?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  treatment_guideline?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ required: false, example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVE'] })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  extension_config?: any;
}

export class QueryDiseaseDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search disease code, name or symptoms', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Results per page', default: 50, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ description: 'Pagination offset', default: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
