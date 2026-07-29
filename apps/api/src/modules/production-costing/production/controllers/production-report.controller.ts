import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionReportService } from '../services/production-report.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Production Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production/report')
export class ProductionReportController {
  constructor(private readonly reportService: ProductionReportService) {}

  @Get('wip')
  @RequirePermission('PRODUCTION', 'REPORT', 'view')
  @ApiOperation({ summary: 'Work In Progress (WIP) Costing Summary Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getWipReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getWipReport(companyId, tenantId);
    return {
      success: true,
      message: 'WIP Report compiled.',
      data: result,
    };
  }

  @Get('variance')
  @RequirePermission('PRODUCTION', 'REPORT', 'view')
  @ApiOperation({ summary: 'Production Yield & Cost Variance Analysis Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getVarianceReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getVarianceReport(companyId, tenantId);
    return {
      success: true,
      message: 'Production Variance Report compiled.',
      data: result,
    };
  }
}
