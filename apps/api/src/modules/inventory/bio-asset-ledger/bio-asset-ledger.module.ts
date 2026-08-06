import { Module } from '@nestjs/common';
import { BioAssetLedgerService } from './bio-asset-ledger.service';
import { BioAssetLedgerController } from './bio-asset-ledger.controller';

@Module({
  controllers: [BioAssetLedgerController],
  providers: [BioAssetLedgerService],
  exports: [BioAssetLedgerService],
})
export class BioAssetLedgerModule {}
