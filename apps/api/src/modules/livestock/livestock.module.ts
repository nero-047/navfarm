import { Module } from '@nestjs/common';
import { LivestockController } from './controllers/livestock.controller';
import { LivestockService } from './services/livestock.service';

@Module({
  controllers: [LivestockController],
  providers: [LivestockService],
  exports: [LivestockService],
})
export class LivestockModule {}
