import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BatchService } from './batch.service';
import {
  CreateBatchDto,
  AddBatchTransactionDto,
  CloseBatchDto,
  QueryBatchDto,
  MatureBioAssetDto,
  AmortizeBioAssetDto,
  RecordFairValueDto,
  DisposeBioAssetDto,
  RenewBatchDto,
  TransferStageDto,
  BulkDailyEntryDto,
  SingleBatchDailyEntryDto,
  UpdateBatchSchedulerLinesDto,
} from './dto/batch.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('Production Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) { }

  @Post()
  @RequirePermission('PRODUCTION', 'BATCH', 'create')
  @ApiOperation({ summary: 'Create a draft Batch with input lines' })
  async create(@Body() dto: CreateBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.create(dto, tenantId, req.user);
    return { success: true, message: 'Batch draft created successfully.', data: result };
  }

  @Post('bulk-daily-entry')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Bulk record daily operational data (feed, mortality, water, temp) across multiple batches' })
  async bulkDailyEntry(@Body() dto: BulkDailyEntryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.bulkAddDailyTransactions(dto, tenantId, req.user);
    return { success: true, message: 'Bulk daily entries recorded successfully.', data: result };
  }


  @Get()
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'List Batches matching filters' })
  async findAll(@Query() query: QueryBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.findAll(query, tenantId);
    return { success: true, message: 'Batches retrieved successfully.', data: result };
  }

  @Get(':id')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'Fetch a single Batch with input lines, transactions and output lines' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async findOne(@Param('id') id: string) {
    const result = await this.batchService.findOne(id);
    return { success: true, message: 'Batch details retrieved.', data: result };
  }

  @Delete(':id')
  @RequirePermission('PRODUCTION', 'BATCH', 'delete')
  @ApiOperation({ summary: 'Cancel a DRAFT Batch' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    return this.batchService.remove(id, tenantId, req.user);
  }

  @Post(':id/activate')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Activate a DRAFT Batch — consumes input lines from inventory via FIFO and mirrors to GL' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async activate(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.activate(id, tenantId, req.user);
    return { success: true, message: 'Batch activated successfully.', data: result };
  }

  @Get(':id/data-entry')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: "Scheduled parameter lines due on a given date for this batch, with expected quantity and what's already been recorded — drives the guided Data Entry screen" })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async getDataEntry(@Param('id') id: string, @Query('date') date: string) {
    const result = await this.batchService.getDataEntry(id, date || new Date().toISOString().slice(0, 10));
    return { success: true, message: 'Scheduled data-entry lines retrieved.', data: result };
  }

  @Post(':id/daily-entry')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Record complete daily operations entry (feed, medicine, mortality, weight, checkpoints, overheads) in a single atomic transaction' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async postDailyEntry(@Param('id') id: string, @Body() dto: SingleBatchDailyEntryDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    if (dto.is_draft) {
      const draftResult = await this.batchService.saveDailyEntryDraft(id, dto, tenantId, req.user);
      return { success: true, message: 'Daily operational draft saved successfully.', data: draftResult };
    }
    const result = await this.batchService.postDailyEntry(id, dto, tenantId, req.user);
    return { success: true, message: 'Daily operational log posted successfully.', data: result };
  }

  @Post(':id/daily-entry/draft')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Save draft daily entry without posting to ledger or inventory' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async saveDailyEntryDraft(@Param('id') id: string, @Body() payload: any, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.saveDailyEntryDraft(id, payload, tenantId, req.user);
    return { success: true, message: 'Draft saved successfully.', data: result };
  }

  @Get(':id/daily-entry/draft')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'Get saved draft daily entry for a given date' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async getDailyEntryDraft(@Param('id') id: string, @Query('date') date: string) {
    const result = await this.batchService.getDailyEntryDraft(id, date || new Date().toISOString().slice(0, 10));
    return { success: true, message: 'Draft retrieved.', data: result };
  }

  @Delete(':id/daily-entry/draft')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Discard saved draft daily entry for a given date' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async deleteDailyEntryDraft(@Param('id') id: string, @Query('date') date: string) {
    const result = await this.batchService.deleteDailyEntryDraft(id, date || new Date().toISOString().slice(0, 10));
    return { success: true, message: 'Draft discarded.', data: result };
  }

  @Post(':id/assign-animals')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Assign registered animals to this batch' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async assignAnimals(@Param('id') id: string, @Body() body: { animal_ids: string[] }, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.assignAnimalsToBatch(id, body.animal_ids, tenantId, req.user);
    return { success: true, message: 'Animals assigned to batch successfully.', data: result };
  }

  @Post(':id/unassign-animals')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Unassign animals from this batch' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async unassignAnimals(@Param('id') id: string, @Body() body: { animal_ids: string[] }, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.unassignAnimalsFromBatch(id, body.animal_ids, tenantId, req.user);
    return { success: true, message: 'Animals unassigned from batch.', data: result };
  }

  @Post(':id/bulk-register-animals')
  @RequirePermission('PRODUCTION', 'BATCH', 'create')
  @ApiOperation({ summary: 'Bulk register animals and attach them to this batch' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async bulkRegisterAnimals(
    @Param('id') id: string,
    @Body() dto: { tags: string[]; breed_id?: string; animal_type?: string; gender?: string },
    @Req() req: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.bulkRegisterAnimalsToBatch(id, dto, tenantId, req.user);
    return { success: true, message: 'Animals registered and assigned successfully.', data: result };
  }

  @Post(':id/transaction')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Record a daily transaction against an ACTIVE Batch (consumption, mortality, output, overhead, observation)' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async addTransaction(@Param('id') id: string, @Body() dto: AddBatchTransactionDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.addTransaction(id, dto, tenantId, req.user);
    return { success: true, message: 'Batch transaction recorded successfully.', data: result };
  }

  @Post(':id/close')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Close an ACTIVE Batch — allocates total cost across output lines and posts them to inventory' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async close(@Param('id') id: string, @Body() dto: CloseBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.close(id, dto, tenantId, req.user);
    return { success: true, message: 'Batch closed successfully.', data: result };
  }

  @Post(':id/mature')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'BIO_ASSET only — transitions PREMATURE → MATURE and sets up the amortization schedule' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async mature(@Param('id') id: string, @Body() dto: MatureBioAssetDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.matureBioAsset(id, dto, tenantId, req.user);
    return { success: true, message: 'Batch matured successfully.', data: result };
  }

  @Post(':id/amortize')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'BIO_ASSET only, MATURE stage — runs one month of amortization (one run per calendar month)' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async amortize(@Param('id') id: string, @Body() dto: AmortizeBioAssetDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.amortizeBioAsset(id, dto, tenantId, req.user);
    return { success: true, message: 'Amortization posted successfully.', data: result };
  }

  @Post(':id/fair-value')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'BIO_ASSET only — revalues the herd to a new fair value per unit, posting the gain or loss' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async fairValue(@Param('id') id: string, @Body() dto: RecordFairValueDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.recordFairValue(id, dto, tenantId, req.user);
    return { success: true, message: 'Fair value adjustment posted successfully.', data: result };
  }

  @Post(':id/dispose')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'BIO_ASSET only — exits animals via HARVEST (to inventory) or SOLD (gain/loss); auto-closes once the herd is fully disposed' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async dispose(@Param('id') id: string, @Body() dto: DisposeBioAssetDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.disposeBioAsset(id, dto, tenantId, req.user);
    return { success: true, message: 'Disposal recorded successfully.', data: result };
  }

  @Post(':id/renew')
  @RequirePermission('PRODUCTION', 'BATCH', 'create')
  @ApiOperation({ summary: "Copy a CLOSED batch's config (breed, scheduler, shed, costing method, standard assumptions) into a new DRAFT batch for the next cycle — only for LOBs with batch_copy_allowed" })
  @ApiParam({ name: 'id', description: 'Source (CLOSED) Batch UUID' })
  async renew(@Param('id') id: string, @Body() dto: RenewBatchDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.renew(id, dto, tenantId, req.user);
    return { success: true, message: 'Batch renewed successfully.', data: result };
  }

  @Post(':id/transfer-stage')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Record a physical move to a new stage/sub-location mid-life (e.g. setter room -> hatcher room) — tracking only, no GL impact' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async transferStage(@Param('id') id: string, @Body() dto: TransferStageDto, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.transferStage(id, dto, tenantId, req.user);
    return { success: true, message: 'Batch stage transferred successfully.', data: result };
  }

  @Post(':id/generate-scheduler')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Auto-generate concrete multi-stage schedulers and daily target curves from breed lifecycle standards' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async generateScheduler(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.generateSchedulerForBatch(id, tenantId, req.user);
    return { success: true, message: 'Batch stage schedulers auto-generated from breed standards.', data: result };
  }

  @Post(':id/generate-stage-schedulers')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Auto-generate dedicated stage schedulers for all lifecycle stages' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async generateStageSchedulers(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.generateSchedulerForBatch(id, tenantId, req.user);
    return { success: true, message: 'Batch stage schedulers generated successfully.', data: result };
  }

  @Get(':id/schedulers')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'List all stage schedulers with lines, stage info, custom days, and structured categorized parameter groups' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async getBatchSchedulers(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.getBatchSchedulers(id, tenantId);
    return { success: true, message: 'Batch stage schedulers retrieved successfully.', data: result };
  }

  @Get(':id/schedulers/:schedulerId')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'Fetch a single stage scheduler details with parameter lines' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  @ApiParam({ name: 'schedulerId', description: 'Scheduler UUID' })
  async getBatchStageScheduler(
    @Param('id') id: string,
    @Param('schedulerId') schedulerId: string,
    @Req() req: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.getBatchStageScheduler(id, schedulerId, tenantId);
    return { success: true, message: 'Stage scheduler details retrieved.', data: result };
  }

  @Put(':id/schedulers/:schedulerId/lines')
  @RequirePermission('PRODUCTION', 'BATCH', 'edit')
  @ApiOperation({ summary: 'Update standard parameters, tolerances, and custom days for a stage scheduler' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  @ApiParam({ name: 'schedulerId', description: 'Scheduler UUID' })
  async updateBatchSchedulerLines(
    @Param('id') id: string,
    @Param('schedulerId') schedulerId: string,
    @Body() dto: UpdateBatchSchedulerLinesDto,
    @Req() req: any
  ) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.updateBatchSchedulerLines(id, schedulerId, dto, tenantId, req.user);
    return { success: true, message: 'Stage scheduler parameters updated successfully.', data: result };
  }

  @Get(':id/performance-curves')
  @RequirePermission('PRODUCTION', 'BATCH', 'view')
  @ApiOperation({ summary: 'Fetch day-by-day standard performance curves vs actual recorded metrics (Feed, Weight, Mortality)' })
  @ApiParam({ name: 'id', description: 'Batch UUID' })
  async getPerformanceCurves(@Param('id') id: string, @Req() req: any) {
    const tenantId = req.user?.tenantId || req['tenantId'];
    const result = await this.batchService.getBatchPerformanceCurves(id, tenantId);
    return { success: true, message: 'Performance curves retrieved successfully.', data: result };
  }
}

