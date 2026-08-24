import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as masterSchema from './master-schema';
import { ConnectionManagerService } from './connection-manager.service';

export const MASTER_CONNECTION = 'MASTER_CONNECTION';
export const PG_CONNECTION = MASTER_CONNECTION; // Backwards compatibility alias

@Global()
@Module({
  providers: [
    ConnectionManagerService,
    {
      provide: MASTER_CONNECTION,
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('database.host');
        const port = config.get<number>('database.port');
        const user = config.get<string>('database.username');
        const database = config.get<string>('database.database') || 'navfarm_master';
        
        const ssl = config.get('database.ssl');
        console.log(`[Master Database] Connecting to ${user}@${host}:${port}/${database} (SSL: ${ssl ? 'enabled' : 'disabled'})`);

        const pool = mysql.createPool({
          host,
          port,
          user,
          password: config.get<string>('database.password'),
          database,
          ssl: ssl || undefined,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
        });

        return drizzle(pool, { schema: masterSchema, mode: 'default' });
      },
      inject: [ConfigService],
    },
  ],
  exports: [MASTER_CONNECTION, ConnectionManagerService],
})
export class DatabaseModule {}
