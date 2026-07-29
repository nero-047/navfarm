import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateHerdDto } from '../dto/herd.dto';

@Injectable()
export class HerdService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  async createHerd(dto: CreateHerdDto, tenantId: string, companyId: string, userId: string) {
    const existing = await this.db.select().from(schema.lvsHerd)
      .where(and(eq(schema.lvsHerd.tenant_id, tenantId), eq(schema.lvsHerd.herd_code, dto.herd_code))).limit(1);
    if (existing.length) throw new ConflictException(`Herd code '${dto.herd_code}' already exists.`);

    const herd_id = randomUUID();
    const record = {
      herd_id, tenant_id: tenantId, company_id: companyId,
      herd_code: dto.herd_code, herd_name: dto.herd_name, herd_type: dto.herd_type,
      farm_id: dto.farm_id || null, species_id: dto.species_id || null,
      location_id: dto.location_id || null, target_size: dto.target_size || null,
      current_size: 0, herd_status: 'ACTIVE', manager_name: dto.manager_name || null,
      notes: dto.notes || null, created_by: userId, updated_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsHerd).values(record);
    return record;
  }

  async getHerd(herdId: string, tenantId: string) {
    const [herd] = await this.db.select().from(schema.lvsHerd)
      .where(and(eq(schema.lvsHerd.herd_id, herdId), eq(schema.lvsHerd.tenant_id, tenantId), isNull(schema.lvsHerd.deleted_at))).limit(1);
    if (!herd) throw new NotFoundException(`Herd '${herdId}' not found.`);
    return herd;
  }

  async listHerds(tenantId: string) {
    return this.db.select().from(schema.lvsHerd)
      .where(and(eq(schema.lvsHerd.tenant_id, tenantId), isNull(schema.lvsHerd.deleted_at)));
  }

  async updateHerdSize(herdId: string, delta: number) {
    const [herd] = await this.db.select().from(schema.lvsHerd).where(eq(schema.lvsHerd.herd_id, herdId)).limit(1);
    if (!herd) return;
    const newSize = Math.max(0, (herd.current_size || 0) + delta);
    await this.db.update(schema.lvsHerd).set({ current_size: newSize, updated_at: new Date().toISOString() })
      .where(eq(schema.lvsHerd.herd_id, herdId));
  }
}
