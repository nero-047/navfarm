import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FinanceReportService } from '../services/finance-report.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Financial Statement Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/finance')
export class FinanceReportController {
  constructor(private readonly finReportService: FinanceReportService) {}

  @Get('trial-balance')
  @RequirePermission('REPORTING', 'FINANCE', 'view')
  @ApiOperation({ summary: 'Trial Balance Financial Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getTrialBalanceReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.finReportService.getTrialBalanceReport(companyId, tenantId);
    return {
      success: true,
      message: 'Trial Balance report generated.',
      data: result,
    };
  }

  @Get('profit-loss')
  @RequirePermission('REPORTING', 'FINANCE', 'view')
  @ApiOperation({ summary: 'Profit & Loss (P&L) Financial Statement Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getProfitAndLossReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.finReportService.getProfitAndLossReport(companyId, tenantId);
    return {
      success: true,
      message: 'Profit & Loss report generated.',
      data: result,
    };
  }
}
