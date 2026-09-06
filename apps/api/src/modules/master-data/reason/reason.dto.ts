import { PartialType, OmitType } from '@nestjs/swagger';
import { IsArray, ArrayUnique, ArrayMaxSize, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { REASON_CATEGORIES } from '../../../core/database/reason-code-seed';
import type { ReasonCategory } from '../../../core/database/reason-code-seed';

export class CreateReasonDto {
  @IsOptional() @IsUUID() company_id?: string;
  @IsOptional() @IsString() @MaxLength(50) reason_code?: string;
  @IsString() @IsNotEmpty() @Matches(/\S/) @MaxLength(150) reason_name!: string;
  @IsIn(REASON_CATEGORIES) category!: ReasonCategory;
  /** Canonical BBP stage codes, not record UUIDs. Null/empty means all stages. */
  @IsOptional() @IsArray() @ArrayUnique() @ArrayMaxSize(50)
  @IsString({ each: true }) @Matches(/^[A-Z][A-Z0-9_]{0,49}$/, { each: true }) applicable_stages?: string[] | null;
  @IsOptional() @IsBoolean() mandatory_weight?: boolean;
}
export class UpdateReasonDto extends PartialType(OmitType(CreateReasonDto, ['company_id'] as const)) {}
export class QueryReasonDto {
  @IsOptional() @IsUUID() companyId?: string;
  @IsOptional() @IsString() @MaxLength(150) search?: string;
  @IsOptional() @IsIn(REASON_CATEGORIES) category?: ReasonCategory;
  @IsOptional() @IsString() @Matches(/^[A-Z][A-Z0-9_]{0,49}$/) stageCode?: string;
  @IsOptional() @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean() isActive?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}
