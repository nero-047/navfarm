import { Module } from '@nestjs/common';
import { ShedService } from './shed.service';
import { ShedController } from './shed.controller';

@Module({
  controllers: [ShedController],
  providers: [ShedService],
  exports: [ShedService],
})
export class ShedModule {}
