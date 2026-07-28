import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VarianceAuditReportService } from '../services/variance-audit-report.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Variance & Audit Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/variance')
export class VarianceAuditReportController {
  constructor(private readonly varReportService: VarianceAuditReportService) {}

  @Get('analysis')
  @RequirePermission('REPORTING', 'VARIANCE', 'view')
  @ApiOperation({ summary: '7-Dimension Enterprise Cost Variance Analysis Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getVarianceAnalysisReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.varReportService.getVarianceAnalysisReport(companyId, tenantId);
    return {
      success: true,
      message: 'Cost variance analysis report generated.',
      data: result,
    };
  }
}
