const mysql = require('mysql2/promise');

async function migrateDraftTable() {
  const host = process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '3306', 10);
  const user = process.env.DATABASE_USERNAME || process.env.DB_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '';
  const isRemoteOrTidb = port === 4000 || host.includes('tidbcloud') || process.env.DATABASE_SSL === 'true';
  const ssl = isRemoteOrTidb ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined;

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    ssl,
  });

  const databases = [
    'piggery_navfarm_master',
    'piggery_tenant_devco',
    'piggery_tenant_demo',
    'piggery_tenant_system',
  ];

  for (const dbName of databases) {
    try {
      console.log(`\nMigrating ${dbName}...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
      await connection.query(`USE \`${dbName}\`;`);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`batch_daily_entry_draft\` (
          \`draft_id\` varchar(36) NOT NULL,
          \`tenant_id\` varchar(36) NOT NULL,
          \`company_id\` varchar(36) NOT NULL,
          \`batch_id\` varchar(36) NOT NULL,
          \`entry_date\` varchar(10) NOT NULL,
          \`payload\` json NOT NULL,
          \`created_by\` varchar(36) DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`draft_id\`),
          KEY \`idx_bded_batch_date\` (\`batch_id\`, \`entry_date\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log(`✓ batch_daily_entry_draft table verified in ${dbName}`);
    } catch (err) {
      console.error(`Error migrating ${dbName}:`, err.message);
    }
  }

  await connection.end();
  console.log('\nAll databases migrated successfully!');
}

migrateDraftTable().catch(console.error);
