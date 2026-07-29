import { Module } from '@nestjs/common';
import { InsectFarmingController } from './insect-farming.controller';
import { InsectFarmingService } from './insect-farming.service';

@Module({
  controllers: [InsectFarmingController],
  providers: [InsectFarmingService],
  exports: [InsectFarmingService],
})
export class InsectFarmingModule {}
