import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { SpeciesController } from './species.controller';
import { BreedLifecycleStageController } from './breed-lifecycle-stage.controller';

@Module({
  controllers: [BreedController, SpeciesController, BreedLifecycleStageController],
  providers: [BreedService],
  exports: [BreedService],
})
export class BreedModule {}
