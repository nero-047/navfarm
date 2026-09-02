import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { batchTransaction, farmRecord, farmRecordAnimal } from './schema';

/**
 * `farm_record` is the object a person creates and corrects; `batch_transaction`
 * becomes its accounting consequence. `farm_record_animal` holds the selection
 * when an entry is scoped to specific animals rather than the whole batch —
 * which is what makes such an entry one editable thing instead of N orphan rows.
 */
describe('farm_record schema', () => {
  it('carries the columns the record layer needs', () => {
    const columns = Object.keys(farmRecord);
    for (const required of [
      'record_id', 'tenant_id', 'company_id', 'batch_id', 'record_date', 'record_type',
      'scope', 'stage_code', 'item_id', 'resource_id', 'quantity', 'uom', 'rate', 'amount',
      'remarks', 'version', 'status', 'supersedes_id', 'superseded_by_id',
      'created_by', 'created_at', 'updated_by', 'updated_at',
    ]) {
      expect({ column: required, present: columns.includes(required) })
        .toEqual({ column: required, present: true });
    }
  });

  it('lets a transaction point back at the record that produced it', () => {
    // Nullable and ON DELETE SET NULL: costing must survive a record being
    // voided, and the column exists for provenance, not as a dependency.
    expect(Object.keys(batchTransaction).includes('record_id')).toBe(true);
  });

  it('links selected animals to their record', () => {
    const columns = Object.keys(farmRecordAnimal);
    for (const required of ['line_id', 'record_id', 'animal_id']) {
      expect({ column: required, present: columns.includes(required) })
        .toEqual({ column: required, present: true });
    }
  });
});

/**
 * MySQL caps identifiers at 64 characters. Drizzle derives foreign key names
 * from table and column names, and for tables with long names those derived
 * names come out over the limit — migration 0049 was rejected mid-apply for
 * exactly this, leaving the tables created and their constraints missing.
 *
 * So every explicitly named constraint in the schema has to stay inside 64.
 */
describe('constraint names fit MySQL', () => {
  it('keeps every explicit constraint name under 64 characters', () => {
    const source = readFileSync(join(__dirname, 'schema.ts'), 'utf8');
    const names = [...source.matchAll(/name:\s*'([a-z0-9_]+)'/gi)].map((m) => m[1]);

    const tooLong = names.filter((n) => n.length > 64).map((n) => ({ name: n, length: n.length }));

    expect(tooLong).toEqual([]);
    // Guard the guard: if the pattern stops matching, the test would pass vacuously.
    expect(names.length).toBeGreaterThan(0);
  });
});
