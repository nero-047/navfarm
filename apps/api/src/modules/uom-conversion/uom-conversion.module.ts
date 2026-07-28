import { Module } from '@nestjs/common';
import { UomConversionController } from './uom-conversion.controller';
import { UomConversionService } from './uom-conversion.service';

@Module({
  controllers: [UomConversionController],
  providers: [UomConversionService],
  exports: [UomConversionService],
})
export class UomConversionModule {}
