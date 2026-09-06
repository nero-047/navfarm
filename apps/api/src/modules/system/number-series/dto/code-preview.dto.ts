import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CodePreviewDto {
  @IsString()
  @Matches(/^[A-Z][A-Z_]{0,49}$/)
  master!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lobId?: string;
}
