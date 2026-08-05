import { Module } from '@nestjs/common';
import { GlMappingService } from './gl-mapping.service';
import { GlMappingController } from './gl-mapping.controller';

@Module({
  controllers: [GlMappingController],
  providers: [GlMappingService],
  exports: [GlMappingService],
})
export class GlMappingModule {}
