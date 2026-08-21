import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsString, IsInt, Min, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class MarkAlertReadDto {
  @ApiProperty({ description: 'Company UUID the alert belongs to' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;
}

export class MarkAllAlertsReadDto {
  @ApiProperty({ description: 'Company UUID' })
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Optional batch UUID to only acknowledge alerts for a specific batch', required: false })
  @IsUUID()
  @IsOptional()
  batchId?: string;
}

export class QueryAlertDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiProperty({ required: false, enum: ['WARNING', 'CRITICAL'] })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1' || value === 1) return true;
    if (value === 'false' || value === false || value === '0' || value === 0) return false;
    return undefined;
  })
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
