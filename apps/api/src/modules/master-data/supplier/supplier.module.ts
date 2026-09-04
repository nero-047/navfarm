import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { EncryptionModule } from '../../system/encryption/encryption.module';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [EncryptionModule, NumberSeriesModule],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
