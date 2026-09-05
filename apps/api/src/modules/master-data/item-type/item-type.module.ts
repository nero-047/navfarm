import { Module } from '@nestjs/common';
import { ItemTypeService } from './item-type.service';
import { ItemTypeController } from './item-type.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [ItemTypeController],
  providers: [ItemTypeService],
  exports: [ItemTypeService],
})
export class ItemTypeModule {}
