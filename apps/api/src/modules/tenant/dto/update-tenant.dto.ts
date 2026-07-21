import { IsString, IsOptional, IsBoolean, IsEmail, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiProperty({ 
    example: 'Green Valley Farms Inc.', 
    description: 'Updated legal tenant name', 
    required: false 
  })
  @IsString()
  @IsOptional()
  @Length(3, 200)
  tenant_name?: string;

  @ApiProperty({ 
    example: 'ENTERPRISE', 
    description: 'Tenant classification: INDIVIDUAL / SME / ENTERPRISE', 
    required: false 
  })
  @IsString()
  @IsOptional()
  tenant_type?: string;

  @ApiProperty({ 
    example: 'billing-updated@greenvalley.com', 
    description: 'Primary contact email for invoicing', 
    required: false 
  })
  @IsEmail()
  @IsOptional()
  billing_email?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Tenant active status toggle', 
    required: false 
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
