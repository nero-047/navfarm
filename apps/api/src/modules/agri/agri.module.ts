import { Module } from '@nestjs/common';
import { AgriController } from './controllers/agri.controller';
import { AgriService } from './services/agri.service';

@Module({
  controllers: [AgriController],
  providers: [AgriService],
  exports: [AgriService],
})
export class AgriModule {}
