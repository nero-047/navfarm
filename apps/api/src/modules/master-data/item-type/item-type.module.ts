import { Module } from '@nestjs/common';
import { ItemTypeService } from './item-type.service';
import { ItemTypeController } from './item-type.controller';

@Module({
  controllers: [ItemTypeController],
  providers: [ItemTypeService],
  exports: [ItemTypeService],
})
export class ItemTypeModule {}
