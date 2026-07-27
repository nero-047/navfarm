import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, lte, gte, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateFiscalYearDto, QueryFiscalYearDto } from '../dto/fiscal.dto';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class FiscalService {
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

  async createFiscalYear(dto: CreateFiscalYearDto, tenantId: string, userId?: string) {
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

      // 2. Duplicate check for year code
      const [existing] = await trx
        .select()
        .from(schema.fiscalYear)
        .where(
          and(
            eq(schema.fiscalYear.tenant_id, tenantId),
            eq(schema.fiscalYear.company_id, dto.company_id),
            eq(schema.fiscalYear.year_code, dto.year_code),
            isNull(schema.fiscalYear.deleted_at)
          )
        )
        .limit(1);
      if (existing) {
        throw new ConflictException(`Fiscal Year with code '${dto.year_code}' already exists.`);
      }

      const fiscalYearId = randomUUID();
      const newYear = {
        fiscal_year_id: fiscalYearId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        year_code: dto.year_code,
        start_date: dto.start_date,
        end_date: dto.end_date,
        status: 'OPEN',
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.fiscalYear).values(newYear);

      // 3. Automatically generate 12 monthly accounting periods
      const startParts = dto.start_date.split('-');
      const startYear = parseInt(startParts[0]);
      const startMonth = parseInt(startParts[1]) - 1; // 0-indexed month

      for (let i = 1; i <= 12; i++) {
        // First day of period month
        const pStart = new Date(startYear, startMonth + i - 1, 1);
        // Last day of period month (0th day of next month)
        const pEnd = new Date(startYear, startMonth + i, 0);

        // Format to YYYY-MM-DD manually to prevent timezone offsets shifting the date
        const pStartStr = `${pStart.getFullYear()}-${String(pStart.getMonth() + 1).padStart(2, '0')}-01`;
        const pEndStr = `${pEnd.getFullYear()}-${String(pEnd.getMonth() + 1).padStart(2, '0')}-${String(pEnd.getDate()).padStart(2, '0')}`;

        const monthName = pStart.toLocaleString('default', { month: 'long', year: 'numeric' });

        await trx.insert(schema.accountingPeriod).values({
          period_id: randomUUID(),
          tenant_id: tenantId,
          company_id: dto.company_id,
          fiscal_year_id: fiscalYearId,
          period_name: monthName,
          period_no: i,
          start_date: pStartStr,
          end_date: pEndStr,
          is_locked: false,
          created_by: userId || null,
          updated_by: userId || null,
        });
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'fiscal_year',
        entityId: fiscalYearId,
        newValues: newYear,
      });

      return this.findOneFiscalYear(fiscalYearId, tenantId, trx);
    });
  }

  async closePeriod(periodId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const [period] = await trx
        .select()
        .from(schema.accountingPeriod)
        .where(
          and(
            eq(schema.accountingPeriod.period_id, periodId),
            eq(schema.accountingPeriod.tenant_id, tenantId)
          )
        )
        .limit(1);

      if (!period) {
        throw new NotFoundException(`Accounting Period with ID '${periodId}' not found.`);
      }

      await trx
        .update(schema.accountingPeriod)
        .set({
          is_locked: true,
          updated_by: userId || null,
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.accountingPeriod.period_id, periodId));

      await this.auditService.log({
        tenantId,
        companyId: period.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'accounting_period',
        entityId: periodId,
        oldValues: period,
        newValues: { ...period, is_locked: true },
      });

      return { success: true, message: `Accounting period '${period.period_name}' locked successfully.` };
    });
  }

  async reopenPeriod(periodId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const [period] = await trx
        .select()
        .from(schema.accountingPeriod)
        .where(
          and(
            eq(schema.accountingPeriod.period_id, periodId),
            eq(schema.accountingPeriod.tenant_id, tenantId)
          )
        )
        .limit(1);

      if (!period) {
        throw new NotFoundException(`Accounting Period with ID '${periodId}' not found.`);
      }

      await trx
        .update(schema.accountingPeriod)
        .set({
          is_locked: false,
          updated_by: userId || null,
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        })
        .where(eq(schema.accountingPeriod.period_id, periodId));

      await this.auditService.log({
        tenantId,
        companyId: period.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'accounting_period',
        entityId: periodId,
        oldValues: period,
        newValues: { ...period, is_locked: false },
      });

      return { success: true, message: `Accounting period '${period.period_name}' unlocked successfully.` };
    });
  }

  async closeFiscalYear(fiscalYearId: string, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      const year = await this.findOneFiscalYear(fiscalYearId, tenantId, trx);
      if (year.status === 'CLOSED') {
        throw new BadRequestException('Fiscal Year is already closed.');
      }

      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // 1. Lock all periods in this year
      await trx
        .update(schema.accountingPeriod)
        .set({
          is_locked: true,
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.accountingPeriod.fiscal_year_id, fiscalYearId));

      // 2. Set year status to CLOSED
      await trx
        .update(schema.fiscalYear)
        .set({
          status: 'CLOSED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.fiscalYear.fiscal_year_id, fiscalYearId));

      await this.auditService.log({
        tenantId,
        companyId: year.company_id,
        userId,
        action: 'CLOSE_YEAR',
        entityName: 'fiscal_year',
        entityId: fiscalYearId,
        oldValues: year,
        newValues: { ...year, status: 'CLOSED' },
      });

      return { success: true, message: `Fiscal Year '${year.year_code}' closed and all accounting periods locked.` };
    });
  }

  async validatePostingDate(companyId: string, dateStr: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;

    // Find period containing this date
    const [period] = await dbClient
      .select()
      .from(schema.accountingPeriod)
      .where(
        and(
          eq(schema.accountingPeriod.tenant_id, tenantId),
          eq(schema.accountingPeriod.company_id, companyId),
          lte(schema.accountingPeriod.start_date, dateStr),
          gte(schema.accountingPeriod.end_date, dateStr),
          isNull(schema.accountingPeriod.deleted_at)
        )
      )
      .limit(1);

    if (!period) {
      throw new BadRequestException(`No active Accounting Period found for date '${dateStr}' in this company.`);
    }

    if (period.is_locked) {
      throw new BadRequestException(`Cannot post. Accounting Period '${period.period_name}' is locked.`);
    }

    // Check fiscal year status
    const [year] = await dbClient
      .select()
      .from(schema.fiscalYear)
      .where(eq(schema.fiscalYear.fiscal_year_id, period.fiscal_year_id))
      .limit(1);

    if (!year || year.status === 'CLOSED') {
      throw new BadRequestException(`Cannot post. Fiscal Year '${year?.year_code || ''}' is closed.`);
    }

    return {
      fiscalYearId: period.fiscal_year_id,
      periodId: period.period_id,
    };
  }

  async findOneFiscalYear(fiscalYearId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [year] = await dbClient
      .select()
      .from(schema.fiscalYear)
      .where(
        and(
          eq(schema.fiscalYear.fiscal_year_id, fiscalYearId),
          eq(schema.fiscalYear.tenant_id, tenantId),
          isNull(schema.fiscalYear.deleted_at)
        )
      )
      .limit(1);

    if (!year) {
      throw new NotFoundException(`Fiscal Year with ID '${fiscalYearId}' not found.`);
    }

    // Load periods
    const periods = await dbClient
      .select()
      .from(schema.accountingPeriod)
      .where(eq(schema.accountingPeriod.fiscal_year_id, fiscalYearId));

    return {
      ...year,
      periods: periods.sort((a, b) => a.period_no - b.period_no),
    };
  }

  async findAllFiscalYears(query: QueryFiscalYearDto, tenantId: string) {
    const conditions = [
      eq(schema.fiscalYear.tenant_id, tenantId),
      isNull(schema.fiscalYear.deleted_at)
    ];

    if (query.companyId) {
      conditions.push(eq(schema.fiscalYear.company_id, query.companyId));
    }
    if (query.status) {
      conditions.push(eq(schema.fiscalYear.status, query.status));
    }

    return this.db
      .select()
      .from(schema.fiscalYear)
      .where(and(...conditions));
  }
}
