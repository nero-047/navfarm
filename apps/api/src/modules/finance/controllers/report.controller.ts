import { 
  Controller, 
  Get, 
  Query, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportService } from '../services/report.service';
import { SubledgerService } from '../services/subledger.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Financial Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance/report')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly subledgerService: SubledgerService,
  ) {}

  @Get('trial-balance')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Compile Trial Balance report for a company and date range' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  @ApiQuery({ name: 'startDate', description: 'Start Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'costCenterId', required: false, description: 'Optional Cost Center UUID filter' })
  async getTrialBalance(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('costCenterId') costCenterId?: string,
    @Req() req?: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getTrialBalance(
      companyId,
      startDate,
      endDate,
      costCenterId || null,
      tenantId
    );
    return {
      success: true,
      message: 'Trial Balance compiled successfully.',
      data: result
    };
  }

  @Get('balance-sheet')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Compile Balance Sheet report (Assets, Liabilities, Equity) as of a date' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  @ApiQuery({ name: 'asOfDate', description: 'As of Date (YYYY-MM-DD)' })
  async getBalanceSheet(
    @Query('companyId') companyId: string,
    @Query('asOfDate') asOfDate: string,
    @Req() req?: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getBalanceSheet(companyId, asOfDate, tenantId);
    return {
      success: true,
      message: 'Balance Sheet compiled successfully.',
      data: result
    };
  }

  @Get('profit-loss')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Compile Profit & Loss statement for a date range' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  @ApiQuery({ name: 'startDate', description: 'Start Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'End Date (YYYY-MM-DD)' })
  async getProfitAndLoss(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req?: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getProfitAndLoss(companyId, startDate, endDate, tenantId);
    return {
      success: true,
      message: 'Profit & Loss statement compiled successfully.',
      data: result
    };
  }

  @Get('aging/customer')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Get Customer accounts receivable aging buckets' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  @ApiQuery({ name: 'asOfDate', description: 'As of Date (YYYY-MM-DD)' })
  async getCustomerAging(
    @Query('companyId') companyId: string,
    @Query('asOfDate') asOfDate: string,
    @Req() req?: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.subledgerService.getCustomerAging(companyId, asOfDate, tenantId);
    return {
      success: true,
      message: 'Customer Accounts Receivable aging compiled.',
      data: result
    };
  }

  @Get('aging/supplier')
  @RequirePermission('FINANCE', 'REPORTS', 'view')
  @ApiOperation({ summary: 'Get Supplier accounts payable aging buckets' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  @ApiQuery({ name: 'asOfDate', description: 'As of Date (YYYY-MM-DD)' })
  async getSupplierAging(
    @Query('companyId') companyId: string,
    @Query('asOfDate') asOfDate: string,
    @Req() req?: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.subledgerService.getSupplierAging(companyId, asOfDate, tenantId);
    return {
      success: true,
      message: 'Supplier Accounts Payable aging compiled.',
      data: result
    };
  }
}
