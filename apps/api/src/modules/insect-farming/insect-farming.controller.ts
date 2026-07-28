import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InsectFarmingService } from './insect-farming.service';
import { CreateInsectBatchDto, InsectDailyEntryDto, InsectHarvestDto } from './dto/insect-farming.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('Insect Farming Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('insect')
export class InsectFarmingController {
  constructor(private readonly svc: InsectFarmingService) {}

  @Post('batch') @RequirePermission('INSECT', 'BATCH', 'create')
  @ApiOperation({ summary: 'Create insect batch (hive setup for bee keeping)' })
  async createBatch(@Body() dto: CreateInsectBatchDto, @Req() req: any) {
    return { success: true, data: await this.svc.createBatch(dto, req.user?.tenantId, req.user?.companyId) };
  }

  @Get('batch') @RequirePermission('INSECT', 'BATCH', 'view')
  @ApiOperation({ summary: 'List all insect batches' })
  async listBatches(@Req() req: any) {
    return { success: true, data: await this.svc.listBatches(req.user?.tenantId) };
  }

  @Post('batch/:batchId/daily-entry') @RequirePermission('INSECT', 'DAILY_ENTRY', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Record monthly feed / labour / overhead entry' })
  async addDailyEntry(@Param('batchId') batchId: string, @Body() dto: InsectDailyEntryDto, @Req() req: any) {
    return { success: true, data: await this.svc.addDailyEntry(batchId, dto, req.user?.userId) };
  }

  @Post('batch/:batchId/harvest') @RequirePermission('INSECT', 'HARVEST', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Record honey harvest + beeswax by-product with joint cost split' })
  async recordHarvest(@Param('batchId') batchId: string, @Body() dto: InsectHarvestDto) {
    return { success: true, data: await this.svc.recordHarvest(batchId, dto) };
  }
}
