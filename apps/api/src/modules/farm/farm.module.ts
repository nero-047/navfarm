import { Module } from '@nestjs/common';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';

@Module({
  controllers: [FarmController],
  providers: [FarmService],
  exports: [FarmService],
})
export class FarmModule {}
