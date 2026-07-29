import { Controller, Post, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BiologicalAssetCostingService } from '../services/biological-asset-costing.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Costing — IAS 41 Biological Asset Valuation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/biological-asset')
export class BiologicalAssetCostingController {
  constructor(private readonly bioCostingService: BiologicalAssetCostingService) {}

  @Post(':poultryBatchId/calculate')
  @RequirePermission('COSTING', 'BIOLOGICAL_ASSET', 'edit')
  @ApiOperation({ summary: 'Calculate IAS 41 Living Asset Valuation & Net Asset Value for a flock' })
  @ApiParam({ name: 'poultryBatchId', description: 'Poultry Batch UUID' })
  async calculateValuation(@Param('poultryBatchId') poultryBatchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.bioCostingService.calculateBiologicalAssetValuation(poultryBatchId, tenantId);
    return {
      success: true,
      message: 'IAS 41 Biological asset valuation compiled.',
      data: result,
    };
  }
}
