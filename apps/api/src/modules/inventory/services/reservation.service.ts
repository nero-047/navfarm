import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateReservationDto, QueryReservationDto } from '../dto/reservation.dto';
import { InventoryLedgerService } from './inventory-ledger.service';
import { SerialService } from './serial.service';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class ReservationService {
  constructor(
    private readonly cls: ClsService,
    private readonly ledgerService: InventoryLedgerService,
    private readonly serialService: SerialService,
    private readonly auditService: AuditLogService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async reserve(dto: CreateReservationDto, tenantId: string, userId?: string, tx?: any) {
    const runInTx = async (trx: any) => {
      // 1. Get current available quantity
      const available = await this.ledgerService.getAvailableStock(
        dto.item_id,
        dto.warehouse_id,
        dto.location_id,
        dto.lot_id || null,
        dto.serial_id || null,
        tenantId,
        trx
      );

      if (available < dto.qty_reserved) {
        throw new BadRequestException(
          `Insufficient stock to reserve. Available: ${available}, Requested: ${dto.qty_reserved}`
        );
      }

      // 2. Validate serial number if provided
      if (dto.serial_id) {
        if (dto.qty_reserved !== 1) {
          throw new BadRequestException('Serialized items can only be reserved with a quantity of 1.');
        }
        await this.serialService.validateAvailability(dto.serial_id, tenantId, trx);
      }

      // 3. Create Reservation Record
      const reservationId = randomUUID();
      const newReservation = {
        reservation_id: reservationId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        warehouse_id: dto.warehouse_id,
        location_id: dto.location_id,
        item_id: dto.item_id,
        lot_id: dto.lot_id || null,
        serial_id: dto.serial_id || null,
        qty_reserved: dto.qty_reserved.toString(),
        reservation_type: dto.reservation_type,
        ref_doc_type: dto.ref_doc_type || null,
        ref_doc_id: dto.ref_doc_id || null,
        status: 'ACTIVE',
        expires_at: dto.expires_at || null,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.stockReservation).values(newReservation);

      // 4. Update the Cached Stock Balance
      await this.ledgerService.reserveStockCache(
        dto.company_id,
        dto.warehouse_id,
        dto.location_id,
        dto.item_id,
        dto.lot_id || null,
        dto.serial_id || null,
        dto.qty_reserved,
        tenantId,
        trx
      );

      // 5. Update Serial Status
      if (dto.serial_id) {
        await this.serialService.updateStatus(dto.serial_id, 'RESERVED', tenantId, trx);
      }

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'stock_reservation',
        entityId: reservationId,
        newValues: newReservation,
      });

      return reservationId;
    };

    if (tx) {
      return runInTx(tx);
    } else {
      return this.db.transaction(async (trx) => runInTx(trx));
    }
  }

  async release(reservationId: string, tenantId: string, userId?: string, tx?: any) {
    const runInTx = async (trx: any) => {
      const [reservation] = await trx
        .select()
        .from(schema.stockReservation)
        .where(
          and(
            eq(schema.stockReservation.reservation_id, reservationId),
            eq(schema.stockReservation.tenant_id, tenantId)
          )
        )
        .limit(1);

      if (!reservation) {
        throw new NotFoundException(`Reservation with ID '${reservationId}' not found.`);
      }

      if (reservation.status !== 'ACTIVE') {
        throw new BadRequestException(`Cannot release a reservation with status: ${reservation.status}`);
      }

      // Update reservation status
      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.stockReservation)
        .set({
          status: 'RELEASED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.stockReservation.reservation_id, reservationId));

      const qtyReserved = parseFloat(reservation.qty_reserved);

      // Update cached balance (decrease reserved, increase available)
      await this.ledgerService.releaseStockCache(
        reservation.company_id,
        reservation.warehouse_id,
        reservation.location_id,
        reservation.item_id,
        reservation.lot_id || null,
        reservation.serial_id || null,
        qtyReserved,
        tenantId,
        trx
      );

      // Update serial status if serial linked
      if (reservation.serial_id) {
        await this.serialService.updateStatus(reservation.serial_id, 'IN_STOCK', tenantId, trx);
      }

      await this.auditService.log({
        tenantId,
        companyId: reservation.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'stock_reservation',
        entityId: reservationId,
        oldValues: reservation,
        newValues: { ...reservation, status: 'RELEASED' },
      });
    };

    if (tx) {
      return runInTx(tx);
    } else {
      return this.db.transaction(async (trx) => runInTx(trx));
    }
  }

  async consume(reservationId: string, tenantId: string, userId?: string, tx?: any) {
    const runInTx = async (trx: any) => {
      const [reservation] = await trx
        .select()
        .from(schema.stockReservation)
        .where(
          and(
            eq(schema.stockReservation.reservation_id, reservationId),
            eq(schema.stockReservation.tenant_id, tenantId)
          )
        )
        .limit(1);

      if (!reservation) {
        throw new NotFoundException(`Reservation with ID '${reservationId}' not found.`);
      }

      if (reservation.status !== 'ACTIVE') {
        throw new BadRequestException(`Cannot consume a reservation with status: ${reservation.status}`);
      }

      const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await trx
        .update(schema.stockReservation)
        .set({
          status: 'CONSUMED',
          updated_by: userId || null,
          updated_at: nowStr,
        })
        .where(eq(schema.stockReservation.reservation_id, reservationId));

      const qtyReserved = parseFloat(reservation.qty_reserved);

      // Update cached balance (decrease reserved quantity, on_hand is updated by the issue entry)
      await this.ledgerService.consumeStockCache(
        reservation.company_id,
        reservation.warehouse_id,
        reservation.location_id,
        reservation.item_id,
        reservation.lot_id || null,
        reservation.serial_id || null,
        qtyReserved,
        tenantId,
        trx
      );

      // Update serial status if serial linked
      if (reservation.serial_id) {
        await this.serialService.updateStatus(reservation.serial_id, 'CONSUMED', tenantId, trx);
      }

      await this.auditService.log({
        tenantId,
        companyId: reservation.company_id,
        userId,
        action: 'UPDATE',
        entityName: 'stock_reservation',
        entityId: reservationId,
        oldValues: reservation,
        newValues: { ...reservation, status: 'CONSUMED' },
      });
    };

    if (tx) {
      return runInTx(tx);
    } else {
      return this.db.transaction(async (trx) => runInTx(trx));
    }
  }

  async getReservation(reservationId: string, tenantId: string) {
    const [reservation] = await this.db
      .select()
      .from(schema.stockReservation)
      .where(
        and(
          eq(schema.stockReservation.reservation_id, reservationId),
          eq(schema.stockReservation.tenant_id, tenantId)
        )
      )
      .limit(1);

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID '${reservationId}' not found.`);
    }

    return {
      ...reservation,
      qty_reserved: parseFloat(reservation.qty_reserved),
    };
  }

  async findAll(query: QueryReservationDto, tenantId: string) {
    const conditions = [eq(schema.stockReservation.tenant_id, tenantId)];

    if (query.companyId) {
      conditions.push(eq(schema.stockReservation.company_id, query.companyId));
    }
    if (query.itemId) {
      conditions.push(eq(schema.stockReservation.item_id, query.itemId));
    }
    if (query.warehouseId) {
      conditions.push(eq(schema.stockReservation.warehouse_id, query.warehouseId));
    }
    if (query.status) {
      conditions.push(eq(schema.stockReservation.status, query.status));
    }

    const reservations = await this.db
      .select()
      .from(schema.stockReservation)
      .where(and(...conditions));

    return reservations.map(r => ({
      ...r,
      qty_reserved: parseFloat(r.qty_reserved),
    }));
  }
}
