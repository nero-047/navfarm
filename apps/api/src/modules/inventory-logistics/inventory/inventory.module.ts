import { Module } from '@nestjs/common';
import { AuditLogModule } from '../../platform-identity/audit-log/audit-log.module';
import { LotService } from './services/lot.service';
import { SerialService } from './services/serial.service';
import { InventoryLedgerService } from './services/inventory-ledger.service';
import { ReservationService } from './services/reservation.service';
import { FifoEngineService } from './services/fifo-engine.service';
import { GoodsReceiptService } from './services/goods-receipt.service';
import { GoodsIssueService } from './services/goods-issue.service';
import { TransferOrderService } from './services/transfer-order.service';
import { InventoryAdjustmentService } from './services/inventory-adjustment.service';
import { InventoryJournalService } from './services/inventory-journal.service';
import { PhysicalCountService } from './services/physical-count.service';

import { InventoryController } from './controllers/inventory.controller';
import { GoodsReceiptController } from './controllers/goods-receipt.controller';
import { GoodsIssueController } from './controllers/goods-issue.controller';
import { TransferOrderController } from './controllers/transfer-order.controller';
import { InventoryAdjustmentController } from './controllers/inventory-adjustment.controller';
import { InventoryJournalController } from './controllers/inventory-journal.controller';
import { PhysicalCountController } from './controllers/physical-count.controller';

@Module({
  imports: [AuditLogModule],
  controllers: [
    InventoryController,
    GoodsReceiptController,
    GoodsIssueController,
    TransferOrderController,
    InventoryAdjustmentController,
    InventoryJournalController,
    PhysicalCountController,
  ],
  providers: [
    LotService,
    SerialService,
    InventoryLedgerService,
    ReservationService,
    FifoEngineService,
    GoodsReceiptService,
    GoodsIssueService,
    TransferOrderService,
    InventoryAdjustmentService,
    InventoryJournalService,
    PhysicalCountService,
  ],
  exports: [
    LotService,
    SerialService,
    InventoryLedgerService,
    ReservationService,
    FifoEngineService,
    GoodsReceiptService,
    GoodsIssueService,
    TransferOrderService,
    InventoryAdjustmentService,
    InventoryJournalService,
    PhysicalCountService,
  ],
})
export class InventoryModule {}
