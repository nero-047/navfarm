import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import { CreateSerialDto, QuerySerialDto } from '../dto/lot-serial.dto';
import { AuditLogService } from '../../../platform-identity/audit-log/audit-log.service';

@Injectable()
export class SerialService {
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

  async create(dto: CreateSerialDto, tenantId: string, userId?: string, tx?: any) {
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

    // 3. Verify lot exists (if provided)
    if (dto.lot_id) {
      const [lot] = await dbClient
        .select()
        .from(schema.lotMaster)
        .where(and(eq(schema.lotMaster.lot_id, dto.lot_id), eq(schema.lotMaster.tenant_id, tenantId)))
        .limit(1);
      if (!lot) {
        throw new NotFoundException(`Lot with ID '${dto.lot_id}' not found.`);
      }
    }

    // 4. Check duplicate serial number for this item
    const [existing] = await dbClient
      .select()
      .from(schema.serialMaster)
      .where(
        and(
          eq(schema.serialMaster.tenant_id, tenantId),
          eq(schema.serialMaster.item_id, dto.item_id),
          eq(schema.serialMaster.serial_no, dto.serial_no.trim())
        )
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(`Serial number '${dto.serial_no}' already exists for this item.`);
    }

    const serialId = randomUUID();
    const newSerial = {
      serial_id: serialId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      item_id: dto.item_id,
      lot_id: dto.lot_id || null,
      serial_no: dto.serial_no.trim(),
      status: 'IN_STOCK',
      warranty_expiry_date: dto.warranty_expiry_date || null,
      created_by: userId || null,
      updated_by: userId || null,
    };

    await dbClient.insert(schema.serialMaster).values(newSerial);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId,
      action: 'CREATE',
      entityName: 'serial_master',
      entityId: serialId,
      newValues: newSerial,
    });

    return serialId;
  }

  async getOrCreate(
    companyId: string,
    itemId: string,
    lotId: string | null,
    serialNo: string,
    tenantId: string,
    userId?: string,
    tx?: any
  ) {
    const dbClient = tx || this.db;

    // Check if serial already exists
    const [existing] = await dbClient
      .select()
      .from(schema.serialMaster)
      .where(
        and(
          eq(schema.serialMaster.tenant_id, tenantId),
          eq(schema.serialMaster.item_id, itemId),
          eq(schema.serialMaster.serial_no, serialNo.trim())
        )
      )
      .limit(1);

    if (existing) {
      // If found but consumed, reactivate it if we are performing a receipt (re-receiving or restoring)
      // For general purposes we just return it
      return existing;
    }

    // Auto-create new serial
    const serialId = randomUUID();
    const newSerial = {
      serial_id: serialId,
      tenant_id: tenantId,
      company_id: companyId,
      item_id: itemId,
      lot_id: lotId,
      serial_no: serialNo.trim(),
      status: 'IN_STOCK',
      warranty_expiry_date: null,
      created_by: userId || null,
      updated_by: userId || null,
    };

    await dbClient.insert(schema.serialMaster).values(newSerial);

    await this.auditService.log({
      tenantId,
      companyId,
      userId,
      action: 'CREATE',
      entityName: 'serial_master',
      entityId: serialId,
      newValues: newSerial,
    });

    return newSerial;
  }

  async findOne(serialId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [serial] = await dbClient
      .select()
      .from(schema.serialMaster)
      .where(and(eq(schema.serialMaster.serial_id, serialId), eq(schema.serialMaster.tenant_id, tenantId)))
      .limit(1);

    if (!serial) {
      throw new NotFoundException(`Serial number with ID '${serialId}' not found.`);
    }

    return serial;
  }

  async findByNo(itemId: string, serialNo: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [serial] = await dbClient
      .select()
      .from(schema.serialMaster)
      .where(
        and(
          eq(schema.serialMaster.tenant_id, tenantId),
          eq(schema.serialMaster.item_id, itemId),
          eq(schema.serialMaster.serial_no, serialNo.trim())
        )
      )
      .limit(1);

    return serial || null;
  }

  async findAll(query: QuerySerialDto, tenantId: string) {
    const conditions = [eq(schema.serialMaster.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.serialMaster.company_id, query.companyId));
    }
    if (query.itemId) {
      conditions.push(eq(schema.serialMaster.item_id, query.itemId));
    }
    if (query.lotId) {
      conditions.push(eq(schema.serialMaster.lot_id, query.lotId));
    }
    if (query.status) {
      conditions.push(eq(schema.serialMaster.status, query.status));
    }
    if (query.search) {
      conditions.push(like(schema.serialMaster.serial_no, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.serialMaster)
      .where(and(...conditions));
  }

  async updateStatus(serialId: string, status: 'IN_STOCK' | 'CONSUMED' | 'RESERVED', tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const serial = await this.findOne(serialId, tenantId, dbClient);

    if (serial.status === status) {
      return;
    }

    // Basic state safety checks
    if (status === 'IN_STOCK' && serial.status === 'CONSUMED') {
      // Allow receiving a previously consumed serial (e.g. return order or restoration)
    } else if (status === 'CONSUMED' && serial.status === 'CONSUMED') {
      throw new BadRequestException(`Serial '${serial.serial_no}' is already consumed.`);
    }

    await dbClient
      .update(schema.serialMaster)
      .set({
        status,
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(schema.serialMaster.serial_id, serialId));
  }

  async validateAvailability(serialId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const serial = await this.findOne(serialId, tenantId, dbClient);

    if (serial.status !== 'IN_STOCK') {
      throw new BadRequestException(`Serial number '${serial.serial_no}' is not available (Current Status: ${serial.status}).`);
    }
  }
}
