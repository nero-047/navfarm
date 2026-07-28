import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum InspectionTypeEnum {
  INCOMING = 'INCOMING',
  IN_PROCESS = 'IN_PROCESS',
  FINAL = 'FINAL',
  OUTGOING = 'OUTGOING',
}

export class CreateQualityParameterDto {
  @ApiProperty({ example: 'Moisture Content' })
  @IsString()
  @IsNotEmpty()
  parameter_name: string;

  @ApiProperty({ example: 12.0, required: false })
  @IsNumber()
  @IsOptional()
  target_value?: number;

  @ApiProperty({ example: 10.0, required: false })
  @IsNumber()
  @IsOptional()
  min_value?: number;

  @ApiProperty({ example: 14.0, required: false })
  @IsNumber()
  @IsOptional()
  max_value?: number;

  @ApiProperty({ example: 'uom-pct', required: false })
  @IsString()
  @IsOptional()
  uom_id?: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;
}

export class CreateQualityPlanDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'PLAN-FEED-01' })
  @IsString()
  @IsNotEmpty()
  plan_code: string;

  @ApiProperty({ example: 'Poultry Feed Quality Inspection Plan' })
  @IsString()
  @IsNotEmpty()
  plan_name: string;

  @ApiProperty({ enum: InspectionTypeEnum, default: InspectionTypeEnum.INCOMING })
  @IsEnum(InspectionTypeEnum)
  @IsNotEmpty()
  inspection_type: InspectionTypeEnum;

  @ApiProperty({ example: 'item-uuid', required: false })
  @IsString()
  @IsOptional()
  item_id?: string;

  @ApiProperty({ example: 'item-cat-uuid', required: false })
  @IsString()
  @IsOptional()
  item_category_id?: string;

  @ApiProperty({ type: [CreateQualityParameterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQualityParameterDto)
  parameters: CreateQualityParameterDto[];
}
