import { Module } from '@nestjs/common';
import { MilkService } from './milk.service';
import { MilkController } from './milk.controller';

@Module({
  controllers: [MilkController],
  providers: [MilkService],
  exports: [MilkService],
})
export class MilkModule {}
