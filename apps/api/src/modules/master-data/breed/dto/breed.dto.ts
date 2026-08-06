import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// SPECIES DTOs
// ==========================================

export class CreateSpeciesDto {
  @ApiProperty({ description: 'Unique code representing the species', example: 'CHICKEN' })
  @IsString()
  @IsNotEmpty()
  species_code: string;

  @ApiProperty({ description: 'Full name of the species', example: 'Chicken' })
  @IsString()
  @IsNotEmpty()
  species_name: string;

  @ApiProperty({ description: 'Company UUID (null means global tenant-wide)', required: false, example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  @IsOptional()
  company_id?: string;
}

export class UpdateSpeciesDto {
  @ApiProperty({ description: 'Species unique code', required: false, example: 'CHICKEN' })
  @IsString()
  @IsOptional()
  species_code?: string;

  @ApiProperty({ description: 'Species full name', required: false, example: 'Chicken' })
  @IsString()
  @IsOptional()
  species_name?: string;

  @ApiProperty({ description: 'Active status', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ description: 'Status description', required: false, example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ARCHIVE'] })
  @IsString()
  @IsOptional()
  status?: string;
}

export class QuerySpeciesDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ description: 'Search term for code or name', required: false })
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

// ==========================================
// BREED DTOs
// ==========================================

export class CreateBreedDto {
  @ApiProperty({ description: 'Nature of Business UUID scope', example: '50000000-5000-5000-5000-000000000001' })
  @IsString()
  @IsNotEmpty()
  nob_id: string;

  @ApiProperty({ description: 'Line of Business UUID scope (optional)', required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ description: 'Unique code representing the breed', example: 'COBB500' })
  @IsString()
  @IsNotEmpty()
  breed_code: string;

  @ApiProperty({ description: 'Full descriptive name of the breed', example: 'Cobb 500 Broiler' })
  @IsString()
  @IsNotEmpty()
  breed_name: string;

  @ApiProperty({ description: 'Species UUID link', example: '00000000-0000-0000-0000-000000000000' })
  @IsUUID()
  @IsNotEmpty()
  species_id: string;

  @ApiProperty({ description: 'Legacy text description of species', required: false, example: 'Chicken' })
  @IsString()
  @IsOptional()
  species?: string;

  @ApiProperty({ description: 'Breed type classification', example: 'BROILER', enum: ['BROILER', 'LAYER', 'BREEDER', 'DUAL_PURPOSE', 'DAIRY', 'BEEF', 'TREE', 'FISH'] })
  @IsString()
  @IsNotEmpty()
  breed_type: string;

  @ApiProperty({ description: 'Average daily growth rate in grams', required: false, example: 52.4 })
  @IsNumber()
  @IsOptional()
  avg_growth_rate_g_day?: number;

  @ApiProperty({ description: 'Benchmark Feed Conversion Ratio (FCR)', required: false, example: 1.6500 })
  @IsNumber()
  @IsOptional()
  avg_fcr?: number;

  @ApiProperty({ description: 'Expected benchmark mortality %', required: false, example: 3.50 })
  @IsNumber()
  @IsOptional()
  avg_mortality_pct?: number;

  @ApiProperty({ description: 'Laying hens benchmark lay rate %', required: false, example: 85.00 })
  @IsNumber()
  @IsOptional()
  avg_lay_rate_pct?: number;

  @ApiProperty({ description: 'Hatching egg incubation days', required: false, example: 21 })
  @IsInt()
  @Min(0)
  @IsOptional()
  incubation_days?: number;

  @ApiProperty({ description: 'Gestation/pregnancy days for mammals', required: false, example: 114 })
  @IsInt()
  @Min(0)
  @IsOptional()
  gestation_days?: number;

  @ApiProperty({ description: 'Average litter size per birth', required: false, example: 10.50 })
  @IsNumber()
  @IsOptional()
  avg_litter_size?: number;

  @ApiProperty({ description: 'Age at productive maturity in months', required: false, example: 6 })
  @IsInt()
  @Min(0)
  @IsOptional()
  mature_age_months?: number;

  @ApiProperty({ description: 'Productive lifespan in months', required: false, example: 18 })
  @IsInt()
  @Min(0)
  @IsOptional()
  productive_life_months?: number;

  @ApiProperty({ description: 'Trees target years to maturity', required: false, example: 5.00 })
  @IsNumber()
  @IsOptional()
  premature_years?: number;

  @ApiProperty({ description: 'Average yield per unit (eggs/day, L milk/day, etc.)', required: false, example: 1.00 })
  @IsNumber()
  @IsOptional()
  avg_yield_per_unit?: number;

  @ApiProperty({ description: 'Additional description details', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Company UUID scope (null means global)', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

  @ApiProperty({ description: 'Flexible custom config config extensions in JSON format', required: false })
  @IsOptional()
  extension_config?: any;
}

export class UpdateBreedDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lob_id?: string;

  @ApiProperty({ required: false, example: 'COBB500' })
  @IsString()
  @IsOptional()
  breed_code?: string;

  @ApiProperty({ required: false, example: 'Cobb 500 Broiler' })
  @IsString()
  @IsOptional()
  breed_name?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  species_id?: string;

  @ApiProperty({ required: false, example: 'Chicken' })
  @IsString()
  @IsOptional()
  species?: string;

  @ApiProperty({ required: false, example: 'BROILER' })
  @IsString()
  @IsOptional()
  breed_type?: string;

  @ApiProperty({ required: false, example: 52.4 })
  @IsNumber()
  @IsOptional()
  avg_growth_rate_g_day?: number;

  @ApiProperty({ required: false, example: 1.65 })
  @IsNumber()
  @IsOptional()
  avg_fcr?: number;

  @ApiProperty({ required: false, example: 3.5 })
  @IsNumber()
  @IsOptional()
  avg_mortality_pct?: number;

  @ApiProperty({ required: false, example: 85.0 })
  @IsNumber()
  @IsOptional()
  avg_lay_rate_pct?: number;

  @ApiProperty({ required: false, example: 21 })
  @IsInt()
  @Min(0)
  @IsOptional()
  incubation_days?: number;

  @ApiProperty({ required: false, example: 114 })
  @IsInt()
  @Min(0)
  @IsOptional()
  gestation_days?: number;

  @ApiProperty({ required: false, example: 10.5 })
  @IsNumber()
  @IsOptional()
  avg_litter_size?: number;

  @ApiProperty({ required: false, example: 6 })
  @IsInt()
  @Min(0)
  @IsOptional()
  mature_age_months?: number;

  @ApiProperty({ required: false, example: 18 })
  @IsInt()
  @Min(0)
  @IsOptional()
  productive_life_months?: number;

  @ApiProperty({ required: false, example: 5.0 })
  @IsNumber()
  @IsOptional()
  premature_years?: number;

  @ApiProperty({ required: false, example: 1.0 })
  @IsNumber()
  @IsOptional()
  avg_yield_per_unit?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

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

export class QueryBreedDto {
  @ApiProperty({ description: 'Filter by company UUID', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ description: 'Filter by species UUID', required: false })
  @IsOptional()
  @IsString()
  speciesId?: string;

  @ApiProperty({ description: 'Filter by NOB UUID', required: false })
  @IsOptional()
  @IsString()
  nobId?: string;

  @ApiProperty({ description: 'Filter by LOB UUID', required: false })
  @IsOptional()
  @IsString()
  lobId?: string;

  @ApiProperty({ description: 'Filter by breed type', required: false, example: 'BROILER' })
  @IsOptional()
  @IsString()
  breedType?: string;

  @ApiProperty({ description: 'Filter by active status', required: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiProperty({ description: 'Search breed code or name', required: false })
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
