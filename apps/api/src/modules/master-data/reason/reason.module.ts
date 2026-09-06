import { Module } from '@nestjs/common';
import { NumberSeriesModule } from '../../system/number-series/number-series.module';
import { ReasonController } from './reason.controller';
import { ReasonService } from './reason.service';

@Module({ imports: [NumberSeriesModule], controllers: [ReasonController], providers: [ReasonService], exports: [ReasonService] })
export class ReasonModule {}
