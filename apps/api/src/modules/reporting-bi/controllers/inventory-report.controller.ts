import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryReportService } from '../services/inventory-report.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Inventory Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/inventory')
export class InventoryReportController {
  constructor(private readonly invReportService: InventoryReportService) {}

  @Get('summary')
  @RequirePermission('REPORTING', 'INVENTORY', 'view')
  @ApiOperation({ summary: 'Stock Summary Report across warehouses & items' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getStockSummaryReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.invReportService.getStockSummaryReport(companyId, tenantId);
    return {
      success: true,
      message: 'Stock summary report generated.',
      data: result,
    };
  }

  @Get('valuation-fifo')
  @RequirePermission('REPORTING', 'INVENTORY', 'view')
  @ApiOperation({ summary: 'Inventory Valuation & FIFO Layers Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getInventoryValuationFifoReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.invReportService.getInventoryValuationFifoReport(companyId, tenantId);
    return {
      success: true,
      message: 'Inventory valuation FIFO report generated.',
      data: result,
    };
  }
}
