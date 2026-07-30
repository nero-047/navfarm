# NAVFarm API — Database Bootstrap Guide

This document covers the full process for initialising the NAVFarm database from scratch on a **local development** MySQL instance.

> **Safety rule:** Never run bootstrap or migrations against an unknown or production database. The bootstrap script validates database names and requires an explicit `SYSTEM_ADMIN_PASSWORD` environment variable — it will refuse to start without it.

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 22.x (`nvm use 22`) |
| MySQL | 8.0+ (local) |
| pnpm | 9+ |

Make sure your local MySQL instance is running and the credentials in `apps/api/.env` are for a local database only.

---

## Step 1 — Configure environment

Copy the example file and fill in your local values:

```bash
cp apps/api/.env.example apps/api/.env
```

Required variables:

```dotenv
# Database connection (local MySQL)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_local_root_password

# Master database name (created automatically)
DATABASE_NAME=navfarm_master

# System tenant database name (created automatically)
SYSTEM_TENANT_DATABASE=tenant_system

# Bootstrap credentials
SYSTEM_ADMIN_EMAIL=admin@navfarm.local
SYSTEM_ADMIN_NAME=NAVFarm System Administrator
SYSTEM_ADMIN_ID=   # optional – leave blank to auto-generate a UUID
SYSTEM_ADMIN_PASSWORD=changeme_min12chars   # min 12 characters
```

> **Database name safety:** The script rejects any database name that contains characters outside `[A-Za-z0-9_]` to prevent SQL injection.

---

## Step 2 — Validate the schema (recommended first)

Run the repeatable validation check before touching the database:

```bash
PATH=/Users/arunpratapsingh/.nvm/versions/node/v22.23.1/bin:$PATH \
  pnpm nx run api:validate-schema
```

Expected output: 5/5 checks pass. If any check fails, fix the schema/migration before bootstrapping.

---

## Step 3 — Bootstrap

> **Confirm this is local** before running. The command creates two databases and seeds system data.

```bash
PATH=/Users/arunpratapsingh/.nvm/versions/node/v22.23.1/bin:$PATH \
  pnpm nx run api:db-bootstrap
```

What this does, in order:

1. Creates `navfarm_master` and `tenant_system` MySQL databases if they do not already exist.
2. Runs all master schema migrations (`src/drizzle/master/`).
3. Runs all tenant schema migrations (`src/drizzle/tenant/`), including 0012 which adds the full operational schema.
4. Seeds reference data: plans, languages (EN/HI), currencies (INR/USD), 15 onboarding wizard steps, 6 NOBs, 16 LOBs.
5. Creates the system platform tenant and company.
6. Creates the hashed system administrator user.

Bootstrap is **idempotent** — running it again on an already-bootstrapped database is safe. All inserts use `ON DUPLICATE KEY UPDATE`.

---

## Step 4 — Verify

```bash
# Confirm API compiles cleanly
PATH=/Users/arunpratapsingh/.nvm/versions/node/v22.23.1/bin:$PATH \
  pnpm nx run api:build

# Re-run schema generation — should report "nothing to migrate"
PATH=/Users/arunpratapsingh/.nvm/versions/node/v22.23.1/bin:$PATH \
  pnpm nx run api:db-generate-tenant
```

---

## Adding a new tenant database

New tenants get their own MySQL database. The connection manager reads credentials from the `tenant_master` table and applies the tenant migrations automatically when the first request arrives.

To manually apply tenant migrations to an existing tenant database:

```bash
# Set the target database in env, then run:
DATABASE_NAME=<tenant_db_name> \
PATH=/Users/arunpratapsingh/.nvm/versions/node/v22.23.1/bin:$PATH \
  pnpm nx run api:db-generate-tenant
```

Do not use `drizzle-kit push` — always generate a migration file and commit it to version control.

---

## Migration workflow (schema changes)

1. Edit `src/core/database/schema.ts`.
2. Generate the migration:
   ```bash
   PATH=... pnpm nx run api:db-generate-tenant
   ```
3. Review the generated SQL in `src/drizzle/tenant/` — confirm it is additive only.
4. Run validation:
   ```bash
   PATH=... pnpm nx run api:validate-schema
   ```
5. Apply to your local database via bootstrap (or `drizzle-kit migrate` if already bootstrapped).
6. Commit both the new `.sql` file and the updated `meta/` snapshot.

---

## Available Nx targets

| Target | Description |
|--------|-------------|
| `api:build` | Compile and bundle the API (webpack) |
| `api:typecheck` | TypeScript type check (app + spec) |
| `api:validate-schema` | Offline schema/migration consistency checks (5 checks, no DB needed) |
| `api:db-bootstrap` | Create databases, run all migrations, seed reference data |
| `api:db-generate-tenant` | Generate a new tenant migration from schema.ts changes |
| `api:db-generate-master` | Generate a new master migration from master-schema.ts changes |
| `api:db-migrate-master` | Apply pending master migrations |
| `api:test` | Run Jest unit tests |

---

## Schema summary (as of migration 0012)

- **202 tables** across all bounded contexts
- **367 foreign keys**, all verified against real table columns
- **Migration 0012** adds 127 new tables (all verticals: livestock, agri, aquaculture, insect, feed mill, QC/QR, scheduler, KPI, reporting)
- All migrations are **purely additive** — no DROP TABLE, DROP COLUMN, or TRUNCATE in any file
- `egg_grading_batch.source_batch_id` → `poultry_batch.poultry_batch_id` (ON DELETE RESTRICT) ✓
