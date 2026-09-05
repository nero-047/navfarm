import { Module } from '@nestjs/common';
import { OperationalAreaService } from './operational-area.service';
import { OperationalAreaController } from './operational-area.controller';
import { NobLobResolutionService } from './nob-lob-resolution.service';

@Module({
  controllers: [OperationalAreaController],
  providers: [OperationalAreaService, NobLobResolutionService],
  exports: [OperationalAreaService, NobLobResolutionService],
})
export class OperationalAreaModule {}
