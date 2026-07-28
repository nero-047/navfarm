import { Module } from '@nestjs/common';
import { SlaughterSplitController } from './slaughter-split.controller';
import { SlaughterSplitService } from './slaughter-split.service';

@Module({
  controllers: [SlaughterSplitController],
  providers: [SlaughterSplitService],
  exports: [SlaughterSplitService],
})
export class SlaughterSplitModule {}
