import { generateCompositeCode } from './composite-code.util';

// Unit tests for the generator extracted from location.service.ts's
// generateLocationCode — the rule verified live in the running app:
// FARM-001 -> FARM-001/SHED-001 -> FARM-001/SHED-001/PEN-001 ->
// FARM-001/SHED-001/SILO-001, and FARM-002/SHED-001 (sequence counts per
// parent, not per company). location.service.spec.ts's "hierarchical
// location codes" describe block is the original specification; these
// tests cover the same properties on the extracted, table-agnostic function.
describe('generateCompositeCode', () => {
  const fetchSiblingCodes = (codes: string[]) => async () => codes.map((code) => ({ code }));

  it('builds a child code from the parent code and type prefix when no siblings exist yet', async () => {
    const code = await generateCompositeCode({
      parentCode: 'FARM-001',
      prefix: 'SHED',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes([]),
    });
    expect(code).toBe('FARM-001/SHED-001');
  });

  it('takes MAX(parsed suffix) + 1 over siblings, not a count', async () => {
    const code = await generateCompositeCode({
      parentCode: 'FARM-001',
      prefix: 'SHED',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes(['FARM-001/SHED-001', 'FARM-001/SHED-002']),
    });
    expect(code).toBe('FARM-001/SHED-003');
  });

  it('does not collide after a sibling is deleted, because it derives from MAX not a count', async () => {
    // Only SHED-002 remains (SHED-001 was deleted) — a naive "count + 1" would
    // produce SHED-002 again and collide; MAX(suffix) + 1 correctly yields 003.
    const code = await generateCompositeCode({
      parentCode: 'FARM-001',
      prefix: 'SHED',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes(['FARM-001/SHED-002']),
    });
    expect(code).toBe('FARM-001/SHED-003');
  });

  it('counts siblings within the parent, not globally — a second parent starts its own sequence at 001', async () => {
    const code = await generateCompositeCode({
      parentCode: 'FARM-002',
      prefix: 'SHED',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes([]), // FARM-002 has no sheds of its own yet
    });
    expect(code).toBe('FARM-002/SHED-001');
  });

  it('skips sibling codes that do not match the pattern instead of failing', async () => {
    const code = await generateCompositeCode({
      parentCode: 'FARM-001',
      prefix: 'SHED',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes(['FARM-001/SHED-001', 'FARM-APEX-01', 'not-a-code']),
    });
    expect(code).toBe('FARM-001/SHED-002');
  });

  it('nests to arbitrary depth — the parent code itself may already be composite', async () => {
    const code = await generateCompositeCode({
      parentCode: 'FARM-001/SHED-001',
      prefix: 'PEN',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes([]),
    });
    expect(code).toBe('FARM-001/SHED-001/PEN-001');

    const deeper = await generateCompositeCode({
      parentCode: 'FARM-001/SHED-001/PEN-001',
      prefix: 'SILO',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes([]),
    });
    expect(deeper).toBe('FARM-001/SHED-001/PEN-001/SILO-001');
  });

  it('throws when called without a parent code — root codes are generateNext\'s job, not this function\'s', async () => {
    await expect(generateCompositeCode({
      parentCode: null,
      prefix: 'SHED',
      seqLength: 3,
      fetchSiblingCodes: fetchSiblingCodes([]),
    })).rejects.toThrow();
  });
});
