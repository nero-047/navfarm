import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'navfarm_db',
  ssl:
    process.env.DATABASE_SSL === 'true' ||
    process.env.DATABASE_PORT === '4000' ||
    (process.env.DATABASE_HOST || '').includes('tidbcloud')
      ? { minVersion: 'TLSv1.2', rejectUnauthorized: true }
      : undefined,
}));
