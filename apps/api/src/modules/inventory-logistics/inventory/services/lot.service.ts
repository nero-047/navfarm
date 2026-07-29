import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateLotDto, QueryLotDto } from '../dto/lot-serial.dto';
import { AuditLogService } from '../../../platform-identity/audit-log/audit-log.service';

@Injectable()
export class LotService {
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

  async create(dto: CreateLotDto, tenantId: string, userId?: string, tx?: any) {
    const dbClient = tx || this.db;

    // 1. Verify company exists
    const [company] = await dbClient
      .select()
      .from(schema.companyMaster)
      .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
      .limit(1);
    if (!company) {
      throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
    }

    // 2. Verify item exists
    const [item] = await dbClient
      .select()
      .from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.item_id, dto.item_id), isNull(schema.itemMaster.deleted_at)))
      .limit(1);
    if (!item) {
      throw new NotFoundException(`Item with ID '${dto.item_id}' not found.`);
    }

    // 3. Check duplicate lot code for this item
    const [existing] = await dbClient
      .select()
      .from(schema.lotMaster)
      .where(
        and(
          eq(schema.lotMaster.tenant_id, tenantId),
          eq(schema.lotMaster.item_id, dto.item_id),
          eq(schema.lotMaster.lot_code, dto.lot_code.trim())
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(`Lot with code '${dto.lot_code}' already exists for this item.`);
    }

    const lotId = randomUUID();
    const newLot = {
      lot_id: lotId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      item_id: dto.item_id,
      lot_code: dto.lot_code.trim(),
      mfg_date: dto.mfg_date || null,
      expiry_date: dto.expiry_date || null,
      qty_initial: dto.qty_initial.toString(),
      qty_on_hand: dto.qty_initial.toString(),
      is_active: true,
      status: 'ACTIVE',
      created_by: userId || null,
      updated_by: userId || null,
    };

    await dbClient.insert(schema.lotMaster).values(newLot);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId,
      action: 'CREATE',
      entityName: 'lot_master',
      entityId: lotId,
      newValues: newLot,
    });

    return lotId;
  }

  async getOrCreate(
    companyId: string,
    itemId: string,
    lotCode: string,
    tenantId: string,
    mfgDate?: string,
    expiryDate?: string,
    userId?: string,
    tx?: any
  ) {
    const dbClient = tx || this.db;

    // Check if lot already exists
    const [existing] = await dbClient
      .select()
      .from(schema.lotMaster)
      .where(
        and(
          eq(schema.lotMaster.tenant_id, tenantId),
          eq(schema.lotMaster.item_id, itemId),
          eq(schema.lotMaster.lot_code, lotCode.trim())
        )
      )
      .limit(1);

    if (existing) {
      return existing;
    }

    // Auto-create new lot with 0 initial quantity (it will be updated by transaction ledger)
    const lotId = randomUUID();
    const newLot = {
      lot_id: lotId,
      tenant_id: tenantId,
      company_id: companyId,
      item_id: itemId,
      lot_code: lotCode.trim(),
      mfg_date: mfgDate || null,
      expiry_date: expiryDate || null,
      qty_initial: '0.0000',
      qty_on_hand: '0.0000',
      is_active: true,
      status: 'ACTIVE',
      created_by: userId || null,
      updated_by: userId || null,
    };

    await dbClient.insert(schema.lotMaster).values(newLot);

    await this.auditService.log({
      tenantId,
      companyId,
      userId,
      action: 'CREATE',
      entityName: 'lot_master',
      entityId: lotId,
      newValues: newLot,
    });

    return {
      ...newLot,
      qty_initial: parseFloat(newLot.qty_initial),
      qty_on_hand: parseFloat(newLot.qty_on_hand),
    };
  }

  async findOne(lotId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [lot] = await dbClient
      .select()
      .from(schema.lotMaster)
      .where(and(eq(schema.lotMaster.lot_id, lotId), eq(schema.lotMaster.tenant_id, tenantId)))
      .limit(1);

    if (!lot) {
      throw new NotFoundException(`Lot with ID '${lotId}' not found.`);
    }

    return {
      ...lot,
      qty_initial: parseFloat(lot.qty_initial),
      qty_on_hand: parseFloat(lot.qty_on_hand),
    };
  }

  async findByCode(itemId: string, lotCode: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [lot] = await dbClient
      .select()
      .from(schema.lotMaster)
      .where(
        and(
          eq(schema.lotMaster.tenant_id, tenantId),
          eq(schema.lotMaster.item_id, itemId),
          eq(schema.lotMaster.lot_code, lotCode.trim())
        )
      )
      .limit(1);

    if (!lot) {
      return null;
    }

    return {
      ...lot,
      qty_initial: parseFloat(lot.qty_initial),
      qty_on_hand: parseFloat(lot.qty_on_hand),
    };
  }

  async findAll(query: QueryLotDto, tenantId: string) {
    const conditions = [eq(schema.lotMaster.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.lotMaster.company_id, query.companyId));
    }
    if (query.itemId) {
      conditions.push(eq(schema.lotMaster.item_id, query.itemId));
    }
    if (query.search) {
      conditions.push(like(schema.lotMaster.lot_code, `%${query.search}%`));
    }

    const lots = await this.db
      .select()
      .from(schema.lotMaster)
      .where(and(...conditions));

    return lots.map(l => ({
      ...l,
      qty_initial: parseFloat(l.qty_initial),
      qty_on_hand: parseFloat(l.qty_on_hand)
    }));
  }

  async updateStock(lotId: string, qtyDelta: number, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;

    // Fetch lot details with lock
    const lot = await this.findOne(lotId, tenantId, dbClient);

    const newQty = lot.qty_on_hand + qtyDelta;
    if (newQty < 0) {
      throw new BadRequestException(`Insufficient stock in lot '${lot.lot_code}'. Available: ${lot.qty_on_hand}, Requested reduction: ${Math.abs(qtyDelta)}`);
    }

    await dbClient
      .update(schema.lotMaster)
      .set({
        qty_on_hand: newQty.toFixed(4),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(schema.lotMaster.lot_id, lotId));
  }

  async validateExpiry(lotId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const lot = await this.findOne(lotId, tenantId, dbClient);

    if (lot.expiry_date) {
      const today = new Date().toISOString().slice(0, 10);
      if (lot.expiry_date < today) {
        throw new BadRequestException(`Lot '${lot.lot_code}' has expired on ${lot.expiry_date}.`);
      }
    }
  }
}
