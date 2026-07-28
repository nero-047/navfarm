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
}
