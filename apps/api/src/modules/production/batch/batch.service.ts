import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull, count, inArray } from 'drizzle-orm';
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
} from './dto/batch.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';
import { InventoryLedgerService } from '../../inventory/inventory-ledger/inventory-ledger.service';
import { GlPostingService } from '../../finance/journal/gl-posting.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class BatchService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly glPostingService: GlPostingService,
  ) {}

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
  private async generateBatchNo(tenantId: string, companyId: string, executor: MySql2Database<typeof schema> = this.db): Promise<string> {
    const [row] = await executor
      .select({ total: count() })
      .from(schema.batchHeader)
      .where(and(eq(schema.batchHeader.tenant_id, tenantId), eq(schema.batchHeader.company_id, companyId)))
      .for('update');
    const seq = Number(row?.total || 0) + 1;
    return `BATCH-${String(seq).padStart(6, '0')}`;
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
    const alerts = await this.db.select().from(schema.notificationAlertLog).where(eq(schema.notificationAlertLog.batch_id, id));
    const stageLog = await this.db.select().from(schema.batchStageLog).where(eq(schema.batchStageLog.batch_id, id));

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
      alerts,
      stage_log: stageLog,
    };
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

    await this.db
      .update(schema.batchHeader)
      .set({
        current_stage_code: dto.to_stage_code,
        sub_location_id: dto.to_location_id || null,
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
      oldValues: { current_stage_code: batch.current_stage_code, sub_location_id: batch.sub_location_id },
      newValues: { current_stage_code: dto.to_stage_code, sub_location_id: dto.to_location_id },
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

  async addTransaction(id: string, dto: AddBatchTransactionDto, tenantId: string, userPayload?: any) {
    const batch = await this.findOne(id);
    this.assertStatus(batch, 'ACTIVE');

    const isBioAsset = batch.costing_method === 'BIO_ASSET';
    let bioState: typeof schema.batchBioAssetState.$inferSelect | undefined;
    if (isBioAsset) {
      [bioState] = await this.db.select().from(schema.batchBioAssetState).where(eq(schema.batchBioAssetState.batch_id, id)).limit(1);
      if (!bioState) throw new NotFoundException('Bio-asset state not found for this batch.');
    }
    const bioAssetSubjectItemId = batch.input_lines[0]?.item_id;

    const transactionId = randomUUID();
    let ledgerId: string | null = null;
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
      await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);
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
      await this.glPostingService.postInventoryLedgerEntry(ledgerEntry, userPayload?.userId);
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
        await this.glPostingService.postBatchCostEntry({
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
          userId: userPayload?.userId,
        });
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
        await this.glPostingService.postBatchCostEntry({
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
          userId: userPayload?.userId,
        });
      }
    } else if (dto.transaction_type === 'OVERHEAD') {
      if (!dto.quantity || !dto.rate) {
        throw new BadRequestException('OVERHEAD transactions require quantity and rate.');
      }
      amount = -(dto.quantity * dto.rate);
      const bioTransactionType = isBioAsset
        ? (bioState!.stage === 'PREMATURE' ? 'BIO_OVERHEAD_PREMATURE' : 'BIO_OVERHEAD_MATURE')
        : 'OVERHEAD';
      await this.glPostingService.postBatchCostEntry({
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
        userId: userPayload?.userId,
      });

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
      quantity: dto.quantity?.toString() || null,
      uom: dto.uom || null,
      rate: rate?.toString() || null,
      amount: amount.toString(),
      remarks: dto.remarks || null,
      ledger_id: ledgerId,
      created_by: userPayload?.userId || null,
    });

    if (batch.scheduler_id && dto.quantity !== undefined && dto.quantity !== null) {
      await this.evaluateKpi(batch, {
        transaction_id: transactionId,
        transaction_date: dto.transaction_date,
        transaction_type: dto.transaction_type,
        item_id: dto.item_id || null,
        resource_id: dto.resource_id || null,
        quantity: dto.quantity,
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
   * Additive KPI-monitoring layer (Phase 6) — no-ops entirely if the batch
   * has no scheduler attached. Finds the scheduler_parameter_line covering
   * today's day-of-batch for a parameter matching this transaction, compares
   * actual vs. expected, and writes a notification_alert_log row on breach.
   * Does not touch cost/GL — purely observational.
   */
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
    return spl.expected_qty_override
      ? Number(spl.expected_qty_override)
      : parameter.qty_method === 'PER_UNIT' && parameter.default_qty_per_unit
      ? Number(parameter.default_qty_per_unit) * openingQty
      : parameter.qty_method === 'PER_BATCH' && parameter.default_qty_per_batch
      ? Number(parameter.default_qty_per_batch)
      : openingQty; // MANUAL_AT_ENTRY fallback — e.g. mortality as a % of headcount
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
    }
  ) {
    if (!batch.scheduler_id) return;

    const startDate = new Date(batch.start_date);
    const txDate = new Date(transaction.transaction_date);
    const dayOfBatch = Math.floor((txDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (dayOfBatch < 1) return;

    const activeLines = await this.loadActiveScheduleLines(batch, dayOfBatch);
    const match = activeLines.find(({ parameter }) => {
      if (parameter.parameter_type !== transaction.transaction_type) return false;
      if (parameter.item_id && parameter.item_id !== transaction.item_id) return false;
      if (parameter.resource_id && parameter.resource_id !== transaction.resource_id) return false;
      return true;
    });

    if (!match || !match.spl.kpi_enabled || !match.spl.kpi_mode) return;
    const { spl, parameter } = match;

    const openingQty = Number(batch.opening_quantity);
    const expectedQty = this.computeExpectedQty(spl, parameter, openingQty);

    const actual = transaction.quantity;
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
      deviationPct = (actual / expectedQty - 1) * 100;
      if (breached && spl.critical_threshold_pct && Math.abs(deviationPct) > Number(spl.critical_threshold_pct)) {
        severity = 'CRITICAL';
      }
    } else if (spl.kpi_mode === 'VALUE') {
      const minVal = spl.kpi_min_value !== null ? Number(spl.kpi_min_value) : -Infinity;
      const maxVal = spl.kpi_max_value !== null ? Number(spl.kpi_max_value) : Infinity;
      breached = actual < minVal || actual > maxVal;
      breachDirection = actual < minVal ? 'below' : actual > maxVal ? 'above' : null;
    }

    if (!breached) return;

    const deviationAmount = actual - expectedQty;
    const title = `${parameter.parameter_name} ${breachDirection === 'below' ? 'Below' : 'Above'} KPI — Batch ${batch.batch_no}${spl.period_label ? `, ${spl.period_label}` : ''}`;
    const message = spl.kpi_mode === 'PCT'
      ? `${parameter.parameter_name}: actual ${actual}, expected ${expectedQty.toFixed(4)} (${deviationPct!.toFixed(2)}% deviation). Batch ${batch.batch_no}, Day ${dayOfBatch}.`
      : `${parameter.parameter_name}: actual ${actual} outside range [${spl.kpi_min_value ?? '-∞'}, ${spl.kpi_max_value ?? '∞'}]. Batch ${batch.batch_no}, Day ${dayOfBatch}.`;

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
      deviation_pct: deviationPct !== null ? deviationPct.toString() : null,
      kpi_min: spl.kpi_mode === 'PCT' ? spl.kpi_min_pct : spl.kpi_min_value,
      kpi_max: spl.kpi_mode === 'PCT' ? spl.kpi_max_pct : spl.kpi_max_value,
    });
  }

  /**
   * Drives the batch "Data Entry" screen: every scheduler_parameter_line
   * that's due on the given date, with its expected quantity and whatever's
   * already been recorded that day — so the UI can show a guided checklist
   * instead of a blank generic transaction form.
   */
  async getDataEntry(id: string, dateStr: string) {
    const batch = await this.findOne(id);
    if (!batch.scheduler_id) {
      throw new BadRequestException('This batch has no scheduler attached — record entries via the generic Transactions form instead.');
    }

    const startDate = new Date(batch.start_date);
    const date = new Date(dateStr);
    const dayOfBatch = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

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
    const itemLabel = (itemId: string | null) => {
      if (!itemId) return null;
      const it = itemRows.find((x) => x.item_id === itemId);
      return it ? `${it.item_code} — ${it.item_name}` : null;
    };

    const lines = activeLines.map(({ spl, parameter }) => {
      const alreadyEntered = sameDayTx
        .filter((t) => t.transaction_type === parameter.parameter_type
          && (parameter.item_id ? t.item_id === parameter.item_id : true)
          && (parameter.resource_id ? t.resource_id === parameter.resource_id : true))
        .reduce((sum, t) => sum + Number(t.quantity || 0), 0);

      return {
        spl_id: spl.spl_id,
        parameter_id: parameter.parameter_id,
        parameter_type: parameter.parameter_type,
        parameter_name: parameter.parameter_name,
        item_id: parameter.item_id,
        item_label: itemLabel(parameter.item_id),
        resource_id: parameter.resource_id,
        uom: spl.uom_override || parameter.default_uom || null,
        occurrence: spl.occurrence,
        period_label: spl.period_label,
        expected_qty: this.computeExpectedQty(spl, parameter, openingQty),
        already_entered_qty: alreadyEntered,
      };
    });

    return { date: dateStr, day_of_batch: dayOfBatch, lines };
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
      bio_asset_item_id: batch.input_lines[0].item_id,
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
      bio_asset_item_id: batch.input_lines[0].item_id,
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
      bio_asset_item_id: batch.input_lines[0].item_id,
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
      bio_asset_item_id: batch.input_lines[0].item_id,
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
}
