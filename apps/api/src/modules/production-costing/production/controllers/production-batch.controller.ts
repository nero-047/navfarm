import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ProductionBatchService } from '../services/production-batch.service';
import { BatchMaterialService } from '../services/batch-material.service';
import { BatchCostingService } from '../services/batch-costing.service';
import { CreateProductionBatchDto, TransitionBatchStatusDto } from '../dto/production-batch.dto';
import { AddBatchInputDto, RecordBatchOutputDto } from '../dto/batch-input-output.dto';
import { AddResourceUsageDto } from '../dto/resource-usage.dto';
import { RecordDailyProductionDto } from '../dto/daily-entry.dto';
import { QueryProductionDto } from '../dto/query-production.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';

@ApiTags('Production Batches & Execution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('production/batch')
export class ProductionBatchController {
  constructor(
    private readonly batchService: ProductionBatchService,
    private readonly materialService: BatchMaterialService,
    private readonly costingService: BatchCostingService,
  ) {}

  @Post()
  @RequirePermission('PRODUCTION', 'BATCH', 'create')
  @ApiOperation({ summary: 'Create a new Production Batch draft' })
  async createBatch(@Body() dto: CreateProductionBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.createBatch(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Production Batch created.',
      data: result,
    };
  }

  @Get(':id')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'Fetch single Production Batch details with inputs & outputs' })
  @ApiParam({ name: 'id', description: 'Production Batch UUID' })
  async findBatchById(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const batch = await this.batchService.findBatchById(id, tenantId);
    const inputs = await this.materialService.getBatchInputs(id, tenantId);
    const outputs = await this.materialService.getBatchOutputs(id, tenantId);
    const costing = await this.costingService.calculateBatchCost(id, tenantId);

    return {
      success: true,
      message: 'Production Batch details retrieved.',
      data: {
        ...batch,
        inputs,
        outputs,
        costing,
      },
    };
  }

  @Get()
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'List all Production Batches matching filters' })
  async findAllBatches(@Query() query: QueryProductionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.findAllBatches(query, tenantId);
    return {
      success: true,
      message: 'Production Batches retrieved.',
      data: result,
    };
  }

  @Post(':id/status')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Transition Batch Status (State Machine)' })
  @ApiParam({ name: 'id', description: 'Production Batch UUID' })
  async transitionStatus(@Param('id') id: string, @Body() dto: TransitionBatchStatusDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.transitionStatus(id, dto.targetStatus, tenantId, req.user?.userId, dto.notes);
    return {
      success: true,
      message: `Batch status transitioned to '${dto.targetStatus}'.`,
      data: result,
    };
  }

  @Post('input')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Issue raw materials for batch (Depletes Inventory via Phase 3 FIFO)' })
  async issueBatchMaterials(@Body() dto: AddBatchInputDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.materialService.issueBatchMaterials(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Batch raw material issued and inventory depleted.',
      data: result,
    };
  }

  @Post('output')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Receive finished goods / by-products for batch (Posts Goods Receipt via Phase 3)' })
  async receiveBatchOutput(@Body() dto: RecordBatchOutputDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.materialService.receiveBatchOutput(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Batch output recorded and stock received into inventory.',
      data: result,
    };
  }

  @Post('resource')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Record resource consumption (Labor, Machine hours, Utilities)' })
  async addResourceUsage(@Body() dto: AddResourceUsageDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.addResourceUsage(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Resource usage recorded.',
      data: result,
    };
  }

  @Post('daily-entry')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Log daily production progress, downtime, and mortality' })
  async addDailyEntry(@Body() dto: RecordDailyProductionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.addDailyEntry(dto, tenantId, req.user?.userId);
    return {
      success: true,
      message: 'Daily production log entry recorded.',
      data: result,
    };
  }

  @Post(':id/close')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Close Production Batch (Calculates final cost, variance & clears WIP GL)' })
  @ApiParam({ name: 'id', description: 'Production Batch UUID' })
  async closeBatch(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.costingService.closeBatch(id, tenantId, req.user?.userId);
    return {
      success: true,
      message: result.message,
      data: result,
    };
  }
}
