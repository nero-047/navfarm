import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LayerService } from '../services/layer.service';
import { RecordEggProductionDto } from '../dto/layer.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Poultry — Layer Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/layer')
export class LayerController {
  constructor(private readonly layerService: LayerService) {}

  @Post('egg-production')
  @RequirePermission('POULTRY', 'LAYER', 'edit')
  @ApiOperation({ summary: 'Log daily egg collection, grading, and auto-receive inventory' })
  async recordEggProduction(@Body() dto: RecordEggProductionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.layerService.recordEggProduction(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Egg production logged, HDP % calculated, and stock received into inventory.',
      data: result,
    };
  }
}
