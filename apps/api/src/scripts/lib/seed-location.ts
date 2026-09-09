import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import * as schema from '../../core/database/schema';

/**
 * Seeds one row of the location tree.
 *
 * `location_master` is the single table for farms, sheds, pens, stores, silos,
 * cages and quarantine areas — one structure, distinguished by `location_type`
 * and by whether `parent_location_id` is set. farm_master, shed_master and
 * warehouse_master are gone; farm_id/shed_id/warehouse_id are now denormalised
 * ancestor pointers back into this same table.
 *
 * Both seed scripts previously inlined their own version of this and drifted,
 * writing farms and sheds into those separate tables with fresh `randomUUID()`s
 * so no location row existed behind them, and leaving every pen with
 * `parent_location_id` NULL and a hardcoded `location_level: 3`. One helper,
 * used by both, is what stops that recurring.
 */

export type SeedLocationType = 'FARM' | 'SHED' | 'PEN' | 'STORE' | 'SILO' | 'QUARANTINE' | 'CAGE';

export interface SeededLocation {
  id: string;
  farmId: string | null;
  shedId: string | null;
  warehouseId: string | null;
  level: number;
}

export interface SeedLocationInput {
  code: string;
  name: string;
  type: SeedLocationType;
  parent?: SeededLocation | null;
  capacity?: number;
  capacityUom?: string;
  /** Only meaningful for FARM/SHED mirrors, which carry a free-text subtype. */
  subType?: string;
  storageType?: 'STORE' | 'SILO';
  siloCapacityKg?: number;
  siloReorderDays?: number;
  isQuarantineZone?: boolean;
  lastCleanedDate?: string;
  lastDisinfectedDate?: string;
}

export async function seedLocation(
  db: any,
  ctx: { tenantId: string; companyId: string; nobId?: string | null; lobId?: string | null },
  loc: SeedLocationInput,
): Promise<SeededLocation> {
  const [existing] = await db
    .select()
    .from(schema.locationMaster)
    .where(
      and(
        eq(schema.locationMaster.company_id, ctx.companyId),
        eq(schema.locationMaster.location_code, loc.code),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      id: existing.location_id,
      farmId: existing.farm_id,
      shedId: existing.shed_id,
      warehouseId: existing.warehouse_id,
      level: existing.location_level,
    };
  }

  const id = randomUUID();
  const parent = loc.parent || null;
  // Depth is derived, never asserted. The old seeds hardcoded 3 on every pen.
  const level = parent ? parent.level + 1 : 1;
  const farmId = loc.type === 'FARM' ? id : parent?.farmId ?? null;
  const shedId = loc.type === 'SHED' ? id : parent?.shedId ?? null;
  const warehouseId = ['STORE', 'SILO'].includes(loc.type) ? id : parent?.warehouseId ?? null;

  await db.insert(schema.locationMaster).values({
    location_id: id,
    tenant_id: ctx.tenantId,
    company_id: ctx.companyId,
    nob_id: ctx.nobId ?? null,
    lob_id: ctx.lobId ?? null,
    farm_id: farmId,
    shed_id: shedId,
    warehouse_id: warehouseId,
    location_code: loc.code,
    location_name: loc.name,
    location_level: level,
    location_type: loc.type,
    parent_location_id: parent?.id ?? null,
    max_capacity: loc.capacity != null ? loc.capacity.toString() : null,
    capacity_uom: loc.capacity != null ? loc.capacityUom || 'HEAD' : null,
    storage_type: loc.storageType ?? null,
    silo_capacity_kg: loc.siloCapacityKg != null ? loc.siloCapacityKg.toString() : null,
    silo_reorder_days: loc.siloReorderDays ?? null,
    is_quarantine_zone: loc.isQuarantineZone ?? false,
    last_cleaned_date: loc.lastCleanedDate ?? null,
    last_disinfected_date: loc.lastDisinfectedDate ?? null,
    is_active: true,
    status: 'ACTIVE',
  });

  return { id, farmId, shedId, warehouseId, level };
}
