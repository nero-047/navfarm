import { Module } from '@nestjs/common';
import { QcParameterService } from './qc-parameter.service';
import { QcParameterController } from './qc-parameter.controller';

@Module({
  controllers: [QcParameterController],
  providers: [QcParameterService],
  exports: [QcParameterService],
})
export class QcParameterModule {}
