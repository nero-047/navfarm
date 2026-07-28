import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RearingService } from '../services/rearing.service';
import { PlaceChickBatchDto, RecordDailyRearingDto } from '../dto/rearing.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Poultry — Rearing Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('poultry/rearing')
export class RearingController {
  constructor(private readonly rearingService: RearingService) {}

  @Post('placement')
  @RequirePermission('POULTRY', 'REARING', 'create')
  @ApiOperation({ summary: 'Place Day-Old Chicks (DOC) into rearing shed' })
  async placeChickBatch(@Body() dto: PlaceChickBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.rearingService.placeChickBatch(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Chick placement recorded and production batch created.',
      data: result,
    };
  }

  @Post('daily-entry')
  @RequirePermission('POULTRY', 'REARING', 'edit')
  @ApiOperation({ summary: 'Log daily rearing entry (Feed, Water, Mortality, Weight)' })
  async addDailyRearingEntry(@Body() dto: RecordDailyRearingDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.rearingService.addDailyRearingEntry(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Daily rearing log recorded and feed inventory issued.',
      data: result,
    };
  }

  @Get('batch/:id')
  @RequirePermission('POULTRY', 'REARING', 'view')
  @ApiOperation({ summary: 'Fetch single Poultry Batch details with KPI' })
  async getPoultryBatchById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.rearingService.getPoultryBatchById(id, tenantId);
    return {
      success: true,
      message: 'Poultry Batch details retrieved.',
      data: result,
    };
  }

  @Get('batch')
  @RequirePermission('POULTRY', 'REARING', 'view')
  @ApiOperation({ summary: 'List all Poultry Batches matching filters' })
  async listPoultryBatches(
    @Query('companyId') companyId: string,
    @Query('batchType') batchType: string,
    @Query('status') status: string,
    @Req() req: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.rearingService.listPoultryBatches(companyId, tenantId, batchType, status);
    return {
      success: true,
      message: 'Poultry Batches retrieved.',
      data: result,
    };
  }

  @Get('daily-entry/:batchId')
  @RequirePermission('POULTRY', 'REARING', 'view')
  @ApiOperation({ summary: 'Fetch daily rearing entries history for a batch' })
  async getDailyEntries(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.rearingService.getDailyEntries(batchId, tenantId);
    return {
      success: true,
      message: 'Daily entries history retrieved.',
      data: result,
    };
  }
}
