import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HatcheryService } from '../services/hatchery.service';
import { RecordEggSettingDto, RecordHatchResultDto } from '../dto/hatchery.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Poultry — Hatchery Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/hatchery')
export class HatcheryController {
  constructor(private readonly hatcheryService: HatcheryService) {}

  @Post('setting')
  @RequirePermission('POULTRY', 'HATCHERY', 'create')
  @ApiOperation({ summary: 'Record hatching eggs set in incubator' })
  async recordEggSetting(@Body() dto: RecordEggSettingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.hatcheryService.recordEggSetting(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Egg setting batch created.',
      data: result,
    };
  }

  @Post('hatch-result')
  @RequirePermission('POULTRY', 'HATCHERY', 'edit')
  @ApiOperation({ summary: 'Record hatch completion, candling fertility, and hatchability %' })
  async recordHatchResult(@Body() dto: RecordHatchResultDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.hatcheryService.recordHatchResult(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Hatch results recorded.',
      data: result,
    };
  }
}
