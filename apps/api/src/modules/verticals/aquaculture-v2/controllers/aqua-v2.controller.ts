import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AquaV2Service } from '../services/aqua-v2.service';
import {
  CreatePondDto, CreateTankDto, StockPondDto, WaterQualityDto, GrowthSampleDto,
  MortalityEventDto, DiseaseEventDto, PondTreatmentDto,
  HarvestDto, FeedingScheduleDto, BatchTransferDto,
} from '../dto/aqua.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Aquaculture — Pond & Production Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('aquaculture')
export class AquaV2Controller {
  constructor(private readonly svc: AquaV2Service) {}

  @Post('pond') @RequirePermission('AQUA', 'POND', 'create')
  @ApiOperation({ summary: 'Register pond (earthen/concrete/cage/RAS/biofloc) with area, depth, aerators' })
  async createPond(@Body() dto: CreatePondDto, @Req() req: any) {
    return { success: true, data: await this.svc.createPond(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('pond') @RequirePermission('AQUA', 'POND', 'view')
  @ApiOperation({ summary: 'List all ponds' })
  async listPonds(@Req() req: any) {
    return { success: true, data: await this.svc.listPonds(req.user?.tenantId) };
  }

  @Get('pond/:pondId') @RequirePermission('AQUA', 'POND', 'view')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Get pond detail' })
  async getPond(@Param('pondId') pondId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getPond(pondId, req.user?.tenantId) };
  }

  @Post('tank') @RequirePermission('AQUA', 'TANK', 'create')
  @ApiOperation({ summary: 'Register indoor tank/RAS system' })
  async createTank(@Body() dto: CreateTankDto, @Req() req: any) {
    return { success: true, data: await this.svc.createTank(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('tank') @RequirePermission('AQUA', 'TANK', 'view')
  @ApiOperation({ summary: 'List all tanks' })
  async listTanks(@Req() req: any) {
    return { success: true, data: await this.svc.listTanks(req.user?.tenantId) };
  }

  @Post('pond/:pondId/stock') @RequirePermission('AQUA', 'STOCKING', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Stock pond with fingerlings — auto-GR if item_id/warehouse_id/location_id provided. Blocks if density > 20/sqm.' })
  async stockPond(@Param('pondId') pondId: string, @Body() dto: StockPondDto, @Req() req: any) {
    return { success: true, data: await this.svc.stockPond(pondId, dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Post('pond/:pondId/water-quality') @RequirePermission('AQUA', 'WATER_QUALITY', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Log water quality (DO, pH, ammonia — auto-calculates WQI, fires & persists alerts if critical)' })
  async logWaterQuality(@Param('pondId') pondId: string, @Body() dto: WaterQualityDto, @Req() req: any) {
    return { success: true, data: await this.svc.logWaterQuality(pondId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('pond/:pondId/water-quality') @RequirePermission('AQUA', 'WATER_QUALITY', 'view')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Get water quality history and trend for a pond' })
  async getWaterQualityHistory(@Param('pondId') pondId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getWaterQualityHistory(pondId, req.user?.tenantId) };
  }

  @Post('pond/:pondId/growth-sample') @RequirePermission('AQUA', 'GROWTH', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Record growth sample (ABW, biomass, survival rate, ADG calculation)' })
  async recordGrowthSample(@Param('pondId') pondId: string, @Body() dto: GrowthSampleDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordGrowthSample(pondId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post('pond/:pondId/mortality') @RequirePermission('AQUA', 'MORTALITY', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Log mortality event (qty, cause, action taken)' })
  async recordMortality(@Param('pondId') pondId: string, @Body() dto: MortalityEventDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordMortality(pondId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Post('pond/:pondId/disease') @RequirePermission('AQUA', 'DISEASE', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Record disease diagnosis with treatment protocol and withdrawal period' })
  async recordDiseaseEvent(@Param('pondId') pondId: string, @Body() dto: DiseaseEventDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordDiseaseEvent(pondId, dto, req.user?.tenantId) };
  }

  @Post('pond/:pondId/treatment') @RequirePermission('AQUA', 'TREATMENT', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Log pond treatment (liming, disinfection, probiotic application)' })
  async recordPondTreatment(@Param('pondId') pondId: string, @Body() dto: PondTreatmentDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordPondTreatment(pondId, dto, req.user?.tenantId) };
  }

  // ── FIX-004: Harvest Endpoint ────────────────────────────────────────────
  @Post('pond/:pondId/harvest') @RequirePermission('AQUA', 'HARVEST', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Record harvest from pond — auto-GR if item_id/warehouse_id/location_id provided' })
  async recordHarvest(@Param('pondId') pondId: string, @Body() dto: HarvestDto, @Req() req: any) {
    return { success: true, data: await this.svc.recordHarvest(pondId, dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  // ── FIX-015: Feeding Schedule Endpoint ───────────────────────────────────
  @Post('pond/:pondId/feeding-schedule') @RequirePermission('AQUA', 'FEEDING', 'create')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Create feeding schedule for pond (daily rate, feed times, feed item)' })
  async createFeedingSchedule(@Param('pondId') pondId: string, @Body() dto: FeedingScheduleDto, @Req() req: any) {
    return { success: true, data: await this.svc.createFeedingSchedule(pondId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('pond/:pondId/feeding-schedule') @RequirePermission('AQUA', 'FEEDING', 'view')
  @ApiParam({ name: 'pondId' })
  @ApiOperation({ summary: 'Get feeding schedules for a pond' })
  async getFeedingSchedules(@Param('pondId') pondId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getFeedingSchedules(pondId, req.user?.tenantId) };
  }

  // ── FIX-016: Batch Transfer Endpoint ─────────────────────────────────────
  @Post('batch-transfer') @RequirePermission('AQUA', 'TRANSFER', 'create')
  @ApiOperation({ summary: 'Transfer fish batch between ponds (validates source/dest differ)' })
  async transferBatch(@Body() dto: BatchTransferDto, @Req() req: any) {
    return { success: true, data: await this.svc.transferBatch(dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('kpi') @RequirePermission('AQUA', 'KPI', 'view')
  @ApiQuery({ name: 'pondId', required: false })
  @ApiOperation({ summary: 'Aquaculture KPI dashboard (WQI, ABW, stocking status, mortality)' })
  async getAquaKpi(@Query('pondId') pondId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getAquaKpi(req.user?.tenantId, pondId) };
  }
}
