import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LivestockCommercialService } from '../services/livestock-commercial.service';
import { AnimalPurchaseDto, AnimalSaleDto, GrazingScheduleDto } from '../dto/animal.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Livestock — Commercial & KPI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('livestock')
export class LivestockCommercialController {
  constructor(private readonly svc: LivestockCommercialService) {}

  @Post('purchase')
  @RequirePermission('LIVESTOCK', 'PURCHASE', 'create')
  @ApiOperation({ summary: 'Record animal purchase (provides link to Inventory GR to post stock)' })
  async createPurchase(@Body() dto: AnimalPurchaseDto, @Req() req: any) {
    return { success: true, data: await this.svc.createPurchase(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('purchase')
  @RequirePermission('LIVESTOCK', 'PURCHASE', 'view')
  @ApiOperation({ summary: 'List all animal purchase records' })
  async listPurchases(@Req() req: any) {
    return { success: true, data: await this.svc.listPurchases(req.user?.tenantId) };
  }

  @Post('sale')
  @RequirePermission('LIVESTOCK', 'SALE', 'create')
  @ApiOperation({ summary: 'Record animal sale (provides link to Inventory GI to post stock movement)' })
  async createSale(@Body() dto: AnimalSaleDto, @Req() req: any) {
    return { success: true, data: await this.svc.createSale(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Get('sale')
  @RequirePermission('LIVESTOCK', 'SALE', 'view')
  @ApiOperation({ summary: 'List all animal sale records' })
  async listSales(@Req() req: any) {
    return { success: true, data: await this.svc.listSales(req.user?.tenantId) };
  }

  @Post('herd/:herdId/grazing')
  @RequirePermission('LIVESTOCK', 'GRAZING', 'create')
  @ApiParam({ name: 'herdId' })
  @ApiOperation({ summary: 'Create grazing schedule for a herd (pasture rotation plan)' })
  async createGrazing(@Param('herdId') herdId: string, @Body() dto: GrazingScheduleDto, @Req() req: any) {
    return { success: true, data: await this.svc.createGrazingSchedule(herdId, dto, req.user?.tenantId, req.user?.userId) };
  }

  @Get('herd/:herdId/kpi')
  @RequirePermission('LIVESTOCK', 'KPI', 'view')
  @ApiParam({ name: 'herdId' })
  @ApiOperation({ summary: 'Get KPI dashboard for a herd (size, milk, mortality, pregnancy rates)' })
  async getHerdKpi(@Param('herdId') herdId: string, @Req() req: any) {
    return { success: true, data: await this.svc.getHerdKpi(herdId, req.user?.tenantId) };
  }

  @Get('herd/:herdId/amortisation')
  @RequirePermission('LIVESTOCK', 'COSTING', 'view')
  @ApiParam({ name: 'herdId' })
  @ApiOperation({ summary: 'Get breeding livestock linear amortisation schedule' })
  async getAmortisation(@Param('herdId') herdId: string, @Req() req: any) {
    return { success: true, data: await this.svc.calculateBreedingAmortisation(herdId, 60, req.user?.tenantId) };
  }

  @Post('fair-value-update')
  @RequirePermission('LIVESTOCK', 'COSTING', 'create')
  @ApiOperation({ summary: 'Update biological asset fair value (IAS 41 revaluation posting)' })
  async updateFairValue(@Body() dto: { herd_id: string; market_rate_per_kg: number; valuation_date: string }, @Req() req: any) {
    return { success: true, data: await this.svc.updateBiologicalAssetFairValue(dto, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }

  @Post('sale/:saleId/payment')
  @RequirePermission('LIVESTOCK', 'SALE', 'edit')
  @ApiParam({ name: 'saleId' })
  @ApiOperation({ summary: 'Record payment received for livestock sale' })
  async recordSalePayment(@Param('saleId') saleId: string, @Body('payment_amount') amount: number, @Req() req: any) {
    return { success: true, data: await this.svc.recordSalePayment(saleId, amount, req.user?.tenantId, req.user?.companyId, req.user?.userId) };
  }
}
