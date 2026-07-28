import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiProperty } from '@nestjs/swagger';
import { KpiMonitoringService } from '../services/kpi-monitoring.service';
import { DefineKpiDto } from '../dto/kpi.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class EvaluateKpiDto {
  @ApiProperty({ example: 'kpi-uuid' })
  @IsString()
  @IsNotEmpty()
  kpi_id: string;

  @ApiProperty({ example: 1.55, description: 'Current metric value to evaluate' })
  @IsNumber()
  @IsNotEmpty()
  metric_value: number;
}

@ApiTags('Scheduler, Alerts & KPI — Enterprise KPI Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiMonitoringService) {}

  @Post('define')
  @RequirePermission('SCHEDULER', 'KPI', 'create')
  @ApiOperation({ summary: 'Define Enterprise KPI Metric & Green/Yellow/Red Thresholds' })
  async defineKpi(@Body() dto: DefineKpiDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.kpiService.defineKpi(dto, tenantId);
    return {
      success: true,
      message: 'KPI metric defined with thresholds.',
      data: result,
    };
  }

  @Post('evaluate')
  @RequirePermission('SCHEDULER', 'KPI', 'create')
  @ApiOperation({ summary: 'Evaluate KPI Metric Value & Assign Traffic Light Zone (GREEN, YELLOW, RED)' })
  async evaluateKpi(@Body() dto: EvaluateKpiDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.kpiService.evaluateKpi(dto.kpi_id, dto.metric_value, tenantId);
    return {
      success: true,
      message: `KPI evaluated. Traffic Zone: ${result.zone}.`,
      data: result,
    };
  }

  @Get()
  @RequirePermission('SCHEDULER', 'KPI', 'view')
  @ApiOperation({ summary: 'List KPI Definitions for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getKpis(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.kpiService.getKpis(companyId, tenantId);
    return {
      success: true,
      message: 'KPI definitions retrieved.',
      data: result,
    };
  }
}
