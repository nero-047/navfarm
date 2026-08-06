import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateNobDto {
  @ApiProperty({ description: 'Short unique Nature of Business code name', example: 'POULTRY' })
  @IsString()
  @IsNotEmpty()
  nob_code: string;

  @ApiProperty({ description: 'Display name of the vertical sector', example: 'Poultry Farming' })
  @IsString()
  @IsNotEmpty()
  nob_name: string;

  @ApiProperty({ description: 'Default cost calculation methodology config', default: 'STANDARD', example: 'STANDARD' })
  @IsString()
  @IsOptional()
  default_costing_method?: string;

  @ApiProperty({ description: 'Optional textual description details', required: false, example: 'Poultry production chain' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'UI navigation list display ordering order ID number', required: false, example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ description: 'Flag marking vertical as built-in default', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  is_system?: boolean;
}

export class UpdateNobDto {
  @ApiProperty({ description: 'Short unique Nature of Business code name', required: false, example: 'POULTRY' })
  @IsString()
  @IsOptional()
  nob_code?: string;

  @ApiProperty({ description: 'Display name of the vertical sector', required: false, example: 'Poultry Farming' })
  @IsString()
  @IsOptional()
  nob_name?: string;

  @ApiProperty({ description: 'Default cost calculation methodology config', required: false, example: 'STANDARD' })
  @IsString()
  @IsOptional()
  default_costing_method?: string;

  @ApiProperty({ description: 'Optional textual description details', required: false, example: 'Poultry production chain' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'UI navigation list display ordering order ID number', required: false, example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ description: 'Flag marking vertical as built-in default', required: false, example: false })
  @IsBoolean()
  @IsOptional()
  is_system?: boolean;

  @ApiProperty({ description: 'Is Active flag status', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class CreateLobDto {
  @ApiProperty({ description: 'Parent Nature of Business UUID mapping code', example: '00000000-0000-0000-0000-000000000000' })
  @IsString()
  @IsNotEmpty()
  nob_id: string;

  @ApiProperty({ description: 'Short unique Line of Business code name', example: 'PLT_REARING' })
  @IsString()
  @IsNotEmpty()
  lob_code: string;

  @ApiProperty({ description: 'Display name of the sub-sector', example: 'Rearing' })
  @IsString()
  @IsNotEmpty()
  lob_name: string;

  @ApiProperty({ description: 'Costing methods permitted, comma-separated', example: 'STANDARD,FIFO' })
  @IsString()
  @IsNotEmpty()
  costing_method_allowed: string;

  @ApiProperty({ description: 'Is Quality Control inspection mandatory before release', default: 'NO', example: 'NO' })
  @IsString()
  @IsOptional()
  qc_required?: string;

  @ApiProperty({ description: 'Is QR code generation mandatory for packages', default: 'NO', example: 'NO' })
  @IsString()
  @IsOptional()
  qr_required?: string;

  @ApiProperty({ description: 'Is cloning previous batch header allowed', default: 'NO', example: 'NO' })
  @IsString()
  @IsOptional()
  batch_copy_allowed?: string;

  @ApiProperty({ description: 'Is copying previous batch scheduler allowed', default: 'NO', example: 'NO' })
  @IsString()
  @IsOptional()
  scheduler_copy_allowed?: string;

  @ApiProperty({ description: 'Is biosecurity traceability tracing mandatory', default: 'YES', example: 'YES' })
  @IsString()
  @IsOptional()
  traceability_required?: string;

  @ApiProperty({ description: 'Optional description details', required: false, example: 'Breeding rearing stage' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'UI navigation list display ordering order ID number', required: false, example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ description: 'Flag marking sub-sector as built-in default', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  is_system?: boolean;
}

export class UpdateLobDto {
  @ApiProperty({ description: 'Parent Nature of Business UUID mapping code', required: false, example: '00000000-0000-0000-0000-000000000000' })
  @IsString()
  @IsOptional()
  nob_id?: string;

  @ApiProperty({ description: 'Short unique Line of Business code name', required: false, example: 'PLT_REARING' })
  @IsString()
  @IsOptional()
  lob_code?: string;

  @ApiProperty({ description: 'Display name of the sub-sector', required: false, example: 'Rearing' })
  @IsString()
  @IsOptional()
  lob_name?: string;

  @ApiProperty({ description: 'Costing methods permitted, comma-separated', required: false, example: 'STANDARD,FIFO' })
  @IsString()
  @IsOptional()
  costing_method_allowed?: string;

  @ApiProperty({ description: 'Is Quality Control inspection mandatory before release', required: false, example: 'NO' })
  @IsString()
  @IsOptional()
  qc_required?: string;

  @ApiProperty({ description: 'Is QR code generation mandatory for packages', required: false, example: 'NO' })
  @IsString()
  @IsOptional()
  qr_required?: string;

  @ApiProperty({ description: 'Is cloning previous batch header allowed', required: false, example: 'NO' })
  @IsString()
  @IsOptional()
  batch_copy_allowed?: string;

  @ApiProperty({ description: 'Is copying previous batch scheduler allowed', required: false, example: 'NO' })
  @IsString()
  @IsOptional()
  scheduler_copy_allowed?: string;

  @ApiProperty({ description: 'Is biosecurity traceability tracing mandatory', required: false, example: 'YES' })
  @IsString()
  @IsOptional()
  traceability_required?: string;

  @ApiProperty({ description: 'Optional description details', required: false, example: 'Breeding rearing stage' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'UI navigation list display ordering order ID number', required: false, example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ description: 'Flag marking sub-sector as built-in default', required: false, example: false })
  @IsBoolean()
  @IsOptional()
  is_system?: boolean;

  @ApiProperty({ description: 'Is Active flag status', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
