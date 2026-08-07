import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull, count } from 'drizzle-orm';
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

  private async generateBatchNo(tenantId: string, companyId: string): Promise<string> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.batchHeader)
      .where(and(eq(schema.batchHeader.tenant_id, tenantId), eq(schema.batchHeader.company_id, companyId)));
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
    const batchNo = await this.generateBatchNo(tenantId, dto.company_id);

    await this.db.insert(schema.batchHeader).values({
      batch_id: batchId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_no: batchNo,
      lob_id: dto.lob_id,
      nob_id: lob.nob_id,
      costing_method: dto.costing_method.toUpperCase(),
      breed_id: dto.breed_id || null,
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

    return {
      ...batch,
      input_lines: inputLines,
      transactions,
      output_lines: outputLines,
      standard: standard ? { ...standard, consumption_lines: standardConsumptionLines } : null,
      variances,
      bio_asset_state: bioAssetState || null,
      bio_asset_entries: bioAssetEntries,
    };
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
        rate: dto.rate,
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
    const costTransactions = (batch.transactions || []).filter(
      (t) => t.transaction_type === 'CONSUMPTION' || t.transaction_type === 'OVERHEAD' || t.transaction_type === 'MORTALITY'
    );
    const transactionTotal = costTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const totalCost = inputTotal + transactionTotal;

    for (const line of dto.output_lines) {
      const computedCost = (totalCost * line.cost_split_pct) / 100;
      const unitCost = line.quantity > 0 ? computedCost / line.quantity : 0;

      const ledgerEntry = await this.ledgerService.writePositiveEntry({
        tenantId,
        companyId: batch.company_id,
        itemId: line.item_id,
        documentType: 'BATCH',
        documentNo: batch.batch_no,
        postingDate: dto.actual_end_date || toMysqlTimestamp().slice(0, 10),
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

    const closingQuantity = dto.closing_quantity ?? Number(batch.opening_quantity);
    const unitCost = closingQuantity > 0 ? totalCost / closingQuantity : 0;
    const actualEndDate = dto.actual_end_date || toMysqlTimestamp().slice(0, 10);

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

    if (batch.costing_method === 'STANDARD') {
      await this.computeAndPostVariances(id, batch, closingQuantity, actualEndDate, tenantId, userPayload);
    }

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
   * batch_standard_consumption_line and posts a variance journal per
   * non-zero deviation. Silently no-ops if no standards were set on the
   * batch — variance is an opt-in comparison, not a forced one.
   */
  private async computeAndPostVariances(
    id: string,
    batch: Awaited<ReturnType<BatchService['findOne']>>,
    closingQuantity: number,
    actualEndDate: string,
    tenantId: string,
    userPayload?: any
  ) {
    const [standard] = await this.db.select().from(schema.batchStandard).where(eq(schema.batchStandard.batch_id, id)).limit(1);
    if (!standard) return;

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
    const monthlyRate = (ncaValue - residualTotal) / productiveLifeMonths;
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
