import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QualityReportService } from '../services/quality-report.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Quality & Traceability — Reports & Compliance Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quality/report')
export class QualityReportController {
  constructor(private readonly reportService: QualityReportService) {}

  @Get('summary')
  @RequirePermission('QUALITY', 'REPORT', 'view')
  @ApiOperation({ summary: 'Enterprise Quality & Food Safety Summary Dashboard (NCR, CAPA, Recall Counts)' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getQualitySummaryDashboard(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.reportService.getQualitySummaryDashboard(companyId, tenantId);
    return {
      success: true,
      message: 'Enterprise Quality & Food Safety Summary Dashboard compiled.',
      data: result,
    };
  }
}
