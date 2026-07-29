import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AgriV2Service } from '../services/agri.service';
import {
  CreateFieldDto, SoilAnalysisDto, CreateCropPlanDto, UpdateCalendarActivityDto,
  IrrigationLogDto, FertilizerAppDto, PesticideAppDto,
  CreateHarvestPlanDto, RecordHarvestDto, ResourceAssignmentDto
} from '../dto/agri.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Agriculture — Field & Crop Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agri')
export class AgriV2Controller {
  constructor(private readonly svc: AgriV2Service) {}

  // ── FIELD ──────────────────────────────────────────────────────────────────
  @Post('field')
  @RequirePermission('AGRI', 'FIELD', 'create')
  @ApiOperation({ summary: 'Register a field/plot master (GPS, soil type, irrigation)' })
  async createField(@Body() dto: CreateFieldDto, @Req() req: any) {
    return { success: true, data: await this.svc.createField(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('field')
  @RequirePermission('AGRI', 'FIELD', 'view')
  @ApiOperation({ summary: 'List all registered fields' })
  async listFields(@Req() req: any) {
    return { success: true, data: await this.svc.listFields(req.user?.tenantId) };
  }

  @Get('field/:fieldId')
  @RequirePermission('AGRI', 'FIELD', 'view')
  @ApiParam({ name: 'fieldId' })
  @ApiOperation({ summary: 'Get field detail' })
  async getField(@Param('fieldId') fieldId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getField(fieldId, req.user?.tenantId) };
  }

  @Post('field/:fieldId/soil-analysis')
  @RequirePermission('AGRI', 'SOIL', 'create')
  @ApiParam({ name: 'fieldId' })
  @ApiOperation({ summary: 'Record soil analysis (pH, N, P, K — alerts on out-of-range values)' })
  async addSoilAnalysis(@Param('fieldId') fieldId: string, @Body() dto: SoilAnalysisDto, @Req() req: any) {
    return { success: true, data: await this.svc.addSoilAnalysis(fieldId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('field/:fieldId/soil-history')
  @RequirePermission('AGRI', 'SOIL', 'view')
  @ApiParam({ name: 'fieldId' })
  @ApiOperation({ summary: 'Get soil analysis history for a field' })
  async getSoilHistory(@Param('fieldId') fieldId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getSoilHistory(fieldId, req.user?.tenantId) };
  }

  // ── CROP PLAN ──────────────────────────────────────────────────────────────
  @Post('crop-plan')
  @RequirePermission('AGRI', 'CROP_PLAN', 'create')
  @ApiOperation({ summary: 'Create crop plan for a field + season (auto-generates activity calendar)' })
  async createCropPlan(@Body() dto: CreateCropPlanDto, @Req() req: any) {
    return { success: true, data: await this.svc.createCropPlan(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('crop-plan')
  @RequirePermission('AGRI', 'CROP_PLAN', 'view')
  @ApiQuery({ name: 'fieldId', required: false })
  @ApiOperation({ summary: 'List crop plans (filter by field optional)' })
  async listCropPlans(@Query('fieldId') fieldId: string, @Req() req: any) {
    return { success: true, data: await this.svc.listCropPlans(req.user?.tenantId, fieldId) };
  }

  @Get('crop-plan/:planId')
  @RequirePermission('AGRI', 'CROP_PLAN', 'view')
  @ApiParam({ name: 'planId' })
  @ApiOperation({ summary: 'Get crop plan detail with full activity calendar' })
  async getCropPlan(@Param('planId') planId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getCropPlan(planId, req.user?.tenantId) };
  }

  @Patch('crop-plan/calendar/:activityId')
  @RequirePermission('AGRI', 'CROP_PLAN', 'edit')
  @ApiParam({ name: 'activityId' })
  @ApiOperation({ summary: 'Mark calendar activity as DONE (record actual date and cost)' })
  async updateCalendarActivity(@Param('activityId') activityId: string, @Body() dto: UpdateCalendarActivityDto, @Req() req: any) {
    return { success: true, data: await this.svc.updateCalendarActivity(activityId, dto, req.user?.tenantId) };
  }

  // ── OPERATIONS ─────────────────────────────────────────────────────────────
  @Post('crop-plan/:planId/irrigation')
  @RequirePermission('AGRI', 'IRRIGATION', 'create')
  @ApiParam({ name: 'planId' })
  @ApiOperation({ summary: 'Log irrigation event for a crop plan (volume, duration, cost)' })
  async logIrrigation(@Param('planId') planId: string, @Body() dto: IrrigationLogDto, @Req() req: any) {
    return { success: true, data: await this.svc.logIrrigation(planId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post('crop-plan/:planId/fertilizer')
  @RequirePermission('AGRI', 'FERTILIZER', 'create')
  @ApiParam({ name: 'planId' })
  @ApiOperation({ summary: 'Log fertilizer application (Urea/DAP/K — auto calculates kg/acre, links to GI)' })
  async logFertilizer(@Param('planId') planId: string, @Body() dto: FertilizerAppDto, @Req() req: any) {
    return { success: true, data: await this.svc.logFertilizer(planId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post('crop-plan/:planId/pesticide')
  @RequirePermission('AGRI', 'PESTICIDE', 'create')
  @ApiParam({ name: 'planId' })
  @ApiOperation({ summary: 'Log pesticide spray with PHI enforcement (warns if harvest within PHI period)' })
  async logPesticide(@Param('planId') planId: string, @Body() dto: PesticideAppDto, @Req() req: any) {
    return { success: true, data: await this.svc.logPesticide(planId, dto, req.user?.tenantId) };
  }

  @Post('crop-plan/:planId/resource')
  @RequirePermission('AGRI', 'RESOURCE', 'create')
  @ApiParam({ name: 'planId' })
  @ApiOperation({ summary: 'Assign labour/equipment resource to a crop plan activity' })
  async assignResource(@Param('planId') planId: string, @Body() dto: ResourceAssignmentDto, @Req() req: any) {
    return { success: true, data: await this.svc.assignResource(planId, dto, req.user?.tenantId) };
  }

  // ── HARVEST ────────────────────────────────────────────────────────────────
  @Post('crop-plan/:planId/harvest-plan')
  @RequirePermission('AGRI', 'HARVEST', 'create')
  @ApiParam({ name: 'planId' })
  @ApiOperation({ summary: 'Create harvest plan for a crop plan (expected yield, target date)' })
  async createHarvestPlan(@Param('planId') planId: string, @Body() dto: CreateHarvestPlanDto, @Req() req: any) {
    return { success: true, data: await this.svc.createHarvestPlan(planId, dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Post('harvest-plan/:harvestPlanId/record')
  @RequirePermission('AGRI', 'HARVEST', 'create')
  @ApiParam({ name: 'harvestPlanId' })
  @ApiOperation({ summary: 'Record actual harvest → auto yield analysis (cost/acre, gross margin%, variance)' })
  async recordHarvest(@Param('harvestPlanId') harvestPlanId: string, @Body() dto: RecordHarvestDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordHarvest(harvestPlanId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('harvest-plan/:harvestPlanId/yield')
  @RequirePermission('AGRI', 'HARVEST', 'view')
  @ApiParam({ name: 'harvestPlanId' })
  @ApiOperation({ summary: 'Get yield analysis (actual vs planned, cost/acre, gross margin)' })
  async getYieldAnalysis(@Param('harvestPlanId') harvestPlanId: string, @Req() req: any) {
    const analyses = await this.svc['db'].select().from(require('../../../../core/database/schema').agriYieldAnalysis)
      .where(require('drizzle-orm').eq(require('../../../../core/database/schema').agriYieldAnalysis.harvest_plan_id, harvestPlanId));
    return { success: true, data: analyses };
  }

  // ── KPI ────────────────────────────────────────────────────────────────────
  @Get('kpi')
  @RequirePermission('AGRI', 'KPI', 'view')
  @ApiQuery({ name: 'fieldId', required: false })
  @ApiOperation({ summary: 'Agriculture KPI dashboard (yield, margin, active plans)' })
  async getAgriKpi(@Query('fieldId') fieldId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getAgriKpi(req.user?.tenantId, fieldId) };
  }
}
