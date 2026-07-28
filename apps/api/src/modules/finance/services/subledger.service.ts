import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, sum, asc, sql, desc, gte, lte } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class SubledgerService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  // --- ACCOUNTS RECEIVABLE (CUSTOMER SUB-LEDGER) ---

  async postCustomerEntry(
    params: {
      company_id: string;
      customer_id: string;
      posting_date: string;
      document_type: string; // INVOICE, PAYMENT, CREDIT_NOTE
      document_no: string;
      amount: number; // positive = debit/invoice, negative = credit/payment
      due_date?: string | null;
      gl_entry_id?: string | null;
    },
    tenantId: string,
    userId?: string,
    tx?: any
  ): Promise<string> {
    const trx = tx || this.db;

    // Verify customer exists in master (Phase 2)
    const [customer] = await trx
      .select()
      .from(schema.customerMaster)
      .where(
        and(
          eq(schema.customerMaster.customer_id, params.customer_id),
          eq(schema.customerMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${params.customer_id}' not found.`);
    }

    const entryId = randomUUID();
    let remainingAmount = params.amount;

    // If it's a payment/credit (negative), automatically match against outstanding invoices
    if (params.amount < 0) {
      let paymentToApply = Math.abs(params.amount);

      // Find outstanding invoices (remaining_amount > 0)
      const outstandingInvoices = await trx
        .select()
        .from(schema.customerLedgerEntry)
        .where(
          and(
            eq(schema.customerLedgerEntry.tenant_id, tenantId),
            eq(schema.customerLedgerEntry.company_id, params.company_id),
            eq(schema.customerLedgerEntry.customer_id, params.customer_id),
            eq(schema.customerLedgerEntry.document_type, 'INVOICE'),
            sql`CAST(remaining_amount AS DECIMAL(18,4)) > 0`
          )
        )
        .orderBy(asc(schema.customerLedgerEntry.posting_date));

      for (const invoice of outstandingInvoices) {
        if (paymentToApply <= 0) break;

        const invRemaining = parseFloat(invoice.remaining_amount);
        const applied = Math.min(paymentToApply, invRemaining);

        // Deduct remaining amount on invoice
        const newInvRemaining = invRemaining - applied;
        await trx
          .update(schema.customerLedgerEntry)
          .set({
            remaining_amount: newInvRemaining.toFixed(4)
          })
          .where(eq(schema.customerLedgerEntry.entry_id, invoice.entry_id));

        paymentToApply -= applied;
      }

      // The remaining unapplied payment amount
      remainingAmount = -paymentToApply;
    } else {
      // If it's a new invoice (positive), check if we have any unapplied payments (remaining_amount < 0)
      let invoiceToApply = params.amount;

      const unappliedPayments = await trx
        .select()
        .from(schema.customerLedgerEntry)
        .where(
          and(
            eq(schema.customerLedgerEntry.tenant_id, tenantId),
            eq(schema.customerLedgerEntry.company_id, params.company_id),
            eq(schema.customerLedgerEntry.customer_id, params.customer_id),
            eq(schema.customerLedgerEntry.document_type, 'PAYMENT'),
            sql`CAST(remaining_amount AS DECIMAL(18,4)) < 0`
          )
        )
        .orderBy(asc(schema.customerLedgerEntry.posting_date));

      for (const payment of unappliedPayments) {
        if (invoiceToApply <= 0) break;

        const payRemaining = Math.abs(parseFloat(payment.remaining_amount));
        const applied = Math.min(invoiceToApply, payRemaining);

        // Reduce remaining unapplied payment (which is negative)
        const newPayRemaining = parseFloat(payment.remaining_amount) + applied;
        await trx
          .update(schema.customerLedgerEntry)
          .set({
            remaining_amount: newPayRemaining.toFixed(4)
          })
          .where(eq(schema.customerLedgerEntry.entry_id, payment.entry_id));

        invoiceToApply -= applied;
      }

      remainingAmount = invoiceToApply;
    }

    const newCustomerLedger = {
      entry_id: entryId,
      tenant_id: tenantId,
      company_id: params.company_id,
      customer_id: params.customer_id,
      posting_date: params.posting_date,
      document_type: params.document_type,
      document_no: params.document_no,
      amount: params.amount.toFixed(4),
      remaining_amount: remainingAmount.toFixed(4),
      due_date: params.due_date || null,
      gl_entry_id: params.gl_entry_id || null,
      created_by: userId || null,
    };

    await trx.insert(schema.customerLedgerEntry).values(newCustomerLedger);

    await this.auditService.log({
      tenantId,
      companyId: params.company_id,
      userId,
      action: 'CREATE',
      entityName: 'customer_ledger_entry',
      entityId: entryId,
      newValues: newCustomerLedger,
    });

    return entryId;
  }

  // --- ACCOUNTS PAYABLE (SUPPLIER SUB-LEDGER) ---

  async postSupplierEntry(
    params: {
      company_id: string;
      supplier_id: string;
      posting_date: string;
      document_type: string; // INVOICE, PAYMENT, DEBIT_NOTE
      document_no: string;
      amount: number; // negative = credit/invoice, positive = debit/payment
      due_date?: string | null;
      gl_entry_id?: string | null;
    },
    tenantId: string,
    userId?: string,
    tx?: any
  ): Promise<string> {
    const trx = tx || this.db;

    // Verify supplier exists (Phase 2)
    const [supplier] = await trx
      .select()
      .from(schema.supplierMaster)
      .where(
        and(
          eq(schema.supplierMaster.supplier_id, params.supplier_id),
          eq(schema.supplierMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID '${params.supplier_id}' not found.`);
    }

    const entryId = randomUUID();
    let remainingAmount = params.amount;

    // If it's a payment (positive), automatically match against outstanding bills (negative remaining_amount)
    if (params.amount > 0) {
      let paymentToApply = params.amount;

      const outstandingBills = await trx
        .select()
        .from(schema.supplierLedgerEntry)
        .where(
          and(
            eq(schema.supplierLedgerEntry.tenant_id, tenantId),
            eq(schema.supplierLedgerEntry.company_id, params.company_id),
            eq(schema.supplierLedgerEntry.supplier_id, params.supplier_id),
            eq(schema.supplierLedgerEntry.document_type, 'INVOICE'),
            sql`CAST(remaining_amount AS DECIMAL(18,4)) < 0`
          )
        )
        .orderBy(asc(schema.supplierLedgerEntry.posting_date));

      for (const bill of outstandingBills) {
        if (paymentToApply <= 0) break;

        const billRemaining = Math.abs(parseFloat(bill.remaining_amount));
        const applied = Math.min(paymentToApply, billRemaining);

        // Reduce bill remaining (which is negative)
        const newBillRemaining = parseFloat(bill.remaining_amount) + applied;
        await trx
          .update(schema.supplierLedgerEntry)
          .set({
            remaining_amount: newBillRemaining.toFixed(4)
          })
          .where(eq(schema.supplierLedgerEntry.entry_id, bill.entry_id));

        paymentToApply -= applied;
      }

      remainingAmount = paymentToApply;
    } else {
      // If it's a new bill (negative), check if we have any unapplied payments (positive remaining_amount)
      let billToApply = Math.abs(params.amount);

      const unappliedPayments = await trx
        .select()
        .from(schema.supplierLedgerEntry)
        .where(
          and(
            eq(schema.supplierLedgerEntry.tenant_id, tenantId),
            eq(schema.supplierLedgerEntry.company_id, params.company_id),
            eq(schema.supplierLedgerEntry.supplier_id, params.supplier_id),
            eq(schema.supplierLedgerEntry.document_type, 'PAYMENT'),
            sql`CAST(remaining_amount AS DECIMAL(18,4)) > 0`
          )
        )
        .orderBy(asc(schema.supplierLedgerEntry.posting_date));

      for (const payment of unappliedPayments) {
        if (billToApply <= 0) break;

        const payRemaining = parseFloat(payment.remaining_amount);
        const applied = Math.min(billToApply, payRemaining);

        const newPayRemaining = payRemaining - applied;
        await trx
          .update(schema.supplierLedgerEntry)
          .set({
            remaining_amount: newPayRemaining.toFixed(4)
          })
          .where(eq(schema.supplierLedgerEntry.entry_id, payment.entry_id));

        billToApply -= applied;
      }

      remainingAmount = -billToApply;
    }

    const newSupplierLedger = {
      entry_id: entryId,
      tenant_id: tenantId,
      company_id: params.company_id,
      supplier_id: params.supplier_id,
      posting_date: params.posting_date,
      document_type: params.document_type,
      document_no: params.document_no,
      amount: params.amount.toFixed(4),
      remaining_amount: remainingAmount.toFixed(4),
      due_date: params.due_date || null,
      gl_entry_id: params.gl_entry_id || null,
      created_by: userId || null,
    };

    await trx.insert(schema.supplierLedgerEntry).values(newSupplierLedger);

    await this.auditService.log({
      tenantId,
      companyId: params.company_id,
      userId,
      action: 'CREATE',
      entityName: 'supplier_ledger_entry',
      entityId: entryId,
      newValues: newSupplierLedger,
    });

    return entryId;
  }

  // --- SUB-LEDGER BALANCES & AGING REPORTS ---

  async getCustomerBalance(customerId: string, tenantId: string): Promise<number> {
    const [result] = await this.db
      .select({
        balance: sum(schema.customerLedgerEntry.remaining_amount)
      })
      .from(schema.customerLedgerEntry)
      .where(
        and(
          eq(schema.customerLedgerEntry.customer_id, customerId),
          eq(schema.customerLedgerEntry.tenant_id, tenantId)
        )
      );

    return result?.balance ? parseFloat(result.balance) : 0;
  }

  async getSupplierBalance(supplierId: string, tenantId: string): Promise<number> {
    const [result] = await this.db
      .select({
        balance: sum(schema.supplierLedgerEntry.remaining_amount)
      })
      .from(schema.supplierLedgerEntry)
      .where(
        and(
          eq(schema.supplierLedgerEntry.supplier_id, supplierId),
          eq(schema.supplierLedgerEntry.tenant_id, tenantId)
        )
      );

    return result?.balance ? parseFloat(result.balance) : 0;
  }

  async getCustomerAging(companyId: string, asOfDate: string, tenantId: string) {
    const entries = await this.db
      .select()
      .from(schema.customerLedgerEntry)
      .where(
        and(
          eq(schema.customerLedgerEntry.tenant_id, tenantId),
          eq(schema.customerLedgerEntry.company_id, companyId),
          sql`CAST(remaining_amount AS DECIMAL(18,4)) > 0`
        )
      );

    return this.calculateAging(entries, asOfDate);
  }

  async getSupplierAging(companyId: string, asOfDate: string, tenantId: string) {
    const entries = await this.db
      .select()
      .from(schema.supplierLedgerEntry)
      .where(
        and(
          eq(schema.supplierLedgerEntry.tenant_id, tenantId),
          eq(schema.supplierLedgerEntry.company_id, companyId),
          sql`CAST(remaining_amount AS DECIMAL(18,4)) < 0`
        )
      );

    return this.calculateAging(entries, asOfDate);
  }

  private calculateAging(entries: any[], asOfDate: string) {
    const asOf = new Date(asOfDate);
    const report = {
      current: 0,
      days_30: 0,
      days_60: 0,
      days_90: 0,
      over_90: 0,
      total: 0
    };

    for (const ent of entries) {
      const remaining = Math.abs(parseFloat(ent.remaining_amount));
      const dueDateStr = ent.due_date || ent.posting_date;
      const due = new Date(dueDateStr);
      const diffMs = asOf.getTime() - due.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        report.current += remaining;
      } else if (diffDays <= 30) {
        report.days_30 += remaining;
      } else if (diffDays <= 60) {
        report.days_60 += remaining;
      } else if (diffDays <= 90) {
        report.days_90 += remaining;
      } else {
        report.over_90 += remaining;
      }
      report.total += remaining;
    }

    return report;
  }

  async getCustomerLedgerEntries(
    params: {
      customerId: string;
      companyId: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
    tenantId: string
  ) {
    const conditions = [
      eq(schema.customerLedgerEntry.tenant_id, tenantId),
      eq(schema.customerLedgerEntry.company_id, params.companyId),
      eq(schema.customerLedgerEntry.customer_id, params.customerId),
    ];

    if (params.startDate) {
      conditions.push(gte(schema.customerLedgerEntry.posting_date, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lte(schema.customerLedgerEntry.posting_date, params.endDate));
    }

    const limit = params.limit ? Number(params.limit) : 50;
    const offset = params.offset ? Number(params.offset) : 0;

    const entries = await this.db
      .select({
        entry_id: schema.customerLedgerEntry.entry_id,
        tenant_id: schema.customerLedgerEntry.tenant_id,
        company_id: schema.customerLedgerEntry.company_id,
        customer_id: schema.customerLedgerEntry.customer_id,
        customer_code: schema.customerMaster.customer_code,
        customer_name: schema.customerMaster.customer_name,
        posting_date: schema.customerLedgerEntry.posting_date,
        document_type: schema.customerLedgerEntry.document_type,
        document_no: schema.customerLedgerEntry.document_no,
        amount: schema.customerLedgerEntry.amount,
        remaining_amount: schema.customerLedgerEntry.remaining_amount,
        due_date: schema.customerLedgerEntry.due_date,
        created_at: schema.customerLedgerEntry.created_at,
      })
      .from(schema.customerLedgerEntry)
      .innerJoin(schema.customerMaster, eq(schema.customerLedgerEntry.customer_id, schema.customerMaster.customer_id))
      .where(and(...conditions))
      .orderBy(desc(schema.customerLedgerEntry.posting_date), desc(schema.customerLedgerEntry.created_at))
      .limit(limit)
      .offset(offset);

    const [totals] = await this.db
      .select({
        totalAmount: sum(schema.customerLedgerEntry.amount),
        totalRemaining: sum(schema.customerLedgerEntry.remaining_amount),
      })
      .from(schema.customerLedgerEntry)
      .where(and(...conditions));

    return {
      customerId: params.customerId,
      entries,
      totalAmount: totals?.totalAmount ? parseFloat(totals.totalAmount) : 0,
      totalRemaining: totals?.totalRemaining ? parseFloat(totals.totalRemaining) : 0,
      limit,
      offset,
    };
  }

  async getSupplierLedgerEntries(
    params: {
      supplierId: string;
      companyId: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    },
    tenantId: string
  ) {
    const conditions = [
      eq(schema.supplierLedgerEntry.tenant_id, tenantId),
      eq(schema.supplierLedgerEntry.company_id, params.companyId),
      eq(schema.supplierLedgerEntry.supplier_id, params.supplierId),
    ];

    if (params.startDate) {
      conditions.push(gte(schema.supplierLedgerEntry.posting_date, params.startDate));
    }
    if (params.endDate) {
      conditions.push(lte(schema.supplierLedgerEntry.posting_date, params.endDate));
    }

    const limit = params.limit ? Number(params.limit) : 50;
    const offset = params.offset ? Number(params.offset) : 0;

    const entries = await this.db
      .select({
        entry_id: schema.supplierLedgerEntry.entry_id,
        tenant_id: schema.supplierLedgerEntry.tenant_id,
        company_id: schema.supplierLedgerEntry.company_id,
        supplier_id: schema.supplierLedgerEntry.supplier_id,
        supplier_code: schema.supplierMaster.supplier_code,
        supplier_name: schema.supplierMaster.supplier_name,
        posting_date: schema.supplierLedgerEntry.posting_date,
        document_type: schema.supplierLedgerEntry.document_type,
        document_no: schema.supplierLedgerEntry.document_no,
        amount: schema.supplierLedgerEntry.amount,
        remaining_amount: schema.supplierLedgerEntry.remaining_amount,
        due_date: schema.supplierLedgerEntry.due_date,
        created_at: schema.supplierLedgerEntry.created_at,
      })
      .from(schema.supplierLedgerEntry)
      .innerJoin(schema.supplierMaster, eq(schema.supplierLedgerEntry.supplier_id, schema.supplierMaster.supplier_id))
      .where(and(...conditions))
      .orderBy(desc(schema.supplierLedgerEntry.posting_date), desc(schema.supplierLedgerEntry.created_at))
      .limit(limit)
      .offset(offset);

    const [totals] = await this.db
      .select({
        totalAmount: sum(schema.supplierLedgerEntry.amount),
        totalRemaining: sum(schema.supplierLedgerEntry.remaining_amount),
      })
      .from(schema.supplierLedgerEntry)
      .where(and(...conditions));

    return {
      supplierId: params.supplierId,
      entries,
      totalAmount: totals?.totalAmount ? parseFloat(totals.totalAmount) : 0,
      totalRemaining: totals?.totalRemaining ? parseFloat(totals.totalRemaining) : 0,
      limit,
      offset,
    };
  }
}
