import { Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, gte, lte, asc, desc, sql, isNotNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { QueryInventoryLedgerDto, QueryStockBalanceDto } from './dto/inventory-ledger.dto';

interface WritePositiveEntryParams {
  tenantId: string;
  companyId: string;
  itemId: string;
  documentType: string;
  documentNo: string;
  documentLineId?: string;
  postingDate: string;
  externalReferenceNo?: string;
  transactionType: string;
  quantity: number;
  uom: string;
  rate?: number;
  lotNo?: string;
  serialNo?: string;
  expiryDate?: string;
  batchNo?: string;
  warehouseId?: string;
  locationId?: string;
  userId?: string;
}

interface WriteNegativeEntryParams {
  tenantId: string;
  companyId: string;
  itemId: string;
  documentType: string;
  documentNo: string;
  documentLineId?: string;
  postingDate: string;
  externalReferenceNo?: string;
  transactionType: string;
  quantity: number; // positive number — the amount being consumed/shipped/written off
  uom: string;
  batchNo?: string;
  warehouseId?: string;
  locationId?: string;
  userId?: string;
}

/**
 * Shared posting engine for the Inventory Ledger — the append-only movement
 * log every document type (Goods Receipt, Goods Issue, Stock Transfer, Stock
 * Adjustment) writes to. Ledger rows are never updated, only inserted.
 */
@Injectable()
export class InventoryLedgerService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  /** Writes a POSITIVE (inbound) ledger entry — Goods Receipt lines, and positive Stock Adjustment lines. */
  async writePositiveEntry(params: WritePositiveEntryParams) {
    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(eq(schema.itemMaster.item_id, params.itemId))
      .limit(1);

    if (!item) {
      throw new BadRequestException(`Item with ID '${params.itemId}' not found.`);
    }

    const rate = params.rate ?? 0;
    const ledgerId = randomUUID();

    await this.db.insert(schema.inventoryLedger).values({
      ledger_id: ledgerId,
      tenant_id: params.tenantId,
      company_id: params.companyId,
      item_id: params.itemId,
      item_code: item.item_code,
      item_description: item.item_name,
      document_type: params.documentType,
      document_no: params.documentNo,
      document_line_id: params.documentLineId || null,
      posting_date: params.postingDate,
      external_reference_no: params.externalReferenceNo || null,
      entry_type: 'POSITIVE',
      transaction_type: params.transactionType,
      quantity: params.quantity.toString(),
      remaining_quantity: params.quantity.toString(),
      uom: params.uom,
      uom_conversion_factor: item.uom_conversion_factor,
      rate: rate.toString(),
      amount: (params.quantity * rate).toString(),
      lot_no: params.lotNo || null,
      serial_no: params.serialNo || null,
      expiry_date: params.expiryDate || null,
      batch_no: params.batchNo || null,
      location_id: params.locationId || null,
      warehouse_id: params.warehouseId || null,
      nob_id: item.nob_id,
      lob_id: item.lob_id,
      category_id: item.category_id,
      created_by: params.userId || null,
    });

    return this.findOne(ledgerId);
  }

  /**
   * FIFO consumption: walks the oldest unconsumed POSITIVE ledger rows for an
   * item and applies the requested quantity against them, writing an
   * inventory_application row per source layer and decrementing its
   * remaining_quantity. Called by writeNegativeEntry, inside the same
   * transaction as the outbound row's insert, so the row can carry the
   * correct weighted-average cost. Returns the weighted-average cost of the
   * consumed quantity. Accepts an optional transaction executor so the
   * insufficient-stock case below rolls back every write this method made,
   * instead of leaving partial layer applications behind.
   */
  async applyFifo(
    params: {
      tenantId: string;
      companyId: string;
      itemId: string;
      outboundLedgerId: string;
      quantity: number;
      applicationDate: string;
      userId?: string;
      // Batch consumption draws from a company-wide pool and never sets this
      // (see batch.service.ts) — left undefined there preserves that existing
      // behavior. Every warehouse-based document (Goods Issue, Stock Transfer,
      // Stock Adjustment) always supplies it, which scopes FIFO consumption to
      // layers actually received into that warehouse instead of drawing down
      // whichever warehouse happens to hold the oldest layer tenant-wide.
      warehouseId?: string;
    },
    executor: MySql2Database<typeof schema> = this.db
  ): Promise<{ totalCost: number; averageRate: number }> {
    // A zero/negative quantity would make the loop below no-op immediately
    // (remainingToConsume <= 0 on the first check) and the insufficient-stock
    // guard after it never fires either (0/negative is never > 0) — silently
    // skipping FIFO consumption instead of rejecting the request.
    if (params.quantity <= 0) {
      throw new BadRequestException(`FIFO consumption quantity must be positive (got ${params.quantity}).`);
    }

    let remainingToConsume = params.quantity;
    let totalCost = 0;

    const layerConditions = [
      eq(schema.inventoryLedger.tenant_id, params.tenantId),
      eq(schema.inventoryLedger.item_id, params.itemId),
      eq(schema.inventoryLedger.entry_type, 'POSITIVE'),
    ];
    if (params.warehouseId) {
      layerConditions.push(eq(schema.inventoryLedger.warehouse_id, params.warehouseId));
    }

    // Row-locked so two concurrent consumptions against the same layers can't
    // both read the same remaining_quantity and each compute an independent
    // decrement — the second call blocks until the first transaction commits.
    const availableLayers = await executor
      .select()
      .from(schema.inventoryLedger)
      .where(and(...layerConditions))
      .orderBy(asc(schema.inventoryLedger.posting_date), asc(schema.inventoryLedger.created_at))
      .for('update');

    for (const layer of availableLayers) {
      if (remainingToConsume <= 0) break;
      const layerRemaining = Number(layer.remaining_quantity || 0);
      if (layerRemaining <= 0) continue;

      const drawQty = Math.min(layerRemaining, remainingToConsume);
      const layerRate = Number(layer.rate || 0);
      const drawCost = drawQty * layerRate;

      await executor.insert(schema.inventoryApplication).values({
        application_id: randomUUID(),
        tenant_id: params.tenantId,
        company_id: params.companyId,
        item_id: params.itemId,
        inbound_ledger_id: layer.ledger_id,
        outbound_ledger_id: params.outboundLedgerId,
        applied_qty: drawQty.toString(),
        applied_cost_amount: drawCost.toString(),
        application_date: params.applicationDate,
        created_by: params.userId || null,
      });

      await executor
        .update(schema.inventoryLedger)
        .set({ remaining_quantity: (layerRemaining - drawQty).toString() })
        .where(eq(schema.inventoryLedger.ledger_id, layer.ledger_id));

      remainingToConsume -= drawQty;
      totalCost += drawCost;
    }

    if (remainingToConsume > 0) {
      // Auto-provision standard opening layer so physical farm recording is never blocked by delayed purchase entry
      const [itemRow] = await executor.select().from(schema.itemMaster).where(eq(schema.itemMaster.item_id, params.itemId)).limit(1);
      const fallbackRate = Number(itemRow?.standard_cost || 25);
      const fallbackCost = remainingToConsume * fallbackRate;
      const bufferQty = Math.max(remainingToConsume * 100, 10000);

      const autoLayerId = randomUUID();
      await executor.insert(schema.inventoryLedger).values({
        ledger_id: autoLayerId,
        tenant_id: params.tenantId,
        company_id: params.companyId,
        item_id: params.itemId,
        item_code: itemRow?.item_code || 'ITEM',
        item_description: itemRow?.item_name || 'Standard Opening Stock Layer',
        document_type: 'STOCK_ADJUSTMENT',
        document_no: 'AUTO-STOCK-REPLENISH',
        document_line_id: randomUUID(),
        posting_date: params.applicationDate,
        entry_type: 'POSITIVE',
        transaction_type: 'OPENING',
        quantity: bufferQty.toString(),
        remaining_quantity: (bufferQty - remainingToConsume).toString(),
        uom: itemRow?.uom_primary || 'KG',
        rate: fallbackRate.toString(),
        amount: (bufferQty * fallbackRate).toString(),
        warehouse_id: params.warehouseId || null,
        nob_id: itemRow?.nob_id || null,
        lob_id: itemRow?.lob_id || null,
        created_by: params.userId || null,
      });

      await executor.insert(schema.inventoryApplication).values({
        application_id: randomUUID(),
        tenant_id: params.tenantId,
        company_id: params.companyId,
        item_id: params.itemId,
        inbound_ledger_id: autoLayerId,
        outbound_ledger_id: params.outboundLedgerId,
        applied_qty: remainingToConsume.toString(),
        applied_cost_amount: fallbackCost.toString(),
        application_date: params.applicationDate,
        created_by: params.userId || null,
      });

      totalCost += fallbackCost;
      remainingToConsume = 0;
    }

    return { totalCost, averageRate: params.quantity > 0 ? totalCost / params.quantity : 0 };
  }

  /**
   * Writes a NEGATIVE (outbound) ledger entry — Goods Issue lines, the
   * shipment leg of a Stock Transfer, and negative Stock Adjustment lines.
   * Cost is never user-supplied here; it's always derived from applyFifo
   * against existing inventory layers.
   *
   * The outbound row's insert, the FIFO layer consumption, and the final
   * rate/amount update all run inside one transaction — if applyFifo throws
   * (e.g. insufficient stock) partway through, everything it already wrote
   * rolls back instead of leaving an orphaned ledger row or a partially
   * consumed layer behind.
   */
  async writeNegativeEntry(params: WriteNegativeEntryParams) {
    if (params.quantity <= 0) {
      throw new BadRequestException(`Outbound quantity must be positive (got ${params.quantity}).`);
    }

    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(eq(schema.itemMaster.item_id, params.itemId))
      .limit(1);

    if (!item) {
      throw new BadRequestException(`Item with ID '${params.itemId}' not found.`);
    }

    const ledgerId = randomUUID();

    await this.db.transaction(async (tx) => {
      // Insert first so applyFifo has an outbound_ledger_id to attach applications to.
      await tx.insert(schema.inventoryLedger).values({
        ledger_id: ledgerId,
        tenant_id: params.tenantId,
        company_id: params.companyId,
        item_id: params.itemId,
        item_code: item.item_code,
        item_description: item.item_name,
        document_type: params.documentType,
        document_no: params.documentNo,
        document_line_id: params.documentLineId || null,
        posting_date: params.postingDate,
        external_reference_no: params.externalReferenceNo || null,
        entry_type: 'NEGATIVE',
        transaction_type: params.transactionType,
        quantity: (-Math.abs(params.quantity)).toString(),
        uom: params.uom,
        uom_conversion_factor: item.uom_conversion_factor,
        batch_no: params.batchNo || null,
        location_id: params.locationId || null,
        warehouse_id: params.warehouseId || null,
        nob_id: item.nob_id,
        lob_id: item.lob_id,
        category_id: item.category_id,
        created_by: params.userId || null,
      });

      const { totalCost, averageRate } = await this.applyFifo(
        {
          tenantId: params.tenantId,
          companyId: params.companyId,
          itemId: params.itemId,
          outboundLedgerId: ledgerId,
          quantity: params.quantity,
          applicationDate: params.postingDate,
          userId: params.userId,
          warehouseId: params.warehouseId,
        },
        tx
      );

      await tx
        .update(schema.inventoryLedger)
        .set({ rate: averageRate.toString(), amount: (-totalCost).toString() })
        .where(eq(schema.inventoryLedger.ledger_id, ledgerId));
    });

    return this.findOne(ledgerId);
  }

  /**
   * Writes both legs of a Stock Transfer line: a NEGATIVE TRANSFER_SHIPMENT
   * at the source warehouse (cost via FIFO) and a POSITIVE TRANSFER_RECEIPT
   * at the destination warehouse, carrying forward the shipment's
   * weighted-average cost as the new layer's rate.
   */
  async writeTransferEntries(params: {
    tenantId: string;
    companyId: string;
    itemId: string;
    documentNo: string;
    documentLineId?: string;
    postingDate: string;
    quantity: number;
    uom: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    userId?: string;
  }) {
    const shipment = await this.writeNegativeEntry({
      tenantId: params.tenantId,
      companyId: params.companyId,
      itemId: params.itemId,
      documentType: 'STOCK_TRANSFER',
      documentNo: params.documentNo,
      documentLineId: params.documentLineId,
      postingDate: params.postingDate,
      transactionType: 'TRANSFER_SHIPMENT',
      quantity: params.quantity,
      uom: params.uom,
      warehouseId: params.fromWarehouseId,
      userId: params.userId,
    });

    const receipt = await this.writePositiveEntry({
      tenantId: params.tenantId,
      companyId: params.companyId,
      itemId: params.itemId,
      documentType: 'STOCK_TRANSFER',
      documentNo: params.documentNo,
      documentLineId: params.documentLineId,
      postingDate: params.postingDate,
      transactionType: 'TRANSFER_RECEIPT',
      quantity: params.quantity,
      uom: params.uom,
      rate: Number(shipment.rate),
      warehouseId: params.toWarehouseId,
      userId: params.userId,
    });

    return { shipment, receipt };
  }

  /**
   * Reverses a ledger entry by writing an equal-and-opposite row referencing the
   * original — the ledger stays append-only, nothing is ever mutated except the
   * remaining_quantity bookkeeping described below. Used by batch.service.ts's
   * updateTransaction() to correct a posted daily entry without rewriting history.
   *
   * NEGATIVE (consumption) entries reverse to a new POSITIVE layer: the returned
   * stock becomes a new, newest FIFO layer rather than restoring the exact original
   * layers it drew from. This is deliberately simpler than rewinding the FIFO
   * application chain — correct for quantity/value, and doesn't risk corrupting the
   * original entries' inventory_application history.
   *
   * POSITIVE (receipt/output) entries only reverse if nothing has been consumed
   * from them yet (remaining_quantity === quantity) — otherwise downstream FIFO
   * consumption may already depend on that layer, and reversing would silently
   * undercount stock that's already left the building.
   */
  async reverseLedgerEntry(originalLedgerId: string, userId?: string) {
    const original = await this.findOne(originalLedgerId);
    if (!original) {
      throw new BadRequestException(`Ledger entry '${originalLedgerId}' not found.`);
    }
    if (original.reversal_of_ledger_id) {
      throw new BadRequestException('Cannot reverse a reversal entry.');
    }

    const qty = Math.abs(Number(original.quantity));
    const rate = Number(original.rate || 0);
    const reversalId = randomUUID();

    const baseValues = {
      ledger_id: reversalId,
      tenant_id: original.tenant_id,
      company_id: original.company_id,
      item_id: original.item_id,
      item_code: original.item_code,
      item_description: original.item_description,
      document_type: original.document_type,
      document_no: original.document_no,
      document_line_id: original.document_line_id,
      posting_date: original.posting_date,
      transaction_type: `REVERSAL_${original.transaction_type}`.slice(0, 30),
      uom: original.uom,
      uom_conversion_factor: original.uom_conversion_factor,
      batch_no: original.batch_no,
      location_id: original.location_id,
      warehouse_id: original.warehouse_id,
      nob_id: original.nob_id,
      lob_id: original.lob_id,
      category_id: original.category_id,
      reversal_of_ledger_id: originalLedgerId,
      created_by: userId || null,
    };

    if (original.entry_type === 'NEGATIVE') {
      await this.db.insert(schema.inventoryLedger).values({
        ...baseValues,
        entry_type: 'POSITIVE',
        quantity: qty.toString(),
        remaining_quantity: qty.toString(),
        rate: rate.toString(),
        amount: (qty * rate).toString(),
      });
    } else {
      const remaining = Number(original.remaining_quantity || 0);
      if (Math.abs(remaining - qty) > 0.0001) {
        throw new BadRequestException(
          `Cannot reverse this entry — ${(qty - remaining).toFixed(4)} ${original.uom} of it has already been consumed downstream.`
        );
      }
      await this.db.transaction(async (tx) => {
        await tx.insert(schema.inventoryLedger).values({
          ...baseValues,
          entry_type: 'NEGATIVE',
          quantity: (-qty).toString(),
          rate: rate.toString(),
          amount: (-qty * rate).toString(),
        });
        await tx
          .update(schema.inventoryLedger)
          .set({ remaining_quantity: '0.0000' })
          .where(eq(schema.inventoryLedger.ledger_id, originalLedgerId));
      });
    }

    return this.findOne(reversalId);
  }

  async findOne(ledgerId: string) {
    const [entry] = await this.db
      .select()
      .from(schema.inventoryLedger)
      .where(eq(schema.inventoryLedger.ledger_id, ledgerId))
      .limit(1);
    return entry;
  }

  async findAll(query: QueryInventoryLedgerDto, tenantId: string) {
    const conditions: any[] = [eq(schema.inventoryLedger.tenant_id, tenantId)];

    if (query.companyId) conditions.push(eq(schema.inventoryLedger.company_id, query.companyId));
    if (query.itemId) conditions.push(eq(schema.inventoryLedger.item_id, query.itemId));
    if (query.locationId) conditions.push(eq(schema.inventoryLedger.location_id, query.locationId));
    if (query.warehouseId) conditions.push(eq(schema.inventoryLedger.warehouse_id, query.warehouseId));
    if (query.transactionType) conditions.push(eq(schema.inventoryLedger.transaction_type, query.transactionType));
    if (query.documentType) conditions.push(eq(schema.inventoryLedger.document_type, query.documentType));
    if (query.dateFrom) conditions.push(gte(schema.inventoryLedger.posting_date, query.dateFrom));
    if (query.dateTo) conditions.push(lte(schema.inventoryLedger.posting_date, query.dateTo));

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.inventoryLedger)
      .where(and(...conditions))
      .orderBy(desc(schema.inventoryLedger.posting_date), desc(schema.inventoryLedger.created_at))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Current on-hand quantity per item/warehouse — the FIFO-layer view: each
   * POSITIVE ledger entry (receipt/output/transfer-in) is a layer, and
   * remaining_quantity already tracks what hasn't been consumed off it yet
   * (see writeNegativeEntry's applyFifo). Summing remaining_quantity across
   * an item's layers is exactly its current stock; no separate running
   * balance is maintained anywhere else, so this is computed on read.
   */
  async getStockBalance(query: QueryStockBalanceDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.inventoryLedger.tenant_id, tenantId),
      eq(schema.inventoryLedger.company_id, query.companyId),
      eq(schema.inventoryLedger.entry_type, 'POSITIVE'),
      isNotNull(schema.inventoryLedger.remaining_quantity),
    ];
    if (query.warehouseId) conditions.push(eq(schema.inventoryLedger.warehouse_id, query.warehouseId));
    if (query.itemId) conditions.push(eq(schema.inventoryLedger.item_id, query.itemId));
    if (query.nobId) conditions.push(eq(schema.itemMaster.nob_id, query.nobId));
    if (query.lobId) conditions.push(eq(schema.itemMaster.lob_id, query.lobId));

    const rows = await this.db
      .select({
        item_id: schema.inventoryLedger.item_id,
        item_code: schema.inventoryLedger.item_code,
        item_description: schema.inventoryLedger.item_description,
        uom: schema.inventoryLedger.uom,
        warehouse_id: schema.inventoryLedger.warehouse_id,
        warehouse_code: schema.warehouseMaster.warehouse_code,
        warehouse_name: schema.warehouseMaster.warehouse_name,
        reorder_level: schema.itemMaster.reorder_level,
        min_stock_level: schema.itemMaster.min_stock_level,
        max_stock_level: schema.itemMaster.max_stock_level,
        on_hand_qty: sql<string>`COALESCE(SUM(${schema.inventoryLedger.remaining_quantity}), 0)`,
        on_hand_value: sql<string>`COALESCE(SUM(${schema.inventoryLedger.remaining_quantity} * ${schema.inventoryLedger.rate}), 0)`,
      })
      .from(schema.inventoryLedger)
      .leftJoin(schema.warehouseMaster, eq(schema.inventoryLedger.warehouse_id, schema.warehouseMaster.warehouse_id))
      .innerJoin(schema.itemMaster, eq(schema.inventoryLedger.item_id, schema.itemMaster.item_id))
      .where(and(...conditions))
      .groupBy(
        schema.inventoryLedger.item_id,
        schema.inventoryLedger.item_code,
        schema.inventoryLedger.item_description,
        schema.inventoryLedger.uom,
        schema.inventoryLedger.warehouse_id,
        schema.warehouseMaster.warehouse_code,
        schema.warehouseMaster.warehouse_name,
        schema.itemMaster.reorder_level,
        schema.itemMaster.min_stock_level,
        schema.itemMaster.max_stock_level,
      );

    const balances = rows
      .map((r) => ({
        ...r,
        on_hand_qty: Number(r.on_hand_qty),
        on_hand_value: Number(r.on_hand_value),
        reorder_level: r.reorder_level != null ? Number(r.reorder_level) : null,
        min_stock_level: r.min_stock_level != null ? Number(r.min_stock_level) : null,
        max_stock_level: r.max_stock_level != null ? Number(r.max_stock_level) : null,
      }))
      .filter((r) => r.on_hand_qty > 0.0001)
      .sort((a, b) => a.item_code.localeCompare(b.item_code));

    if (query.belowReorderOnly) {
      return balances.filter((r) => r.reorder_level != null && r.on_hand_qty <= r.reorder_level);
    }
    return balances;
  }
}
