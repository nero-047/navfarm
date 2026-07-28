import { Module } from '@nestjs/common';
import { NobLobConfigController } from './nob-lob-config.controller';
import { NobLobConfigService } from './nob-lob-config.service';

@Module({
  controllers: [NobLobConfigController],
  providers: [NobLobConfigService],
  exports: [NobLobConfigService],
})
export class NobLobConfigModule {}
