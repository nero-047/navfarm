import { Module } from '@nestjs/common';
import { OperationalAreaService } from './operational-area.service';
import { OperationalAreaController } from './operational-area.controller';

@Module({
  controllers: [OperationalAreaController],
  providers: [OperationalAreaService],
  exports: [OperationalAreaService],
})
export class OperationalAreaModule {}
