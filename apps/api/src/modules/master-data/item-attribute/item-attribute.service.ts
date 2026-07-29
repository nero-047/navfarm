import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateItemAttributeDefinitionDto, SetItemAttributeValueDto } from './dto/item-attribute.dto';

@Injectable()
export class ItemAttributeService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createDefinition(dto: CreateItemAttributeDefinitionDto, tenantId: string) {
    const id = randomUUID();
    const record = {
      attribute_id: id,
      tenant_id: tenantId,
      nob_id: dto.nob_id || null,
      lob_id: dto.lob_id || null,
      attribute_code: dto.attribute_code,
      attribute_name: dto.attribute_name,
      data_type: dto.data_type,
      unit: dto.unit || null,
      list_values: dto.list_values ? JSON.stringify(dto.list_values) : null,
      is_mandatory: dto.is_mandatory ?? false,
      affects_costing: dto.affects_costing ?? false,
      is_active: true,
    };
    await this.db.insert(schema.itemAttributeMaster).values(record);
    return record;
  }

  async listDefinitions(tenantId: string) {
    return this.db
      .select()
      .from(schema.itemAttributeMaster)
      .where(
        and(
          eq(schema.itemAttributeMaster.tenant_id, tenantId),
          eq(schema.itemAttributeMaster.is_active, true)
        )
      );
  }

  async setAttributeValue(itemId: string, dto: SetItemAttributeValueDto) {
    const [existing] = await this.db
      .select()
      .from(schema.itemAttributeValues)
      .where(
        and(
          eq(schema.itemAttributeValues.item_id, itemId),
          eq(schema.itemAttributeValues.attribute_id, dto.attribute_id)
        )
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(schema.itemAttributeValues)
        .set({ value: dto.value })
        .where(
          and(
            eq(schema.itemAttributeValues.item_id, itemId),
            eq(schema.itemAttributeValues.attribute_id, dto.attribute_id)
          )
        );
      return { item_id: itemId, attribute_id: dto.attribute_id, value: dto.value, action: 'updated' };
    } else {
      const record = {
        value_id: randomUUID(),
        item_id: itemId,
        attribute_id: dto.attribute_id,
        attribute_value: dto.value,
      };
      await this.db.insert(schema.itemAttributeValues).values(record);
      return { ...record, action: 'created' };
    }
  }

  async getItemAttributes(itemId: string) {
    const values = await this.db
      .select()
      .from(schema.itemAttributeValues)
      .where(eq(schema.itemAttributeValues.item_id, itemId));

    if (!values.length) return [];

    const defs = await this.db
      .select()
      .from(schema.itemAttributeMaster)
      .where(eq(schema.itemAttributeMaster.is_active, true));

    return values.map(v => {
      const def = defs.find(d => d.attribute_id === v.attribute_id);
      return {
        ...v,
        attribute_code: def?.attribute_code,
        attribute_name: def?.attribute_name,
        data_type: def?.data_type,
        unit: def?.unit,
        affects_costing: def?.affects_costing,
      };
    });
  }
}
