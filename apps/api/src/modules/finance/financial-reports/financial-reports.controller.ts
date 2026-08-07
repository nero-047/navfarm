import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialReportsService } from './financial-reports.service';
import { TrialBalanceQueryDto, BalanceSheetQueryDto, ProfitLossQueryDto } from './dto/financial-reports.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Financial Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('financial-reports')
export class FinancialReportsController {
  constructor(private readonly reportsService: FinancialReportsService) {}

  @Get('trial-balance')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Trial Balance — debit/credit totals per GL account as of a date' })
  async trialBalance(@Query() query: TrialBalanceQueryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportsService.getTrialBalance(tenantId, query.companyId, query.asOfDate);
    return { success: true, message: 'Trial Balance retrieved successfully.', data: result };
  }

  @Get('balance-sheet')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Balance Sheet — Assets/Liabilities/Equity as of a date' })
  async balanceSheet(@Query() query: BalanceSheetQueryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportsService.getBalanceSheet(tenantId, query.companyId, query.asOfDate);
    return { success: true, message: 'Balance Sheet retrieved successfully.', data: result };
  }

  @Get('profit-loss')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Profit & Loss — Income/Expense for a date range' })
  async profitLoss(@Query() query: ProfitLossQueryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportsService.getProfitLoss(tenantId, query.companyId, query.dateFrom, query.dateTo);
    return { success: true, message: 'Profit & Loss retrieved successfully.', data: result };
  }
}
