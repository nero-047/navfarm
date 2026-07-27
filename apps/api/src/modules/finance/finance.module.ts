import { Module, Global } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';

// Controllers
import { CoaController } from './controllers/coa.controller';
import { FiscalController } from './controllers/fiscal.controller';
import { SetupController } from './controllers/setup.controller';
import { JournalController } from './controllers/journal.controller';
import { ReportController } from './controllers/report.controller';

// Services
import { CoaService } from './services/coa.service';
import { FiscalService } from './services/fiscal.service';
import { DimensionService } from './services/dimension.service';
import { LedgerService } from './services/ledger.service';
import { JournalService } from './services/journal.service';
import { PostingEngineService } from './services/posting-engine.service';
import { SubledgerService } from './services/subledger.service';
import { ReportService } from './services/report.service';

@Global()
@Module({
  imports: [AuditLogModule],
  controllers: [
    CoaController,
    FiscalController,
    SetupController,
    JournalController,
    ReportController,
  ],
  providers: [
    CoaService,
    FiscalService,
    DimensionService,
    LedgerService,
    JournalService,
    PostingEngineService,
    SubledgerService,
    ReportService,
  ],
  exports: [
    CoaService,
    FiscalService,
    DimensionService,
    LedgerService,
    JournalService,
    PostingEngineService,
    SubledgerService,
    ReportService,
  ],
})
export class FinanceModule {}
