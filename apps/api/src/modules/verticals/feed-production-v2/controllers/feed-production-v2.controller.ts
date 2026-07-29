import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { FeedProductionV2Service } from '../services/feed-production-v2.service';
import { CreateMODto, UpdateStageDto, QcInspectionDto, CreateDeliveryDto, IngredientPriceDto, CostBreakdownDto, CreateFeedReturnNoteDto } from '../dto/feed-production.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Feed Production — Manufacturing & QC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feed-production')
export class FeedProductionV2Controller {
  constructor(private readonly svc: FeedProductionV2Service) {}

  @Post('mo') @RequirePermission('FEED_PROD', 'MO', 'create')
  @ApiOperation({ summary: 'Create Manufacturing Order (auto-creates 5 production stages: Grind/Mix/Pelletize/Cool/Pack)' })
  async createMO(@Body() dto: CreateMODto, @Req() req: any) {
    return { success: true, data: await this.svc.createMO(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('mo') @RequirePermission('FEED_PROD', 'MO', 'view')
  @ApiOperation({ summary: 'List all Manufacturing Orders' })
  async listMOs(@Req() req: any) {
    return { success: true, data: await this.svc.listMOs(req.user?.tenantId) };
  }

  @Get('mo/:moId') @RequirePermission('FEED_PROD', 'MO', 'view')
  @ApiParam({ name: 'moId' })
  @ApiOperation({ summary: 'Get MO detail with all production stage statuses' })
  async getMO(@Param('moId') moId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getMO(moId, req.user?.tenantId) };
  }

  @Patch('mo/:moId/start') @RequirePermission('FEED_PROD', 'MO', 'edit')
  @ApiParam({ name: 'moId' })
  @ApiOperation({ summary: 'Start production (activates GRINDING stage, sets actual_start_date)' })
  async startMO(@Param('moId') moId: string, @Req() req: any) {
    return { success: true, data: await this.svc.startMO(moId, req.user?.tenantId) };
  }

  @Patch('stage/:stageId') @RequirePermission('FEED_PROD', 'STAGE', 'edit')
  @ApiParam({ name: 'stageId' })
  @ApiOperation({ summary: 'Update production stage (auto-advances to next stage on COMPLETED)' })
  async updateStage(@Param('stageId') stageId: string, @Body() dto: UpdateStageDto, @Req() req: any) {
    return { success: true, data: await this.svc.updateStage(stageId, dto, req.user?.tenantId) };
  }

  @Post('mo/:moId/qc') @RequirePermission('FEED_PROD', 'QC', 'create')
  @ApiParam({ name: 'moId' })
  @ApiOperation({ summary: 'Record QC inspection (moisture, protein, aflatoxin — auto alerts on FAIL, updates MO status)' })
  async recordQc(@Param('moId') moId: string, @Body() dto: QcInspectionDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordQcInspection(moId, dto, req.user?.tenantId) };
  }

  @Post('mo/:moId/cost') @RequirePermission('FEED_PROD', 'COST', 'create')
  @ApiParam({ name: 'moId' })
  @ApiOperation({ summary: 'Calculate and record cost breakdown (cost/MT, cost/kg, ingredient vs overhead split)' })
  async calculateCost(@Param('moId') moId: string, @Body() dto: CostBreakdownDto, @Req() req: any) {
    return { success: true, data: await this.svc.calculateCost(moId, dto, req.user?.tenantId) };
  }

  @Post('mo/:moId/delivery') @RequirePermission('FEED_PROD', 'DELIVERY', 'create')
  @ApiParam({ name: 'moId' })
  @ApiOperation({ summary: 'Create delivery note from MO (links to Inventory GI for stock deduction)' })
  async createDelivery(@Param('moId') moId: string, @Body() dto: CreateDeliveryDto, @Req() req: any) {
    return { success: true, data: await this.svc.createDelivery(moId, dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('delivery') @RequirePermission('FEED_PROD', 'DELIVERY', 'view')
  @ApiOperation({ summary: 'List all feed delivery notes' })
  async listDeliveries(@Req() req: any) {
    return { success: true, data: await this.svc.listDeliveries(req.user?.tenantId) };
  }

  @Post('ingredient-price') @RequirePermission('FEED_PROD', 'PRICE', 'create')
  @ApiOperation({ summary: 'Set ingredient market price for formula cost estimation' })
  async setPrice(@Body() dto: IngredientPriceDto, @Req() req: any) {
    return { success: true, data: await this.svc.setIngredientPrice(dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('kpi') @RequirePermission('FEED_PROD', 'KPI', 'view')
  @ApiOperation({ summary: 'Feed production KPI (production volume, QC pass rate, avg cost/MT, aflatoxin alerts)' })
  async getFeedKpi(@Req() req: any) {
    return { success: true, data: await this.svc.getFeedKpi(req.user?.tenantId) };
  }

  @Post('return-note') @RequirePermission('FEED_PROD', 'DELIVERY', 'create')
  @ApiOperation({ summary: 'Create feed return note (processes return of unconsumed feed to mill inventory with auto-GR)' })
  async createReturnNote(@Body() dto: CreateFeedReturnNoteDto, @Req() req: any) {
    return { success: true, data: await this.svc.createReturnNote(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('ingredient-inventory') @RequirePermission('FEED_PROD', 'MO', 'view')
  @ApiOperation({ summary: 'List raw material ingredient stock levels and pricing for formulation planning' })
  async getIngredientInventory(@Req() req: any) {
    return { success: true, data: await this.svc.getIngredientInventory(req.user?.tenantId) };
  }
}
