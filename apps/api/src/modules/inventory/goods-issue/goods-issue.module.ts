import { Module } from '@nestjs/common';
import { GoodsIssueService } from './goods-issue.service';
import { GoodsIssueController } from './goods-issue.controller';
import { InventoryLedgerModule } from '../inventory-ledger/inventory-ledger.module';

@Module({
  imports: [InventoryLedgerModule],
  controllers: [GoodsIssueController],
  providers: [GoodsIssueService],
  exports: [GoodsIssueService],
})
export class GoodsIssueModule {}
