import { Module } from '@nestjs/common';
import { ParameterMasterController } from './parameter-master.controller';
import { ParameterMasterService } from './parameter-master.service';

@Module({
  controllers: [ParameterMasterController],
  providers: [ParameterMasterService],
  exports: [ParameterMasterService],
})
export class ParameterMasterModule {}
