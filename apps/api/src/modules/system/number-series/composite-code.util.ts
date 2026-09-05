/**
 * Table-agnostic hierarchical/composite code generator, extracted from
 * location.service.ts's generateLocationCode — that private method is the
 * verified specification (its own tests keep passing unchanged against this
 * function). A child's code is `<parent code>/<prefix>-<seq>`; the caller
 * decides what "child" means for its own table via `fetchSiblingCodes`.
 *
 * Keeps every property location.service.ts's tests encode:
 *   - <seq> is MAX(parsed numeric suffix) + 1 over siblings, NOT a count —
 *     deleting a sibling must not cause a collision with a surviving one;
 *   - soft-deleted siblings still count toward MAX (the caller's
 *     fetchSiblingCodes decides whether to include them — location's does,
 *     because its unique index is not partial);
 *   - sibling codes that don't match `<parentCode>/<prefix>-<digits>` are
 *     skipped rather than treated as a parse failure;
 *   - this function does no locking itself — the caller is expected to hold
 *     the series row lock (NumberSeriesService.lockSeries) for the duration
 *     of fetchSiblingCodes() + this call + its own insert, the same way
 *     location.service.ts's generateLocationCode does.
 *
 * Root codes (no parent) are NOT this function's job — callers use
 * NumberSeriesService.generateNext for those, exactly as before.
 */
export interface GenerateCompositeCodeParams {
  /** The parent record's own code. Composite codes only exist below a parent. */
  parentCode: string | null | undefined;
  /** This level's type prefix, e.g. 'SHED', 'SILO' — becomes the code segment after the parent code. */
  prefix: string;
  /** Padding width for the sequence segment (from the locked series row's seq_length). */
  seqLength: number;
  /** Fetches the sibling codes to derive the next sequence from — scoped by whatever "sibling" means for the caller's table (same parent + same type, typically). */
  fetchSiblingCodes: () => Promise<Array<{ code: string | null }>>;
}

export async function generateCompositeCode(params: GenerateCompositeCodeParams): Promise<string> {
  const { parentCode, prefix, seqLength, fetchSiblingCodes } = params;
  if (!parentCode) {
    throw new Error('generateCompositeCode requires a parentCode — root codes are generated via NumberSeriesService.generateNext.');
  }

  const siblings = await fetchSiblingCodes();

  const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapeRegex(parentCode)}/${escapeRegex(prefix)}-(\\d+)$`, 'i');
  const nextSeq = siblings.reduce((max, row) => {
    const match = row.code?.match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0) + 1;

  return `${parentCode}/${prefix}-${String(nextSeq).padStart(seqLength, '0')}`;
}
