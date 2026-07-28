import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CostingReportService } from '../services/costing-report.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Costing — Reports & Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('costing/report')
export class CostingReportController {
  constructor(private readonly reportService: CostingReportService) {}

  @Get('inventory-valuation')
  @RequirePermission('COSTING', 'REPORT', 'view')
  @ApiOperation({ summary: 'Inventory Valuation Report (Quantity x Standard/WAVG Cost)' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getInventoryValuationReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getInventoryValuationReport(companyId, tenantId);
    return {
      success: true,
      message: 'Inventory Valuation Report compiled.',
      data: result,
    };
  }

  @Get('biological-assets')
  @RequirePermission('COSTING', 'REPORT', 'view')
  @ApiOperation({ summary: 'IAS 41 Biological Assets Valuation Summary Dashboard' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getBiologicalAssetValuationReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getBiologicalAssetValuationReport(companyId, tenantId);
    return {
      success: true,
      message: 'Biological Assets Valuation Report compiled.',
      data: result,
    };
  }
}
