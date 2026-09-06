import { Module } from '@nestjs/common';
import { LocationTypeController } from './location-type.controller';
import { LocationTypeService } from './location-type.service';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';

@Module({ imports: [NumberSeriesModule], controllers: [LocationTypeController], providers: [LocationTypeService], exports: [LocationTypeService] })
export class LocationTypeModule {}
