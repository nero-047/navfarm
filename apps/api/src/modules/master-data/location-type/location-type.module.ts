import { Module } from '@nestjs/common';
import { LocationTypeController } from './location-type.controller';
import { LocationTypeService } from './location-type.service';

@Module({ controllers: [LocationTypeController], providers: [LocationTypeService], exports: [LocationTypeService] })
export class LocationTypeModule {}
