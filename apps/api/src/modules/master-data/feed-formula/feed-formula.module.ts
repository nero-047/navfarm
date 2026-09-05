import { Module } from '@nestjs/common';
import { FeedFormulaService } from './feed-formula.service';
import { FeedFormulaController } from './feed-formula.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [FeedFormulaController],
  providers: [FeedFormulaService],
  exports: [FeedFormulaService],
})
export class FeedFormulaModule {}
