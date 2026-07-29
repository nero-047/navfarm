import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateJournalDto, QueryJournalDto } from '../dto/journal.dto';
import { LedgerService } from './ledger.service';
import { DimensionService } from './dimension.service';
import { AuditLogService } from '../../../platform-identity/audit-log/audit-log.service';

@Injectable()
export class JournalService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: LedgerService,
    private readonly dimService: DimensionService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async create(dto: CreateJournalDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Duplicate check for journal number
      const journalNo = dto.journal_no?.trim() || `JNL-${randomUUID().substring(0, 8).toUpperCase()}`;
      const [existing] = await trx
        .select()
        .from(schema.financialJournal)
        .where(
          and(
            eq(schema.financialJournal.tenant_id, tenantId),
            eq(schema.financialJournal.journal_no, journalNo),
            isNull(schema.financialJournal.deleted_at)
          )
        )
        .limit(1);
      if (existing) {
        throw new ConflictException(`Financial Journal number '${journalNo}' already exists.`);
      }

      // 3. Balance verification (Sum(Debits) == Sum(Credits))
      let totalDr = 0;
      let totalCr = 0;

      if (!dto.lines || dto.lines.length === 0) {
        throw new BadRequestException('Journal must contain at least one line.');
      }

      for (const line of dto.lines) {
        const dr = line.debit || 0;
        const cr = line.credit || 0;
        if (dr < 0 || cr < 0) {
          throw new BadRequestException('Debit and Credit amounts must be non-negative.');
        }
        totalDr += dr;
        totalCr += cr;

        // Perform basic validations for active cost centers and dimensions
        if (line.cost_center_id) {
          await this.dimService.validateCostCenter(line.cost_center_id, dto.company_id, tenantId, trx);
        }
        if (line.dimension_values) {
          await this.dimService.validateDimensionValues(dto.company_id, line.dimension_values, tenantId, trx);
        }
      }

      // Allow a tiny floating point buffer (e.g. 0.0001) for currency fractions
      if (Math.abs(totalDr - totalCr) > 0.0001) {
        throw new BadRequestException(
          `Journal is out of balance. Total Debits: ${totalDr.toFixed(4)}, Total Credits: ${totalCr.toFixed(4)}. Difference: ${Math.abs(totalDr - totalCr).toFixed(4)}`
        );
      }

      const journalId = randomUUID();
      const newJournal = {
        journal_id: journalId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        journal_no: journalNo,
        journal_type: dto.journal_type,
        posting_date: dto.posting_date,
        status: 'DRAFT',
        notes: dto.notes || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.financialJournal).values(newJournal);

      // Create lines
      for (const line of dto.lines) {
        await trx.insert(schema.financialJournalLine).values({
          line_id: randomUUID(),
          journal_id: journalId,
          gl_account_id: line.gl_account_id,
          debit: (line.debit || 0).toFixed(4),
          credit: (line.credit || 0).toFixed(4),
          description: line.description || null,
          cost_center_id: line.cost_center_id || null,
          dimension_values: line.dimension_values || null,
          ref_doc_type: line.ref_doc_type || null,
          ref_doc_id: line.ref_doc_id || null,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'financial_journal',
        entityId: journalId,
        newValues: newJournal,
      });

      return this.findOne(journalId, tenantId, trx);
    });
  }

  async post(journalId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const journal = await this.findOne(journalId, tenantId, trx);
      if (journal.status !== 'DRAFT') {
        throw new ConflictException(`Financial Journal is already in status ${journal.status}.`);
      }

      // Verify lock periods again in case of delayed posting
      // (LedgerService.postEntry will validate this on each line, but doing a header validate is cleaner)
      await this.db.select().from(schema.financialJournal).where(eq(schema.financialJournal.journal_id, journalId));

      // Loop lines and write GL Entries
      for (const line of journal.lines) {
        await this.ledgerService.postEntry(
          {
            company_id: journal.company_id,
            gl_account_id: line.gl_account_id,
            debit: line.debit,
            credit: line.credit,
            posting_date: journal.posting_date,
            cost_center_id: line.cost_center_id,
            dimension_values: line.dimension_values as Record<string, string>,
            ref_doc_type: 'FinancialJournal',
            ref_doc_id: journalId,
            ref_doc_line_id: line.line_id,
            notes: line.description,
          },
          tenantId,
          userId,
          trx
        );
      }

      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.financialJournal)
        .set({
          status: 'POSTED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.financialJournal.journal_id, journalId));

      await this.auditService.log({
        tenantId,
        companyId: journal.company_id,
        userId,
        action: 'POST',
        entityName: 'financial_journal',
        entityId: journalId,
        oldValues: journal,
        newValues: { ...journal, status: 'POSTED' },
      });

      return { success: true, message: 'Financial Journal posted to General Ledger successfully.' };
    });
  }

  async findOne(journalId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [journal] = await dbClient
      .select()
      .from(schema.financialJournal)
      .where(
        and(
          eq(schema.financialJournal.journal_id, journalId),
          eq(schema.financialJournal.tenant_id, tenantId),
          isNull(schema.financialJournal.deleted_at)
        )
      )
      .limit(1);

    if (!journal) {
      throw new NotFoundException(`Financial Journal with ID '${journalId}' not found.`);
    }

    const lines = await dbClient
      .select()
      .from(schema.financialJournalLine)
      .where(eq(schema.financialJournalLine.journal_id, journalId));

    return {
      ...journal,
      lines: lines.map(l => ({
        ...l,
        debit: parseFloat(l.debit),
        credit: parseFloat(l.credit),
        cost_center_id: l.cost_center_id || null,
        dimension_values: l.dimension_values || null,
      })),
    };
  }

  async findAll(query: QueryJournalDto, tenantId: string) {
    const conditions = [
      eq(schema.financialJournal.tenant_id, tenantId),
      isNull(schema.financialJournal.deleted_at)
    ];

    if (query.companyId) {
      conditions.push(eq(schema.financialJournal.company_id, query.companyId));
    }
    if (query.status) {
      conditions.push(eq(schema.financialJournal.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.financialJournal.journal_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.financialJournal)
      .where(and(...conditions));
  }
}
