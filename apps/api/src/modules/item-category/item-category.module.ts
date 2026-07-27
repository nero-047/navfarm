import { Module } from '@nestjs/common';
import { ItemCategoryService } from './item-category.service';
import { ItemCategoryController } from './item-category.controller';

@Module({
  controllers: [ItemCategoryController],
  providers: [ItemCategoryService],
  exports: [ItemCategoryService],
})
export class ItemCategoryModule {}
