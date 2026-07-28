import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PoultryKpiService } from '../services/poultry-kpi.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Poultry — Reports & KPIs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/report')
export class PoultryReportController {
  constructor(private readonly kpiService: PoultryKpiService) {}

  @Get('batch/:id/kpi')
  @RequirePermission('POULTRY', 'REPORT', 'view')
  @ApiOperation({ summary: 'Fetch single Poultry Batch KPI performance metrics (FCR, Livability, HDP %)' })
  @ApiParam({ name: 'id', description: 'Poultry Batch UUID' })
  async getBatchKpi(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.kpiService.getBatchKpi(id, tenantId);
    return {
      success: true,
      message: 'Batch KPI retrieved.',
      data: result,
    };
  }

  @Get('company/summary')
  @RequirePermission('POULTRY', 'REPORT', 'view')
  @ApiOperation({ summary: 'Company-wide Poultry Flock & Performance KPI Summary Dashboard' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getCompanyKpiSummary(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.kpiService.getCompanyKpiSummary(companyId, tenantId);
    return {
      success: true,
      message: 'Company Poultry KPI Summary compiled.',
      data: result,
    };
  }
}
