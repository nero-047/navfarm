const mysql = require('mysql2/promise');

const dbs = ['piggery_navfarm_master', 'piggery_tenant_devco', 'piggery_tenant_demo', 'piggery_tenant_system'];

const schedulerMasterCols = [
  { name: 'batch_id', type: 'varchar(36) NULL' },
  { name: 'stage_id', type: 'varchar(36) NULL' },
  { name: 'stage_code', type: 'varchar(50) NULL' },
  { name: 'stage_name', type: 'varchar(100) NULL' },
  { name: 'scheduler_status', type: "varchar(20) DEFAULT 'DRAFT'" },
  { name: 'location_id', type: 'varchar(36) NULL' },
  { name: 'data_entry_level', type: "varchar(10) DEFAULT 'SHED'" },
  { name: 'effective_from', type: 'varchar(50) NULL' },
  { name: 'effective_to', type: 'varchar(50) NULL' },
  { name: 'actual_end_date', type: 'varchar(50) NULL' },
  { name: 'animal_count', type: 'decimal(14,4) NULL' },
  { name: 'auto_generated', type: 'tinyint(1) DEFAULT 1' },
];

const splCols = [
  { name: 'line_seq', type: 'int NULL' },
  { name: 'line_type', type: 'varchar(20) NULL' },
  { name: 'parameter_name', type: 'varchar(200) NULL' },
  { name: 'occurrence', type: 'varchar(20) NULL' },
  { name: 'stage_id', type: 'varchar(36) NULL' },
  { name: 'stage_code', type: 'varchar(50) NULL' },
  { name: 'start_day', type: 'int NULL' },
  { name: 'end_day', type: 'int NULL' },
  { name: 'day_of_week', type: 'int NULL' },
  { name: 'custom_days', type: 'json NULL' },
  { name: 'is_mandatory', type: 'tinyint(1) NOT NULL DEFAULT 0' },
  { name: 'source', type: "varchar(20) DEFAULT 'AUTO'" },
  { name: 'lifecycle_ref_id', type: 'varchar(36) NULL' },
  { name: 'nob_id', type: 'varchar(36) NULL' },
  { name: 'lob_id', type: 'varchar(36) NULL' },
  { name: 'item_id', type: 'varchar(36) NULL' },
  { name: 'item_description', type: 'varchar(200) NULL' },
  { name: 'uom', type: 'varchar(20) NULL' },
  { name: 'standard_qty', type: 'decimal(18,6) NULL' },
  { name: 'qty_basis', type: "varchar(20) DEFAULT 'PER_HEAD'" },
  { name: 'allow_qty_edit', type: 'tinyint(1) DEFAULT 1' },
  { name: 'lot_required', type: 'tinyint(1) DEFAULT 0' },
  { name: 'withdrawal_days', type: 'int NULL' },
  { name: 'creates_inventory', type: 'tinyint(1) DEFAULT 0' },
  { name: 'output_lot_auto', type: 'tinyint(1) DEFAULT 1' },
  { name: 'output_basis', type: "varchar(20) DEFAULT 'PER_BATCH'" },
  { name: 'kpi_metric', type: 'varchar(50) NULL' },
  { name: 'kpi_uom', type: 'varchar(20) NULL' },
  { name: 'std_value', type: 'decimal(18,4) NULL' },
  { name: 'lower_alert_limit', type: 'decimal(18,4) NULL' },
  { name: 'upper_alert_limit', type: 'decimal(18,4) NULL' },
  { name: 'alert_severity', type: "varchar(10) DEFAULT 'WARNING'" },
  { name: 'capture_per', type: "varchar(20) DEFAULT 'AVERAGE'" },
  { name: 'overhead_category', type: 'varchar(30) NULL' },
  { name: 'gl_account', type: 'varchar(20) NULL' },
  { name: 'estimated_cost', type: 'decimal(18,4) NULL' },
  { name: 'resource_id', type: 'varchar(36) NULL' },
  { name: 'resource_name', type: 'varchar(200) NULL' },
  { name: 'to_batch_id', type: 'varchar(36) NULL' },
  { name: 'to_location_id', type: 'varchar(36) NULL' },
  { name: 'transfer_item_id', type: 'varchar(36) NULL' },
  { name: 'transfer_qty_basis', type: 'varchar(20) NULL' },
  { name: 'capture_transfer_weight', type: 'tinyint(1) NOT NULL DEFAULT 0' },
  { name: 'auto_triggers_stage', type: 'tinyint(1) NOT NULL DEFAULT 0' },
  { name: 'destination_stage_id', type: 'varchar(36) NULL' },
];

async function addMissingCols(connection, db, table, cols) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [db, table]
  );
  if (!rows.length) return;
  const existingCols = new Set(rows.map(r => r.COLUMN_NAME));

  for (const col of cols) {
    if (!existingCols.has(col.name)) {
      try {
        await connection.query(`ALTER TABLE \`${db}\`.\`${table}\` ADD COLUMN \`${col.name}\` ${col.type}`);
        console.log(`  + Added ${col.name} to ${table}`);
      } catch (err) {
        console.warn(`  ! Could not add ${col.name} to ${table}: ${err.message}`);
      }
    }
  }
}

async function run() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT || 3306);
  const user = process.env.DATABASE_USERNAME || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
  const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl,
  });

  console.log('Connected to MySQL server.');

  for (const db of dbs) {
    if (db.endsWith('_master')) continue;
    console.log(`\nChecking & migrating ${db}...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``);

    // 1. scheduler_master
    await addMissingCols(connection, db, 'scheduler_master', schedulerMasterCols);

    // 2. scheduler_parameter_line
    await addMissingCols(connection, db, 'scheduler_parameter_line', splCols);

    // 3. scheduler_line_custom_days
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`${db}\`.\`scheduler_line_custom_days\` (
        \`custom_day_id\` varchar(36) NOT NULL PRIMARY KEY,
        \`spl_id\` varchar(36) NOT NULL,
        \`day_number\` int NOT NULL,
        \`day_label\` varchar(50) NULL,
        \`is_active\` tinyint(1) NOT NULL DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_slcd_spl\` (\`spl_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log(`  ✓ scheduler_line_custom_days verified.`);
  }

  await connection.end();
  console.log('\nMigration complete.');
}

run().catch(console.error);
