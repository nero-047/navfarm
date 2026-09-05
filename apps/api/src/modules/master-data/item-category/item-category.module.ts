import { Module } from '@nestjs/common';
import { ItemCategoryService } from './item-category.service';
import { ItemCategoryController } from './item-category.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [ItemCategoryController],
  providers: [ItemCategoryService],
  exports: [ItemCategoryService],
})
export class ItemCategoryModule {}
