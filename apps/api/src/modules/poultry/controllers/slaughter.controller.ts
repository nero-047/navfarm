import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlaughterService } from '../services/slaughter.service';
import { RecordSlaughterYieldDto } from '../dto/slaughter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Poultry — Slaughter & Processing Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/slaughter')
export class SlaughterController {
  constructor(private readonly slaughterService: SlaughterService) {}

  @Post('yield')
  @RequirePermission('POULTRY', 'SLAUGHTER', 'edit')
  @ApiOperation({ summary: 'Record slaughterhouse live bird receiving, dressing, yield %, and finished meat receipt' })
  async recordSlaughterYield(@Body() dto: RecordSlaughterYieldDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.slaughterService.recordSlaughterYield(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Slaughter yield recorded and meat stock received into inventory.',
      data: result,
    };
  }
}
