import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../core/database/schema';
import { CreateUomConversionDto, UpdateUomConversionDto } from './dto/uom-conversion.dto';

@Injectable()
export class UomConversionService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createConversion(dto: CreateUomConversionDto, tenantId: string) {
    const id = randomUUID();
    const record = {
      conversion_id: id,
      tenant_id: tenantId,
      item_id: dto.item_id || null,
      from_uom: dto.from_uom,
      to_uom: dto.to_uom,
      conversion_factor: String(dto.conversion_factor),
      effective_from: dto.effective_from,
      effective_to: dto.effective_to || null,
      is_active: true,
    };
    await this.db.insert(schema.uomConversionMaster).values(record);
    return record;
  }

  async listConversions(tenantId: string) {
    return this.db
      .select()
      .from(schema.uomConversionMaster)
      .where(
        and(
          eq(schema.uomConversionMaster.tenant_id, tenantId),
          eq(schema.uomConversionMaster.is_active, true)
        )
      );
  }

  async updateConversion(conversionId: string, dto: UpdateUomConversionDto, tenantId: string) {
    const [existing] = await this.db
      .select()
      .from(schema.uomConversionMaster)
      .where(
        and(
          eq(schema.uomConversionMaster.conversion_id, conversionId),
          eq(schema.uomConversionMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!existing) throw new NotFoundException(`UOM Conversion '${conversionId}' not found.`);

    const updateData: Record<string, any> = {};
    if (dto.conversion_factor !== undefined) updateData.conversion_factor = String(dto.conversion_factor);
    if (dto.effective_to !== undefined) updateData.effective_to = dto.effective_to;
    if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

    await this.db
      .update(schema.uomConversionMaster)
      .set(updateData)
      .where(eq(schema.uomConversionMaster.conversion_id, conversionId));

    return { conversion_id: conversionId, ...updateData };
  }

  async deactivateConversion(conversionId: string, tenantId: string) {
    const [existing] = await this.db
      .select()
      .from(schema.uomConversionMaster)
      .where(
        and(
          eq(schema.uomConversionMaster.conversion_id, conversionId),
          eq(schema.uomConversionMaster.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!existing) throw new NotFoundException(`UOM Conversion '${conversionId}' not found.`);

    await this.db
      .update(schema.uomConversionMaster)
      .set({ is_active: false })
      .where(eq(schema.uomConversionMaster.conversion_id, conversionId));

    return { conversion_id: conversionId, is_active: false, message: 'Deactivated.' };
  }
}
