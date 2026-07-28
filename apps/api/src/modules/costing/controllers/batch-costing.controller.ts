import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BatchCostingEngineService } from '../services/batch-costing-engine.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Costing — Batch Costing Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/batch')
export class BatchCostingController {
  constructor(private readonly batchCostingService: BatchCostingEngineService) {}

  @Get(':id/summary')
  @RequirePermission('COSTING', 'BATCH', 'view')
  @ApiOperation({ summary: 'Fetch finalized Cost Summary for a Production Batch' })
  @ApiParam({ name: 'id', description: 'Production Batch UUID' })
  async getBatchCostSummary(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchCostingService.getBatchCostSummary(id, tenantId);
    return {
      success: true,
      message: 'Batch cost summary retrieved.',
      data: result,
    };
  }
}
