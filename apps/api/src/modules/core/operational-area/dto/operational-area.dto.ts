import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum PreseedSource {
  TENANT = 'TENANT',
  COMPANY = 'COMPANY',
  NONE = 'NONE',
}

export class CreateOperationalAreaDto {
  @IsString()
  @IsNotEmpty()
  company_id!: string;

  @IsString()
  @IsOptional()
  farm_id?: string;

  @IsString()
  @IsNotEmpty()
  nob_id!: string;

  @IsString()
  @IsNotEmpty()
  lob_id!: string;

  @IsString()
  @IsNotEmpty()
  area_code!: string;

  @IsString()
  @IsNotEmpty()
  area_name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(PreseedSource)
  @IsOptional()
  preseed_source?: PreseedSource = PreseedSource.TENANT;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean = true;
}

export class UpdateOperationalAreaDto {
  @IsString()
  @IsOptional()
  area_name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  farm_id?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class AssignUserToAreaDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @IsString()
  @IsNotEmpty()
  area_id!: string;

  @IsString()
  @IsNotEmpty()
  company_id!: string;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean = true;
}
