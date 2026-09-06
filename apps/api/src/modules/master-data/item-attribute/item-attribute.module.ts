import { Module } from '@nestjs/common';
import { ItemAttributeService } from './item-attribute.service';
import { ItemAttributeController } from './item-attribute.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [ItemAttributeController],
  providers: [ItemAttributeService],
  exports: [ItemAttributeService],
})
export class ItemAttributeModule {}
