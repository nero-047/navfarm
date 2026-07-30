import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { GenerateQrBarcodeDto } from '../dto/qr-barcode.dto';

@Injectable()
export class QrBarcodeEngineService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async generateQrBarcode(dto: GenerateQrBarcodeDto, tenantId: string) {
    const rawPayload = `${tenantId}:${dto.company_id}:${dto.entity_type}:${dto.entity_id}:${Date.now()}`;
    const hash = createHash('sha256').update(rawPayload).digest('hex').substring(0, 32);

    const qrId = randomUUID();
    const newRecord = {
      qr_id: qrId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      qr_code_hash: `NAV-${dto.barcode_type}-${hash.toUpperCase()}`,
      barcode_type: dto.barcode_type,
      entity_type: dto.entity_type,
      entity_id: dto.entity_id,
      payload_json: dto.payload_metadata || {},
      scanned_count: 0,
    };

    await this.db.insert(schema.qrBarcodeMaster).values(newRecord);
    return newRecord;
  }

  async scanQrCode(qrHash: string, tenantId: string) {
    const [qrRecord] = await this.db
      .select()
      .from(schema.qrBarcodeMaster)
      .where(
        and(
          eq(schema.qrBarcodeMaster.qr_code_hash, qrHash),
          eq(schema.qrBarcodeMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!qrRecord) {
      throw new NotFoundException(`QR/Barcode '${qrHash}' not found or invalid.`);
    }

    await this.db
      .update(schema.qrBarcodeMaster)
      .set({
        scanned_count: qrRecord.scanned_count + 1,
      })
      .where(eq(schema.qrBarcodeMaster.qr_id, qrRecord.qr_id));

    return {
      ...qrRecord,
      scanned_count: qrRecord.scanned_count + 1,
    };
  }

  async getPublicTraceability(qrHash: string) {
    const [qrRecord] = await this.db
      .select()
      .from(schema.qrBarcodeMaster)
      .where(eq(schema.qrBarcodeMaster.qr_code_hash, qrHash))
      .limit(1);

    if (!qrRecord) {
      throw new NotFoundException(`Public QR code '${qrHash}' was not found or is invalid.`);
    }

    // Increment scan count
    await this.db
      .update(schema.qrBarcodeMaster)
      .set({ scanned_count: qrRecord.scanned_count + 1 })
      .where(eq(schema.qrBarcodeMaster.qr_id, qrRecord.qr_id));

    // Resolve public consumer-safe information based on entity type
    let batch: any = null;
    let farm: any = null;
    let inspections: any[] = [];

    if (qrRecord.entity_id) {
      const [b] = await this.db
        .select()
        .from(schema.productionBatch)
        .where(eq(schema.productionBatch.batch_id, qrRecord.entity_id))
        .limit(1);
      batch = b || null;

      if (batch?.farm_id) {
        const [f] = await this.db
          .select()
          .from(schema.farmMaster)
          .where(eq(schema.farmMaster.farm_id, batch.farm_id))
          .limit(1);
        farm = f || null;
      }

      try {
        inspections = await this.db
          .select()
          .from(schema.qualityInspection)
          .where(eq(schema.qualityInspection.batch_id, qrRecord.entity_id));
      } catch {
        inspections = [];
      }
    }

    const inspectionsList = Array.isArray(inspections) ? inspections : [];
    const hasPassed = inspectionsList.some(i => i.overall_result === 'PASSED');
    const hasQuarantine = inspectionsList.some(i => i.overall_result === 'QUARANTINE' || i.overall_result === 'FAILED');

    let qualityVerification = 'INSPECTION_PENDING';
    if (hasPassed && !hasQuarantine) {
      qualityVerification = 'PASSED_AND_VERIFIED';
    } else if (hasQuarantine) {
      qualityVerification = 'QUARANTINE_HOLD';
    }

    const payloadMeta = (qrRecord.payload_json as Record<string, any>) || {};

    // Return sanitized public consumer payload (No internal GL IDs, costs, or tenant secrets)
    return {
      qr_code: qrRecord.qr_code_hash,
      barcode_type: qrRecord.barcode_type,
      product_name: payloadMeta.item_name || payloadMeta.product_name || null,
      batch_number: batch?.batch_no || payloadMeta.batch_no || null,
      production_stage: batch?.stage || payloadMeta.stage || null,
      farm_origin: farm?.farm_name || payloadMeta.farm_name || null,
      produced_at: batch?.created_at || qrRecord.created_at || null,
      quality_verification: qualityVerification,
      total_quality_inspections: inspections.length,
      scanned_count: qrRecord.scanned_count + 1,
      consumer_message: 'Verified farm-to-fork origin record.',
    };
  }
}
