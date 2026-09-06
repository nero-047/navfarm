import { Module } from '@nestjs/common';
import { GlMappingService } from './gl-mapping.service';
import { GlMappingController } from './gl-mapping.controller';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({
  imports: [NumberSeriesModule],
  controllers: [GlMappingController],
  providers: [GlMappingService],
  exports: [GlMappingService],
})
export class GlMappingModule {}
