import { Module } from '@nestjs/common';
import { FeedMillController } from './controllers/feed-mill.controller';
import { FeedMillService } from './services/feed-mill.service';

@Module({
  controllers: [FeedMillController],
  providers: [FeedMillService],
  exports: [FeedMillService],
})
export class FeedMillModule {}
