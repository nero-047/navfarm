import { Module } from '@nestjs/common';
import { FeedFormulaService } from './feed-formula.service';
import { FeedFormulaController } from './feed-formula.controller';

@Module({
  controllers: [FeedFormulaController],
  providers: [FeedFormulaService],
  exports: [FeedFormulaService],
})
export class FeedFormulaModule {}
