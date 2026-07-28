import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LivestockService } from '../services/livestock.service';
import {
  CreateLivestockBatchDto, LivestockDailyEntryDto,
  MilkHarvestDto, OffspringRecordDto, AmortisationRunDto, FairValueUpdateDto
} from '../dto/livestock.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Livestock Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('livestock')
export class LivestockController {
  constructor(private readonly svc: LivestockService) {}

  @Post('batch')
  @RequirePermission('LIVESTOCK', 'BATCH', 'create')
  @ApiOperation({ summary: 'Create livestock batch (Cow/Buffalo, Piggery, Goat/Sheep)' })
  async createBatch(@Body() dto: CreateLivestockBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const companyId = req.user?.companyId || req['companyId'];
    const result = await this.svc.createBatch(dto, tenantId, companyId);
    return { success: true, message: 'Livestock batch created.', data: result };
  }

  @Get('batch')
  @RequirePermission('LIVESTOCK', 'BATCH', 'view')
  @ApiOperation({ summary: 'List all livestock batches for tenant' })
  async listBatches(@Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.listBatches(tenantId);
    return { success: true, message: 'Livestock batches retrieved.', data: result };
  }

  @Get('batch/:batchId')
  @RequirePermission('LIVESTOCK', 'BATCH', 'view')
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiOperation({ summary: 'Get livestock batch by ID' })
  async getBatch(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.getBatch(batchId, tenantId);
    return { success: true, message: 'Batch retrieved.', data: result };
  }

  @Post('batch/:batchId/daily-entry')
  @RequirePermission('LIVESTOCK', 'DAILY_ENTRY', 'create')
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiOperation({ summary: 'Record daily feed/medicine/weight/overhead entry for livestock batch' })
  async addDailyEntry(@Param('batchId') batchId: string, @Body() dto: LivestockDailyEntryDto, @Req() req: any) {
    const userId = req.user?.userId;
    const result = await this.svc.addDailyEntry(batchId, dto, userId);
    return { success: true, message: 'Daily entry recorded.', data: result };
  }

  @Post('batch/:batchId/milk-harvest')
  @RequirePermission('LIVESTOCK', 'MILK', 'create')
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiOperation({ summary: 'Record daily milk harvest (litres, fat%, SNF%)' })
  async recordMilkHarvest(@Param('batchId') batchId: string, @Body() dto: MilkHarvestDto, @Req() req: any) {
    const userId = req.user?.userId;
    const result = await this.svc.recordMilkHarvest(batchId, dto, userId);
    return { success: true, message: 'Milk harvest recorded.', data: result };
  }

  @Post('batch/:batchId/offspring')
  @RequirePermission('LIVESTOCK', 'OFFSPRING', 'create')
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiOperation({ summary: 'Record offspring/birth event (piglets, calves, kids, lambs)' })
  async recordOffspring(@Param('batchId') batchId: string, @Body() dto: OffspringRecordDto) {
    const result = await this.svc.recordOffspring(batchId, dto);
    return { success: true, message: 'Offspring event recorded.', data: result };
  }

  @Post('batch/:batchId/amortisation/run')
  @RequirePermission('LIVESTOCK', 'AMORTISATION', 'create')
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiOperation({ summary: 'Run monthly amortisation for Bio Asset livestock batch (IAS 41)' })
  async runAmortisation(@Param('batchId') batchId: string, @Body() dto: AmortisationRunDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.svc.runAmortisation(batchId, dto, tenantId);
    return { success: true, message: 'Amortisation run completed.', data: result };
  }

  @Post('batch/:batchId/fair-value')
  @RequirePermission('LIVESTOCK', 'FAIR_VALUE', 'edit')
  @ApiParam({ name: 'batchId', description: 'Batch UUID' })
  @ApiOperation({ summary: 'Update IAS 41 fair value for biological asset (Gain/Loss recognition)' })
  async updateFairValue(@Param('batchId') batchId: string, @Body() dto: FairValueUpdateDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const userId = req.user?.userId;
    const result = await this.svc.updateFairValue(batchId, dto, tenantId, userId);
    return { success: true, message: 'Fair value updated.', data: result };
  }
}
