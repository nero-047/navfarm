import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BroilerService } from '../services/broiler.service';
import { CreateBroilerBatchDto } from '../dto/broiler.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Poultry — Broiler Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/broiler')
export class BroilerController {
  constructor(private readonly broilerService: BroilerService) {}

  @Post('placement')
  @RequirePermission('POULTRY', 'BROILER', 'create')
  @ApiOperation({ summary: 'Place commercial broiler chicks' })
  async createBroilerBatch(@Body() dto: CreateBroilerBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.broilerService.createBroilerBatch(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Broiler placement created.',
      data: result,
    };
  }

  @Get(':id/fcr')
  @RequirePermission('POULTRY', 'BROILER', 'view')
  @ApiOperation({ summary: 'Calculate Feed Conversion Ratio (FCR) for broiler batch' })
  @ApiParam({ name: 'id', description: 'Poultry Batch UUID' })
  async calculateFcr(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.broilerService.calculateFcr(id, tenantId);
    return {
      success: true,
      message: 'FCR calculated.',
      data: result,
    };
  }
}
