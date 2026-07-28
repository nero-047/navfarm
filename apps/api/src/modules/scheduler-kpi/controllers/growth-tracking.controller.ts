import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { GrowthTrackingService } from '../services/growth-tracking.service';
import { RecordWeightDto, RecordMortalityDto } from '../dto/growth-tracking.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Scheduler, Alerts & KPI — Growth & Mortality Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/growth')
export class GrowthTrackingController {
  constructor(private readonly growthService: GrowthTrackingService) {}

  @Post('weight')
  @RequirePermission('SCHEDULER', 'GROWTH', 'create')
  @ApiOperation({ summary: 'Record Flock Weight Sample Log' })
  async recordWeight(@Body() dto: RecordWeightDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.growthService.recordWeight(dto, tenantId);
    return {
      success: true,
      message: 'Weight record logged.',
      data: result,
    };
  }

  @Get('weight/:batchId')
  @RequirePermission('SCHEDULER', 'GROWTH', 'view')
  @ApiOperation({ summary: 'Fetch Weight Gain History for a batch' })
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  async getWeightHistory(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.growthService.getWeightHistory(batchId, tenantId);
    return {
      success: true,
      message: 'Weight history retrieved.',
      data: result,
    };
  }

  @Post('mortality')
  @RequirePermission('SCHEDULER', 'GROWTH', 'create')
  @ApiOperation({ summary: 'Record Daily Mortality / Cull Log' })
  async recordMortality(@Body() dto: RecordMortalityDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.growthService.recordMortality(dto, tenantId);
    return {
      success: true,
      message: 'Mortality record logged.',
      data: result,
    };
  }

  @Get('mortality/:batchId')
  @RequirePermission('SCHEDULER', 'GROWTH', 'view')
  @ApiOperation({ summary: 'Fetch Mortality History for a batch' })
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  async getMortalityHistory(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.growthService.getMortalityHistory(batchId, tenantId);
    return {
      success: true,
      message: 'Mortality history retrieved.',
      data: result,
    };
  }
}
