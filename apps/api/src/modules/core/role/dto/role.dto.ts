import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @ApiProperty({ 
    description: 'Company identifier scoping the role', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ 
    description: 'Short unique role code name', 
    example: 'FARM_SUPERVISOR' 
  })
  @IsString()
  @IsNotEmpty()
  roleCode: string;

  @ApiProperty({ 
    description: 'Display name of the custom role', 
    example: 'Farm Supervisor' 
  })
  @IsString()
  @IsNotEmpty()
  roleName: string;

  @ApiProperty({ 
    description: 'Optional textual description details', 
    required: false, 
    example: 'Manages batch feeding operations' 
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignRoleDto {
  @ApiProperty({ 
    description: 'User identifier receiving the assignment', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ 
    description: 'Role identifier to assign', 
    example: '00000000-0000-0000-0000-000000000000' 
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class PermissionItemDto {
  @ApiProperty({ description: 'System module code name', example: 'POULTRY' })
  @IsString()
  @IsNotEmpty()
  module_code: string;

  @ApiProperty({ description: 'Target resource asset classification', example: 'BATCH' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ description: 'Allows viewing records', default: false, example: true })
  @IsBoolean()
  @IsOptional()
  can_view?: boolean;

  @ApiProperty({ description: 'Allows creating records', default: false, example: true })
  @IsBoolean()
  @IsOptional()
  can_create?: boolean;

  @ApiProperty({ description: 'Allows updating records', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  can_edit?: boolean;

  @ApiProperty({ description: 'Allows deleting records', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  can_delete?: boolean;

  @ApiProperty({ description: 'Allows approving workflow status changes', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  can_approve?: boolean;

  @ApiProperty({ description: 'Allows exporting reports/grids', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  can_export?: boolean;

  @ApiProperty({ description: 'Allows printing documents', default: false, example: false })
  @IsBoolean()
  @IsOptional()
  can_print?: boolean;
}

export class UpdateRoleDto {
  @ApiProperty({ description: 'Updated display name', required: false, example: 'Senior Farm Supervisor' })
  @IsString()
  @IsOptional()
  roleName?: string;

  @ApiProperty({ description: 'Updated description', required: false, example: 'Manages batch feeding and health operations' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Activate or deactivate the role', required: false, example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePermissionsDto {
  @ApiProperty({ 
    description: 'Array of module and resource-specific action policies mapping permission structures', 
    type: [PermissionItemDto] 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionItemDto)
  permissions: PermissionItemDto[];
}
