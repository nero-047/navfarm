import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DashboardBiService } from '../services/dashboard-bi.service';
import { CreateDashboardDto } from '../dto/dashboard-bi.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Reporting & BI — Interactive BI Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting/dashboard')
export class DashboardBiController {
  constructor(private readonly dashBiService: DashboardBiService) {}

  @Post()
  @RequirePermission('REPORTING', 'DASHBOARD', 'create')
  @ApiOperation({ summary: 'Create Interactive BI Dashboard with Widgets' })
  async createDashboard(@Body() dto: CreateDashboardDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dashBiService.createDashboard(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'BI Dashboard created.',
      data: result,
    };
  }

  @Get()
  @RequirePermission('REPORTING', 'DASHBOARD', 'view')
  @ApiOperation({ summary: 'List BI Dashboards for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getDashboards(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dashBiService.getDashboards(companyId, tenantId);
    return {
      success: true,
      message: 'BI Dashboards retrieved.',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermission('REPORTING', 'DASHBOARD', 'view')
  @ApiOperation({ summary: 'Fetch BI Dashboard layout & widget definitions' })
  @ApiParam({ name: 'id', description: 'Dashboard UUID' })
  async getDashboardById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.dashBiService.getDashboardById(id, tenantId);
    return {
      success: true,
      message: 'BI Dashboard layout retrieved.',
      data: result,
    };
  }
}
