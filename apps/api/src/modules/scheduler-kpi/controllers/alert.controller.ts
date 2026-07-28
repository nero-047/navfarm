import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiProperty } from '@nestjs/swagger';
import { AlertEngineService } from '../services/alert-engine.service';
import { CreateAlertRuleDto } from '../dto/alert.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class EvaluateAlertDto {
  @ApiProperty({ example: 'COMP-001' })
  @IsString()
  @IsNotEmpty()
  company_id: string;

  @ApiProperty({ example: 'rule-uuid' })
  @IsString()
  @IsNotEmpty()
  rule_id: string;

  @ApiProperty({ example: 2.5, description: 'Measured value to test against rule' })
  @IsNumber()
  @IsNotEmpty()
  measured_value: number;
}

@ApiTags('Scheduler, Alerts & KPI — Rule-Based Alert Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('scheduler/alert')
export class AlertController {
  constructor(private readonly alertService: AlertEngineService) {}

  @Post('rule')
  @RequirePermission('SCHEDULER', 'ALERT', 'create')
  @ApiOperation({ summary: 'Create Configurable Alert Rule' })
  async createAlertRule(@Body() dto: CreateAlertRuleDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.alertService.createAlertRule(dto, tenantId);
    return {
      success: true,
      message: 'Alert rule created.',
      data: result,
    };
  }

  @Post('evaluate')
  @RequirePermission('SCHEDULER', 'ALERT', 'create')
  @ApiOperation({ summary: 'Evaluate metric against Alert Rule & trigger alert event if breached' })
  async evaluateAndTriggerAlert(@Body() dto: EvaluateAlertDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.alertService.evaluateAndTriggerAlert(dto.company_id, dto.rule_id, dto.measured_value, tenantId);
    return {
      success: true,
      message: result ? 'Alert triggered!' : 'Metric within normal limits.',
      data: result,
    };
  }

  @Get('active')
  @RequirePermission('SCHEDULER', 'ALERT', 'view')
  @ApiOperation({ summary: 'List Active Alert Events for a company' })
  @ApiQuery({ name: 'companyId', description: 'Company UUID' })
  async getActiveAlerts(@Query('companyId') companyId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.alertService.getActiveAlerts(companyId, tenantId);
    return {
      success: true,
      message: 'Active alerts retrieved.',
      data: result,
    };
  }

  @Post('acknowledge/:id')
  @RequirePermission('SCHEDULER', 'ALERT', 'edit')
  @ApiOperation({ summary: 'Acknowledge Active Alert Instance' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  async acknowledgeAlert(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.alertService.acknowledgeAlert(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Alert acknowledged.',
      data: result,
    };
  }
}
