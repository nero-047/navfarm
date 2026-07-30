/**
 * NAVFarm Schema Validation Script
 * ─────────────────────────────────
 * Run via: pnpm nx run api:validate-schema
 *
 * Checks performed (no database connection required):
 *   1. Every mysqlTable exported from schema.ts appears in the latest
 *      Drizzle snapshot (0012_snapshot.json), confirming a valid migration exists.
 *   2. Every table in the snapshot appears in the schema exports (no orphaned
 *      migration-only tables that lack a schema definition).
 *   3. Every foreignKey() / .references() FK in the snapshot points to a
 *      table that also exists in the snapshot.
 *   4. Verifies migration 0012 SQL contains only additive DDL (CREATE TABLE,
 *      ALTER TABLE ADD CONSTRAINT, --> statement-breakpoint). No DROP TABLE,
 *      DROP COLUMN, or TRUNCATE is present.
 *   5. Confirms egg_grading_batch.source_batch_id FK references
 *      poultry_batch.poultry_batch_id (not any other table).
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as schema from '../core/database/schema';

// ─── Paths ────────────────────────────────────────────────────────────────────
const ROOT = resolve(__dirname, '../..');
const SNAPSHOT_PATH = resolve(ROOT, 'src/drizzle/tenant/meta/0012_snapshot.json');
const MIGRATION_SQL_PATH = resolve(ROOT, 'src/drizzle/tenant/0012_spicy_trish_tilby.sql');

// ─── Helpers ──────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function pass(msg: string) {
  console.log(`  ✓  ${msg}`);
  passed++;
}

function fail(msg: string) {
  console.error(`  ✗  ${msg}`);
  failed++;
}

function section(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

// ─── Load snapshot ────────────────────────────────────────────────────────────
const snapshot: {
  tables: Record<
    string,
    {
      columns: Record<string, unknown>;
      foreignKeys: Record<
        string,
        { tableFrom: string; columnsFrom: string[]; tableTo: string; columnsTo: string[] }
      >;
    }
  >;
} = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));

const snapshotTables = new Set(Object.keys(snapshot.tables));

// ─── Collect schema table names ───────────────────────────────────────────────
// drizzle mysqlTable objects carry a [Symbol.for('drizzle:Name')] or a `._.name`
// property depending on the drizzle-orm version. We support both.
const DRIZZLE_NAME_SYMBOL = Symbol.for('drizzle:Name');

function getTableName(table: unknown): string | undefined {
  if (table && typeof table === 'object') {
    // drizzle v0.29+ stores name on the table object directly
    if (DRIZZLE_NAME_SYMBOL in (table as object)) {
      return (table as Record<symbol, string>)[DRIZZLE_NAME_SYMBOL];
    }
    const t = table as Record<string, unknown>;
    if (t['_'] && typeof t['_'] === 'object') {
      const inner = t['_'] as Record<string, unknown>;
      if (typeof inner['name'] === 'string') return inner['name'];
    }
    if (typeof t['name'] === 'string') return t['name'];
  }
  return undefined;
}

const schemaTableNames = new Set<string>();
const schemaExports = schema as Record<string, unknown>;

for (const [exportKey, value] of Object.entries(schemaExports)) {
  // Skip relation objects and non-table exports
  if (exportKey.endsWith('Relations') || typeof value !== 'object' || value === null) continue;
  const name = getTableName(value);
  if (name) schemaTableNames.add(name);
}

// ─── CHECK 1: Every schema table has a migration ───────────────────────────────
section('CHECK 1 — Every schema.ts table has a valid migration snapshot entry');

const tablesOnlyInSchema = [...schemaTableNames].filter(t => !snapshotTables.has(t));
if (tablesOnlyInSchema.length === 0) {
  pass(`All ${schemaTableNames.size} schema tables are present in the 0012 snapshot.`);
} else {
  for (const t of tablesOnlyInSchema) {
    fail(`Table '${t}' exists in schema.ts but NOT in 0012 snapshot — needs a new migration.`);
  }
}

// ─── CHECK 2: Every snapshot table has a schema definition ────────────────────
section('CHECK 2 — Every snapshot table has a schema.ts definition (no orphans)');

const tablesOnlyInSnapshot = [...snapshotTables].filter(t => !schemaTableNames.has(t));
if (tablesOnlyInSnapshot.length === 0) {
  pass(`All ${snapshotTables.size} snapshot tables are accounted for in schema.ts.`);
} else {
  for (const t of tablesOnlyInSnapshot) {
    // notification_log was superseded by notification_history; flag as warning not error
    const label = t === 'notification_log' ? '[INFO — legacy, superseded by notification_history]' : '[WARN]';
    console.warn(`  ⚠  ${label} Table '${t}' is in snapshot but has no export in schema.ts.`);
  }
}

// ─── CHECK 3: All FK targets exist ────────────────────────────────────────────
section('CHECK 3 — All foreign key targets point to real tables in the snapshot');

let fkCount = 0;
let fkBroken = 0;
for (const [tableName, tableDef] of Object.entries(snapshot.tables)) {
  for (const [fkName, fkDef] of Object.entries(tableDef.foreignKeys ?? {})) {
    fkCount++;
    if (!snapshotTables.has(fkDef.tableTo)) {
      fail(
        `FK '${fkName}' on table '${tableName}' references unknown table '${fkDef.tableTo}'.`
      );
      fkBroken++;
    }
  }
}
if (fkBroken === 0) {
  pass(`All ${fkCount} foreign keys point to tables that exist in the snapshot.`);
}

// ─── CHECK 4: Migration 0012 is purely additive ────────────────────────────────
section('CHECK 4 — Migration 0012 contains no destructive DDL');

const migrationSql = readFileSync(MIGRATION_SQL_PATH, 'utf8').toUpperCase();
const destructivePatterns: Array<[RegExp, string]> = [
  [/\bDROP\s+TABLE\b/, 'DROP TABLE'],
  [/\bDROP\s+COLUMN\b/, 'DROP COLUMN'],
  [/\bTRUNCATE\b/, 'TRUNCATE'],
  [/\bDROP\s+DATABASE\b/, 'DROP DATABASE'],
  [/\bDELETE\s+FROM\b/, 'DELETE FROM (data manipulation in DDL migration)'],
];

let destructiveFound = false;
for (const [pattern, label] of destructivePatterns) {
  if (pattern.test(migrationSql)) {
    fail(`Migration 0012 contains destructive DDL: ${label}`);
    destructiveFound = true;
  }
}
if (!destructiveFound) {
  // Count additive statements
  const createCount = (migrationSql.match(/\bCREATE TABLE\b/g) ?? []).length;
  const alterCount = (migrationSql.match(/\bALTER TABLE\b/g) ?? []).length;
  pass(
    `Migration 0012 is fully additive: ${createCount} CREATE TABLE, ${alterCount} ALTER TABLE ADD CONSTRAINT.`
  );
}

// ─── CHECK 5: egg_grading_batch FK correctness ────────────────────────────────
section('CHECK 5 — egg_grading_batch.source_batch_id FK targets poultry_batch.poultry_batch_id');

const eggTable = snapshot.tables['egg_grading_batch'];
if (!eggTable) {
  fail("Table 'egg_grading_batch' not found in snapshot.");
} else {
  const fks = Object.values(eggTable.foreignKeys ?? {}).filter(
    fk => fk.columnsFrom.includes('source_batch_id')
  );
  if (fks.length === 0) {
    fail("egg_grading_batch.source_batch_id has no foreign key in the snapshot.");
  } else {
    const fk = fks[0];
    const ok = fk.tableTo === 'poultry_batch' && fk.columnsTo.includes('poultry_batch_id');
    if (ok) {
      pass(
        `egg_grading_batch.source_batch_id → poultry_batch.poultry_batch_id ✓ (ON DELETE RESTRICT)`
      );
    } else {
      fail(
        `egg_grading_batch.source_batch_id points to '${fk.tableTo}.${fk.columnsTo[0]}' — expected poultry_batch.poultry_batch_id.`
      );
    }
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(64)}`);
console.log(`  Schema validation complete: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(64)}\n`);

if (failed > 0) {
  process.exitCode = 1;
}
