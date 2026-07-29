import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PoultryReportService } from '../services/poultry-report.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Poultry Vertical Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/poultry')
export class PoultryReportController {
  constructor(private readonly poultryReportService: PoultryReportService) {}

  @Get('performance')
  @RequirePermission('REPORTING', 'POULTRY', 'view')
  @ApiOperation({ summary: 'Poultry Performance Summary Report (Flocks, Mortality, Weights, FCR)' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getPoultryPerformanceReport(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.poultryReportService.getPoultryPerformanceReport(companyId, tenantId);
    return {
      success: true,
      message: 'Poultry performance report generated.',
      data: result,
    };
  }
}
