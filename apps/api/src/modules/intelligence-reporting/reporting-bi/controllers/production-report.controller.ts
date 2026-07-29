import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductionReportService } from '../services/production-report.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Production Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/production')
export class ProductionReportController {
  constructor(private readonly prodReportService: ProductionReportService) {}

  @Get('efficiency')
  @RequirePermission('REPORTING', 'PRODUCTION', 'view')
  @ApiOperation({ summary: 'Production Efficiency, WIP & Yield Report' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getProductionEfficiencyReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.prodReportService.getProductionEfficiencyReport(companyId, tenantId);
    return {
      success: true,
      message: 'Production efficiency report generated.',
      data: result,
    };
  }
}
