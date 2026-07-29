import { Module } from '@nestjs/common';
import { QcController } from './qc.controller';
import { QcService } from './qc.service';
import { AuditLogModule } from '../../platform-identity/audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [QcController],
  providers: [QcService],
  exports: [QcService],
})
export class QcModule {}
