import { Module } from '@nestjs/common';
import { EggGradingController } from './egg-grading.controller';
import { EggGradingService } from './egg-grading.service';

@Module({
  controllers: [EggGradingController],
  providers: [EggGradingService],
  exports: [EggGradingService],
})
export class EggGradingModule {}
