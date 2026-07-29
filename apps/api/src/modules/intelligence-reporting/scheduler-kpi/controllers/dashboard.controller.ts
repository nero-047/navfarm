import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DashboardEngineService } from '../services/dashboard-engine.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Scheduler, Alerts & KPI — Executive & Operational Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardEngineService) {}

  @Get('executive')
  @RequirePermission('SCHEDULER', 'DASHBOARD', 'view')
  @ApiOperation({ summary: 'Executive Real-Time Operations & Alert Summary Dashboard' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getExecutiveDashboard(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dashboardService.getExecutiveDashboard(companyId, tenantId);
    return {
      success: true,
      message: 'Executive operations summary dashboard compiled.',
      data: result,
    };
  }
}
