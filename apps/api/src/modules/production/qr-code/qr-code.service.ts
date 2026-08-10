import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateQrCodeDto, QueryQrCodeDto } from './dto/qr-code.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

@Injectable()
export class QrCodeService {
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

  private async generatePackNo(tenantId: string, companyId: string): Promise<string> {
    const [row] = await this.db
      .select({ total: count() })
      .from(schema.qrCodeMaster)
      .where(and(eq(schema.qrCodeMaster.tenant_id, tenantId), eq(schema.qrCodeMaster.company_id, companyId)));
    const seq = Number(row?.total || 0) + 1;
    return `PACK-${String(seq).padStart(6, '0')}`;
  }

  /** Walks batch_input_line.source_batch_id recursively — the exact traceability chain Phase 5 built. */
  private async buildOriginChain(batchId: string): Promise<any> {
    const [batch] = await this.db.select().from(schema.batchHeader).where(eq(schema.batchHeader.batch_id, batchId)).limit(1);
    if (!batch) return null;

    const inputLines = await this.db.select().from(schema.batchInputLine).where(eq(schema.batchInputLine.batch_id, batchId));
    const parents: any[] = [];
    for (const line of inputLines) {
      if (!line.source_batch_id) continue;
      const parentChain = await this.buildOriginChain(line.source_batch_id);
      if (parentChain) parents.push(parentChain);
    }

    return {
      batch_no: batch.batch_no,
      costing_method: batch.costing_method,
      start_date: batch.start_date,
      ...(parents.length > 0 ? { parents } : {}),
    };
  }

  async create(dto: CreateQrCodeDto, tenantId: string, userPayload?: any) {
    const [item] = await this.db.select().from(schema.itemMaster).where(eq(schema.itemMaster.item_id, dto.item_id)).limit(1);
    if (!item) {
      throw new NotFoundException(`Item with ID '${dto.item_id}' not found.`);
    }
    if (!item.is_qr_enabled) {
      throw new BadRequestException(`Item '${item.item_code}' is not QR-enabled. Enable is_qr_enabled on the item first.`);
    }

    const [batch] = await this.db.select().from(schema.batchHeader).where(eq(schema.batchHeader.batch_id, dto.batch_id)).limit(1);
    if (!batch) {
      throw new NotFoundException(`Batch with ID '${dto.batch_id}' not found.`);
    }

    let breedName: string | null = null;
    if (batch.breed_id) {
      const [breed] = await this.db.select().from(schema.breedMaster).where(eq(schema.breedMaster.breed_id, batch.breed_id)).limit(1);
      breedName = breed?.breed_name || null;
    }

    let qcSummary: any = null;
    let grade: string | null = null;
    if (dto.qc_id) {
      const [qc] = await this.db.select().from(schema.qcBatchDetail).where(eq(schema.qcBatchDetail.qc_id, dto.qc_id)).limit(1);
      if (!qc) {
        throw new NotFoundException(`QC record with ID '${dto.qc_id}' not found.`);
      }
      const qcResults = await this.db.select().from(schema.qcParamResult).where(eq(schema.qcParamResult.qc_id, dto.qc_id));
      const gradedResult = qcResults.find((r) => r.grade_assigned);
      grade = gradedResult?.grade_assigned || null;
      qcSummary = { qc_id: qc.qc_id, overall_result: qc.overall_result, disposition: qc.disposition, qc_date: qc.qc_date };
    }

    const packNo = await this.generatePackNo(tenantId, dto.company_id);
    const expiryDate = item.shelf_life_days ? addDays(dto.production_date, item.shelf_life_days) : null;
    const originChain = await this.buildOriginChain(dto.batch_id);

    let facilityCode: string | null = null;
    if (dto.warehouse_id) {
      const [wh] = await this.db.select().from(schema.warehouseMaster).where(eq(schema.warehouseMaster.warehouse_id, dto.warehouse_id)).limit(1);
      facilityCode = wh?.warehouse_code || null;
    }

    const qrData = {
      pack_no: packNo,
      item_code: item.item_code,
      item_name: item.item_name,
      lot_no: dto.lot_no || null,
      batch_no: batch.batch_no,
      net_weight: dto.net_weight,
      gross_weight: dto.gross_weight || null,
      pack_uom: dto.pack_uom,
      production_date: dto.production_date,
      expiry_date: expiryDate,
      facility_code: facilityCode,
      breed: breedName,
      grade,
      origin_batch_chain: originChain,
      qc: qcSummary,
    };

    const qrId = randomUUID();

    await this.db.insert(schema.qrCodeMaster).values({
      qr_id: qrId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      batch_id: dto.batch_id,
      output_line_id: dto.output_line_id || null,
      qc_id: dto.qc_id || null,
      item_id: dto.item_id,
      lot_no: dto.lot_no || null,
      pack_no: packNo,
      production_date: dto.production_date,
      expiry_date: expiryDate,
      net_weight: dto.net_weight.toString(),
      gross_weight: dto.gross_weight?.toString() || null,
      pack_uom: dto.pack_uom,
      warehouse_id: dto.warehouse_id || null,
      grade,
      origin_batch_chain: originChain,
      breed: breedName,
      qr_data: qrData,
      generated_by: userPayload?.userId || null,
    });

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'qr_code_master',
      entityId: qrId,
      newValues: { pack_no: packNo, ...dto },
    });

    return this.findOne(qrId);
  }

  async findOne(id: string) {
    const [qr] = await this.db.select().from(schema.qrCodeMaster).where(eq(schema.qrCodeMaster.qr_id, id)).limit(1);
    if (!qr) {
      throw new NotFoundException(`QR/Pack with ID '${id}' not found.`);
    }
    return qr;
  }

  async findAll(query: QueryQrCodeDto, tenantId: string) {
    const conditions: any[] = [eq(schema.qrCodeMaster.tenant_id, tenantId)];
    if (query.companyId) conditions.push(eq(schema.qrCodeMaster.company_id, query.companyId));
    if (query.batchId) conditions.push(eq(schema.qrCodeMaster.batch_id, query.batchId));
    if (query.outputLineId) conditions.push(eq(schema.qrCodeMaster.output_line_id, query.outputLineId));

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.qrCodeMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async voidPack(id: string, tenantId: string, userPayload?: any) {
    const qr = await this.findOne(id);

    await this.db.update(schema.qrCodeMaster).set({ is_voided: true }).where(eq(schema.qrCodeMaster.qr_id, id));

    await this.auditService.log({
      tenantId,
      companyId: qr.company_id,
      userId: userPayload?.userId,
      action: 'VOID',
      entityName: 'qr_code_master',
      entityId: id,
      oldValues: qr,
    });

    return { success: true, message: `Pack '${qr.pack_no}' has been voided.` };
  }
}
