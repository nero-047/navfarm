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

  /**
   * The in-progress record, keyed by field name, so a series configured with
   * code_segments / prefix_field previews the code it will actually allocate.
   * Without it the form showed BRD-001 live and saved LARGEWHITE-001.
   *
   * Sent as JSON because this is a GET: a query string cannot carry an object,
   * and the alternative — one query parameter per field — cannot be validated
   * or bounded.
   */
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  record?: string;
}
