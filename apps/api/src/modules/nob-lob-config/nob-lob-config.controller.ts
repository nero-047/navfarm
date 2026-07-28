import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { NobLobConfigService } from './nob-lob-config.service';
import { CreateNobLobConfigDto, UpdateNobLobConfigDto } from './dto/nob-lob-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('NOB/LOB Extension Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('setup/nob-lob-config')
export class NobLobConfigController {
  constructor(private readonly svc: NobLobConfigService) {}

  @Post()
  @RequirePermission('SETUP', 'NOB_LOB_CONFIG', 'create')
  @ApiOperation({ summary: 'Create NOB/LOB extension config (e.g. egg_grading_required = TRUE)' })
  async createConfig(@Body() dto: CreateNobLobConfigDto) {
    const result = await this.svc.createConfig(dto);
    return { success: true, message: 'Config created.', data: result };
  }

  @Get('lob/:lobId')
  @RequirePermission('SETUP', 'NOB_LOB_CONFIG', 'view')
  @ApiOperation({ summary: 'Get all extension configs for a LOB' })
  @ApiParam({ name: 'lobId', description: 'LOB UUID' })
  async getConfigByLob(@Param('lobId') lobId: string) {
    const result = await this.svc.getConfigByLob(lobId);
    return { success: true, message: 'LOB configs retrieved.', data: result };
  }

  @Get('nob/:nobId')
  @RequirePermission('SETUP', 'NOB_LOB_CONFIG', 'view')
  @ApiOperation({ summary: 'Get all extension configs for a NOB' })
  @ApiParam({ name: 'nobId', description: 'NOB UUID' })
  async getConfigByNob(@Param('nobId') nobId: string) {
    const result = await this.svc.getConfigByNob(nobId);
    return { success: true, message: 'NOB configs retrieved.', data: result };
  }

  @Put(':id')
  @RequirePermission('SETUP', 'NOB_LOB_CONFIG', 'edit')
  @ApiOperation({ summary: 'Update an extension config value' })
  @ApiParam({ name: 'id', description: 'Config UUID' })
  async updateConfig(@Param('id') id: string, @Body() dto: UpdateNobLobConfigDto) {
    const result = await this.svc.updateConfig(id, dto);
    return { success: true, message: 'Config updated.', data: result };
  }
}
