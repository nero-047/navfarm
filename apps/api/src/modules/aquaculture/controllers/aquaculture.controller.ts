import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AquacultureService } from '../services/aquaculture.service';
import { CreateAquaBatchDto, AquaDailyEntryDto, AquaHarvestDto, AquaSlaughterDto } from '../dto/aquaculture.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Aquaculture Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('aquaculture')
export class AquacultureController {
  constructor(private readonly svc: AquacultureService) {}

  @Post('batch') @RequirePermission('AQUA', 'BATCH', 'create')
  @ApiOperation({ summary: 'Create aquaculture batch (fingerling stocking)' })
  async createBatch(@Body() dto: CreateAquaBatchDto, @Req() req: any) {
    return { success: true, data: await this.svc.createBatch(dto, req.user?.tenantId, req.user?.companyId) };
  }

  @Get('batch') @RequirePermission('AQUA', 'BATCH', 'view')
  @ApiOperation({ summary: 'List all aquaculture batches' })
  async listBatches(@Req() req: any) {
    return { success: true, data: await this.svc.listBatches(req.user?.tenantId) };
  }

  @Post('batch/:batchId/daily-entry') @RequirePermission('AQUA', 'DAILY_ENTRY', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Record daily entry (feed, sample weight, mortality)' })
  async addDailyEntry(@Param('batchId') batchId: string, @Body() dto: AquaDailyEntryDto, @Req() req: any) {
    return { success: true, data: await this.svc.addDailyEntry(batchId, dto, req.user?.userId) };
  }

  @Post('batch/:batchId/harvest') @RequirePermission('AQUA', 'HARVEST', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Record aqua harvest (partial or full)' })
  async recordHarvest(@Param('batchId') batchId: string, @Body() dto: AquaHarvestDto) {
    return { success: true, data: await this.svc.recordHarvest(batchId, dto) };
  }

  @Post('slaughter') @RequirePermission('AQUA', 'SLAUGHTER', 'create')
  @ApiOperation({ summary: 'Process aqua slaughter with 3-way joint cost split (Fillet/Meal/Skin)' })
  async processSlaughter(@Body() dto: AquaSlaughterDto, @Req() req: any) {
    return { success: true, data: await this.svc.processSlaughter(dto, req.user?.tenantId) };
  }
}
