import { Module } from '@nestjs/common';
import { BreedService } from './breed.service';
import { BreedController } from './breed.controller';
import { SpeciesController } from './species.controller';

@Module({
  controllers: [BreedController, SpeciesController],
  providers: [BreedService],
  exports: [BreedService],
})
export class BreedModule {}
