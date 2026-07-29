import { Module } from '@nestjs/common';
import { ItemAttributeController } from './item-attribute.controller';
import { ItemAttributeService } from './item-attribute.service';

@Module({
  controllers: [ItemAttributeController],
  providers: [ItemAttributeService],
  exports: [ItemAttributeService],
})
export class ItemAttributeModule {}
