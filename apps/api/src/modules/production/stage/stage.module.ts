import { Module } from '@nestjs/common';
import { StageService } from './stage.service';
import { StageController } from './stage.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';
import { OperationalAreaModule } from '../../core/operational-area/operational-area.module';

@Module({
  imports: [NumberSeriesModule, OperationalAreaModule],
  controllers: [StageController],
  providers: [StageService],
  exports: [StageService],
})
export class StageModule {}
