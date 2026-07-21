import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('System')
@Controller()
export class SystemController {
  @Get('health')
  @ApiOperation({ summary: 'Liveness check (does not require a database connection)' })
  health() {
    return {
      status: 'ok',
      service: 'navfarm-api',
      timestamp: new Date().toISOString(),
    };
  }
}
