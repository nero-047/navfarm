import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { CreateProductionOrderDto, UpdateProductionOrderDto } from '../dto/production-order.dto';
import { QueryProductionDto } from '../dto/query-production.dto';

@Injectable()
export class ProductionOrderService {
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

  async createOrder(dto: CreateProductionOrderDto, tenantId: string, userId?: string) {
    // 1. Check for existing order_no in company
    const [existing] = await this.db
      .select()
      .from(schema.productionOrder)
      .where(
        and(
          eq(schema.productionOrder.tenant_id, tenantId),
          eq(schema.productionOrder.company_id, dto.company_id),
          eq(schema.productionOrder.order_no, dto.order_no),
          isNull(schema.productionOrder.deleted_at)
        )
      )
      .limit(1);

    if (existing) {
      throw new BadRequestException(`Production Order '${dto.order_no}' already exists in this company.`);
    }

    const orderId = randomUUID();
    const newOrder = {
      order_id: orderId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      order_no: dto.order_no,
      item_id: dto.item_id,
      warehouse_id: dto.warehouse_id,
      location_id: dto.location_id,
      planned_qty: dto.planned_qty.toFixed(4),
      actual_qty: '0.0000',
      uom_id: dto.uom_id,
      start_date: dto.start_date,
      end_date: dto.end_date || null,
      status: 'DRAFT',
      cost_center_id: dto.cost_center_id || null,
      dimension_values: dto.dimension_values || null,
      notes: dto.notes || null,
      created_by: userId || null,
    };

    await this.db.insert(schema.productionOrder).values(newOrder);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId,
      action: 'CREATE',
      entityName: 'production_order',
      entityId: orderId,
      newValues: newOrder,
    });

    return newOrder;
  }

  async findOrderById(orderId: string, tenantId: string) {
    const [order] = await this.db
      .select()
      .from(schema.productionOrder)
      .where(
        and(
          eq(schema.productionOrder.order_id, orderId),
          eq(schema.productionOrder.tenant_id, tenantId),
          isNull(schema.productionOrder.deleted_at)
        )
      )
      .limit(1);

    if (!order) {
      throw new NotFoundException(`Production Order '${orderId}' not found.`);
    }

    return order;
  }

  async findAllOrders(query: QueryProductionDto, tenantId: string) {
    const conditions = [
      eq(schema.productionOrder.tenant_id, tenantId),
      isNull(schema.productionOrder.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(eq(schema.productionOrder.company_id, query.companyId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.productionOrder.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.productionOrder.status, query.status));
    }

    const limit = query.limit ? Number(query.limit) : 50;
    const offset = query.offset ? Number(query.offset) : 0;

    return this.db
      .select()
      .from(schema.productionOrder)
      .where(and(...conditions))
      .orderBy(desc(schema.productionOrder.created_at))
      .limit(limit)
      .offset(offset);
  }

  async updateOrder(orderId: string, dto: UpdateProductionOrderDto, tenantId: string, userId?: string) {
    const existing = await this.findOrderById(orderId, tenantId);

    if (existing.status === 'CLOSED' || existing.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot update Production Order in status '${existing.status}'.`);
    }

    const updates: Partial<typeof schema.productionOrder.$inferInsert> = {
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };

    if (dto.planned_qty !== undefined) updates.planned_qty = dto.planned_qty.toFixed(4);
    if (dto.start_date !== undefined) updates.start_date = dto.start_date;
    if (dto.end_date !== undefined) updates.end_date = dto.end_date;
    if (dto.notes !== undefined) updates.notes = dto.notes;

    await this.db
      .update(schema.productionOrder)
      .set(updates)
      .where(eq(schema.productionOrder.order_id, orderId));

    await this.auditService.log({
      tenantId,
      companyId: existing.company_id,
      userId,
      action: 'UPDATE',
      entityName: 'production_order',
      entityId: orderId,
      oldValues: existing,
      newValues: updates,
    });

    return this.findOrderById(orderId, tenantId);
  }
}
