import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'navfarm_db',
  // TiDB Cloud (and most managed MySQL-compatible hosts) require TLS; local
  // MySQL in dev does not, so this defaults off.
  ssl: process.env.DATABASE_SSL === 'true',
}));
