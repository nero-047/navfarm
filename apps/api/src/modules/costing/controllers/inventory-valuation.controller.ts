import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InventoryValuationService } from '../services/inventory-valuation.service';
import { RevaluateItemCostDto } from '../dto/costing-revaluation.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Costing — Inventory Valuation & Revaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/inventory')
export class InventoryValuationController {
  constructor(private readonly valuationService: InventoryValuationService) {}

  @Post('revaluate')
  @RequirePermission('COSTING', 'REVALUATION', 'edit')
  @ApiOperation({ summary: 'Revaluate Item Standard/WAVG Cost & Post GL Adjustment Entry' })
  async revaluateItemCost(@Body() dto: RevaluateItemCostDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.valuationService.revaluateItemCost(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Item cost revaluated and GL journal adjustment posted.',
      data: result,
    };
  }

  @Get('history/:itemId')
  @RequirePermission('COSTING', 'REVALUATION', 'view')
  @ApiOperation({ summary: 'Fetch cost revision history for an item' })
  @ApiParam({ name: 'itemId', description: 'Item Master UUID' })
  async getItemCostHistory(@Param('itemId') itemId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.valuationService.getItemCostHistory(itemId, tenantId);
    return {
      success: true,
      message: 'Item cost revision history retrieved.',
      data: result,
    };
  }
}
