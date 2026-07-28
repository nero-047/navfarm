import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AgriService } from '../services/agri.service';
import { CreateAgriBatchDto, AgriFieldInputDto, AgriHarvestDto } from '../dto/agri.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Agriculture Module')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agri')
export class AgriController {
  constructor(private readonly svc: AgriService) {}

  @Post('batch')
  @RequirePermission('AGRI', 'BATCH', 'create')
  @ApiOperation({ summary: 'Create agri batch (Fruit/Crop/Seeds/Flower)' })
  async createBatch(@Body() dto: CreateAgriBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const companyId = req.user?.companyId || req['companyId'];
    return { success: true, data: await this.svc.createBatch(dto, tenantId, companyId) };
  }

  @Get('batch')
  @RequirePermission('AGRI', 'BATCH', 'view')
  @ApiOperation({ summary: 'List all agri batches' })
  async listBatches(@Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return { success: true, data: await this.svc.listBatches(tenantId) };
  }

  @Get('batch/:batchId')
  @RequirePermission('AGRI', 'BATCH', 'view')
  @ApiParam({ name: 'batchId' })
  async getBatch(@Param('batchId') batchId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return { success: true, data: await this.svc.getBatch(batchId, tenantId) };
  }

  @Post('batch/:batchId/field-input')
  @RequirePermission('AGRI', 'FIELD_INPUT', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Record field input (fertiliser, seed, pesticide, labour)' })
  async addFieldInput(@Param('batchId') batchId: string, @Body() dto: AgriFieldInputDto, @Req() req: any) {
    return { success: true, data: await this.svc.addFieldInput(batchId, dto, req.user?.userId) };
  }

  @Post('batch/:batchId/harvest')
  @RequirePermission('AGRI', 'HARVEST', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiOperation({ summary: 'Record crop/fruit harvest (full or partial)' })
  async recordHarvest(@Param('batchId') batchId: string, @Body() dto: AgriHarvestDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return { success: true, data: await this.svc.recordHarvest(batchId, dto, tenantId, req.user?.userId) };
  }

  @Post('batch/:batchId/copy')
  @RequirePermission('AGRI', 'BATCH', 'create')
  @ApiParam({ name: 'batchId' })
  @ApiQuery({ name: 'newSeasonYear', description: 'New season year for batch copy (fruit tree)' })
  @ApiOperation({ summary: 'Year-end batch copy for fruit tree (next season continuation)' })
  async copyBatch(@Param('batchId') batchId: string, @Query('newSeasonYear') newSeasonYear: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return { success: true, data: await this.svc.copyBatch(batchId, parseInt(newSeasonYear), tenantId) };
  }
}
