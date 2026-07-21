import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class AssignUserCompanyDto {
  @ApiProperty({ description: 'User UUID to assign', example: '00000000-0000-0000-0000-000000000001' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Company UUID to assign the user to', example: '00000000-0000-0000-0000-000000000002' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Set as primary/home company', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
