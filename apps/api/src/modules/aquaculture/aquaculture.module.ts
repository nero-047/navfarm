import { Module } from '@nestjs/common';
import { AquacultureController } from './controllers/aquaculture.controller';
import { AquacultureService } from './services/aquaculture.service';

@Module({
  controllers: [AquacultureController],
  providers: [AquacultureService],
  exports: [AquacultureService],
})
export class AquacultureModule {}
