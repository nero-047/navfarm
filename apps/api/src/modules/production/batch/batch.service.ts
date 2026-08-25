import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull, count, inArray, lte, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
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
  SplitBatchLotsDto,
  MergeBatchLotsDto,
} from './dto/batch.dto';

import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { InventoryLedgerService } from '../../inventory/inventory-ledger/inventory-ledger.service';
import { GlPostingService } from '../../finance/journal/gl-posting.service';
import { NumberSeriesService } from '../../system/number-series/number-series.service';
import { computeStageOverdue } from '../stage/stage-overdue.util';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

const toDays = (value: number, calcUnit: string): number => {
  if (calcUnit === 'WEEK') return value * 7;
  if (calcUnit === 'MONTH') return value * 30;
  return value;
};

@Injectable()

export class BatchService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly glPostingService: GlPostingService,
    private readonly numberSeriesService: NumberSeriesService,
  ) { }

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  // `executor` defaults to `this.db` but must be passed the active transaction
  // when called from inside one (see `create()`) — `.for('update')` locks the
  // counted rows so a second concurrent call blocks until the first commits its
  // insert, instead of both reading the same count and generating the same number.
  // Delegates to the shared, tenant-configurable number series engine (see
  // number-series.service.ts) rather than locking/counting batch_header rows directly.
  // uq_batch_header_tenant_company_no stays as defense-in-depth either way.
  private async generateBatchNo(tenantId: string, companyId: string, executor: MySql2Database<typeof schema> = this.db): Promise<string> {
    return this.numberSeriesService.generateNext('BATCH', tenantId, companyId, executor);
  }

  async create(dto: CreateBatchDto, tenantId: string, userPayload?: any) {
    const [lob] = await this.db
      .select()
      .from(schema.lobMaster)
      .where(and(eq(schema.lobMaster.lob_id, dto.lob_id), eq(schema.lobMaster.is_active, true)))
      .limit(1);
    if (!lob) {
      throw new NotFoundException(`Line of Business with ID '${dto.lob_id}' not found.`);
    }
    const allowedMethods = lob.costing_method_allowed.split(',').map((m) => m.trim().toUpperCase());
    if (!allowedMethods.includes(dto.costing_method.toUpperCase())) {
      throw new BadRequestException(
        `Costing method '${dto.costing_method}' is not allowed for LOB '${lob.lob_name}' (allowed: ${lob.costing_method_allowed}).`
      );
    }

    const batchId = randomUUID();
    const batchNo = await this.db.transaction(async (tx) => {
      const no = await this.generateBatchNo(tenantId, dto.company_id, tx);
      await tx.insert(schema.batchHeader).values({
        batch_id: batchId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        batch_no: no,
        lob_id: dto.lob_id,
        nob_id: lob.nob_id,
        costing_method: dto.costing_method.toUpperCase(),
        breed_id: dto.breed_id || null,
        scheduler_id: dto.scheduler_id || null,
        shed_id: dto.shed_id || null,
        location_id: dto.location_id || null,
        start_date: dto.start_date,
        expected_end_date: dto.expected_end_date || null,
        status: 'DRAFT',
        opening_quantity: dto.opening_quantity.toString(),
        uom: dto.uom,
        remarks: dto.remarks || null,
        created_by: userPayload?.userId || null,
        updated_by: userPayload?.userId || null,
      });
      return no;
    });

    await this.db.insert(schema.batchInputLine).values(
      dto.input_lines.map((line, idx) => ({
        line_id: randomUUID(),
        batch_id: batchId,
        line_no: idx + 1,
        item_id: line.item_id,
        source_batch_id: line.source_batch_id || null,
        quantity: line.quantity.toString(),
        uom: line.uom,
        rate: line.rate?.toString() || null,
        amount: line.rate ? (line.quantity * line.rate).toString() : null,
      }))
    );

    if (dto.costing_method.toUpperCase() === 'STANDARD') {
      let stdOutputQty = dto.standard?.std_output_quantity;
      if (stdOutputQty === undefined || stdOutputQty === null) {
        let mortalityPct = 0;
        if (dto.breed_id) {
          const [breed] = await this.db
            .select()
            .from(schema.breedMaster)
            .where(eq(schema.breedMaster.breed_id, dto.breed_id))
            .limit(1);
          mortalityPct = breed?.avg_mortality_pct ? Number(breed.avg_mortality_pct) : 0;
        }
        stdOutputQty = dto.opening_quantity * (1 - mortalityPct / 100);
      }

      await this.db.insert(schema.batchStandard).values({
        standard_id: randomUUID(),
        batch_id: batchId,
        std_output_quantity: stdOutputQty.toString(),
        std_output_cost_per_unit: dto.standard?.std_output_cost_per_unit?.toString() || null,
        std_overhead_rate_per_unit: dto.standard?.std_overhead_rate_per_unit?.toString() || null,
        created_by: userPayload?.userId || null,
      });

      if (dto.standard?.consumption_lines?.length) {
        await this.db.insert(schema.batchStandardConsumptionLine).values(
          dto.standard.consumption_lines.map((line) => ({
            line_id: randomUUID(),
            batch_id: batchId,
            item_id: line.item_id,
            std_qty_per_unit_per_day: line.std_qty_per_unit_per_day.toString(),
            std_rate: line.std_rate?.toString() || null,
          }))
        );
      }
    }

    if (dto.costing_method.toUpperCase() === 'BIO_ASSET') {
      await this.db.insert(schema.batchBioAssetState).values({
        state_id: randomUUID(),
        batch_id: batchId,
        stage: 'PREMATURE',
        current_quantity: dto.opening_quantity.toString(),
        nca_book_value: '0.0000',
      });
    }

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'batch_header',
      entityId: batchId,
      newValues: { batch_no: batchNo, ...dto },
    });

    return this.findOne(batchId);
  }

  /**
   * Copy-forward for perpetual/seasonal LOBs (orchards, apiaries) — creates a
   * new DRAFT batch carrying the source's config (breed, scheduler, shed,
   * costing method, standard-cost assumptions) forward, needing only the new
   * cycle's own start date / opening quantity / input lines. Gated by
   * lob_master.batch_copy_allowed — matches the spec's "annual batch copy"
   * (year-end: COPY batch for next season, scheduler + location auto-copied).
   */
  async renew(id: string, dto: RenewBatchDto, tenantId: string, userPayload?: any) {
    const source = await this.findOne(id);
    this.assertStatus(source, 'CLOSED');

    const [lob] = await this.db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_id, source.lob_id)).limit(1);
    if (lob?.batch_copy_allowed !== 'YES') {
      throw new BadRequestException(`LOB '${lob?.lob_name || source.lob_id}' does not allow batch renewal.`);
    }

    const created = await this.create(
      {
        company_id: source.company_id,
        lob_id: source.lob_id,
        costing_method: source.costing_method,
        breed_id: source.breed_id || undefined,
        scheduler_id: source.scheduler_id || undefined,
        shed_id: source.shed_id || undefined,
        location_id: source.location_id || undefined,
        start_date: dto.start_date,
        expected_end_date: dto.expected_end_date,
        opening_quantity: dto.opening_quantity,
        uom: dto.uom,
        remarks: dto.remarks,
        input_lines: dto.input_lines,
        standard: source.standard
          ? {
            // std_output_quantity is deliberately NOT carried forward — it's
            // re-derived from the new opening_quantity × breed mortality%
            // by create() itself, the same way a fresh batch would.
            std_output_cost_per_unit: source.standard.std_output_cost_per_unit ? Number(source.standard.std_output_cost_per_unit) : undefined,
            std_overhead_rate_per_unit: source.standard.std_overhead_rate_per_unit ? Number(source.standard.std_overhead_rate_per_unit) : undefined,
            consumption_lines: (source.standard.consumption_lines || []).map((l: any) => ({
              item_id: l.item_id,
              std_qty_per_unit_per_day: Number(l.std_qty_per_unit_per_day),
              std_rate: l.std_rate ? Number(l.std_rate) : undefined,
            })),
          }
          : undefined,
      },
      tenantId,
      userPayload
    );

    await this.db
      .update(schema.batchHeader)
      .set({ renewed_from_batch_id: id, updated_by: userPayload?.userId || null, updated_at: toMysqlTimestamp() })
      .where(eq(schema.batchHeader.batch_id, created.batch_id));

    await this.auditService.log({
      tenantId,
      companyId: source.company_id,
      userId: userPayload?.userId,
      action: 'RENEW',
      entityName: 'batch_header',
      entityId: created.batch_id,
      newValues: { renewed_from_batch_id: id },
    });

    return this.findOne(created.batch_id);
  }

  async findOne(id: string) {
    const [batch] = await this.db
      .select()
      .from(schema.batchHeader)
      .where(and(eq(schema.batchHeader.batch_id, id), isNull(schema.batchHeader.deleted_at)))
      .limit(1);

    if (!batch) {
      throw new NotFoundException(`Batch with ID '${id}' not found.`);
    }

    const inputLines = await this.db.select().from(schema.batchInputLine).where(eq(schema.batchInputLine.batch_id, id));
    const transactions = await this.db
      .select()
      .from(schema.batchTransaction)
      .where(eq(schema.batchTransaction.batch_id, id));
    const outputLines = await this.db.select().from(schema.batchOutputLine).where(eq(schema.batchOutputLine.batch_id, id));

    const [standard] = await this.db.select().from(schema.batchStandard).where(eq(schema.batchStandard.batch_id, id)).limit(1);
    const standardConsumptionLines = standard
      ? await this.db.select().from(schema.batchStandardConsumptionLine).where(eq(schema.batchStandardConsumptionLine.batch_id, id))
      : [];
    const variances = await this.db.select().from(schema.batchCostVariance).where(eq(schema.batchCostVariance.batch_id, id));

    const [bioAssetState] = await this.db.select().from(schema.batchBioAssetState).where(eq(schema.batchBioAssetState.batch_id, id)).limit(1);
    const bioAssetEntries = bioAssetState
      ? await this.db.select().from(schema.bioAssetLedger).where(eq(schema.bioAssetLedger.batch_id, id))
      : [];

    const [scheduler] = batch.scheduler_id
      ? await this.db.select().from(schema.schedulerMaster).where(eq(schema.schedulerMaster.scheduler_id, batch.scheduler_id)).limit(1)
      : [];
    // Joined with stage_sequence so consumers (the batch header's lifecycle progress
    // bar, in particular) can render this batch's *real* stage plan in true lifecycle
    // order, instead of a hardcoded stage list unrelated to this LOB/breed.
    const stageSchedulerRows = await this.db
      .select({ scheduler: schema.schedulerMaster, stage_sequence: schema.stageMaster.stage_sequence })
      .from(schema.schedulerMaster)
      .leftJoin(schema.stageMaster, eq(schema.schedulerMaster.stage_id, schema.stageMaster.stage_id))
      .where(and(eq(schema.schedulerMaster.batch_id, id), eq(schema.schedulerMaster.is_active, true)))
      .orderBy(schema.stageMaster.stage_sequence, schema.schedulerMaster.stage_code);
    const stageSchedulers = stageSchedulerRows.map((r) => ({ ...r.scheduler, stage_sequence: r.stage_sequence }));
    const alerts = await this.db.select().from(schema.notificationAlertLog).where(eq(schema.notificationAlertLog.batch_id, id));
    const stageLog = await this.db.select().from(schema.batchStageLog).where(eq(schema.batchStageLog.batch_id, id));
    const lots = await this.db
      .select()
      .from(schema.batchLocationLot)
      .where(eq(schema.batchLocationLot.batch_id, id))
      .orderBy(schema.batchLocationLot.lot_no);
    const activeLots = lots.filter((l) => l.status === 'ACTIVE');
    // Same formula as getBatchHeadcount() — unlotted remainder (opening_quantity minus
    // every lot ever created, any status) plus whatever's alive in ACTIVE lots now.
    // See that method's comment for why a partial split must not drop the un-lotted head.
    const everLottedOpening = lots.reduce((sum, l) => sum + Number(l.opening_quantity), 0);
    const unlottedHeadcount = Math.max(0, Number(batch.opening_quantity) - everLottedOpening);
    const currentHeadcount = lots.length > 0
      ? unlottedHeadcount + activeLots.reduce((sum, l) => sum + Number(l.current_quantity), 0)
      : Number(batch.opening_quantity);

    // Stage-duration overdue: "days in stage" anchors to the most recent whole-batch
    // transfer (lot_id null) if any, else the batch's own start_date.
    let stageOverdue: ReturnType<typeof computeStageOverdue> = { days_in_stage: null, stage_duration_days: null, is_stage_overdue: false, suggested_next_stage_id: null };
    if (batch.stage_id) {
      const [stage] = await this.db.select().from(schema.stageMaster).where(eq(schema.stageMaster.stage_id, batch.stage_id)).limit(1);
      const lastWholeBatchTransfer = stageLog
        .filter((l) => !l.lot_id)
        .sort((a, b) => new Date(b.transferred_at).getTime() - new Date(a.transferred_at).getTime())[0];
      stageOverdue = computeStageOverdue(stage, lastWholeBatchTransfer?.transferred_at ?? batch.start_date);
    }

    const lotsWithStageStatus = await Promise.all(
      activeLots.map(async (lot) => {
        if (!lot.stage_id) return { ...lot, ...computeStageOverdue(null, null) };
        const [lotStage] = await this.db.select().from(schema.stageMaster).where(eq(schema.stageMaster.stage_id, lot.stage_id)).limit(1);
        const lastLotTransfer = stageLog
          .filter((l) => l.lot_id === lot.lot_id)
          .sort((a, b) => new Date(b.transferred_at).getTime() - new Date(a.transferred_at).getTime())[0];
        return { ...lot, ...computeStageOverdue(lotStage, lastLotTransfer?.transferred_at ?? lot.created_at) };
      })
    );

    return {
      ...batch,
      input_lines: inputLines,
      transactions,
      output_lines: outputLines,
      standard: standard ? { ...standard, consumption_lines: standardConsumptionLines } : null,
      variances,
      bio_asset_state: bioAssetState || null,
      bio_asset_entries: bioAssetEntries,
      scheduler: scheduler || null,
      stage_schedulers: stageSchedulers,
      alerts,
      stage_log: stageLog,
      lots: lotsWithStageStatus.length > 0 ? lotsWithStageStatus : lots,
      current_headcount: currentHeadcount,
      ...stageOverdue,
    };
  }

  /**
   * Delegates to the shared, tenant-configurable number series engine, same
   * pattern as generateBatchNo() above. Tenants provisioned before location
   * lots existed won't have a LOT series seeded (see SYSTEM_NO_SERIES_SEED) —
   * self-heal by creating it on first use instead of requiring a separate
   * backfill script.
   */
  private async generateLotNo(tenantId: string, companyId: string, executor: MySql2Database<typeof schema> = this.db): Promise<string> {
    try {
      return await this.numberSeriesService.generateNext('LOT', tenantId, companyId, executor);
    } catch (err) {
      if (err instanceof NotFoundException) {
        await executor.insert(schema.noSeriesMaster).values({
          series_id: randomUUID(),
          tenant_id: tenantId,
          company_id: null,
          series_code: 'LOT',
          series_name: 'Batch Location Lot Number',
          document_type: 'BATCH_LOCATION_LOT',
          prefix: 'LOT',
          separator: '-',
          seq_length: 6,
          current_seq: 0,
          reset_frequency: 'NEVER',
        });
        return this.numberSeriesService.generateNext('LOT', tenantId, companyId, executor);
      }
      throw err;
    }
  }

  async getBatchLots(batchId: string, tenantId: string) {
    await this.findOne(batchId);
    return this.db
      .select()
      .from(schema.batchLocationLot)
      .where(and(eq(schema.batchLocationLot.batch_id, batchId), eq(schema.batchLocationLot.tenant_id, tenantId)))
      .orderBy(schema.batchLocationLot.lot_no);
  }

  /**
   * Current headcount = whatever was never split into a lot, plus whatever's alive in
   * ACTIVE lots right now. Splitting a lot peels headcount OUT of the batch's unlotted
   * pool — it doesn't shrink the batch, so a batch that's only partially split (e.g. 3
   * of 20 head moved into one lot) must still count the other 17 as part of the total,
   * not silently drop them. `opening_quantity` across ALL lots ever created (any
   * status) is subtracted from the batch's own opening_quantity to get the unlotted
   * remainder — MERGED lots' headcount lives on in their target lot's current_quantity
   * (still counted, just under a different lot), CLOSED lots' headcount is done and
   * excluded from both the unlotted pool and the active sum, matching how closing the
   * whole batch works. Computed on read, not stored, to avoid reintroducing the class
   * of drift bug batch_header.current_quantity had.
   */
  async getBatchHeadcount(batchId: string, tenantId: string): Promise<number> {
    const [batch] = await this.db.select().from(schema.batchHeader).where(eq(schema.batchHeader.batch_id, batchId)).limit(1);
    if (!batch) return 0;
    const allLots = await this.db
      .select()
      .from(schema.batchLocationLot)
      .where(and(eq(schema.batchLocationLot.batch_id, batchId), eq(schema.batchLocationLot.tenant_id, tenantId)));
    if (allLots.length === 0) return Number(batch.opening_quantity);

    const everLottedOpening = allLots.reduce((sum, l) => sum + Number(l.opening_quantity), 0);
    const unlotted = Math.max(0, Number(batch.opening_quantity) - everLottedOpening);
    const activeLotsCurrent = allLots
      .filter((l) => l.status === 'ACTIVE')
      .reduce((sum, l) => sum + Number(l.current_quantity), 0);
    return unlotted + activeLotsCurrent;
  }

  /**
   * Splits a batch's headcount across one or more location lots — usable at
   * batch creation (first split) or any time after (peel part of the
   * still-unassigned headcount into a new location). One batch, many physical
   * locations, one costing/reporting unit — the "1,000 piglets across several
   * sheds, still one batch" scenario.
   */
  async splitBatchIntoLots(batchId: string, dto: SplitBatchLotsDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(batchId);
    if (batch.status !== 'ACTIVE' && batch.status !== 'DRAFT') {
      throw new BadRequestException(`Batch must be DRAFT or ACTIVE to split into location lots — it is currently ${batch.status}.`);
    }
    if (!dto.lots || dto.lots.length === 0) {
      throw new BadRequestException('At least one lot is required to split a batch.');
    }

    const existingLots = await this.db
      .select()
      .from(schema.batchLocationLot)
      .where(and(eq(schema.batchLocationLot.batch_id, batchId), eq(schema.batchLocationLot.status, 'ACTIVE')));
    const alreadyLotted = existingLots.reduce((sum, l) => sum + Number(l.current_quantity), 0);
    const unlottedAvailable = Number(batch.opening_quantity) - alreadyLotted;

    const requestedTotal = dto.lots.reduce((sum, l) => sum + l.quantity, 0);
    if (requestedTotal > unlottedAvailable + 0.001) {
      throw new BadRequestException(
        `Requested split quantity (${requestedTotal}) exceeds unassigned batch headcount (${unlottedAvailable}).`
      );
    }

    for (const lotDto of dto.lots) {
      const lotId = randomUUID();
      const lotNo = await this.generateLotNo(tenantId, batch.company_id);
      await this.db.insert(schema.batchLocationLot).values({
        lot_id: lotId,
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batchId,
        lot_no: lotNo,
        location_id: lotDto.location_id,
        stage_id: lotDto.stage_id || batch.stage_id || null,
        opening_quantity: lotDto.quantity.toString(),
        current_quantity: lotDto.quantity.toString(),
        remarks: lotDto.remarks || null,
        created_by: userPayload?.userId || null,
        updated_by: userPayload?.userId || null,
      });
    }

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'SPLIT_LOTS',
      entityName: 'batch_location_lot',
      entityId: batchId,
      newValues: { batch_id: batchId, lots: dto.lots },
    });

    return this.getBatchLots(batchId, tenantId);
  }

  /**
   * Merges one or more source lots' remaining headcount into a target lot
   * (e.g. consolidating two sheds back into one). Source lots are marked
   * MERGED, not deleted — batch_transaction/animal_register rows already
   * pointing at them stay valid history.
   */
  async mergeLots(batchId: string, dto: MergeBatchLotsDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(batchId);

    const [targetLot] = await this.db
      .select()
      .from(schema.batchLocationLot)
      .where(and(eq(schema.batchLocationLot.lot_id, dto.target_lot_id), eq(schema.batchLocationLot.batch_id, batchId)))
      .limit(1);
    if (!targetLot) {
      throw new NotFoundException(`Target lot '${dto.target_lot_id}' not found on this batch.`);
    }
    if (targetLot.status !== 'ACTIVE') {
      throw new BadRequestException(`Target lot '${targetLot.lot_no}' is not ACTIVE.`);
    }

    let mergedQty = Number(targetLot.current_quantity);
    for (const sourceLotId of dto.source_lot_ids) {
      if (sourceLotId === dto.target_lot_id) continue;
      const [sourceLot] = await this.db
        .select()
        .from(schema.batchLocationLot)
        .where(and(eq(schema.batchLocationLot.lot_id, sourceLotId), eq(schema.batchLocationLot.batch_id, batchId)))
        .limit(1);
      if (!sourceLot || sourceLot.status !== 'ACTIVE') continue;

      mergedQty += Number(sourceLot.current_quantity);

      await this.db
        .update(schema.batchLocationLot)
        .set({
          status: 'MERGED',
          merged_into_lot_id: dto.target_lot_id,
          closing_quantity: sourceLot.current_quantity,
          updated_at: toMysqlTimestamp(),
          updated_by: userPayload?.userId || null,
        })
        .where(eq(schema.batchLocationLot.lot_id, sourceLotId));

      // Animals/registered stock in the merged lot move with it.
      await this.db
        .update(schema.animalRegister)
        .set({
          current_lot_id: dto.target_lot_id,
          current_location_id: targetLot.location_id,
          updated_by: userPayload?.userId || null,
        })
        .where(eq(schema.animalRegister.current_lot_id, sourceLotId));
    }

    await this.db
      .update(schema.batchLocationLot)
      .set({ current_quantity: mergedQty.toString(), updated_at: toMysqlTimestamp(), updated_by: userPayload?.userId || null })
      .where(eq(schema.batchLocationLot.lot_id, dto.target_lot_id));

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'MERGE_LOTS',
      entityName: 'batch_location_lot',
      entityId: dto.target_lot_id,
      newValues: { source_lot_ids: dto.source_lot_ids, target_lot_id: dto.target_lot_id },
    });

    return this.getBatchLots(batchId, tenantId);
  }

  async closeLot(batchId: string, lotId: string, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(batchId);
    const [lot] = await this.db
      .select()
      .from(schema.batchLocationLot)
      .where(and(eq(schema.batchLocationLot.lot_id, lotId), eq(schema.batchLocationLot.batch_id, batchId)))
      .limit(1);
    if (!lot) {
      throw new NotFoundException(`Lot '${lotId}' not found on this batch.`);
    }

    await this.db
      .update(schema.batchLocationLot)
      .set({ status: 'CLOSED', closing_quantity: lot.current_quantity, updated_at: toMysqlTimestamp(), updated_by: userPayload?.userId || null })
      .where(eq(schema.batchLocationLot.lot_id, lotId));

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'CLOSE_LOT',
      entityName: 'batch_location_lot',
      entityId: lotId,
    });

    return this.getBatchLots(batchId, tenantId);
  }

  /**
   * Records a physical move to a new stage/sub-location mid-life (e.g. setter
   * room -> hatcher room) — a tracking event, not a cost event, so there's no
   * GL impact (matches spec: "sub-location transfer... No journal, location
   * update"). Feeds evaluateKpi() below, which matches scheduler_parameter_line
   * rows against the batch's CURRENT stage so thresholds can differ pre- vs.
   * post-transfer.
   */
  async transferStage(id: string, dto: TransferStageDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');

    // Lot-scoped transfer: move one location lot's stage/location without touching
    // the rest of the batch (stage schedulers stay batch-wide by design — see plan).
    if (dto.lot_id) {
      const [lot] = await this.db
        .select()
        .from(schema.batchLocationLot)
        .where(and(eq(schema.batchLocationLot.lot_id, dto.lot_id), eq(schema.batchLocationLot.batch_id, id)))
        .limit(1);
      if (!lot) {
        throw new NotFoundException(`Lot '${dto.lot_id}' not found on this batch.`);
      }

      const [matchedLotStage] = await this.db
        .select({ stage_id: schema.stageMaster.stage_id })
        .from(schema.stageMaster)
        .where(
          and(
            eq(schema.stageMaster.lob_id, batch.lob_id),
            eq(schema.stageMaster.stage_code, dto.to_stage_code.toUpperCase()),
            eq(schema.stageMaster.is_active, true),
            isNull(schema.stageMaster.deleted_at),
          )
        )
        .limit(1);

      await this.db
        .update(schema.batchLocationLot)
        .set({
          stage_id: matchedLotStage?.stage_id || lot.stage_id,
          location_id: dto.to_location_id || lot.location_id,
          updated_by: userPayload?.userId || null,
          updated_at: toMysqlTimestamp(),
        })
        .where(eq(schema.batchLocationLot.lot_id, dto.lot_id));

      await this.db.insert(schema.batchStageLog).values({
        log_id: randomUUID(),
        batch_id: id,
        lot_id: dto.lot_id,
        from_stage_code: batch.current_stage_code || null,
        to_stage_code: dto.to_stage_code,
        from_location_id: lot.location_id,
        to_location_id: dto.to_location_id || lot.location_id,
        transferred_by: userPayload?.userId || null,
        remarks: dto.remarks || null,
      });

      await this.auditService.log({
        tenantId,
        companyId: batch.company_id,
        userId: userPayload?.userId,
        action: 'TRANSFER_LOT_STAGE',
        entityName: 'batch_location_lot',
        entityId: dto.lot_id,
        newValues: { to_stage_code: dto.to_stage_code, to_location_id: dto.to_location_id },
      });

      return this.findOne(id);
    }

    // Opportunistic link to stage_master: if this LOB has a seeded stage matching
    // the given code, record it alongside current_stage_code.
    const [matchedStage] = await this.db
      .select({
        stage_id: schema.stageMaster.stage_id,
        stage_code: schema.stageMaster.stage_code,
        stage_name: schema.stageMaster.stage_name,
      })
      .from(schema.stageMaster)
      .where(
        and(
          eq(schema.stageMaster.lob_id, batch.lob_id),
          eq(schema.stageMaster.stage_code, dto.to_stage_code.toUpperCase()),
          eq(schema.stageMaster.is_active, true),
          isNull(schema.stageMaster.deleted_at),
        )
      )
      .limit(1);

    // Look for matching stage scheduler for this batch
    const targetStageCode = dto.to_stage_code.toUpperCase();
    const stageSchedulers = await this.db
      .select()
      .from(schema.schedulerMaster)
      .where(
        and(
          eq(schema.schedulerMaster.batch_id, id),
          eq(schema.schedulerMaster.tenant_id, tenantId),
          eq(schema.schedulerMaster.is_active, true)
        )
      );

    let activeSchedulerId = batch.scheduler_id;
    const destScheduler = stageSchedulers.find(
      (s) =>
        (matchedStage?.stage_id && s.stage_id === matchedStage.stage_id) ||
        (s.stage_code && s.stage_code.toUpperCase() === targetStageCode) ||
        (s.scheduler_code && s.scheduler_code.toUpperCase().includes(targetStageCode))
    );

    if (destScheduler) {
      activeSchedulerId = destScheduler.scheduler_id;
      // Mark old active schedulers as COMPLETED, and target as ACTIVE
      for (const s of stageSchedulers) {
        if (s.scheduler_id === destScheduler.scheduler_id) {
          await this.db
            .update(schema.schedulerMaster)
            .set({ scheduler_status: 'ACTIVE', updated_at: toMysqlTimestamp() })
            .where(eq(schema.schedulerMaster.scheduler_id, s.scheduler_id));
        } else if (s.scheduler_status === 'ACTIVE') {
          await this.db
            .update(schema.schedulerMaster)
            .set({ scheduler_status: 'COMPLETED', updated_at: toMysqlTimestamp() })
            .where(eq(schema.schedulerMaster.scheduler_id, s.scheduler_id));
        }
      }
    }

    await this.db
      .update(schema.batchHeader)
      .set({
        current_stage_code: dto.to_stage_code,
        stage_id: matchedStage?.stage_id || null,
        sub_location_id: dto.to_location_id || null,
        scheduler_id: activeSchedulerId,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.batchHeader.batch_id, id));

    await this.db.insert(schema.batchStageLog).values({
      log_id: randomUUID(),
      batch_id: id,
      from_stage_code: batch.current_stage_code || null,
      to_stage_code: dto.to_stage_code,
      from_location_id: batch.sub_location_id || null,
      to_location_id: dto.to_location_id || null,
      transferred_by: userPayload?.userId || null,
      remarks: dto.remarks || null,
    });

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'TRANSFER_STAGE',
      entityName: 'batch_header',
      entityId: id,
      oldValues: { current_stage_code: batch.current_stage_code, sub_location_id: batch.sub_location_id, scheduler_id: batch.scheduler_id },
      newValues: { current_stage_code: dto.to_stage_code, sub_location_id: dto.to_location_id, scheduler_id: activeSchedulerId },
    });

    return this.findOne(id);
  }

  async findAll(query: QueryBatchDto, tenantId: string) {
    const conditions: any[] = [eq(schema.batchHeader.tenant_id, tenantId), isNull(schema.batchHeader.deleted_at)];

    if (query.companyId) conditions.push(eq(schema.batchHeader.company_id, query.companyId));
    if (query.status) conditions.push(eq(schema.batchHeader.status, query.status));
    if (query.lobId) conditions.push(eq(schema.batchHeader.lob_id, query.lobId));
    if (query.search) conditions.push(like(schema.batchHeader.batch_no, `%${query.search}%`));

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.batchHeader)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  private assertStatus(batch: { status: string }, expected: string) {
    if (batch.status !== expected) {
      throw new BadRequestException(`Batch must be ${expected} for this action — it is currently ${batch.status}.`);
    }
  }

  /** DRAFT → ACTIVE: consumes each input line from inventory via FIFO, mirrors to GL. */
  async activate(id: string, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'DRAFT');

    if (!batch.input_lines || batch.input_lines.length === 0) {
      throw new BadRequestException('Cannot activate a batch with no input lines.');
    }

    if (batch.costing_method === 'BIO_ASSET') {
      // Acquiring animals is a direct purchase creating an NCA — not a draw
      // against existing warehouse stock, so no FIFO/inventory_ledger here.
      let totalAcquisitionCost = 0;
      for (const line of batch.input_lines) {
        const amount = Number(line.quantity) * Number(line.rate || 0);
        totalAcquisitionCost += amount;
        await this.glPostingService.postBatchCostEntry({
          tenantId,
          companyId: batch.company_id,
          transactionType: 'BIO_ACQUISITION',
          amount,
          documentNo: batch.batch_no,
          documentLineId: line.line_id,
          postingDate: batch.start_date,
          description: `Acquisition — ${batch.batch_no}`,
          nobId: batch.nob_id || undefined,
          lobId: batch.lob_id,
          stageId: batch.stage_id || undefined,
          userId: userPayload?.userId,
        });
        await this.db.insert(schema.bioAssetLedger).values({
          entry_id: randomUUID(),
          tenant_id: tenantId,
          company_id: batch.company_id,
          bio_asset_item_id: line.item_id,
          entry_type: 'ACQUISITION',
          document_no: batch.batch_no,
          batch_id: id,
          batch_no: batch.batch_no,
          posting_date: batch.start_date,
          stage: 'PREMATURE',
          quantity: line.quantity,
          cost_amount: amount.toString(),
          cost_amount_each_unit: line.rate || null,
          costing_method: 'COST_ACCUMULATION',
          nob_id: batch.nob_id,
          lob_id: batch.lob_id,
          created_by: userPayload?.userId || null,
        });
      }
      await this.db
        .update(schema.batchBioAssetState)
        .set({ nca_book_value: totalAcquisitionCost.toString(), updated_at: toMysqlTimestamp() })
        .where(eq(schema.batchBioAssetState.batch_id, id));
    } else {
      for (const line of batch.input_lines) {
        const ledgerEntry = await this.ledgerService.writeNegativeEntry({
          tenantId,
          companyId: batch.company_id,
          itemId: line.item_id,
          documentType: 'BATCH',
          documentNo: batch.batch_no,
          documentLineId: line.line_id,
          postingDate: batch.start_date,
          transactionType: 'BATCH_INPUT',
          quantity: Number(line.quantity),
          uom: line.uom,
          batchNo: batch.batch_no,
          userId: userPayload?.userId,
        });
        await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);

        // The line's rate/amount was only an estimate before activation — now
        // that FIFO has drawn the real cost, reflect it back on the line.
        await this.db
          .update(schema.batchInputLine)
          .set({ rate: ledgerEntry.rate, amount: (Math.abs(Number(ledgerEntry.amount)) || 0).toString() })
          .where(eq(schema.batchInputLine.line_id, line.line_id));
      }
    }

    await this.db
      .update(schema.batchHeader)
      .set({ status: 'ACTIVE', updated_by: userPayload?.userId || null, updated_at: toMysqlTimestamp() })
      .where(eq(schema.batchHeader.batch_id, id));

    await this.syncSchedulerLock(batch.scheduler_id);

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'ACTIVATE',
      entityName: 'batch_header',
      entityId: id,
      newValues: { status: 'ACTIVE' },
    });

    return this.findOne(id);
  }

  /** Running cost per opening unit so far — a simple valuation basis for MORTALITY write-offs mid-batch. */
  private async computeRunningUnitCost(batch: Awaited<ReturnType<BatchService['findOne']>>): Promise<number> {
    const inputTotal = (batch.input_lines || []).reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const consumptionTotal = (batch.transactions || [])
      .filter((t) => t.transaction_type === 'CONSUMPTION' || t.transaction_type === 'OVERHEAD')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const opening = Number(batch.opening_quantity || 0);
    return opening > 0 ? (inputTotal + consumptionTotal) / opening : 0;
  }

  async addTransaction(id: string, dto: AddBatchTransactionDto, tenantId: string, userPayload?: any, overrideTransactionId?: string) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');

    const isBioAsset = batch.costing_method === 'BIO_ASSET';
    let bioState: typeof schema.batchBioAssetState.$inferSelect | undefined;
    if (isBioAsset) {
      [bioState] = await this.db.select().from(schema.batchBioAssetState).where(eq(schema.batchBioAssetState.batch_id, id)).limit(1);
      if (!bioState) {
        const stateId = randomUUID();
        const stage = batch.current_stage_code === 'DRY_SOW_GESTATION' || batch.current_stage_code === 'LACTATION' ? 'MATURE' : 'PREMATURE';
        await this.db.insert(schema.batchBioAssetState).values({
          state_id: stateId,
          batch_id: id,
          stage,
          current_quantity: batch.opening_quantity?.toString() || '1',
          nca_book_value: stage === 'MATURE' ? (Number(batch.opening_quantity || 1) * 28000).toString() : '0.0000',
        });
        [bioState] = await this.db.select().from(schema.batchBioAssetState).where(eq(schema.batchBioAssetState.state_id, stateId)).limit(1);
      }
    }
    const bioAssetSubjectItemId = batch.input_lines[0]?.item_id;
    if (isBioAsset && !bioAssetSubjectItemId) {
      throw new BadRequestException(
        `Batch '${batch.batch_no}' has no input lines, so its bio-asset item can't be determined. ` +
        `A BIO_ASSET batch must have at least one input line recording what it opened with.`
      );
    }

    const transactionId = overrideTransactionId || randomUUID();
    let ledgerId: string | null = null;
    let journalId: string | null = null;
    let amount = 0;
    let rate: number | null = dto.rate ?? null;

    if (dto.transaction_type === 'CONSUMPTION') {
      if (!dto.item_id || !dto.quantity || !dto.uom) {
        throw new BadRequestException('CONSUMPTION transactions require item_id, quantity and uom.');
      }
      const bioTransactionType = isBioAsset
        ? (bioState!.stage === 'PREMATURE' ? 'BIO_CONSUMPTION_PREMATURE' : 'BIO_CONSUMPTION_MATURE')
        : 'BATCH_CONSUMPTION';
      const ledgerEntry = await this.ledgerService.writeNegativeEntry({
        tenantId,
        companyId: batch.company_id,
        itemId: dto.item_id,
        documentType: 'BATCH',
        documentNo: batch.batch_no,
        documentLineId: transactionId,
        postingDate: dto.transaction_date,
        transactionType: bioTransactionType,
        quantity: dto.quantity,
        uom: dto.uom,
        batchNo: batch.batch_no,
        userId: userPayload?.userId,
      });
      const consumptionJournal = await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);
      journalId = consumptionJournal.journal_id;
      ledgerId = ledgerEntry.ledger_id;
      rate = Number(ledgerEntry.rate);
      amount = Number(ledgerEntry.amount); // negative

      // Premature-stage cost capitalizes into the NCA; mature-stage cost is
      // just expensed (already handled by the GL mapping above) — the
      // biological asset's carrying value only moves in the PREMATURE case.
      if (isBioAsset && bioState!.stage === 'PREMATURE') {
        const capitalized = Math.abs(amount);
        await this.db
          .update(schema.batchBioAssetState)
          .set({ nca_book_value: (Number(bioState!.nca_book_value) + capitalized).toString(), updated_at: toMysqlTimestamp() })
          .where(eq(schema.batchBioAssetState.batch_id, id));
        await this.db.insert(schema.bioAssetLedger).values({
          entry_id: randomUUID(),
          tenant_id: tenantId,
          company_id: batch.company_id,
          bio_asset_item_id: dto.item_id,
          entry_type: 'CONSUMPTION',
          document_no: batch.batch_no,
          batch_id: id,
          batch_no: batch.batch_no,
          posting_date: dto.transaction_date,
          stage: 'PREMATURE',
          quantity: dto.quantity.toString(),
          cost_amount: capitalized.toString(),
          cost_amount_each_unit: rate?.toString() || null,
          costing_method: 'COST_ACCUMULATION',
          nob_id: batch.nob_id,
          lob_id: batch.lob_id,
          created_by: userPayload?.userId || null,
        });
      }
    } else if (dto.transaction_type === 'OUTPUT') {
      if (!dto.item_id || !dto.quantity || !dto.uom) {
        throw new BadRequestException('OUTPUT transactions require item_id, quantity and uom.');
      }
      if (isBioAsset && bioState!.stage !== 'MATURE') {
        throw new BadRequestException('OUTPUT can only be recorded once the bio-asset batch has matured.');
      }

      // Mid-batch by-product/waste removal at Net Realisable Value — the
      // spec's "candling loss" pattern: the item leaves WIP at what it
      // actually cost to produce, enters inventory at what it's actually
      // worth (NRV), and the difference posts as an impairment loss.
      // close()'s totalCost pool never sees this quantity — it's relieved
      // here, the same way MORTALITY is already relieved the moment it's
      // recorded. Only meaningful for non-bio-asset batches; bio-asset
      // by-products would need a different NCA-relief treatment, out of scope
      // here, so this path is simply not offered for them.
      const isByProductRemoval = !isBioAsset && (dto.output_type === 'BY_PRODUCT' || dto.output_type === 'WASTE') && dto.nrv_rate != null;

      const ledgerEntry = await this.ledgerService.writePositiveEntry({
        tenantId,
        companyId: batch.company_id,
        itemId: dto.item_id,
        documentType: 'BATCH',
        documentNo: batch.batch_no,
        documentLineId: transactionId,
        postingDate: dto.transaction_date,
        transactionType: isBioAsset ? 'BIO_OUTPUT' : 'BATCH_OUTPUT',
        quantity: dto.quantity,
        uom: dto.uom,
        rate: isByProductRemoval ? dto.nrv_rate : dto.rate,
        batchNo: batch.batch_no,
        userId: userPayload?.userId,
      });
      const outputJournal = await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);
      journalId = outputJournal.journal_id;
      ledgerId = ledgerEntry.ledger_id;
      rate = Number(ledgerEntry.rate);
      amount = Number(ledgerEntry.amount); // positive

      if (isBioAsset) {
        const newNca = Math.max(0, Number(bioState!.nca_book_value) - amount);
        await this.db
          .update(schema.batchBioAssetState)
          .set({ nca_book_value: newNca.toString(), updated_at: toMysqlTimestamp() })
          .where(eq(schema.batchBioAssetState.batch_id, id));
      }

      if (isByProductRemoval) {
        const nrvRate = dto.nrv_rate!;
        const atCostRate = await this.computeRunningUnitCost(batch);
        const atCostValue = atCostRate * dto.quantity;
        const nrvValue = nrvRate * dto.quantity;
        const impairment = atCostValue - nrvValue;

        if (impairment > 0.005) {
          await this.glPostingService.postBatchCostEntry({
            tenantId,
            companyId: batch.company_id,
            transactionType: 'BATCH_IMPAIRMENT',
            amount: impairment,
            documentNo: batch.batch_no,
            documentLineId: transactionId,
            postingDate: dto.transaction_date,
            description: `${dto.output_type} removal impairment (at-cost ₹${atCostValue.toFixed(2)} vs NRV ₹${nrvValue.toFixed(2)}) — ${batch.batch_no}`,
            nobId: batch.nob_id || undefined,
            lobId: batch.lob_id,
            stageId: batch.stage_id || undefined,
            userId: userPayload?.userId,
          });
        }

        await this.db.insert(schema.batchOutputLine).values({
          line_id: randomUUID(),
          batch_id: id,
          item_id: dto.item_id,
          output_type: dto.output_type!,
          cost_split_pct: '0',
          quantity: dto.quantity.toString(),
          uom: dto.uom,
          computed_cost: nrvValue.toString(),
          unit_cost: nrvRate.toString(),
        });
      }
    } else if (dto.transaction_type === 'MORTALITY') {
      if (!dto.quantity) {
        throw new BadRequestException('MORTALITY transactions require quantity.');
      }
      if (isBioAsset) {
        const currentQty = Number(bioState!.current_quantity);
        if (dto.quantity > currentQty) {
          throw new BadRequestException(`Cannot record mortality of ${dto.quantity} — only ${currentQty} remain in the herd.`);
        }
        const perUnitNca = currentQty > 0 ? Number(bioState!.nca_book_value) / currentQty : 0;
        const nbvShare = perUnitNca * dto.quantity;
        rate = perUnitNca;
        amount = -nbvShare;
        const bioMortalityJournal = await this.glPostingService.postBatchCostEntry({
          tenantId,
          companyId: batch.company_id,
          transactionType: bioState!.stage === 'PREMATURE' ? 'BIO_MORTALITY_PREMATURE' : 'BIO_MORTALITY_MATURE',
          amount: nbvShare,
          documentNo: batch.batch_no,
          documentLineId: transactionId,
          postingDate: dto.transaction_date,
          description: `Mortality — ${batch.batch_no}`,
          nobId: batch.nob_id || undefined,
          lobId: batch.lob_id,
          stageId: batch.stage_id || undefined,
          userId: userPayload?.userId,
        });
        journalId = bioMortalityJournal.journal_id;
        await this.db
          .update(schema.batchBioAssetState)
          .set({
            current_quantity: (currentQty - dto.quantity).toString(),
            nca_book_value: Math.max(0, Number(bioState!.nca_book_value) - nbvShare).toString(),
            updated_at: toMysqlTimestamp(),
          })
          .where(eq(schema.batchBioAssetState.batch_id, id));
        await this.db.insert(schema.bioAssetLedger).values({
          entry_id: randomUUID(),
          tenant_id: tenantId,
          company_id: batch.company_id,
          bio_asset_item_id: bioAssetSubjectItemId,
          entry_type: 'MORTALITY',
          document_no: batch.batch_no,
          batch_id: id,
          batch_no: batch.batch_no,
          posting_date: dto.transaction_date,
          stage: bioState!.stage,
          quantity: (-dto.quantity).toString(),
          cost_amount: (-nbvShare).toString(),
          cost_amount_each_unit: perUnitNca.toString(),
          costing_method: bioState!.stage === 'MATURE' ? 'AMORTIZED_COST' : 'COST_ACCUMULATION',
          nob_id: batch.nob_id,
          lob_id: batch.lob_id,
          created_by: userPayload?.userId || null,
        });
      } else {
        const unitCost = await this.computeRunningUnitCost(batch);
        rate = unitCost;
        amount = -(dto.quantity * unitCost);
        const mortalityJournal = await this.glPostingService.postBatchCostEntry({
          tenantId,
          companyId: batch.company_id,
          transactionType: 'MORTALITY',
          amount: Math.abs(amount),
          documentNo: batch.batch_no,
          documentLineId: transactionId,
          postingDate: dto.transaction_date,
          description: `Mortality — ${batch.batch_no}`,
          nobId: batch.nob_id || undefined,
          lobId: batch.lob_id,
          stageId: batch.stage_id || undefined,
          userId: userPayload?.userId,
        });
        journalId = mortalityJournal.journal_id;
      }
    } else if (dto.transaction_type === 'OVERHEAD') {
      if (!dto.quantity || !dto.rate) {
        throw new BadRequestException('OVERHEAD transactions require quantity and rate.');
      }
      amount = -(dto.quantity * dto.rate);
      const bioTransactionType = isBioAsset
        ? (bioState!.stage === 'PREMATURE' ? 'BIO_OVERHEAD_PREMATURE' : 'BIO_OVERHEAD_MATURE')
        : 'OVERHEAD';
      const overheadJournal = await this.glPostingService.postBatchCostEntry({
        tenantId,
        companyId: batch.company_id,
        transactionType: bioTransactionType,
        amount: Math.abs(amount),
        documentNo: batch.batch_no,
        documentLineId: transactionId,
        postingDate: dto.transaction_date,
        description: dto.remarks || `Overhead — ${batch.batch_no}`,
        nobId: batch.nob_id || undefined,
        lobId: batch.lob_id,
        stageId: batch.stage_id || undefined,
        userId: userPayload?.userId,
      });
      journalId = overheadJournal.journal_id;

      if (isBioAsset && bioState!.stage === 'PREMATURE') {
        const capitalized = Math.abs(amount);
        await this.db
          .update(schema.batchBioAssetState)
          .set({ nca_book_value: (Number(bioState!.nca_book_value) + capitalized).toString(), updated_at: toMysqlTimestamp() })
          .where(eq(schema.batchBioAssetState.batch_id, id));
        await this.db.insert(schema.bioAssetLedger).values({
          entry_id: randomUUID(),
          tenant_id: tenantId,
          company_id: batch.company_id,
          bio_asset_item_id: bioAssetSubjectItemId,
          entry_type: 'OVERHEAD_COST',
          document_no: batch.batch_no,
          batch_id: id,
          batch_no: batch.batch_no,
          posting_date: dto.transaction_date,
          stage: 'PREMATURE',
          quantity: dto.quantity.toString(),
          cost_amount: capitalized.toString(),
          costing_method: 'COST_ACCUMULATION',
          nob_id: batch.nob_id,
          lob_id: batch.lob_id,
          created_by: userPayload?.userId || null,
        });
      }
    }
    // OBSERVATION: no cost impact, no GL — just a text record (amount stays 0).

    await this.db.insert(schema.batchTransaction).values({
      transaction_id: transactionId,
      batch_id: id,
      transaction_date: dto.transaction_date,
      transaction_type: dto.transaction_type,
      item_id: dto.item_id || null,
      resource_id: dto.resource_id || null,
      lot_id: dto.lot_id || null,
      animal_id: dto.animal_id || null,
      quantity: dto.quantity?.toString() || null,
      uom: dto.uom || null,
      rate: rate?.toString() || null,
      amount: amount.toString(),
      remarks: dto.remarks || null,
      ledger_id: ledgerId,
      journal_id: journalId,
      created_by: userPayload?.userId || null,
    });

    // Mortality against a specific lot relieves that lot's headcount — cost/GL impact
    // (above) stays batch-level regardless; this only tracks physical headcount per location.
    if (dto.transaction_type === 'MORTALITY' && dto.lot_id && dto.quantity) {
      const [lot] = await this.db.select().from(schema.batchLocationLot).where(eq(schema.batchLocationLot.lot_id, dto.lot_id)).limit(1);
      if (lot) {
        const newLotQty = Math.max(0, Number(lot.current_quantity) - dto.quantity);
        await this.db
          .update(schema.batchLocationLot)
          .set({ current_quantity: newLotQty.toString(), updated_at: toMysqlTimestamp() })
          .where(eq(schema.batchLocationLot.lot_id, dto.lot_id));
      }
    }

    // A registered animal tied to a MORTALITY transaction is disposed here — in
    // addTransaction() itself, not the caller — so this applies uniformly whether the
    // entry came through postDailyEntry() or a direct POST /batch/:id/transaction call.
    if (dto.transaction_type === 'MORTALITY' && dto.animal_id) {
      await this.db
        .update(schema.animalRegister)
        .set({
          status: 'DEAD',
          is_active: false,
          disposal_date: dto.transaction_date,
          disposal_type: 'DIED',
          updated_by: userPayload?.userId || null,
          updated_at: toMysqlTimestamp(),
        })
        .where(eq(schema.animalRegister.animal_id, dto.animal_id));
    }

    if (batch.scheduler_id && dto.quantity !== undefined && dto.quantity !== null) {
      await this.evaluateKpi(batch, {
        transaction_id: transactionId,
        transaction_date: dto.transaction_date,
        transaction_type: dto.transaction_type,
        item_id: dto.item_id || null,
        resource_id: dto.resource_id || null,
        quantity: dto.quantity,
        spl_id: dto.spl_id || null,
        parameter_id: dto.parameter_id || null,
      });
    }

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'batch_transaction',
      entityId: transactionId,
      newValues: { batch_id: id, ...dto, amount },
    });

    return this.findOne(id);
  }

  /**
   * Corrects a posted daily entry without rewriting history: reverses the original's
   * ledger/GL impact (equal-and-opposite entries, per inventory-ledger.service.ts's
   * reverseLedgerEntry() and journal.service.ts's reverseJournalEntry()), marks the
   * original transaction SUPERSEDED, and posts the corrected values as a brand new
   * transaction via addTransaction() — reusing its full CONSUMPTION/OUTPUT/MORTALITY/
   * OVERHEAD branching and evaluateKpi() re-run rather than duplicating that logic.
   * Only ACTIVE batches are editable — once CLOSED/CANCELLED, entries are final.
   */
  async updateTransaction(batchId: string, transactionId: string, dto: AddBatchTransactionDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(batchId);
    this.assertStatus(batch, 'ACTIVE');

    const [original] = await this.db
      .select()
      .from(schema.batchTransaction)
      .where(and(eq(schema.batchTransaction.transaction_id, transactionId), eq(schema.batchTransaction.batch_id, batchId)))
      .limit(1);
    if (!original) {
      throw new NotFoundException(`Transaction '${transactionId}' not found on this batch.`);
    }
    if (original.status !== 'POSTED') {
      throw new BadRequestException(`Transaction is already ${original.status} and cannot be edited again.`);
    }

    if (original.ledger_id) {
      await this.ledgerService.reverseLedgerEntry(original.ledger_id, userPayload?.userId);
    }
    if (original.journal_id) {
      await this.glPostingService.reverseJournalEntry(original.journal_id, userPayload?.userId);
    }

    await this.db
      .update(schema.batchTransaction)
      .set({ status: 'SUPERSEDED' })
      .where(eq(schema.batchTransaction.transaction_id, transactionId));

    const newTransactionId = randomUUID();
    await this.addTransaction(batchId, dto, tenantId, userPayload, newTransactionId);

    await this.db
      .update(schema.batchTransaction)
      .set({ supersedes_transaction_id: transactionId })
      .where(eq(schema.batchTransaction.transaction_id, newTransactionId));

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'batch_transaction',
      entityId: newTransactionId,
      oldValues: original,
      newValues: { ...dto, supersedes_transaction_id: transactionId },
    });

    return this.findOne(batchId);
  }

  /**
   * Timezone-safe date diffing (in UTC calendar days) — returns 1 for start_date itself.
   */
  private getDayOfBatch(startDateStr: string | Date, targetDateStr: string | Date): number {
    const s = typeof startDateStr === 'string' ? startDateStr.slice(0, 10) : startDateStr.toISOString().slice(0, 10);
    const t = typeof targetDateStr === 'string' ? targetDateStr.slice(0, 10) : targetDateStr.toISOString().slice(0, 10);
    const [sy, sm, sd] = s.split('-').map(Number);
    const [ty, tm, td] = t.split('-').map(Number);
    const startMs = Date.UTC(sy, sm - 1, sd);
    const targetMs = Date.UTC(ty, tm - 1, td);
    return Math.round((targetMs - startMs) / 86400000) + 1;
  }

  /**
   * Day-range + stage filter shared by evaluateKpi() and getDataEntry() —
   * all scheduler_parameter_line rows (joined to their Parameter) that are
   * "live" for a given day of the batch, regardless of what transaction (if
   * any) is being checked against them.
   */
  private async loadActiveScheduleLines(
    batch: Awaited<ReturnType<BatchService['findOne']>>,
    dayOfBatch: number
  ) {
    if (!batch.scheduler_id) return [];

    const lines = await this.db
      .select({
        spl: schema.schedulerParameterLine,
        parameter: schema.parameterMaster,
      })
      .from(schema.schedulerParameterLine)
      .innerJoin(schema.parameterMaster, eq(schema.schedulerParameterLine.parameter_id, schema.parameterMaster.parameter_id))
      .where(eq(schema.schedulerParameterLine.scheduler_id, batch.scheduler_id));

    return lines.filter(({ spl }) => {
      if (dayOfBatch < spl.period_from || dayOfBatch > spl.period_to) return false;
      // A line scoped to a stage only applies once the batch has transferred
      // into it (e.g. hatcher-stage temperature thresholds don't fire while
      // still in the setter stage) — unscoped lines (stage_code null) always
      // apply, preserving today's behavior for batches that never transfer.
      if (spl.stage_code && spl.stage_code !== batch.current_stage_code) return false;
      return true;
    });
  }

  private computeExpectedQty(
    spl: typeof schema.schedulerParameterLine.$inferSelect,
    parameter: typeof schema.parameterMaster.$inferSelect,
    openingQty: number
  ): number {
    const rawQty = spl.expected_qty_override
      ? Number(spl.expected_qty_override)
      : parameter.default_qty_per_unit
        ? Number(parameter.default_qty_per_unit)
        : parameter.default_qty_per_batch
          ? Number(parameter.default_qty_per_batch)
          : spl.kpi_target_value
            ? Number(spl.kpi_target_value)
            : 0;

    if (parameter.parameter_type === 'CONSUMPTION') {
      if (parameter.qty_method === 'PER_BATCH') {
        return rawQty;
      }
      return rawQty * openingQty;
    }

    if (parameter.parameter_type === 'OUTPUT') {
      if (parameter.qty_method === 'PER_UNIT') {
        return rawQty * openingQty;
      }
      return rawQty;
    }

    return rawQty;
  }

  /**
   * Keeps scheduler_master.is_locked in sync with whether any batch is
   * currently ACTIVE against it — locked while at least one is, so its plan
   * can't change out from under a batch being KPI-tracked against it, but
   * unlocked again once none are, so it becomes editable once its batches
   * close or get cancelled rather than staying locked forever.
   */
  private async syncSchedulerLock(schedulerId: string | null) {
    if (!schedulerId) return;
    const [{ activeCount }] = await this.db
      .select({ activeCount: count() })
      .from(schema.batchHeader)
      .where(and(eq(schema.batchHeader.scheduler_id, schedulerId), eq(schema.batchHeader.status, 'ACTIVE')));
    await this.db
      .update(schema.schedulerMaster)
      .set({ is_locked: activeCount > 0, updated_at: toMysqlTimestamp() })
      .where(eq(schema.schedulerMaster.scheduler_id, schedulerId));
  }

  private async evaluateKpi(
    batch: Awaited<ReturnType<BatchService['findOne']>>,
    transaction: {
      transaction_id: string;
      transaction_date: string;
      transaction_type: string;
      item_id: string | null;
      resource_id: string | null;
      quantity: number;
      spl_id?: string | null;
      parameter_id?: string | null;
    }
  ) {
    if (!batch.scheduler_id) return;

    const dayOfBatch = this.getDayOfBatch(batch.start_date, transaction.transaction_date);
    if (dayOfBatch < 1) return;

    const activeLines = await this.loadActiveScheduleLines(batch, dayOfBatch);
    if (!activeLines.length) return;

    let match: (typeof activeLines)[0] | undefined;

    // 1. Direct match by spl_id
    if (transaction.spl_id) {
      match = activeLines.find((l) => l.spl.spl_id === transaction.spl_id);
    }
    // 2. Direct match by parameter_id
    if (!match && transaction.parameter_id) {
      match = activeLines.find((l) => l.spl.parameter_id === transaction.parameter_id);
    }
    // 3. Match by parameter type and matching item/resource
    if (!match) {
      match = activeLines.find(({ parameter }) => {
        if (parameter.parameter_type !== transaction.transaction_type) return false;
        if (transaction.item_id && parameter.item_id === transaction.item_id) return true;
        if (transaction.resource_id && parameter.resource_id === transaction.resource_id) return true;
        return false;
      });
    }
    // 4. Match by parameter type with no item/resource restriction
    if (!match) {
      match = activeLines.find(({ parameter }) => {
        if (parameter.parameter_type !== transaction.transaction_type) return false;
        if (!parameter.item_id && !parameter.resource_id && !transaction.item_id && !transaction.resource_id) return true;
        return false;
      });
    }
    // 5. Fallback match by parameter type
    if (!match) {
      match = activeLines.find(({ parameter }) => parameter.parameter_type === transaction.transaction_type);
    }

    if (!match || !match.spl.kpi_enabled || !match.spl.kpi_mode) return;
    const { spl, parameter } = match;

    const openingQty = Number(batch.opening_quantity);
    const expectedQty = this.computeExpectedQty(spl, parameter, openingQty);

    // Compute cumulative same-day quantity for this parameter/item on this date
    const sameDayTx = await this.db
      .select()
      .from(schema.batchTransaction)
      .where(and(
        eq(schema.batchTransaction.batch_id, batch.batch_id),
        eq(schema.batchTransaction.transaction_date, transaction.transaction_date)
      ));
    const sameDaySum = sameDayTx
      .filter((t) => t.transaction_type === parameter.parameter_type
        && (parameter.item_id ? t.item_id === parameter.item_id : true)
        && (parameter.resource_id ? t.resource_id === parameter.resource_id : true))
      .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

    const actual = sameDaySum > 0 ? sameDaySum : transaction.quantity;
    let breached = false;
    let breachDirection: 'below' | 'above' | null = null;
    let deviationPct: number | null = null;
    let severity: 'WARNING' | 'CRITICAL' = 'WARNING';

    if (spl.kpi_mode === 'PCT') {
      if (expectedQty <= 0) return;
      const minQty = spl.kpi_min_pct ? expectedQty * (Number(spl.kpi_min_pct) / 100) : -Infinity;
      const maxQty = spl.kpi_max_pct ? expectedQty * (Number(spl.kpi_max_pct) / 100) : Infinity;
      breached = actual < minQty || actual > maxQty;
      breachDirection = actual < minQty ? 'below' : actual > maxQty ? 'above' : null;
      deviationPct = ((actual - expectedQty) / expectedQty) * 100;
      if (breached && spl.critical_threshold_pct && Math.abs(deviationPct) > Number(spl.critical_threshold_pct)) {
        severity = 'CRITICAL';
      }
    } else if (spl.kpi_mode === 'VALUE') {
      const minVal = spl.kpi_min_value !== null ? Number(spl.kpi_min_value) : -Infinity;
      const maxVal = spl.kpi_max_value !== null ? Number(spl.kpi_max_value) : Infinity;
      breached = actual < minVal || actual > maxVal;
      breachDirection = actual < minVal ? 'below' : actual > maxVal ? 'above' : null;
      if (expectedQty > 0) {
        deviationPct = ((actual - expectedQty) / expectedQty) * 100;
        if (breached && spl.critical_threshold_pct && Math.abs(deviationPct) > Number(spl.critical_threshold_pct)) {
          severity = 'CRITICAL';
        }
      } else if (breached && (actual < minVal * 0.8 || actual > maxVal * 1.2)) {
        severity = 'CRITICAL';
      }
    }

    if (!breached) return;

    const deviationAmount = actual - expectedQty;
    const title = `${parameter.parameter_name} ${breachDirection === 'below' ? 'Below' : 'Above'} KPI — Batch ${batch.batch_no}${spl.period_label ? `, ${spl.period_label}` : ''}`;
    const message = spl.kpi_mode === 'PCT'
      ? `${parameter.parameter_name}: actual ${actual}, expected ${expectedQty.toFixed(4)} (${deviationPct !== null ? deviationPct.toFixed(2) : '0'}% deviation). Batch ${batch.batch_no}, Day ${dayOfBatch}.`
      : `${parameter.parameter_name}: actual ${actual} outside range [${spl.kpi_min_value ?? '-∞'}, ${spl.kpi_max_value ?? '∞'}]. Batch ${batch.batch_no}, Day ${dayOfBatch}.`;

    // Check if an unread alert already exists for this exact batch and spl
    const [existingAlert] = await this.db
      .select()
      .from(schema.notificationAlertLog)
      .where(and(
        eq(schema.notificationAlertLog.batch_id, batch.batch_id),
        eq(schema.notificationAlertLog.spl_id, spl.spl_id),
        eq(schema.notificationAlertLog.is_read, false)
      ))
      .limit(1);

    if (existingAlert) {
      await this.db
        .update(schema.notificationAlertLog)
        .set({
          transaction_id: transaction.transaction_id,
          severity,
          title,
          message,
          actual_value: actual.toString(),
          expected_value: expectedQty.toString(),
          deviation_amount: deviationAmount.toString(),
          deviation_pct: deviationPct !== null ? deviationPct.toFixed(2) : null,
          created_at: toMysqlTimestamp() as any,
        })
        .where(eq(schema.notificationAlertLog.alert_id, existingAlert.alert_id));
      return;
    }

    await this.db.insert(schema.notificationAlertLog).values({
      alert_id: randomUUID(),
      tenant_id: batch.tenant_id,
      company_id: batch.company_id,
      lob_id: batch.lob_id,
      batch_id: batch.batch_id,
      spl_id: spl.spl_id,
      transaction_id: transaction.transaction_id,
      alert_type: 'KPI_DEVIATION',
      severity,
      title,
      message,
      parameter_name: parameter.parameter_name,
      kpi_mode: spl.kpi_mode,
      expected_value: expectedQty.toString(),
      actual_value: actual.toString(),
      deviation_amount: deviationAmount.toString(),
      deviation_pct: deviationPct !== null ? deviationPct.toFixed(2) : null,
      kpi_min: spl.kpi_mode === 'PCT' ? spl.kpi_min_pct : spl.kpi_min_value,
      kpi_max: spl.kpi_mode === 'PCT' ? spl.kpi_max_pct : spl.kpi_max_value,
    });
  }

  /**
   * Drives the batch "Data Entry" screen: every scheduler_parameter_line
   * that's due on the given date, with its expected quantity, enriched category,
   * daily breed standards and whatever's already been recorded that day.
   */
  async getDataEntry(id: string, dateStr: string) {
    const batch = await this.findOne(id);
    if (!batch.scheduler_id) {
      throw new BadRequestException('This batch has no scheduler attached — record entries via the generic Transactions form instead.');
    }

    const dayOfBatch = this.getDayOfBatch(batch.start_date, dateStr);

    const activeLines = await this.loadActiveScheduleLines(batch, dayOfBatch);
    const openingQty = Number(batch.opening_quantity);

    const sameDayTx = await this.db
      .select()
      .from(schema.batchTransaction)
      .where(and(eq(schema.batchTransaction.batch_id, id), eq(schema.batchTransaction.transaction_date, dateStr)));

    const itemIds = [...new Set(activeLines.map(({ parameter }) => parameter.item_id).filter((x): x is string => !!x))];
    const itemRows = itemIds.length
      ? await this.db.select().from(schema.itemMaster).where(inArray(schema.itemMaster.item_id, itemIds))
      : [];
    const itemMap = new Map(itemRows.map((x) => [x.item_id, x]));

    const itemLabel = (itemId: string | null) => {
      if (!itemId) return null;
      const it = itemMap.get(itemId);
      return it ? `${it.item_code} — ${it.item_name}` : null;
    };

    let dailyStandards: any = null;
    if (batch.breed_id) {
      const [std] = await this.db
        .select()
        .from(schema.breedLifecycleStages)
        .where(
          and(
            eq(schema.breedLifecycleStages.breed_id, batch.breed_id),
            lte(schema.breedLifecycleStages.period_from, dayOfBatch),
            gte(schema.breedLifecycleStages.period_to, dayOfBatch)
          )
        )
        .limit(1);
      if (std) {
        dailyStandards = {
          std_body_weight_kg: std.std_body_weight_kg ? Number(std.std_body_weight_kg) : null,
          std_adg_gpd: std.std_adg_gpd ? Number(std.std_adg_gpd) : null,
          feed_qty_per_head_per_day_kg: std.feed_qty_per_head_per_day_kg ? Number(std.feed_qty_per_head_per_day_kg) : null,
          std_fcr: std.std_fcr ? Number(std.std_fcr) : null,
          std_mortality_rate_pct: std.std_mortality_rate_pct ? Number(std.std_mortality_rate_pct) : null,
        };
      }
    }

    const lines = activeLines.map(({ spl, parameter }) => {
      const alreadyEntered = sameDayTx
        .filter((t) => t.transaction_type === parameter.parameter_type
          && (parameter.item_id ? t.item_id === parameter.item_id : true)
          && (parameter.resource_id ? t.resource_id === parameter.resource_id : true))
        .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

      const it = parameter.item_id ? itemMap.get(parameter.item_id) : null;
      let category = 'GENERAL';
      const pType = parameter.parameter_type;
      const pName = (parameter.parameter_name || '').toUpperCase();
      if (pType === 'CONSUMPTION') {
        if (pName.includes('FEED') || pName.includes('STARTER') || pName.includes('GROWER') || pName.includes('FINISHER') || pName.includes('CREEP') || pName.includes('GESTATION') || pName.includes('LACTATION')) {
          category = 'FEED';
        } else if (pName.includes('VACCINE') || pName.includes('VACCINATION')) {
          category = 'VACCINE';
        } else if (pName.includes('MEDICINE') || pName.includes('ANTIBIOTIC') || pName.includes('DEWORM')) {
          category = 'MEDICINE';
        } else {
          category = 'FEED';
        }
      } else if (pType === 'OBSERVATION') {
        if (pName.includes('WEIGHT') || pName.includes('ADG')) {
          category = 'WEIGHT';
        } else if (pName.includes('PREGNANCY') || pName.includes('SCAN') || pName.includes('HEAT')) {
          category = 'SCAN';
        } else {
          category = 'OBSERVATION';
        }
      } else if (pType === 'MORTALITY') {
        category = 'MORTALITY';
      } else if (pType === 'OVERHEAD') {
        category = 'OVERHEAD';
      } else if (pType === 'OUTPUT') {
        category = 'OUTPUT';
      } else if (pType === 'RESOURCE') {
        category = 'RESOURCE';
      } else if (pType === 'TRANSFER') {
        category = 'TRANSFER';
      }

      return {
        spl_id: spl.spl_id,
        parameter_id: parameter.parameter_id,
        parameter_type: parameter.parameter_type,
        line_type: spl.line_type || parameter.parameter_type,
        parameter_name: spl.parameter_name || parameter.parameter_name,
        category,
        item_id: spl.item_id || parameter.item_id,
        item_code: it?.item_code || null,
        item_name: spl.item_description || it?.item_name || null,
        item_label: itemLabel(spl.item_id || parameter.item_id),
        standard_cost: it?.standard_cost ? Number(it.standard_cost) : (spl.estimated_cost ? Number(spl.estimated_cost) : null),
        estimated_cost: spl.estimated_cost ? Number(spl.estimated_cost) : null,
        resource_id: spl.resource_id || parameter.resource_id,
        resource_name: spl.resource_name || null,
        uom: spl.uom_override || spl.uom || parameter.default_uom || 'KG',
        occurrence: spl.occurrence,
        period_label: spl.period_label,
        withdrawal_days: spl.withdrawal_days,
        transfer_qty_basis: spl.transfer_qty_basis,
        auto_triggers_stage: spl.auto_triggers_stage,
        to_batch_id: spl.to_batch_id,
        to_location_id: spl.to_location_id,
        expected_qty: this.computeExpectedQty(spl, parameter, openingQty),
        already_entered_qty: alreadyEntered,
        kpi_enabled: spl.kpi_enabled,
        kpi_target_value: spl.kpi_target_value ? Number(spl.kpi_target_value) : null,
        kpi_min_pct: spl.kpi_min_pct ? Number(spl.kpi_min_pct) : null,
        kpi_max_pct: spl.kpi_max_pct ? Number(spl.kpi_max_pct) : null,
        kpi_min_value: spl.kpi_min_value ? Number(spl.kpi_min_value) : null,
        kpi_max_value: spl.kpi_max_value ? Number(spl.kpi_max_value) : null,
        critical_threshold_pct: spl.critical_threshold_pct ? Number(spl.critical_threshold_pct) : null,
      };
    });

    let draft: unknown = null;
    try {
      const [draftRow] = await this.db
        .select()
        .from(schema.batchDailyEntryDraft)
        .where(
          and(
            eq(schema.batchDailyEntryDraft.batch_id, id),
            eq(schema.batchDailyEntryDraft.entry_date, dateStr)
          )
        )
        .limit(1);
      if (draftRow) {
        draft = draftRow.payload;
      }
    } catch {}

    return {
      date: dateStr,
      day_of_batch: dayOfBatch,
      daily_standards: dailyStandards,
      lines,
      same_day_transactions: sameDayTx,
      draft,
      bio_asset_state: batch.bio_asset_state || null,
    };
  }

  /**
   * Unified Daily Operations Entry: records multi-block operational logs
   * (feed consumption, medicine, mortality, weight, checkpoints, overheads)
   * in an integrated workflow.
   */
  async postDailyEntry(id: string, dto: SingleBatchDailyEntryDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');

    // Helper to resolve a valid item_id
    const resolveItemId = async (itemId?: string, parameterId?: string): Promise<string | null> => {
      if (itemId) {
        const [found] = await this.db.select({ id: schema.itemMaster.item_id }).from(schema.itemMaster).where(eq(schema.itemMaster.item_id, itemId)).limit(1);
        if (found) return found.id;
      }
      if (parameterId) {
        const [param] = await this.db.select({ item_id: schema.parameterMaster.item_id }).from(schema.parameterMaster).where(eq(schema.parameterMaster.parameter_id, parameterId)).limit(1);
        if (param?.item_id) return param.item_id;
      }
      return null;
    };

    // 1. Process Feed Lines
    if (dto.feed_lines && dto.feed_lines.length > 0) {
      for (const line of dto.feed_lines) {
        if (!line.quantity || Number(line.quantity) <= 0) continue;
        const validItemId = await resolveItemId(line.item_id, line.parameter_id);
        if (validItemId) {
          await this.addTransaction(
            id,
            {
              transaction_date: dto.date,
              transaction_type: 'CONSUMPTION',
              item_id: validItemId,
              quantity: Number(line.quantity),
              uom: line.uom || 'KG',
              rate: line.rate ? Number(line.rate) : undefined,
              remarks: line.lot_no ? `Lot: ${line.lot_no}` : undefined,
              spl_id: line.spl_id,
              parameter_id: line.parameter_id,
              lot_id: line.location_lot_id,
              animal_id: line.animal_id,
            },
            tenantId,
            userPayload
          );
        } else {
          // Record as OBSERVATION log so operational data is safely preserved
          await this.addTransaction(
            id,
            {
              transaction_date: dto.date,
              transaction_type: 'OBSERVATION',
              quantity: Number(line.quantity),
              uom: line.uom || 'KG',
              remarks: `Feed Consumption: ${line.quantity} ${line.uom || 'KG'}${line.lot_no ? ` (Lot: ${line.lot_no})` : ''}`,
              lot_id: line.location_lot_id,
              animal_id: line.animal_id,
            },
            tenantId,
            userPayload
          );
        }
      }
    }

    // 2. Process Medicine Lines
    if (dto.medicine_lines && dto.medicine_lines.length > 0) {
      for (const line of dto.medicine_lines) {
        if (!line.quantity || Number(line.quantity) <= 0) continue;
        const validItemId = await resolveItemId(line.item_id, line.parameter_id);
        const remarksList = [line.lot_no ? `Lot: ${line.lot_no}` : '', line.remarks || ''].filter(Boolean);
        if (validItemId) {
          await this.addTransaction(
            id,
            {
              transaction_date: dto.date,
              transaction_type: 'CONSUMPTION',
              item_id: validItemId,
              quantity: Number(line.quantity),
              uom: line.uom || 'DOSES',
              rate: line.rate ? Number(line.rate) : undefined,
              remarks: remarksList.length > 0 ? remarksList.join(' - ') : undefined,
              spl_id: line.spl_id,
              parameter_id: line.parameter_id,
              lot_id: line.location_lot_id,
              animal_id: line.animal_id,
            },
            tenantId,
            userPayload
          );
        } else {
          await this.addTransaction(
            id,
            {
              transaction_date: dto.date,
              transaction_type: 'OBSERVATION',
              quantity: Number(line.quantity),
              uom: line.uom || 'DOSES',
              remarks: `Medicine/Vaccine administration: ${line.quantity} ${line.uom || 'DOSES'}${remarksList.length > 0 ? ` (${remarksList.join(' - ')})` : ''}`,
              lot_id: line.location_lot_id,
              animal_id: line.animal_id,
            },
            tenantId,
            userPayload
          );
        }
      }
    }

    // 3. Process Weight Observation
    if (dto.weight && dto.weight.avg_weight && Number(dto.weight.avg_weight) > 0) {
      const notes = [
        `Avg Weight: ${dto.weight.avg_weight} kg`,
        dto.weight.daily_gain_gpd ? `ADG: ${dto.weight.daily_gain_gpd} g/d` : '',
        dto.weight.bcs_score ? `BCS: ${dto.weight.bcs_score}` : '',
        dto.weight.head_count ? `Headcount: ${dto.weight.head_count}` : '',
        dto.weight.remarks || '',
      ].filter(Boolean).join(' | ');

      await this.addTransaction(
        id,
        {
          transaction_date: dto.date,
          transaction_type: 'OBSERVATION',
          quantity: Number(dto.weight.avg_weight),
          uom: 'KG',
          remarks: notes,
        },
        tenantId,
        userPayload
      );
    }

    // 4. Process Mortality Lines
    if (dto.mortality_lines && dto.mortality_lines.length > 0) {
      for (const mort of dto.mortality_lines) {
        if (!mort.quantity || Number(mort.quantity) <= 0) continue;
        const notes = [mort.reason ? `Reason: ${mort.reason}` : '', mort.remarks || ''].filter(Boolean).join(' - ');
        await this.addTransaction(
          id,
          {
            transaction_date: dto.date,
            transaction_type: 'MORTALITY',
            quantity: Number(mort.quantity),
            remarks: notes || undefined,
            spl_id: mort.spl_id,
            lot_id: mort.location_lot_id,
            animal_id: mort.animal_id,
          },
          tenantId,
          userPayload
        );
      }
    }

    // 5. Process Checkpoint Decision
    if (dto.checkpoint_decision && dto.checkpoint_decision.decision) {
      const dec = dto.checkpoint_decision;
      const notes = `Checkpoint [${dec.checkpoint_type || 'SCAN'}]: ${dec.decision} (Confirmed: ${dec.confirmed_count || 0}, Repeat: ${dec.repeat_count || 0}, Failed: ${dec.failed_count || 0})${dec.remarks ? ` — ${dec.remarks}` : ''}`;
      await this.addTransaction(
        id,
        {
          transaction_date: dto.date,
          transaction_type: 'OBSERVATION',
          remarks: notes,
        },
        tenantId,
        userPayload
      );
    }

    // 7. Process Output Harvest Lines (Live Born Piglets, Weaned Piglets, Market Porkers)
    if (dto.output_lines && dto.output_lines.length > 0) {
      for (const line of dto.output_lines) {
        if (!line.quantity || Number(line.quantity) <= 0) continue;
        const validItemId = await resolveItemId(line.item_id, line.parameter_id);
        const notes = [
          line.output_type ? `Type: ${line.output_type}` : '',
          line.avg_weight ? `Avg Weight: ${line.avg_weight} kg` : '',
          line.remarks || '',
        ].filter(Boolean).join(' - ');

        await this.addTransaction(
          id,
          {
            transaction_date: dto.date,
            transaction_type: 'OUTPUT',
            item_id: validItemId || undefined,
            quantity: Number(line.quantity),
            uom: line.uom || 'HEAD',
            rate: line.rate ? Number(line.rate) : undefined,
            remarks: notes || (validItemId ? undefined : `Output yield: ${line.item_name || 'Produced items'} (${line.quantity} ${line.uom || 'HEAD'})`),
            spl_id: line.spl_id,
            parameter_id: line.parameter_id,
            output_type: line.output_type || 'MAIN',
            lot_id: line.location_lot_id,
          },
          tenantId,
          userPayload
        );
      }
    }

    // 8. Process Resource / Labour Lines
    if (dto.resource_lines && dto.resource_lines.length > 0) {
      for (const res of dto.resource_lines) {
        if (!res.quantity || Number(res.quantity) <= 0) continue;
        await this.addTransaction(
          id,
          {
            transaction_date: dto.date,
            transaction_type: 'OVERHEAD',
            resource_id: res.resource_id,
            parameter_id: res.parameter_id,
            quantity: Number(res.quantity),
            rate: res.rate ? Number(res.rate) : undefined,
            uom: res.uom || 'HOURS',
            remarks: res.resource_name || res.remarks || 'Labour & Attendant Care',
            spl_id: res.spl_id,
          },
          tenantId,
          userPayload
        );
      }
    }

    // 9. Process Stage Batch Transfer
    if (dto.transfer && dto.transfer.head_count && Number(dto.transfer.head_count) > 0) {
      await this.addTransaction(
        id,
        {
          transaction_date: dto.date,
          transaction_type: 'TRANSFER',
          quantity: Number(dto.transfer.head_count),
          uom: 'HEAD',
          remarks: `Stage Transfer: ${dto.transfer.head_count} head${dto.transfer.to_stage_code ? ` to ${dto.transfer.to_stage_code}` : ''}${dto.transfer.remarks ? ` — ${dto.transfer.remarks}` : ''}`,
          lot_id: dto.transfer.location_lot_id,
        },
        tenantId,
        userPayload
      );

      if (dto.transfer.auto_triggers_stage && dto.transfer.to_stage_code) {
        await this.transferStage(
          id,
          {
            to_stage_code: dto.transfer.to_stage_code,
            to_location_id: dto.transfer.to_location_id,
            lot_id: dto.transfer.location_lot_id,
            remarks: dto.transfer.remarks || `Auto-triggered via daily data entry transfer on ${dto.date}`,
          },
          tenantId,
          userPayload
        );
      }
    }

    // Auto-discard any draft for this date upon successful posting
    try {
      await this.deleteDailyEntryDraft(id, dto.date);
    } catch {}

    // A posted day is no longer a draft — without this, the draft row for this date
    // lingers and GET /data-entry keeps reporting it as in-progress even after the
    // entries are fully committed to the ledger/GL.
    await this.deleteDailyEntryDraft(id, dto.date);

    return this.findOne(id);
  }

  /**
   * Save / update a draft daily entry sheet without committing ledger or inventory movements
   */
  async saveDailyEntryDraft(batchId: string, payload: any, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(batchId);
    const dateStr = payload.date || new Date().toISOString().slice(0, 10);
    const existing = await this.db
      .select()
      .from(schema.batchDailyEntryDraft)
      .where(
        and(
          eq(schema.batchDailyEntryDraft.batch_id, batchId),
          eq(schema.batchDailyEntryDraft.entry_date, dateStr)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await this.db
        .update(schema.batchDailyEntryDraft)
        .set({
          payload,
          updated_at: new Date().toISOString(),
          created_by: userPayload?.userId || undefined,
        })
        .where(eq(schema.batchDailyEntryDraft.draft_id, existing[0].draft_id));
      return { draft_id: existing[0].draft_id, message: 'Draft updated successfully.' };
    } else {
      const draftId = randomUUID();
      await this.db.insert(schema.batchDailyEntryDraft).values({
        draft_id: draftId,
        tenant_id: tenantId,
        company_id: batch.company_id,
        batch_id: batchId,
        entry_date: dateStr,
        payload,
        created_by: userPayload?.userId || null,
      });
      return { draft_id: draftId, message: 'Draft saved successfully.' };
    }
  }

  /**
   * Retrieve a saved draft daily entry sheet
   */
  async getDailyEntryDraft(batchId: string, dateStr: string) {
    const [draftRow] = await this.db
      .select()
      .from(schema.batchDailyEntryDraft)
      .where(
        and(
          eq(schema.batchDailyEntryDraft.batch_id, batchId),
          eq(schema.batchDailyEntryDraft.entry_date, dateStr)
        )
      )
      .limit(1);

    return draftRow ? { exists: true, draft: draftRow.payload } : { exists: false, draft: null };
  }

  /**
   * Delete / discard a saved draft daily entry sheet
   */
  async deleteDailyEntryDraft(batchId: string, dateStr: string) {
    await this.db
      .delete(schema.batchDailyEntryDraft)
      .where(
        and(
          eq(schema.batchDailyEntryDraft.batch_id, batchId),
          eq(schema.batchDailyEntryDraft.entry_date, dateStr)
        )
      );
    return { success: true, message: 'Draft discarded successfully.' };
  }

  /**
   * Assign individual registered animals to a batch
   */
  async assignAnimalsToBatch(batchId: string, animalIds: string[], tenantId: string, userPayload?: any, lotId?: string) {
    const batch = await this.findOne(batchId);
    if (!animalIds || animalIds.length === 0) {
      throw new BadRequestException('No animal IDs provided for assignment.');
    }

    let lot: typeof schema.batchLocationLot.$inferSelect | undefined;
    if (lotId) {
      [lot] = await this.db.select().from(schema.batchLocationLot).where(and(eq(schema.batchLocationLot.lot_id, lotId), eq(schema.batchLocationLot.batch_id, batchId))).limit(1);
      if (!lot) {
        throw new NotFoundException(`Lot '${lotId}' not found on this batch.`);
      }
    }

    for (const animalId of animalIds) {
      await this.db
        .update(schema.animalRegister)
        .set({
          current_batch_id: batchId,
          current_stage_id: lot?.stage_id ?? batch.stage_id ?? null,
          current_lot_id: lot?.lot_id ?? null,
          // batch.shed_id is a shed_master row — a different table from location_master,
          // which is what current_location_id's FK actually points to. Falling back to
          // it here would write a shed's UUID into a location-scoped column and trip
          // the FK constraint (as it did). Leave it unset unless a real location is
          // known (via the lot or the batch's own location_id).
          current_location_id: lot?.location_id ?? batch.location_id ?? null,
          updated_by: userPayload?.userId || null,
        })
        .where(
          and(
            eq(schema.animalRegister.animal_id, animalId),
            eq(schema.animalRegister.tenant_id, tenantId)
          )
        );
    }

    const assignedCount = await this.db
      .select()
      .from(schema.animalRegister)
      .where(
        and(
          eq(schema.animalRegister.current_batch_id, batchId),
          eq(schema.animalRegister.is_active, true)
        )
      );

    return { assigned: animalIds.length, total_assigned: assignedCount.length };
  }

  /**
   * Unassign animals from a batch
   */
  async unassignAnimalsFromBatch(batchId: string, animalIds: string[], tenantId: string, userPayload?: any) {
    if (!animalIds || animalIds.length === 0) {
      throw new BadRequestException('No animal IDs provided for unassignment.');
    }

    for (const animalId of animalIds) {
      await this.db
        .update(schema.animalRegister)
        .set({
          current_batch_id: null,
          updated_by: userPayload?.userId || null,
        })
        .where(
          and(
            eq(schema.animalRegister.animal_id, animalId),
            eq(schema.animalRegister.tenant_id, tenantId)
          )
        );
    }

    return { unassigned: animalIds.length };
  }

  /**
   * Bulk register and assign animals via list of ear/RFID tags
   */
  async bulkRegisterAnimalsToBatch(
    batchId: string,
    dto: { tags: string[]; breed_id?: string; animal_type?: string; gender?: string },
    tenantId: string,
    userPayload?: any
  ) {
    const batch = await this.findOne(batchId);
    const tags = (dto.tags || []).map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      throw new BadRequestException('No ear tags or RFID tags provided.');
    }

    const breedId = dto.breed_id || batch.breed_id;
    if (!breedId) {
      throw new BadRequestException('Unable to resolve a breed for bulk animal registration — provide breed_id or ensure the batch has one configured.');
    }
    const animalType = dto.animal_type || (batch.costing_method === 'BIO_ASSET' ? 'SOW' : 'PORKER');
    const gender = dto.gender || (animalType === 'SOW' ? 'F' : 'M');

    // Get default item
    const [defItem] = await this.db.select({ item_id: schema.itemMaster.item_id }).from(schema.itemMaster).limit(1);

    const createdAnimals: string[] = [];
    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const anmId = randomUUID();
      const code = `PIG-${Date.now().toString().slice(-4)}-${String(i + 1).padStart(3, '0')}`;
      await this.db.insert(schema.animalRegister).values({
        animal_id: anmId,
        tenant_id: tenantId,
        company_id: batch.company_id,
        nob_id: batch.nob_id || '50000000-5000-5000-5000-000000000002',
        lob_id: batch.lob_id,
        animal_code: code,
        animal_type: animalType,
        breed_id: breedId,
        gender: gender,
        dob: '2025-06-01',
        entry_type: 'BORN_ON_FARM',
        entry_date: batch.start_date,
        item_id: defItem?.item_id || randomUUID(),
        ear_tag: tag.startsWith('ET-') ? tag : `ET-${tag}`,
        rfid_tag: tag.startsWith('982') ? tag : `98200041${Date.now().toString().slice(-4)}${String(i + 1).padStart(3, '0')}`,
        acquisition_cost: '25000.00',
        total_opening_asset_value: '25000.00',
        current_bio_asset_value: '25000.00',
        current_stage_id: batch.stage_id || null,
        current_batch_id: batchId,
        status: 'ACTIVE',
        is_active: true,
        created_by: userPayload?.userId || null,
      });
      createdAnimals.push(anmId);
    }

    return { registered_count: createdAnimals.length, animal_ids: createdAnimals };
  }

  async close(id: string, dto: CloseBatchDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');
    if (batch.costing_method === 'BIO_ASSET') {
      throw new BadRequestException(
        "BIO_ASSET batches don't close via this action — use the dispose endpoint to exit animals from the herd; the batch closes automatically once the herd is fully disposed."
      );
    }

    const totalSplitPct = dto.output_lines.reduce((sum, l) => sum + l.cost_split_pct, 0);
    if (Math.abs(totalSplitPct - 100) > 0.01) {
      throw new BadRequestException(`Output line cost_split_pct must sum to 100 (got ${totalSplitPct}).`);
    }

    const inputTotal = (batch.input_lines || []).reduce((sum, l) => sum + Number(l.amount || 0), 0);
    // MORTALITY is deliberately excluded here — it's already expensed and relieved
    // from WIP the moment it's recorded (see addTransaction()'s postBatchCostEntry
    // for 'MORTALITY'). Including it again here would double-count the write-off
    // into the surviving output's valuation. Mid-batch BY_PRODUCT/WASTE outputs
    // are excluded the same way — they're already relieved from WIP when recorded.
    const costTransactions = (batch.transactions || []).filter(
      (t) => t.transaction_type === 'CONSUMPTION' || t.transaction_type === 'OVERHEAD'
    );
    const transactionTotal = costTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const totalCost = inputTotal + transactionTotal;

    const closingQuantity = dto.closing_quantity ?? Number(batch.opening_quantity);
    const actualEndDate = dto.actual_end_date || toMysqlTimestamp().slice(0, 10);

    let standard: typeof schema.batchStandard.$inferSelect | undefined;
    if (batch.costing_method === 'STANDARD') {
      [standard] = await this.db.select().from(schema.batchStandard).where(eq(schema.batchStandard.batch_id, id)).limit(1);
    }
    // STANDARD batches with a locked output rate value their output at that
    // rate, not a proportional split of actual cost — this is what makes the
    // variance postings below a real reconciliation (actual cost in = std
    // value out + variances), not a non-binding side report. FIFO batches,
    // and STANDARD batches that never set up standard assumptions, keep the
    // original actual-cost-proportional-split — matching the spec's own
    // "FIFO: no variance, layered cost IS the batch cost" rule.
    const stdOutputCostPerUnit = standard?.std_output_cost_per_unit ? Number(standard.std_output_cost_per_unit) : null;

    let sumOfOutputValues = 0;
    const outputValuations = dto.output_lines.map((line) => {
      const computedCost = stdOutputCostPerUnit !== null
        ? stdOutputCostPerUnit * line.quantity
        : (totalCost * line.cost_split_pct) / 100;
      sumOfOutputValues += computedCost;
      return { line, computedCost, unitCost: line.quantity > 0 ? computedCost / line.quantity : 0 };
    });

    // Pre-compute variance lines (pure calculation, no writes) so the
    // reconciliation check below can run BEFORE anything is posted — a batch
    // that doesn't reconcile is rejected outright, nothing gets written.
    const varianceLines = standard ? await this.computeVarianceLines(id, batch, standard, closingQuantity, actualEndDate) : [];

    if (stdOutputCostPerUnit !== null) {
      const sumOfVariances = varianceLines.reduce((sum, v) => sum + v.variance_amount, 0);
      const residual = totalCost - sumOfOutputValues - sumOfVariances;
      if (Math.abs(residual) > 0.01) {
        throw new BadRequestException(
          `Batch cannot close — cost does not reconcile (₹${residual.toFixed(2)} unaccounted for). ` +
          `This usually means a consumption transaction has no matching standard-cost line, or a standard rate is unset for an item that was consumed. Review the batch's transactions before retrying.`
        );
      }
    }

    for (const { line, computedCost, unitCost } of outputValuations) {
      const ledgerEntry = await this.ledgerService.writePositiveEntry({
        tenantId,
        companyId: batch.company_id,
        itemId: line.item_id,
        documentType: 'BATCH',
        documentNo: batch.batch_no,
        postingDate: actualEndDate,
        transactionType: 'BATCH_OUTPUT',
        quantity: line.quantity,
        uom: line.uom,
        rate: unitCost,
        batchNo: batch.batch_no,
        warehouseId: line.warehouse_id,
        userId: userPayload?.userId,
      });
      await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);

      await this.db.insert(schema.batchOutputLine).values({
        line_id: randomUUID(),
        batch_id: id,
        item_id: line.item_id,
        output_type: line.output_type || 'MAIN',
        cost_split_pct: line.cost_split_pct.toString(),
        quantity: line.quantity.toString(),
        uom: line.uom,
        computed_cost: computedCost.toString(),
        unit_cost: unitCost.toString(),
        warehouse_id: line.warehouse_id,
      });
    }

    const unitCost = closingQuantity > 0 ? totalCost / closingQuantity : 0;

    await this.db
      .update(schema.batchHeader)
      .set({
        status: 'CLOSED',
        actual_end_date: actualEndDate,
        closing_quantity: closingQuantity.toString(),
        total_cost: totalCost.toString(),
        unit_cost: unitCost.toString(),
        closed_at: toMysqlTimestamp() as any,
        closed_by: userPayload?.userId || null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.batchHeader.batch_id, id));

    if (varianceLines.length > 0) {
      await this.postVarianceLines(id, batch, varianceLines, actualEndDate, tenantId, userPayload);
    }

    await this.syncSchedulerLock(batch.scheduler_id);

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'CLOSE',
      entityName: 'batch_header',
      entityId: id,
      newValues: { status: 'CLOSED', total_cost: totalCost, unit_cost: unitCost },
    });

    return this.findOne(id);
  }

  /**
   * Standard-costing only. Compares actuals against batch_standard /
   * batch_standard_consumption_line and returns the resulting variance lines
   * — pure calculation, no journal/DB writes. close() uses this twice: once
   * to reconcile WIP before committing anything, then (only if that check
   * passes) to actually post via postVarianceLines().
   */
  private async computeVarianceLines(
    id: string,
    batch: Awaited<ReturnType<BatchService['findOne']>>,
    standard: typeof schema.batchStandard.$inferSelect,
    closingQuantity: number,
    actualEndDate: string
  ): Promise<Array<{ variance_type: string; item_id: string | null; std_value: number; actual_value: number; variance_amount: number }>> {
    const standardLines = await this.db
      .select()
      .from(schema.batchStandardConsumptionLine)
      .where(eq(schema.batchStandardConsumptionLine.batch_id, id));

    const startDate = new Date(batch.start_date);
    const endDate = new Date(actualEndDate);
    const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const openingQty = Number(batch.opening_quantity);

    const lines: Array<{ variance_type: string; item_id: string | null; std_value: number; actual_value: number; variance_amount: number }> = [];

    if (standardLines.length > 0) {
      const consumptionByItem = new Map<string, { qty: number; amount: number }>();
      for (const t of batch.transactions || []) {
        if (t.transaction_type !== 'CONSUMPTION' || !t.item_id) continue;
        const entry = consumptionByItem.get(t.item_id) || { qty: 0, amount: 0 };
        entry.qty += Number(t.quantity || 0);
        entry.amount += Math.abs(Number(t.amount || 0));
        consumptionByItem.set(t.item_id, entry);
      }

      for (const stdLine of standardLines) {
        const actual = consumptionByItem.get(stdLine.item_id);
        if (!actual || actual.qty <= 0) continue;

        let stdRate = stdLine.std_rate ? Number(stdLine.std_rate) : null;
        if (stdRate === null) {
          const [item] = await this.db.select().from(schema.itemMaster).where(eq(schema.itemMaster.item_id, stdLine.item_id)).limit(1);
          stdRate = item?.standard_cost ? Number(item.standard_cost) : null;
        }
        if (stdRate === null) continue;

        const actualRate = actual.amount / actual.qty;
        const stdQty = Number(stdLine.std_qty_per_unit_per_day) * openingQty * durationDays;

        const priceVar = (actualRate - stdRate) * actual.qty;
        const usageVar = (actual.qty - stdQty) * stdRate;

        if (Math.abs(priceVar) > 0.005) {
          lines.push({ variance_type: 'PRICE', item_id: stdLine.item_id, std_value: stdRate, actual_value: actualRate, variance_amount: priceVar });
        }
        if (Math.abs(usageVar) > 0.005) {
          lines.push({ variance_type: 'USAGE', item_id: stdLine.item_id, std_value: stdQty, actual_value: actual.qty, variance_amount: usageVar });
        }
      }
    }

    if (standard.std_output_cost_per_unit && standard.std_output_quantity) {
      const stdOutputQty = Number(standard.std_output_quantity);
      const stdOutputCost = Number(standard.std_output_cost_per_unit);
      const outputVar = (stdOutputQty - closingQuantity) * stdOutputCost;
      if (Math.abs(outputVar) > 0.005) {
        lines.push({ variance_type: 'OUTPUT', item_id: null, std_value: stdOutputQty, actual_value: closingQuantity, variance_amount: outputVar });
      }
    }

    if (standard.std_overhead_rate_per_unit) {
      const actualOverhead = (batch.transactions || [])
        .filter((t) => t.transaction_type === 'OVERHEAD')
        .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
      const stdOverhead = Number(standard.std_overhead_rate_per_unit) * closingQuantity;
      const overheadVar = actualOverhead - stdOverhead;
      if (Math.abs(overheadVar) > 0.005) {
        lines.push({ variance_type: 'OVERHEAD', item_id: null, std_value: stdOverhead, actual_value: actualOverhead, variance_amount: overheadVar });
      }
    }

    return lines;
  }

  private async postVarianceLines(
    id: string,
    batch: Awaited<ReturnType<BatchService['findOne']>>,
    lines: Array<{ variance_type: string; item_id: string | null; std_value: number; actual_value: number; variance_amount: number }>,
    actualEndDate: string,
    tenantId: string,
    userPayload?: any
  ) {
    for (const line of lines) {
      const isFavorable = line.variance_amount < 0;
      const journal: any = await this.glPostingService.postBatchCostEntry({
        tenantId,
        companyId: batch.company_id,
        transactionType: `${line.variance_type}_VARIANCE`,
        amount: Math.abs(line.variance_amount),
        documentNo: batch.batch_no,
        postingDate: actualEndDate,
        description: `${line.variance_type} Variance — ${batch.batch_no}`,
        nobId: batch.nob_id || undefined,
        lobId: batch.lob_id,
        stageId: batch.stage_id || undefined,
        userId: userPayload?.userId,
        reverseDirection: isFavorable,
      });
      const drLine = journal.lines?.find((l: any) => Number(l.debit_amount) > 0);
      const crLine = journal.lines?.find((l: any) => Number(l.credit_amount) > 0);

      await this.db.insert(schema.batchCostVariance).values({
        variance_id: randomUUID(),
        batch_id: id,
        variance_type: line.variance_type,
        item_id: line.item_id,
        std_value: line.std_value.toString(),
        actual_value: line.actual_value.toString(),
        variance_amount: line.variance_amount.toString(),
        is_favorable: isFavorable,
        dr_gl_account_id: drLine?.gl_account_id || null,
        cr_gl_account_id: crLine?.gl_account_id || null,
        journal_id: journal.journal_id,
      });
    }
  }

  private async getBioAssetState(id: string) {
    const [bioState] = await this.db.select().from(schema.batchBioAssetState).where(eq(schema.batchBioAssetState.batch_id, id)).limit(1);
    if (!bioState) throw new NotFoundException('Bio-asset state not found for this batch.');
    return bioState;
  }

  private assertBioAsset(batch: { costing_method: string }, action: string) {
    if (batch.costing_method !== 'BIO_ASSET') {
      throw new BadRequestException(`${action} only applies to BIO_ASSET batches.`);
    }
  }

  /** PREMATURE → MATURE: reclassifies the NCA and sets up the amortization schedule. */
  async matureBioAsset(id: string, dto: MatureBioAssetDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');
    this.assertBioAsset(batch, 'Maturity transition');
    const bioState = await this.getBioAssetState(id);
    if (bioState.stage !== 'PREMATURE') {
      throw new BadRequestException(`Batch must be PREMATURE to mature — it is currently ${bioState.stage}.`);
    }

    let productiveLifeMonths = dto.productive_life_months;
    if (!productiveLifeMonths && batch.breed_id) {
      const [breed] = await this.db.select().from(schema.breedMaster).where(eq(schema.breedMaster.breed_id, batch.breed_id)).limit(1);
      productiveLifeMonths = breed?.productive_life_months ?? undefined;
    }
    if (!productiveLifeMonths) {
      throw new BadRequestException("productive_life_months is required (either on the request, or via the batch's breed).");
    }

    const currentQty = Number(bioState.current_quantity);
    const ncaValue = Number(bioState.nca_book_value);
    const residualTotal = dto.residual_value_per_unit * currentQty;
    // Stored per-unit (amortizeBioAsset multiplies by the *current* headcount at
    // each run, which correctly shrinks the monthly charge as mortality reduces
    // the surviving herd — storing a herd-total here instead double-counts
    // headcount and wipes the NCA out on the very first amortization run).
    const monthlyRate = currentQty > 0 ? (ncaValue - residualTotal) / productiveLifeMonths / currentQty : 0;
    if (monthlyRate < 0) {
      throw new BadRequestException('Residual value exceeds the current NCA book value — cannot compute a positive amortization rate.');
    }

    const maturedAt = toMysqlTimestamp().slice(0, 10);
    await this.glPostingService.postBatchCostEntry({
      tenantId,
      companyId: batch.company_id,
      transactionType: 'BIO_TRANSFORMATION',
      amount: ncaValue,
      documentNo: batch.batch_no,
      postingDate: maturedAt,
      description: `Maturity transition — ${batch.batch_no}`,
      nobId: batch.nob_id || undefined,
      lobId: batch.lob_id,
      stageId: batch.stage_id || undefined,
      userId: userPayload?.userId,
    });

    await this.db
      .update(schema.batchBioAssetState)
      .set({
        stage: 'MATURE',
        matured_at: maturedAt,
        monthly_amortization_rate: monthlyRate.toString(),
        residual_value_per_unit: dto.residual_value_per_unit.toString(),
        productive_life_months: productiveLifeMonths,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.batchBioAssetState.batch_id, id));

    await this.db.insert(schema.bioAssetLedger).values({
      entry_id: randomUUID(),
      tenant_id: tenantId,
      company_id: batch.company_id,
      bio_asset_item_id: batch.input_lines?.[0]?.item_id || '',
      entry_type: 'TRANSFORMATION',
      document_no: batch.batch_no,
      batch_id: id,
      batch_no: batch.batch_no,
      posting_date: maturedAt,
      stage: 'MATURE',
      quantity: currentQty.toString(),
      cost_amount: '0.0000',
      costing_method: 'AMORTIZED_COST',
      nob_id: batch.nob_id,
      lob_id: batch.lob_id,
      created_by: userPayload?.userId || null,
    });

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'MATURE',
      entityName: 'batch_bio_asset_state',
      entityId: id,
      newValues: { stage: 'MATURE', monthly_amortization_rate: monthlyRate },
    });

    return this.findOne(id);
  }

  /** Mature only. One run per calendar month — posts Dr Amort Expense / Cr Accum Amort and reduces the NCA. */
  async amortizeBioAsset(id: string, dto: AmortizeBioAssetDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');
    this.assertBioAsset(batch, 'Amortization');
    const bioState = await this.getBioAssetState(id);
    if (bioState.stage !== 'MATURE') {
      throw new BadRequestException('Batch must be MATURE before amortization can run.');
    }
    if (!bioState.monthly_amortization_rate) {
      throw new BadRequestException('No amortization rate set — mature the batch first.');
    }

    const period = dto.posting_date.slice(0, 7); // YYYY-MM
    const existingEntries = await this.db
      .select()
      .from(schema.bioAssetLedger)
      .where(and(eq(schema.bioAssetLedger.batch_id, id), eq(schema.bioAssetLedger.entry_type, 'AMORTIZATION')));
    if (existingEntries.some((e) => e.posting_date.slice(0, 7) === period)) {
      throw new BadRequestException(`Amortization has already been run for ${period}.`);
    }

    const currentQty = Number(bioState.current_quantity);
    const amount = Number(bioState.monthly_amortization_rate) * currentQty;

    await this.glPostingService.postBatchCostEntry({
      tenantId,
      companyId: batch.company_id,
      transactionType: 'BIO_AMORTIZATION',
      amount,
      documentNo: batch.batch_no,
      postingDate: dto.posting_date,
      description: `Amortization ${period} — ${batch.batch_no}`,
      nobId: batch.nob_id || undefined,
      lobId: batch.lob_id,
      stageId: batch.stage_id || undefined,
      userId: userPayload?.userId,
    });

    const newNca = Math.max(0, Number(bioState.nca_book_value) - amount);
    await this.db
      .update(schema.batchBioAssetState)
      .set({ nca_book_value: newNca.toString(), updated_at: toMysqlTimestamp() })
      .where(eq(schema.batchBioAssetState.batch_id, id));

    await this.db.insert(schema.bioAssetLedger).values({
      entry_id: randomUUID(),
      tenant_id: tenantId,
      company_id: batch.company_id,
      bio_asset_item_id: batch.input_lines?.[0]?.item_id || '',
      entry_type: 'AMORTIZATION',
      document_no: batch.batch_no,
      batch_id: id,
      batch_no: batch.batch_no,
      posting_date: dto.posting_date,
      stage: 'MATURE',
      quantity: currentQty.toString(),
      cost_amount: (-amount).toString(),
      costing_method: 'AMORTIZED_COST',
      nob_id: batch.nob_id,
      lob_id: batch.lob_id,
      created_by: userPayload?.userId || null,
    });

    return this.findOne(id);
  }

  /** Revalues the herd to a new fair value per unit — gain posts normally, loss reverses (mirrors Phase 7's variance direction). */
  async recordFairValue(id: string, dto: RecordFairValueDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');
    this.assertBioAsset(batch, 'Fair value adjustment');
    const bioState = await this.getBioAssetState(id);

    const currentQty = Number(bioState.current_quantity);
    if (currentQty <= 0) {
      throw new BadRequestException('No animals remain in this herd.');
    }
    const currentPerUnit = Number(bioState.nca_book_value) / currentQty;
    const gainLoss = (dto.fair_value_per_unit - currentPerUnit) * currentQty;

    if (Math.abs(gainLoss) < 0.005) {
      return this.findOne(id);
    }

    await this.glPostingService.postBatchCostEntry({
      tenantId,
      companyId: batch.company_id,
      transactionType: 'BIO_FAIR_VALUE',
      amount: Math.abs(gainLoss),
      documentNo: batch.batch_no,
      postingDate: dto.posting_date,
      description: `Fair value adjustment — ${batch.batch_no}`,
      nobId: batch.nob_id || undefined,
      lobId: batch.lob_id,
      stageId: batch.stage_id || undefined,
      userId: userPayload?.userId,
      reverseDirection: gainLoss < 0,
    });

    const newNca = Math.max(0, Number(bioState.nca_book_value) + gainLoss);
    await this.db
      .update(schema.batchBioAssetState)
      .set({ nca_book_value: newNca.toString(), updated_at: toMysqlTimestamp() })
      .where(eq(schema.batchBioAssetState.batch_id, id));

    await this.db.insert(schema.bioAssetLedger).values({
      entry_id: randomUUID(),
      tenant_id: tenantId,
      company_id: batch.company_id,
      bio_asset_item_id: batch.input_lines?.[0]?.item_id || '',
      entry_type: 'FAIR_VALUE_ADJMT',
      document_no: batch.batch_no,
      batch_id: id,
      batch_no: batch.batch_no,
      posting_date: dto.posting_date,
      stage: bioState.stage,
      quantity: currentQty.toString(),
      cost_amount: gainLoss.toString(),
      cost_amount_each_unit: dto.fair_value_per_unit.toString(),
      costing_method: 'FAIR_VALUE',
      nob_id: batch.nob_id,
      lob_id: batch.lob_id,
      created_by: userPayload?.userId || null,
    });

    return this.findOne(id);
  }

  /** Exits animals from the herd via harvest (NBV becomes the resulting inventory item's cost) or sale (proceeds vs. NBV = gain/loss). Auto-closes the batch once the herd is fully disposed. */
  async disposeBioAsset(id: string, dto: DisposeBioAssetDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');
    this.assertBioAsset(batch, 'Disposal');
    const bioState = await this.getBioAssetState(id);

    const currentQty = Number(bioState.current_quantity);
    if (dto.quantity <= 0 || dto.quantity > currentQty) {
      throw new BadRequestException(`Invalid disposal quantity — ${currentQty} remain in the herd.`);
    }

    const ncaBefore = Number(bioState.nca_book_value);
    const nbvDisposed = currentQty > 0 ? (ncaBefore / currentQty) * dto.quantity : 0;

    if (dto.disposal_type === 'HARVEST') {
      if (!dto.output_item_id || !dto.output_uom || !dto.output_quantity || !dto.warehouse_id) {
        throw new BadRequestException('HARVEST disposal requires output_item_id, output_uom, output_quantity and warehouse_id.');
      }
      const rate = dto.output_quantity > 0 ? nbvDisposed / dto.output_quantity : 0;
      const ledgerEntry = await this.ledgerService.writePositiveEntry({
        tenantId,
        companyId: batch.company_id,
        itemId: dto.output_item_id,
        documentType: 'BATCH',
        documentNo: batch.batch_no,
        postingDate: dto.posting_date,
        transactionType: 'BIO_HARVEST',
        quantity: dto.output_quantity,
        uom: dto.output_uom,
        rate,
        batchNo: batch.batch_no,
        warehouseId: dto.warehouse_id,
        userId: userPayload?.userId,
      });
      await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);
    } else {
      if (dto.sale_proceeds === undefined || dto.sale_proceeds === null) {
        throw new BadRequestException('SOLD disposal requires sale_proceeds.');
      }
      const gainLoss = dto.sale_proceeds - nbvDisposed;
      if (Math.abs(gainLoss) >= 0.005) {
        // Only the bio-asset-relief + gain/loss recognition posts here — no
        // Sales/AR module exists yet to hang the cash/receivable side off of.
        await this.glPostingService.postBatchCostEntry({
          tenantId,
          companyId: batch.company_id,
          transactionType: 'BIO_DISPOSAL_SOLD',
          amount: Math.abs(gainLoss),
          documentNo: batch.batch_no,
          postingDate: dto.posting_date,
          description: `Disposal (sold) — ${batch.batch_no}`,
          nobId: batch.nob_id || undefined,
          lobId: batch.lob_id,
          stageId: batch.stage_id || undefined,
          userId: userPayload?.userId,
          reverseDirection: gainLoss < 0,
        });
      }
    }

    const newQty = currentQty - dto.quantity;
    const newNca = Math.max(0, ncaBefore - nbvDisposed);
    await this.db
      .update(schema.batchBioAssetState)
      .set({ current_quantity: newQty.toString(), nca_book_value: newNca.toString(), updated_at: toMysqlTimestamp() })
      .where(eq(schema.batchBioAssetState.batch_id, id));

    await this.db.insert(schema.bioAssetLedger).values({
      entry_id: randomUUID(),
      tenant_id: tenantId,
      company_id: batch.company_id,
      bio_asset_item_id: batch.input_lines?.[0]?.item_id || '',
      entry_type: 'TRANSFORMATION',
      document_no: batch.batch_no,
      batch_id: id,
      batch_no: batch.batch_no,
      posting_date: dto.posting_date,
      stage: bioState.stage,
      quantity: (-dto.quantity).toString(),
      cost_amount: (-nbvDisposed).toString(),
      costing_method: bioState.stage === 'MATURE' ? 'AMORTIZED_COST' : 'COST_ACCUMULATION',
      nob_id: batch.nob_id,
      lob_id: batch.lob_id,
      created_by: userPayload?.userId || null,
    });

    let closedNow = false;
    if (newQty <= 0) {
      closedNow = true;
      await this.db
        .update(schema.batchHeader)
        .set({
          status: 'CLOSED',
          actual_end_date: dto.posting_date,
          closing_quantity: '0.0000',
          total_cost: newNca.toString(),
          unit_cost: '0.000000',
          closed_at: toMysqlTimestamp() as any,
          closed_by: userPayload?.userId || null,
          updated_by: userPayload?.userId || null,
          updated_at: toMysqlTimestamp(),
        })
        .where(eq(schema.batchHeader.batch_id, id));
      await this.syncSchedulerLock(batch.scheduler_id);
    }

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'DISPOSE',
      entityName: 'batch_bio_asset_state',
      entityId: id,
      newValues: { ...dto, closedNow },
    });

    return this.findOne(id);
  }

  async remove(id: string, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'DRAFT');
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.batchHeader)
      .set({ status: 'CANCELLED', deleted_at: deletedTime as any, updated_by: userPayload?.userId || null })
      .where(eq(schema.batchHeader.batch_id, id));

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'batch_header',
      entityId: id,
      oldValues: batch,
      newValues: { status: 'CANCELLED', deleted_at: deletedTime },
    });

    return { success: true, message: `Batch '${batch.batch_no}' has been cancelled.` };
  }

  async bulkAddDailyTransactions(dto: BulkDailyEntryDto, tenantId: string, userPayload?: any) {
    let successCount = 0;
    const errors: Array<{ batch_id: string; error: string }> = [];

    // Cache active feed items for fallback resolution
    let feedItems: any[] = [];
    try {
      const q = this.db?.select?.();
      if (q?.from) {
        feedItems = await q
          .from(schema.itemMaster)
          .where(and(eq(schema.itemMaster.tenant_id, tenantId), eq(schema.itemMaster.is_active, true)));
      }
    } catch {
      feedItems = [];
    }

    for (const row of dto.entries) {
      try {
        let batch: any;
        try {
          batch = await this.findOne(row.batch_id);
        } catch {
          batch = { batch_id: row.batch_id, opening_quantity: 1 };
        }

        // 1. Feed Consumption
        if (row.feed_qty != null && Number(row.feed_qty) > 0) {
          let feedItemId = row.feed_item_id;
          if (!feedItemId) {
            if (batch.current_stage_code === 'DRY_SOW_GESTATION') {
              feedItemId = feedItems.find((i) => i.item_code.includes('GEST'))?.item_id;
            } else if (batch.current_stage_code === 'LACTATION' || batch.current_stage_code === 'FARROWING') {
              feedItemId = feedItems.find((i) => i.item_code.includes('CREEP') || i.item_code.includes('LACT'))?.item_id;
            } else {
              feedItemId = feedItems.find((i) => i.item_code.includes('WEAN') || i.item_code.includes('GROW') || i.item_code.includes('FIN'))?.item_id;
            }
            if (!feedItemId) {
              feedItemId = feedItems.find((i) => i.item_type === 'FEED')?.item_id || feedItems[0]?.item_id;
            }
          }

          await this.addTransaction(
            row.batch_id,
            {
              transaction_date: dto.entry_date,
              transaction_type: 'CONSUMPTION',
              item_id: feedItemId,
              quantity: Number(row.feed_qty),
              uom: 'KG',
              remarks: row.remarks || 'Daily feed log',
            },
            tenantId,
            userPayload
          );
          successCount++;
        }

        // 2. Mortality
        if (row.mortality_count != null && Number(row.mortality_count) > 0) {
          await this.addTransaction(
            row.batch_id,
            {
              transaction_date: dto.entry_date,
              transaction_type: 'MORTALITY',
              quantity: Number(row.mortality_count),
              uom: 'HEAD',
              remarks: row.remarks || 'Daily mortality log',
            },
            tenantId,
            userPayload
          );
          successCount++;
        }

        // 3. Water intake observation
        if (row.water_qty != null && Number(row.water_qty) > 0) {
          await this.addTransaction(
            row.batch_id,
            {
              transaction_date: dto.entry_date,
              transaction_type: 'OBSERVATION',
              quantity: Number(row.water_qty),
              uom: 'L',
              remarks: `Water Intake: ${row.water_qty} L`,
            },
            tenantId,
            userPayload
          );
          successCount++;
        }

        // 4. Shed temperature observation
        if (row.temperature != null && (row.temperature as any) !== '') {
          await this.addTransaction(
            row.batch_id,
            {
              transaction_date: dto.entry_date,
              transaction_type: 'OBSERVATION',
              quantity: Number(row.temperature),
              uom: '°C',
              remarks: `Shed Temperature: ${row.temperature}°C`,
            },
            tenantId,
            userPayload
          );
          successCount++;
        }

        // 5. Transfer Line (Scheduler 6th Line Type)
        if (row.transfer_count != null && Number(row.transfer_count) > 0) {
          const transferRemarks = row.remarks || (row.transfer_weight ? `Transfer ${row.transfer_count} heads (${row.transfer_weight} kg)` : `Transfer ${row.transfer_count} heads`);
          await this.addTransaction(
            row.batch_id,
            {
              transaction_date: dto.entry_date,
              transaction_type: 'TRANSFER_OUT',
              quantity: Number(row.transfer_count),
              uom: 'HEAD',
              remarks: transferRemarks,
            },
            tenantId,
            userPayload
          );

          if (row.to_batch_id) {
            await this.addTransaction(
              row.to_batch_id,
              {
                transaction_date: dto.entry_date,
                transaction_type: 'TRANSFER_IN',
                quantity: Number(row.transfer_count),
                uom: 'HEAD',
                remarks: `Transfer in from ${batch.batch_no || row.batch_id}`,
              },
              tenantId,
              userPayload
            );
          }

          if (row.auto_triggers_stage && row.to_stage_code) {
            await this.transferStage(
              row.batch_id,
              {
                to_stage_code: row.to_stage_code,
                to_location_id: row.to_location_id,
                remarks: `Auto-transition on transfer log (${dto.entry_date})`,
              },
              tenantId,
              userPayload
            );
          }
          successCount++;
        }
      } catch (err: any) {
        errors.push({
          batch_id: row.batch_id,
          error: err?.message || 'Transaction recording failed',
        });
      }
    }

    if (errors.length > 0 && successCount === 0) {
      throw new BadRequestException(`Failed to record daily entries: ${errors.map((e) => e.error).join('; ')}`);
    }

    return {
      success: errors.length === 0,
      totalEntries: dto.entries.length,
      successCount,
      errorsCount: errors.length,
      errorCount: errors.length,
      errors,
    };
  }

  /**
   * Multi-Stage Schedulers Engine: Auto-generates dedicated scheduler_master records
   * and parameter lines for each lifecycle stage of the batch from breed standards & Stage Master.
   */
  async generateSchedulerForBatch(batchId: string, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(batchId);

    if (!batch.breed_id) {
      throw new BadRequestException('Batch must have a breed assigned to auto-generate schedulers from breed lifecycle standards.');
    }

    // 1. Fetch breed lifecycle stages and stage master records for this LOB
    const lifecycleRows = await this.db
      .select({
        lifecycle: schema.breedLifecycleStages,
        stage: schema.stageMaster,
      })
      .from(schema.breedLifecycleStages)
      .innerJoin(schema.stageMaster, eq(schema.breedLifecycleStages.stage_id, schema.stageMaster.stage_id))
      .where(
        and(
          eq(schema.breedLifecycleStages.breed_id, batch.breed_id),
          eq(schema.breedLifecycleStages.tenant_id, tenantId),
          eq(schema.breedLifecycleStages.is_active, true)
        )
      )
      .orderBy(schema.breedLifecycleStages.period_from);

    const stagesToGenerate: Array<{
      stage_id: string;
      stage_code: string;
      stage_name: string;
      duration_days: number;
      lifecycle?: typeof schema.breedLifecycleStages.$inferSelect;
    }> = [];

    if (lifecycleRows.length > 0) {
      for (const row of lifecycleRows) {
        const pDays = toDays(row.lifecycle.period_to - row.lifecycle.period_from + 1, row.lifecycle.calc_unit);
        stagesToGenerate.push({
          stage_id: row.stage.stage_id,
          stage_code: row.stage.stage_code,
          stage_name: row.stage.stage_name,
          duration_days: Math.max(1, pDays || row.stage.typical_duration_days || 30),
          lifecycle: row.lifecycle,
        });
      }
    } else {
      const lobStages = await this.db
        .select()
        .from(schema.stageMaster)
        .where(
          and(
            eq(schema.stageMaster.lob_id, batch.lob_id),
            eq(schema.stageMaster.is_active, true),
            isNull(schema.stageMaster.deleted_at)
          )
        )
        .orderBy(schema.stageMaster.stage_sequence);

      for (const stg of lobStages) {
        stagesToGenerate.push({
          stage_id: stg.stage_id,
          stage_code: stg.stage_code,
          stage_name: stg.stage_name,
          duration_days: stg.typical_duration_days || 30,
        });
      }
    }

    if (stagesToGenerate.length === 0) {
      throw new BadRequestException(`No lifecycle stages or stage master standards found for breed '${batch.breed_id}'.`);
    }

    // 2. Fetch existing or create fallback parameter_master records
    const existingParams = await this.db
      .select()
      .from(schema.parameterMaster)
      .where(
        and(
          eq(schema.parameterMaster.tenant_id, tenantId),
          eq(schema.parameterMaster.is_active, true)
        )
      );

    const findOrCreateParam = async (paramCode: string, paramName: string, paramType: string, defaultUom: string) => {
      let foundParam = existingParams.find(p => p.parameter_code === paramCode || (p.parameter_type === paramType && p.parameter_name === paramName));
      if (!foundParam) {
        const newId = randomUUID();
        await this.db.insert(schema.parameterMaster).values({
          parameter_id: newId,
          tenant_id: tenantId,
          nob_id: batch.nob_id,
          lob_id: batch.lob_id,
          parameter_code: paramCode,
          parameter_name: paramName,
          parameter_type: paramType,
          default_uom: defaultUom,
          qty_method: 'PER_UNIT',
          created_by: userPayload?.userId || null,
        });
        foundParam = {
          parameter_id: newId,
          tenant_id: tenantId,
          nob_id: batch.nob_id,
          lob_id: batch.lob_id,
          parameter_code: paramCode,
          parameter_name: paramName,
          parameter_type: paramType,
          default_uom: defaultUom,
          qty_method: 'PER_UNIT',
          created_by: userPayload?.userId || null,
          created_at: new Date().toISOString(),
          default_qty_per_unit: null,
          default_qty_per_batch: null,
          item_id: null,
          resource_id: null,
          company_id: null,
          description: null,
          is_mandatory: false,
          is_active: true,
        };
      }
      return foundParam;
    };

    const feedParam = await findOrCreateParam('FEED_STD', 'Daily Feed Consumption', 'CONSUMPTION', 'KG');
    const dewormParam = await findOrCreateParam('DEWORM_STD', 'Deworming Protocol', 'CONSUMPTION', 'DOSES');
    const pcv2Param = await findOrCreateParam('PCV2_STD', 'PCV2 Vaccination Protocol', 'CONSUMPTION', 'DOSES');
    const ironParam = await findOrCreateParam('IRON_STD', 'Iron Dextran 200mg Injection', 'CONSUMPTION', 'DOSES');
    const mortParam = await findOrCreateParam('MORT_STD', 'Daily Mortality Count', 'DESCRIPTIVE', 'HEAD');
    const headParam = await findOrCreateParam('HEAD_STD', 'Head Count Verification', 'DESCRIPTIVE', 'HEAD');
    const weightParam = await findOrCreateParam('WEIGHT_STD', 'Average Body Weight Target', 'DESCRIPTIVE', 'KG');
    const adgParam = await findOrCreateParam('ADG_STD', 'Average Daily Gain (ADG)', 'DESCRIPTIVE', 'G/DAY');
    const bcsParam = await findOrCreateParam('BCS_STD', 'Body Condition Score (BCS 1-5)', 'DESCRIPTIVE', 'SCORE');
    const scanParam = await findOrCreateParam('PREG_SCAN', 'Pregnancy Confirmation Ultrasound Scan', 'DESCRIPTIVE', 'CHECK');
    const tempParam = await findOrCreateParam('TEMP_STD', 'Barn Ambient Temperature', 'DESCRIPTIVE', 'CELSIUS');
    const waterParam = await findOrCreateParam('WATER_STD', 'Water Meter Reading', 'DESCRIPTIVE', 'LITRE');
    const electOverhead = await findOrCreateParam('OH_ELEC', 'Barn Electricity & Ventilation', 'OVERHEAD', 'MONTH');
    const waterOverhead = await findOrCreateParam('OH_WATER', 'Barn Water Supply & Misting', 'OVERHEAD', 'MONTH');
    const stockmanLabour = await findOrCreateParam('RES_STOCKMAN', 'Stockman Attendant Care', 'RESOURCE', 'HOURS');
    const vetLabour = await findOrCreateParam('RES_VET', 'Veterinary Health Inspection', 'RESOURCE', 'HOURS');
    const weanTransferParam = await findOrCreateParam('TRANS_WEAN', 'Transfer Weaned Piglets to Nursery Batch', 'TRANSFER', 'HEAD');
    const gestTransferParam = await findOrCreateParam('TRANS_FARR', 'Transfer Sows to Farrowing Crate', 'TRANSFER', 'HEAD');

    const animalCount = await this.getBatchHeadcount(batchId, tenantId);
    const currentStageCode = (batch.current_stage_code || 'DRY_SOW_GESTATION').toUpperCase();
    // scheduler_master.nob_id is a required FK; batch.nob_id is nullable, so fall back to
    // the same default system NOB sentinel used elsewhere (bulkRegisterAnimalsToBatch).
    const resolvedNobId = batch.nob_id || '50000000-5000-5000-5000-000000000002';

    let activeStageSchedulerId: string | null = null;

    // 3. Iterate each stage and create a dedicated scheduler_master & parameter lines
    for (const stageItem of stagesToGenerate) {
      const stageCode = stageItem.stage_code.toUpperCase();
      const schedulerCode = `SCHED-${batch.batch_no}-${stageCode}`;
      const isCurrentStage = currentStageCode === stageCode || (!batch.current_stage_code && stageCode === 'DRY_SOW_GESTATION');

      // Check if scheduler for this stage already exists
      const [existingSched] = await this.db
        .select()
        .from(schema.schedulerMaster)
        .where(
          and(
            eq(schema.schedulerMaster.tenant_id, tenantId),
            eq(schema.schedulerMaster.batch_id, batchId),
            eq(schema.schedulerMaster.stage_code, stageCode)
          )
        )
        .limit(1);

      const schedulerId = existingSched?.scheduler_id || randomUUID();
      const schedStatus = isCurrentStage ? 'ACTIVE' : 'PENDING';

      if (existingSched) {
        await this.db
          .update(schema.schedulerMaster)
          .set({
            stage_id: stageItem.stage_id,
            stage_name: stageItem.stage_name,
            duration_value: stageItem.duration_days,
            animal_count: animalCount.toString(),
            scheduler_status: schedStatus,
            updated_at: toMysqlTimestamp(),
          })
          .where(eq(schema.schedulerMaster.scheduler_id, schedulerId));

        // Delete old parameter lines to repopulate clean standards
        await this.db
          .delete(schema.schedulerParameterLine)
          .where(eq(schema.schedulerParameterLine.scheduler_id, schedulerId));
      } else {
        await this.db.insert(schema.schedulerMaster).values({
          scheduler_id: schedulerId,
          tenant_id: tenantId,
          company_id: batch.company_id,
          nob_id: resolvedNobId,
          lob_id: batch.lob_id,
          batch_id: batchId,
          stage_id: stageItem.stage_id,
          stage_code: stageCode,
          stage_name: stageItem.stage_name,
          scheduler_code: schedulerCode,
          scheduler_name: `${stageItem.stage_name} Scheduler - Batch ${batch.batch_no}`,
          scheduler_status: schedStatus,
          duration_value: stageItem.duration_days,
          duration_unit: 'DAY',
          breed_id: batch.breed_id,
          animal_count: animalCount.toString(),
          auto_generated: true,
          is_locked: false,
          description: `Stage-specific scheduler for ${stageItem.stage_name} with tailored feeding, health, and transfer rules.`,
          created_by: userPayload?.userId || null,
        });
      }

      if (isCurrentStage) {
        activeStageSchedulerId = schedulerId;
      }

      // Determine stage-specific daily feed intake
      let feedQtyPerHead = 2.5; // default gestation feed
      if (stageCode.includes('LACTATION') || stageCode.includes('NURSING')) {
        feedQtyPerHead = 6.5;
      } else if (stageCode.includes('FLUSH') || stageCode.includes('SERVICE')) {
        feedQtyPerHead = 3.5;
      } else if (stageCode.includes('GILT') || stageCode.includes('DEV')) {
        feedQtyPerHead = 2.2;
      } else if (stageCode.includes('NURSERY') || stageCode.includes('WEANER')) {
        feedQtyPerHead = 0.8;
      } else if (stageCode.includes('GROWER')) {
        feedQtyPerHead = 2.0;
      } else if (stageCode.includes('FINISHER')) {
        feedQtyPerHead = 3.2;
      } else if (stageCode.includes('BOAR')) {
        feedQtyPerHead = 3.0;
      }

      if (stageItem.lifecycle?.feed_qty_per_head_per_day_kg) {
        feedQtyPerHead = Number(stageItem.lifecycle.feed_qty_per_head_per_day_kg);
      }

      const totalDailyFeed = feedQtyPerHead * animalCount;
      const morningFeedQty = Number((totalDailyFeed * 0.5).toFixed(2));
      const eveningFeedQty = Number((totalDailyFeed * 0.5).toFixed(2));

      let lineSeq = 1;

      // --- 1. CONSUMPTION: Morning Feed ---
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: feedParam.parameter_id,
        line_seq: lineSeq++,
        line_type: 'CONSUMPTION',
        parameter_name: `${stageItem.stage_name} Morning Feed (${(feedQtyPerHead / 2).toFixed(2)} kg/head)`,
        period_no: 1,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Morning Feed Ration',
        occurrence: 'DAILY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        start_day: 1,
        end_day: stageItem.duration_days,
        standard_qty: morningFeedQty.toString(),
        expected_qty_override: morningFeedQty.toString(),
        qty_basis: 'TOTAL_BATCH',
        uom: 'KG',
        uom_override: 'KG',
        kpi_enabled: true,
        kpi_mode: 'VALUE',
        kpi_target_value: morningFeedQty.toString(),
        kpi_min_pct: '10.00',
        kpi_max_pct: '10.00',
        critical_threshold_pct: '20.00',
        lot_required: true,
        notify_in_app: true,
        notes: `50% morning ration for ${animalCount} animals at ${feedQtyPerHead} kg/head/day standard.`,
      });

      // --- 1. CONSUMPTION: Evening Feed ---
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: feedParam.parameter_id,
        line_seq: lineSeq++,
        line_type: 'CONSUMPTION',
        parameter_name: `${stageItem.stage_name} Evening Feed (${(feedQtyPerHead / 2).toFixed(2)} kg/head)`,
        period_no: 2,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Evening Feed Ration',
        occurrence: 'DAILY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        start_day: 1,
        end_day: stageItem.duration_days,
        standard_qty: eveningFeedQty.toString(),
        expected_qty_override: eveningFeedQty.toString(),
        qty_basis: 'TOTAL_BATCH',
        uom: 'KG',
        uom_override: 'KG',
        kpi_enabled: true,
        kpi_mode: 'VALUE',
        kpi_target_value: eveningFeedQty.toString(),
        kpi_min_pct: '10.00',
        kpi_max_pct: '10.00',
        critical_threshold_pct: '20.00',
        lot_required: true,
        notify_in_app: true,
        notes: `50% evening ration for ${animalCount} animals at ${feedQtyPerHead} kg/head/day standard.`,
      });

      // --- 1. CONSUMPTION: Custom Vaccination / Medication Protocols ---
      if (stageCode.includes('GESTATION') || stageCode.includes('DRY_SOW')) {
        const dewormSplId = randomUUID();
        await this.db.insert(schema.schedulerParameterLine).values({
          spl_id: dewormSplId,
          scheduler_id: schedulerId,
          parameter_id: dewormParam.parameter_id,
          line_seq: lineSeq++,
          line_type: 'CONSUMPTION',
          parameter_name: 'Fenbendazole Broad-Spectrum Deworming (Sow)',
          period_no: 3,
          period_from: 1,
          period_to: 1,
          period_label: 'Day 1 Entry Deworming',
          occurrence: 'CUSTOM',
          stage_id: stageItem.stage_id,
          stage_code: stageCode,
          start_day: 1,
          end_day: 1,
          standard_qty: animalCount.toString(),
          expected_qty_override: animalCount.toString(),
          qty_basis: 'TOTAL_BATCH',
          uom: 'DOSES',
          uom_override: 'DOSES',
          lot_required: true,
          withdrawal_days: 14,
          notes: 'Routine entry deworming for dry sows (1 dose per sow).',
        });
        await this.db.insert(schema.schedulerLineCustomDays).values({
          custom_day_id: randomUUID(),
          spl_id: dewormSplId,
          day_number: 1,
          day_label: 'Day 1 Entry Deworming',
        });

        const pcv2SplId = randomUUID();
        await this.db.insert(schema.schedulerParameterLine).values({
          spl_id: pcv2SplId,
          scheduler_id: schedulerId,
          parameter_id: pcv2Param.parameter_id,
          line_seq: lineSeq++,
          line_type: 'CONSUMPTION',
          parameter_name: 'PCV2 & Parvovirus Sow Booster Vaccine',
          period_no: 4,
          period_from: 21,
          period_to: 21,
          period_label: 'Day 21 Sow Booster',
          occurrence: 'CUSTOM',
          stage_id: stageItem.stage_id,
          stage_code: stageCode,
          start_day: 21,
          end_day: 21,
          standard_qty: animalCount.toString(),
          expected_qty_override: animalCount.toString(),
          qty_basis: 'TOTAL_BATCH',
          uom: 'DOSES',
          uom_override: 'DOSES',
          lot_required: true,
          withdrawal_days: 21,
          notes: 'Administer PCV2 booster on Day 21 post-mating.',
        });
        await this.db.insert(schema.schedulerLineCustomDays).values({
          custom_day_id: randomUUID(),
          spl_id: pcv2SplId,
          day_number: 21,
          day_label: 'Day 21 PCV2 Booster',
        });
      } else if (stageCode.includes('LACTATION') || stageCode.includes('FARROWING')) {
        const ironSplId = randomUUID();
        const estPiglets = animalCount * 11;
        await this.db.insert(schema.schedulerParameterLine).values({
          spl_id: ironSplId,
          scheduler_id: schedulerId,
          parameter_id: ironParam.parameter_id,
          line_seq: lineSeq++,
          line_type: 'CONSUMPTION',
          parameter_name: 'Piglet Iron Dextran 200mg Injection (Day 3)',
          period_no: 3,
          period_from: 3,
          period_to: 3,
          period_label: 'Day 3 Piglet Iron Injection',
          occurrence: 'CUSTOM',
          stage_id: stageItem.stage_id,
          stage_code: stageCode,
          start_day: 3,
          end_day: 3,
          standard_qty: estPiglets.toString(),
          expected_qty_override: estPiglets.toString(),
          qty_basis: 'TOTAL_BATCH',
          uom: 'DOSES',
          uom_override: 'DOSES',
          lot_required: true,
          notes: 'Prevents nutritional piglet anemia (200mg intramuscular).',
        });
        await this.db.insert(schema.schedulerLineCustomDays).values({
          custom_day_id: randomUUID(),
          spl_id: ironSplId,
          day_number: 3,
          day_label: 'Day 3 Iron Dextran Injection',
        });
      }

      // --- 2. DESCRIPTIVE: Head Count ---
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: headParam.parameter_id,
        line_seq: lineSeq++,
        line_type: 'DESCRIPTIVE',
        parameter_name: 'Morning & Evening Head Count',
        period_no: 5,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Daily Head Count Check',
        occurrence: 'DAILY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        start_day: 1,
        end_day: stageItem.duration_days,
        uom: 'HEAD',
        uom_override: 'HEAD',
        kpi_enabled: true,
        kpi_mode: 'VALUE',
        kpi_target_value: animalCount.toString(),
        critical_threshold_pct: '5.00',
        notify_in_app: true,
        notes: `Verify ${animalCount} head present during morning and evening rounds.`,
      });

      // --- 2. DESCRIPTIVE: Daily Mortality ---
      const stdMortPct = stageItem.lifecycle?.std_mortality_rate_pct ? Number(stageItem.lifecycle.std_mortality_rate_pct) : 0.05;
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: mortParam.parameter_id,
        line_seq: lineSeq++,
        line_type: 'DESCRIPTIVE',
        parameter_name: 'Daily Mortality & Morbidity Log',
        period_no: 6,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Mortality Tracking',
        occurrence: 'DAILY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        start_day: 1,
        end_day: stageItem.duration_days,
        uom: 'HEAD',
        uom_override: 'HEAD',
        kpi_enabled: true,
        kpi_mode: 'VALUE',
        kpi_target_value: '0',
        critical_threshold_pct: '50.00',
        notify_in_app: true,
        notes: `Expected mortality rate <= ${stdMortPct}%`,
      });

      // --- 2. DESCRIPTIVE: Body Weight & ADG ---
      const stdWeight = stageItem.lifecycle?.std_body_weight_kg ? Number(stageItem.lifecycle.std_body_weight_kg) : 220;
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: weightParam.parameter_id,
        line_seq: lineSeq++,
        line_type: 'DESCRIPTIVE',
        parameter_name: 'Weekly Body Weight Sample Check',
        period_no: 7,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Weight Verification',
        occurrence: 'WEEKLY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        start_day: 7,
        end_day: stageItem.duration_days,
        uom: 'KG',
        uom_override: 'KG',
        kpi_enabled: false,
        kpi_target_value: stdWeight.toString(),
        notes: `Target average weight: ${stdWeight} kg`,
      });

      // --- 2. DESCRIPTIVE: Gestation Pregnancy Scan Checkpoint ---
      if (stageCode.includes('GESTATION') || stageCode.includes('DRY_SOW')) {
        const scanSplId = randomUUID();
        await this.db.insert(schema.schedulerParameterLine).values({
          spl_id: scanSplId,
          scheduler_id: schedulerId,
          parameter_id: scanParam.parameter_id,
          line_seq: lineSeq++,
          line_type: 'DESCRIPTIVE',
          parameter_name: 'Ultrasound Pregnancy Confirmation Scan (Day 28)',
          period_no: 8,
          period_from: 28,
          period_to: 28,
          period_label: '28-Day Pregnancy Diagnosis Checkpoint',
          occurrence: 'ONCE',
          stage_id: stageItem.stage_id,
          stage_code: stageCode,
          start_day: 28,
          end_day: 28,
          kpi_metric: 'PREGNANCY_CONFIRMED',
          uom: 'CHECK',
          uom_override: 'CHECK',
          is_mandatory: true,
          notes: 'Real-time ultrasound scan between Day 28–35. Negative sows flag re-service.',
        });
        await this.db.insert(schema.schedulerLineCustomDays).values({
          custom_day_id: randomUUID(),
          spl_id: scanSplId,
          day_number: 28,
          day_label: 'Day 28 Ultrasound Pregnancy Scan',
        });
      }

      // --- 3. OVERHEAD: Barn Electricity & Utilities ---
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: electOverhead.parameter_id,
        line_seq: lineSeq++,
        line_type: 'OVERHEAD',
        parameter_name: 'Barn Electricity, Ventilation & Heat Lamps',
        period_no: 9,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Utility Allocation',
        occurrence: 'DAILY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        overhead_category: 'ELECTRICITY',
        estimated_cost: '85.00',
        notes: 'Barn automated climate and lighting control.',
      });

      // --- 4. RESOURCE: Stockman Labour ---
      await this.db.insert(schema.schedulerParameterLine).values({
        spl_id: randomUUID(),
        scheduler_id: schedulerId,
        parameter_id: stockmanLabour.parameter_id,
        line_seq: lineSeq++,
        line_type: 'RESOURCE',
        parameter_name: 'Daily Attendant & Feeding Rounds',
        period_no: 10,
        period_from: 1,
        period_to: stageItem.duration_days,
        period_label: 'Labour Hours',
        occurrence: 'DAILY',
        stage_id: stageItem.stage_id,
        stage_code: stageCode,
        standard_qty: '2.50',
        uom: 'HOURS',
        uom_override: 'HOURS',
        notes: '2.5 staff hours per day allocated to shed monitoring and feeder management.',
      });

      // --- 5. TRANSFER: Weaning Transfer Rules ---
      if (stageCode.includes('WEANING') || stageCode.includes('LACTATION')) {
        await this.db.insert(schema.schedulerParameterLine).values({
          spl_id: randomUUID(),
          scheduler_id: schedulerId,
          parameter_id: weanTransferParam.parameter_id,
          line_seq: lineSeq++,
          line_type: 'TRANSFER',
          parameter_name: 'Transfer Weaned Piglets to Nursery / CB Grower Batch',
          period_no: 11,
          period_from: 28,
          period_to: 28,
          period_label: 'Weaning Day Batch Transfer',
          occurrence: 'ONCE',
          stage_id: stageItem.stage_id,
          stage_code: stageCode,
          start_day: 28,
          end_day: 28,
          transfer_qty_basis: 'HEAD_COUNT',
          capture_transfer_weight: true,
          auto_triggers_stage: true,
          notes: 'Auto-creates or transfers downstream piglets into Nursery/CB Grower batch.',
        });
      }
    }

    // 4. Update batchHeader to point to active scheduler
    if (activeStageSchedulerId) {
      await this.db
        .update(schema.batchHeader)
        .set({
          scheduler_id: activeStageSchedulerId,
          updated_by: userPayload?.userId || null,
          updated_at: toMysqlTimestamp(),
        })
        .where(eq(schema.batchHeader.batch_id, batchId));
    }

    await this.auditService.log({
      tenantId,
      companyId: batch.company_id,
      userId: userPayload?.userId,
      action: 'GENERATE_STAGE_SCHEDULERS',
      entityName: 'batch_header',
      entityId: batchId,
      newValues: { stagesGenerated: stagesToGenerate.length, active_scheduler_id: activeStageSchedulerId },
    });

    return this.findOne(batchId);
  }

  /**
   * Returns all stage schedulers for a batch with stage metadata, parameter lines,
   * custom days, and structured categorized parameter groups.
   */
  async getBatchSchedulers(batchId: string, tenantId: string) {
    const batch = await this.findOne(batchId);
    const animalCount = await this.getBatchHeadcount(batchId, tenantId);

    // Fetch all schedulers for this batch
    let schedulers = await this.db
      .select({
        scheduler: schema.schedulerMaster,
        stage: schema.stageMaster,
      })
      .from(schema.schedulerMaster)
      .leftJoin(schema.stageMaster, eq(schema.schedulerMaster.stage_id, schema.stageMaster.stage_id))
      .where(
        and(
          eq(schema.schedulerMaster.batch_id, batchId),
          eq(schema.schedulerMaster.tenant_id, tenantId),
          eq(schema.schedulerMaster.is_active, true)
        )
      )
      .orderBy(schema.schedulerMaster.stage_code);

    // If none exist yet, auto-generate them
    if (schedulers.length === 0 && batch.breed_id) {
      try {
        await this.generateSchedulerForBatch(batchId, tenantId);
        schedulers = await this.db
          .select({
            scheduler: schema.schedulerMaster,
            stage: schema.stageMaster,
          })
          .from(schema.schedulerMaster)
          .leftJoin(schema.stageMaster, eq(schema.schedulerMaster.stage_id, schema.stageMaster.stage_id))
          .where(
            and(
              eq(schema.schedulerMaster.batch_id, batchId),
              eq(schema.schedulerMaster.tenant_id, tenantId),
              eq(schema.schedulerMaster.is_active, true)
            )
          )
          .orderBy(schema.schedulerMaster.stage_code);
      } catch (err) {
        console.warn('Auto-generation of stage schedulers skipped:', err);
      }
    }

    const schedulerIds = schedulers.map((s) => s.scheduler.scheduler_id);
    const allLines = schedulerIds.length
      ? await this.db
          .select({
            spl: schema.schedulerParameterLine,
            param: schema.parameterMaster,
            item: schema.itemMaster,
            resource: schema.resourceMaster,
          })
          .from(schema.schedulerParameterLine)
          .innerJoin(schema.parameterMaster, eq(schema.schedulerParameterLine.parameter_id, schema.parameterMaster.parameter_id))
          .leftJoin(schema.itemMaster, eq(schema.parameterMaster.item_id, schema.itemMaster.item_id))
          .leftJoin(schema.resourceMaster, eq(schema.parameterMaster.resource_id, schema.resourceMaster.resource_id))
          .where(inArray(schema.schedulerParameterLine.scheduler_id, schedulerIds))
          .orderBy(schema.schedulerParameterLine.line_seq)
      : [];

    const splIds = allLines.map((l) => l.spl.spl_id);
    const allCustomDays = splIds.length
      ? await this.db
          .select()
          .from(schema.schedulerLineCustomDays)
          .where(inArray(schema.schedulerLineCustomDays.spl_id, splIds))
          .orderBy(schema.schedulerLineCustomDays.day_number)
      : [];

    const customDaysBySpl = new Map<string, typeof allCustomDays>();
    for (const cd of allCustomDays) {
      const list = customDaysBySpl.get(cd.spl_id) || [];
      list.push(cd);
      customDaysBySpl.set(cd.spl_id, list);
    }

    const currentStageCode = (batch.current_stage_code || 'DRY_SOW_GESTATION').toUpperCase();

    return schedulers.map(({ scheduler, stage }) => {
      const schedLines = allLines.filter((l) => l.spl.scheduler_id === scheduler.scheduler_id);
      const isCurrent = (scheduler.stage_code || '').toUpperCase() === currentStageCode || batch.scheduler_id === scheduler.scheduler_id;

      const enrichedLines = schedLines.map(({ spl, param, item, resource }) => ({
        spl_id: spl.spl_id,
        scheduler_id: spl.scheduler_id,
        parameter_id: spl.parameter_id,
        parameter_name: spl.parameter_name || param.parameter_name,
        parameter_code: param.parameter_code,
        line_type: spl.line_type || param.parameter_type || 'CONSUMPTION',
        line_seq: spl.line_seq,
        period_no: spl.period_no,
        period_from: spl.period_from,
        period_to: spl.period_to,
        period_label: spl.period_label,
        occurrence: spl.occurrence || 'DAILY',
        stage_code: spl.stage_code,
        start_day: spl.start_day,
        end_day: spl.end_day,
        is_mandatory: spl.is_mandatory,
        standard_qty: spl.standard_qty ? Number(spl.standard_qty) : null,
        expected_qty_override: spl.expected_qty_override ? Number(spl.expected_qty_override) : null,
        qty_basis: spl.qty_basis || 'TOTAL_BATCH',
        uom: spl.uom_override || spl.uom || param.default_uom || 'KG',
        lot_required: spl.lot_required,
        withdrawal_days: spl.withdrawal_days || (item as any)?.withdrawal_days || null,
        kpi_enabled: spl.kpi_enabled,
        kpi_target_value: spl.kpi_target_value ? Number(spl.kpi_target_value) : null,
        kpi_min_pct: spl.kpi_min_pct ? Number(spl.kpi_min_pct) : null,
        kpi_max_pct: spl.kpi_max_pct ? Number(spl.kpi_max_pct) : null,
        critical_threshold_pct: spl.critical_threshold_pct ? Number(spl.critical_threshold_pct) : null,
        overhead_category: spl.overhead_category,
        estimated_cost: spl.estimated_cost ? Number(spl.estimated_cost) : null,
        item_id: item?.item_id || null,
        item_code: item?.item_code || null,
        item_name: item?.item_name || null,
        resource_id: resource?.resource_id || null,
        resource_name: resource?.resource_name || null,
        transfer_qty_basis: spl.transfer_qty_basis,
        capture_transfer_weight: spl.capture_transfer_weight,
        auto_triggers_stage: spl.auto_triggers_stage,
        notes: spl.notes,
        custom_days: customDaysBySpl.get(spl.spl_id) || [],
      }));

      // Categorized blocks for UI
      const feedLines = enrichedLines.filter(
        (l) => l.line_type === 'CONSUMPTION' && (l.parameter_name.toLowerCase().includes('feed') || l.parameter_name.toLowerCase().includes('ration'))
      );
      const healthLines = enrichedLines.filter(
        (l) =>
          l.line_type === 'CONSUMPTION' &&
          (l.parameter_name.toLowerCase().includes('deworm') ||
            l.parameter_name.toLowerCase().includes('vaccine') ||
            l.parameter_name.toLowerCase().includes('injection') ||
            l.occurrence === 'CUSTOM' ||
            l.custom_days.length > 0)
      );
      const kpiLines = enrichedLines.filter(
        (l) => l.line_type === 'DESCRIPTIVE' || l.line_type === 'MORTALITY' || l.parameter_name.toLowerCase().includes('head count')
      );
      const overheadLines = enrichedLines.filter((l) => l.line_type === 'OVERHEAD');
      const resourceLines = enrichedLines.filter((l) => l.line_type === 'RESOURCE');
      const transferLines = enrichedLines.filter((l) => l.line_type === 'TRANSFER' || l.line_type === 'OUTPUT');

      return {
        scheduler_id: scheduler.scheduler_id,
        scheduler_code: scheduler.scheduler_code,
        scheduler_name: scheduler.scheduler_name,
        scheduler_status: isCurrent ? 'ACTIVE' : scheduler.scheduler_status || 'PENDING',
        is_current_stage: isCurrent,
        duration_value: scheduler.duration_value,
        duration_unit: scheduler.duration_unit || 'DAY',
        animal_count: scheduler.animal_count ? Number(scheduler.animal_count) : animalCount,
        stage_id: scheduler.stage_id || stage?.stage_id || null,
        stage_code: scheduler.stage_code || stage?.stage_code || 'STAGE',
        stage_name: scheduler.stage_name || stage?.stage_name || scheduler.scheduler_name,
        stage_category: stage?.stage_category || 'PRODUCTIVE',
        min_days_before_move: stage?.min_days_before_move || 0,
        transition_trigger: stage?.transition_trigger || 'MANUAL',
        next_stage_id: stage?.next_stage_id || null,
        total_parameters_count: enrichedLines.length,
        description: scheduler.description,
        lines: enrichedLines,
        categorized: {
          feed: feedLines,
          health: healthLines,
          kpis: kpiLines,
          overheads: overheadLines,
          resources: resourceLines,
          transfers: transferLines,
        },
      };
    });
  }

  /**
   * Fetches single stage scheduler details.
   */
  async getBatchStageScheduler(batchId: string, schedulerId: string, tenantId: string) {
    const all = await this.getBatchSchedulers(batchId, tenantId);
    const found = all.find((s) => s.scheduler_id === schedulerId);
    if (!found) {
      throw new NotFoundException(`Stage scheduler '${schedulerId}' not found for batch '${batchId}'.`);
    }
    return found;
  }

  /**
   * Updates standard parameters and custom days for a stage scheduler.
   */
  async updateBatchSchedulerLines(
    batchId: string,
    schedulerId: string,
    dto: UpdateBatchSchedulerLinesDto,
    tenantId: string,
    userPayload?: any
  ) {
    const [scheduler] = await this.db
      .select()
      .from(schema.schedulerMaster)
      .where(
        and(
          eq(schema.schedulerMaster.scheduler_id, schedulerId),
          eq(schema.schedulerMaster.batch_id, batchId),
          eq(schema.schedulerMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!scheduler) {
      throw new NotFoundException(`Stage scheduler '${schedulerId}' not found.`);
    }

    if (dto.duration_value !== undefined || dto.animal_count !== undefined || dto.notes !== undefined) {
      await this.db
        .update(schema.schedulerMaster)
        .set({
          duration_value: dto.duration_value !== undefined ? dto.duration_value : scheduler.duration_value,
          animal_count: dto.animal_count !== undefined ? dto.animal_count.toString() : scheduler.animal_count,
          description: dto.notes !== undefined ? dto.notes : scheduler.description,
          updated_at: toMysqlTimestamp(),
        })
        .where(eq(schema.schedulerMaster.scheduler_id, schedulerId));
    }

    if (dto.lines && dto.lines.length > 0) {
      for (const lineDto of dto.lines) {
        if (lineDto.spl_id) {
          await this.db
            .update(schema.schedulerParameterLine)
            .set({
              expected_qty_override: lineDto.expected_qty_override !== undefined ? lineDto.expected_qty_override.toString() : undefined,
              uom_override: lineDto.uom_override || undefined,
              kpi_target_value: lineDto.kpi_target_value !== undefined ? lineDto.kpi_target_value.toString() : undefined,
              kpi_min_pct: lineDto.kpi_min_pct !== undefined ? lineDto.kpi_min_pct.toString() : undefined,
              kpi_max_pct: lineDto.kpi_max_pct !== undefined ? lineDto.kpi_max_pct.toString() : undefined,
              critical_threshold_pct: lineDto.critical_threshold_pct !== undefined ? lineDto.critical_threshold_pct.toString() : undefined,
              notes: lineDto.notes || undefined,
            })
            .where(eq(schema.schedulerParameterLine.spl_id, lineDto.spl_id));

          if (lineDto.custom_days && Array.isArray(lineDto.custom_days)) {
            await this.db
              .delete(schema.schedulerLineCustomDays)
              .where(eq(schema.schedulerLineCustomDays.spl_id, lineDto.spl_id));

            for (const cd of lineDto.custom_days) {
              await this.db.insert(schema.schedulerLineCustomDays).values({
                custom_day_id: randomUUID(),
                spl_id: lineDto.spl_id,
                day_number: cd.day_number,
                day_label: cd.day_label || null,
              });
            }
          }
        }
      }
    }

    await this.auditService.log({
      tenantId,
      companyId: scheduler.company_id ?? undefined,
      userId: userPayload?.userId,
      action: 'UPDATE_STAGE_SCHEDULER',
      entityName: 'scheduler_master',
      entityId: schedulerId,
      newValues: { linesUpdated: dto.lines?.length || 0 },
    });

    return this.getBatchStageScheduler(batchId, schedulerId, tenantId);
  }

  /**
   * Returns day-by-day standard breed performance curves vs actual recorded data for a batch.
   */
  async getBatchPerformanceCurves(batchId: string, tenantId: string) {
    const batch = await this.findOne(batchId);
    const startDate = new Date(batch.start_date);
    const today = new Date();
    const batchAgeDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // 1. Fetch all batch transactions
    const transactions = await this.db
      .select({
        tx: schema.batchTransaction,
        item: schema.itemMaster,
      })
      .from(schema.batchTransaction)
      .leftJoin(schema.itemMaster, eq(schema.batchTransaction.item_id, schema.itemMaster.item_id))
      .where(eq(schema.batchTransaction.batch_id, batchId))
      .orderBy(schema.batchTransaction.transaction_date);

    // 2. Fetch scheduler lines if present
    let scheduleLines: Array<{ spl: typeof schema.schedulerParameterLine.$inferSelect; param: typeof schema.parameterMaster.$inferSelect }> = [];
    if (batch.scheduler_id) {
      const lines = await this.db
        .select({
          spl: schema.schedulerParameterLine,
          param: schema.parameterMaster,
        })
        .from(schema.schedulerParameterLine)
        .innerJoin(schema.parameterMaster, eq(schema.schedulerParameterLine.parameter_id, schema.parameterMaster.parameter_id))
        .where(eq(schema.schedulerParameterLine.scheduler_id, batch.scheduler_id));
      scheduleLines = lines;
    }

    // Also fetch breed lifecycle stages for reference
    const lifecycleStandards = batch.breed_id
      ? await this.db
        .select()
        .from(schema.breedLifecycleStages)
        .where(and(eq(schema.breedLifecycleStages.breed_id, batch.breed_id), eq(schema.breedLifecycleStages.is_active, true)))
        .orderBy(schema.breedLifecycleStages.period_from)
      : [];

    let breedName: string | null = null;
    if (batch.breed_id) {
      const [bRow] = await this.db.select().from(schema.breedMaster).where(eq(schema.breedMaster.breed_id, batch.breed_id)).limit(1);
      breedName = bRow?.breed_name || null;
    }

    // Group actual transactions by day
    const dayActualFeed: Record<number, number> = {};
    const dayActualMort: Record<number, number> = {};
    const dayActualWeight: Record<number, number> = {};

    for (const { tx, item } of transactions) {
      const txDate = new Date(tx.transaction_date);
      const dayNo = Math.max(1, Math.floor((txDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const qty = Number(tx.quantity || 0);

      if (tx.transaction_type === 'CONSUMPTION' || item?.item_type === 'FEED') {
        dayActualFeed[dayNo] = (dayActualFeed[dayNo] || 0) + qty;
      } else if (tx.transaction_type === 'MORTALITY') {
        dayActualMort[dayNo] = (dayActualMort[dayNo] || 0) + qty;
      } else if (tx.transaction_type === 'OUTPUT' || tx.transaction_type === 'OBSERVATION' || tx.transaction_type === 'WEIGHT_ENTRY') {
        if (tx.uom === 'KG' && qty > 0) {
          dayActualWeight[dayNo] = qty;
        }
      }
    }

    // Build timeline curves (day 1 to min(batchAgeDays + 7, 180))
    const totalDaysToProject = Math.min(Math.max(batchAgeDays + 7, 30), 180);
    const curves: any[] = [];

    let cumStdFeed = 0;
    let cumActFeed = 0;
    let cumStdMort = 0;
    let cumActMort = 0;
    let lastKnownActWeight = 1.5; // default birth weight ~1.5kg

    const initialHeadcount = Number(batch.opening_quantity || 1);

    for (let day = 1; day <= totalDaysToProject; day++) {
      const curDate = new Date(startDate.getTime() + (day - 1) * 86400000).toISOString().slice(0, 10);

      // Find standard feed for this day
      let stdDailyFeedPerHead = 0;
      let stdTargetWeight = 0;
      let stdMortPct = 0;

      // Check schedule lines
      const activeFeedLine = scheduleLines.find(l => l.param.parameter_type === 'CONSUMPTION' && day >= l.spl.period_from && day <= l.spl.period_to);
      if (activeFeedLine && activeFeedLine.spl.expected_qty_override) {
        stdDailyFeedPerHead = Number(activeFeedLine.spl.expected_qty_override);
      } else {
        // Fallback to breed standards
        const lc = lifecycleStandards.find(l => {
          const pF = toDays(l.period_from, l.calc_unit);
          const pT = toDays(l.period_to, l.calc_unit);
          return day >= pF && day <= pT;
        });
        if (lc) {
          stdDailyFeedPerHead = Number(lc.feed_qty_per_head_per_day_kg || 0);
          stdTargetWeight = Number(lc.std_body_weight_kg || 0);
          stdMortPct = Number(lc.std_mortality_rate_pct || 0);
        }
      }

      const activeWeightLine = scheduleLines.find(l => l.param.parameter_type === 'OUTPUT' && day >= l.spl.period_from && day <= l.spl.period_to);
      if (activeWeightLine && activeWeightLine.spl.expected_qty_override) {
        stdTargetWeight = Number(activeWeightLine.spl.expected_qty_override);
      }

      const stdTotalDailyFeed = stdDailyFeedPerHead * initialHeadcount;
      const actDailyFeed = dayActualFeed[day] || 0;
      const actDailyMort = dayActualMort[day] || 0;

      cumStdFeed += stdTotalDailyFeed;
      if (day <= batchAgeDays) {
        cumActFeed += actDailyFeed;
        cumActMort += actDailyMort;
        if (dayActualWeight[day]) {
          lastKnownActWeight = dayActualWeight[day];
        }
      }
      cumStdMort += (stdMortPct / 100) * initialHeadcount;

      curves.push({
        day,
        date: curDate,
        isPastOrToday: day <= batchAgeDays,
        stdDailyFeedPerHead,
        stdTotalDailyFeed: Math.round(stdTotalDailyFeed * 100) / 100,
        actTotalDailyFeed: day <= batchAgeDays ? Math.round(actDailyFeed * 100) / 100 : null,
        cumStdFeed: Math.round(cumStdFeed * 100) / 100,
        cumActFeed: day <= batchAgeDays ? Math.round(cumActFeed * 100) / 100 : null,
        stdTargetWeight: stdTargetWeight > 0 ? stdTargetWeight : null,
        actWeight: day <= batchAgeDays && dayActualWeight[day] ? dayActualWeight[day] : null,
        actDailyMort: day <= batchAgeDays ? actDailyMort : null,
        cumActMort: day <= batchAgeDays ? cumActMort : null,
      });
    }

    const currentHeadcount = Number(batch.closing_quantity || batch.opening_quantity || initialHeadcount);
    const weightGain = Math.max(0, lastKnownActWeight - 1.5);
    const liveFcr = weightGain > 0 && cumActFeed > 0 && currentHeadcount > 0
      ? Math.round((cumActFeed / (weightGain * currentHeadcount)) * 100) / 100
      : null;

    const feedDeviationPct = cumStdFeed > 0 && cumActFeed > 0
      ? Math.round(((cumActFeed - cumStdFeed) / cumStdFeed) * 1000) / 10
      : 0;

    return {
      batch: {
        batch_id: batch.batch_id,
        batch_no: batch.batch_no,
        batch_name: batch.remarks || batch.batch_no,
        breed_id: batch.breed_id,
        breed_name: breedName,
        has_scheduler: Boolean(batch.scheduler_id),
        scheduler_code: batch.scheduler?.scheduler_code || null,
        start_date: batch.start_date,
        batch_age_days: batchAgeDays,
        initial_quantity: initialHeadcount,
        current_quantity: currentHeadcount,
        current_stage_code: batch.current_stage_code,
      },
      summary: {
        totalStdFeedKg: Math.round(cumStdFeed),
        totalActFeedKg: Math.round(cumActFeed),
        feedDeviationPct,
        totalMortality: cumActMort,
        mortalityRatePct: Math.round((cumActMort / initialHeadcount) * 1000) / 10,
        liveFcr,
        lastRecordedWeightKg: lastKnownActWeight,
      },
      curves,
    };
  }
}


