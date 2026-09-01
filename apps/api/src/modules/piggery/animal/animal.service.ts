import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, or, like } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { BulkTransitionAnimalStageDto, CreateAnimalDto, UpdateAnimalDto, DisposeAnimalDto, QueryAnimalDto, TransitionAnimalStageDto } from './dto/animal.dto';

import { AuditLogService } from '../../system/audit-log/audit-log.service';

import { NumberSeriesService } from '../../system/number-series/number-series.service';

const toMysqlTimestamp = (date: Date = new Date()) => date.toISOString().slice(0, 19).replace('T', ' ');

// Maps a disposal_type to the terminal `status` it leaves the animal in. TRANSFERRED has no
// direct status match in the spec's STATUSES enum (it means the animal left this tenant's
// register, not that it died/sold/slaughtered here) — SOLD is the closest "left the register"
// status other than the disposal-specific ones, but rather than guessing, TRANSFERRED keeps
// whatever status it already had and only is_active flips false.
const DISPOSAL_STATUS_MAP: Record<string, string | undefined> = {
  SOLD: 'SOLD',
  SLAUGHTERED: 'SLAUGHTERED',
  DIED: 'DEAD',
  TRANSFERRED: undefined,
};

@Injectable()
export class AnimalService {
  constructor(
    private readonly cls: ClsService,
    private readonly auditService: AuditLogService,
    private readonly numberSeriesService: NumberSeriesService,
  ) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private async assertExists<T extends { limit: (n: number) => Promise<any[]> }>(
    query: T,
    label: string,
    id: string,
  ) {
    const rows = await query.limit(1);
    if (rows.length === 0) {
      throw new NotFoundException(`${label} with ID '${id}' not found.`);
    }
    return rows[0];
  }

  /**
   * Spec: "At the time of a slaughter entry the system must check that today minus the
   * last administration date for each medicine given to that animal is greater than or
   * equal to withdrawal_days. Block the slaughter if not." Reduced in JS rather than a SQL
   * GROUP BY — per-animal medication log volume is small (a few dozen rows at most).
   */
  private async assertWithdrawalPeriodsElapsed(animalId: string, disposalDate: string) {
    const rows = await this.db
      .select({
        item_id: schema.itemMaster.item_id,
        item_name: schema.itemMaster.item_name,
        item_type: schema.itemMaster.item_type,
        withdrawal_days: schema.itemMaster.withdrawal_days,
        administered_date: schema.animalMedicationLog.administered_date,
      })
      .from(schema.animalMedicationLog)
      .innerJoin(schema.itemMaster, eq(schema.animalMedicationLog.item_id, schema.itemMaster.item_id))
      .where(eq(schema.animalMedicationLog.animal_id, animalId));

    const lastDoseByItem = new Map<string, { item_name: string; withdrawal_days: number; lastDate: string }>();
    for (const row of rows) {
      if (row.withdrawal_days == null) continue;
      if (!['MEDICINE', 'VACCINE'].includes(row.item_type)) continue;
      const existing = lastDoseByItem.get(row.item_id);
      if (!existing || row.administered_date > existing.lastDate) {
        lastDoseByItem.set(row.item_id, {
          item_name: row.item_name,
          withdrawal_days: row.withdrawal_days,
          lastDate: row.administered_date,
        });
      }
    }

    const disposalMs = new Date(disposalDate).getTime();
    const violations: string[] = [];
    for (const { item_name, withdrawal_days, lastDate } of lastDoseByItem.values()) {
      const daysSinceDose = Math.floor((disposalMs - new Date(lastDate).getTime()) / 86400000);
      if (daysSinceDose < withdrawal_days) {
        violations.push(`${item_name} (${withdrawal_days - daysSinceDose} day(s) remaining, last dose ${lastDate})`);
      }
    }

    if (violations.length > 0) {
      throw new BadRequestException(`Cannot slaughter — withdrawal period not elapsed for: ${violations.join('; ')}`);
    }
  }

  /**
   * Animal codes were always drawn from the ANIMAL_PIGGERY series, so a dairy
   * cow or a layer bird would be issued a code like PIG-2026-0001. The series
   * is now resolved from the animal's line of business, falling back to a
   * tenant-wide ANIMAL series and finally to ANIMAL_PIGGERY so existing
   * piggery tenants keep their numbering unchanged.
   */
  private async generateAnimalCode(lobId: string, tenantId: string, companyId: string): Promise<string> {
    const [lob] = await this.db
      .select({ lob_code: schema.lobMaster.lob_code })
      .from(schema.lobMaster)
      .where(eq(schema.lobMaster.lob_id, lobId))
      .limit(1);

    const candidates = [
      lob?.lob_code ? `ANIMAL_${lob.lob_code.toUpperCase()}` : null,
      'ANIMAL',
      'ANIMAL_PIGGERY',
    ].filter((x): x is string => !!x);

    let lastError: unknown;
    for (const seriesCode of candidates) {
      try {
        return await this.numberSeriesService.generateNext(seriesCode, tenantId, companyId);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  }

  async create(dto: CreateAnimalDto, tenantId: string, userPayload?: any) {
    await this.assertExists(
      this.db.select().from(schema.companyMaster).where(eq(schema.companyMaster.company_id, dto.company_id)),
      'Company', dto.company_id,
    );
    await this.assertExists(
      this.db.select().from(schema.nobMaster).where(eq(schema.nobMaster.nob_id, dto.nob_id)),
      'NOB', dto.nob_id,
    );
    await this.assertExists(
      this.db.select().from(schema.lobMaster).where(eq(schema.lobMaster.lob_id, dto.lob_id)),
      'LOB', dto.lob_id,
    );
    await this.assertExists(
      this.db.select().from(schema.breedMaster).where(eq(schema.breedMaster.breed_id, dto.breed_id)),
      'Breed', dto.breed_id,
    );
    await this.assertExists(
      this.db.select().from(schema.itemMaster).where(eq(schema.itemMaster.item_id, dto.item_id)),
      'Item', dto.item_id,
    );

    // COND rules from the spec: source_receipt_id required for purchased entries,
    // source_batch_id required for on-farm births.
    if (['PURCHASED_IMPORTED', 'PURCHASED_LOCAL'].includes(dto.entry_type) && !dto.source_receipt_id) {
      throw new BadRequestException(`source_receipt_id is required when entry_type is '${dto.entry_type}'.`);
    }
    if (dto.entry_type === 'BORN_ON_FARM' && !dto.source_batch_id) {
      throw new BadRequestException(`source_batch_id is required when entry_type is 'BORN_ON_FARM'.`);
    }

    if (dto.source_receipt_id) {
      await this.assertExists(
        this.db.select().from(schema.goodsReceipt).where(eq(schema.goodsReceipt.receipt_id, dto.source_receipt_id)),
        'Goods receipt', dto.source_receipt_id,
      );
    }
    if (dto.source_batch_id) {
      await this.assertExists(
        this.db.select().from(schema.batchHeader).where(eq(schema.batchHeader.batch_id, dto.source_batch_id)),
        'Batch', dto.source_batch_id,
      );
    }
    if (dto.sire_animal_id) {
      await this.assertExists(
        this.db.select().from(schema.animalRegister).where(eq(schema.animalRegister.animal_id, dto.sire_animal_id)),
        'Sire animal', dto.sire_animal_id,
      );
    }
    if (dto.dam_animal_id) {
      await this.assertExists(
        this.db.select().from(schema.animalRegister).where(eq(schema.animalRegister.animal_id, dto.dam_animal_id)),
        'Dam animal', dto.dam_animal_id,
      );
    }
    if (dto.current_stage_id) {
      await this.assertExists(
        this.db.select().from(schema.stageMaster).where(eq(schema.stageMaster.stage_id, dto.current_stage_id)),
        'Stage', dto.current_stage_id,
      );
    }
    if (dto.current_batch_id) {
      await this.assertExists(
        this.db.select().from(schema.batchHeader).where(eq(schema.batchHeader.batch_id, dto.current_batch_id)),
        'Batch', dto.current_batch_id,
      );
    }
    if (dto.current_location_id) {
      await this.assertExists(
        this.db.select().from(schema.locationMaster).where(eq(schema.locationMaster.location_id, dto.current_location_id)),
        'Location', dto.current_location_id,
      );
    }

    if (dto.rfid_tag) {
      const duplicateRfid = await this.db
        .select()
        .from(schema.animalRegister)
        .where(and(eq(schema.animalRegister.tenant_id, tenantId), eq(schema.animalRegister.rfid_tag, dto.rfid_tag)))
        .limit(1);
      if (duplicateRfid.length > 0) {
        throw new ConflictException(`RFID tag '${dto.rfid_tag}' is already registered to another animal.`);
      }
    }

    const animalId = randomUUID();
    const animalCode = await this.generateAnimalCode(dto.lob_id, tenantId, dto.company_id);
    const totalOpeningAssetValue = dto.acquisition_cost + (dto.landing_cost || 0);

    const newAnimal = {
      animal_id: animalId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      nob_id: dto.nob_id,
      lob_id: dto.lob_id,
      animal_code: animalCode,
      animal_type: dto.animal_type,
      breed_id: dto.breed_id,
      gender: dto.gender,
      dob: dto.dob || null,
      entry_type: dto.entry_type,
      entry_date: dto.entry_date,
      source_receipt_id: dto.source_receipt_id || null,
      source_batch_id: dto.source_batch_id || null,
      item_id: dto.item_id,
      rfid_tag: dto.rfid_tag || null,
      ear_tag: dto.ear_tag || null,
      sire_animal_id: dto.sire_animal_id || null,
      dam_animal_id: dto.dam_animal_id || null,
      acquisition_cost: dto.acquisition_cost.toString(),
      landing_cost: dto.landing_cost?.toString() || null,
      total_opening_asset_value: totalOpeningAssetValue.toString(),
      current_bio_asset_value: totalOpeningAssetValue.toString(),
      total_amortised: '0.0000',
      book_value: totalOpeningAssetValue.toString(),
      current_stage_id: dto.current_stage_id || null,
      current_batch_id: dto.current_batch_id || null,
      current_location_id: dto.current_location_id || null,
      productive_life_start: dto.productive_life_start || null,
      status: dto.status || 'ACTIVE',
      notes: dto.notes || null,
      is_active: true,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.animalRegister).values(newAnimal);

    // Record IAS 41 Opening Acquisition in bio_asset_ledger for this tagged animal
    await this.db.insert(schema.bioAssetLedger).values({
      entry_id: randomUUID(),
      tenant_id: tenantId,
      company_id: dto.company_id,
      bio_asset_item_id: dto.item_id,
      animal_id: animalId,
      entry_type: 'ACQUISITION',
      document_no: animalCode,
      posting_date: dto.entry_date,
      stage: dto.current_stage_id || null,
      status: 'ACTIVE',
      quantity: '1.0000',
      cost_amount: totalOpeningAssetValue.toString(),
      cost_amount_each_unit: totalOpeningAssetValue.toString(),
      costing_method: 'COST_ACCUMULATION',
      nob_id: dto.nob_id,
      lob_id: dto.lob_id,
      created_by: userPayload?.userId || null,
    });

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'animal_register',
      entityId: animalId,
      newValues: newAnimal,
    });

    return this.findOne(animalId);
  }

  async lookupByTag(tag: string, tenantId: string) {
    const trimmed = tag.trim();
    if (!trimmed) {
      throw new BadRequestException('Tag / Code query parameter cannot be empty.');
    }

    const rows = await this.db
      .select({
        animal: schema.animalRegister,
        breed: schema.breedMaster,
        stage: schema.stageMaster,
        batch: schema.batchHeader,
      })
      .from(schema.animalRegister)
      .leftJoin(schema.breedMaster, eq(schema.animalRegister.breed_id, schema.breedMaster.breed_id))
      .leftJoin(schema.stageMaster, eq(schema.animalRegister.current_stage_id, schema.stageMaster.stage_id))
      .leftJoin(schema.batchHeader, eq(schema.animalRegister.current_batch_id, schema.batchHeader.batch_id))
      .where(
        and(
          eq(schema.animalRegister.tenant_id, tenantId),
          or(
            eq(schema.animalRegister.rfid_tag, trimmed),
            eq(schema.animalRegister.ear_tag, trimmed),
            eq(schema.animalRegister.animal_code, trimmed),
            eq(schema.animalRegister.animal_id, trimmed)
          )
        )
      )
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException(`No animal found matching RFID tag, ear tag, or code '${trimmed}'.`);
    }

    const { animal, breed, stage, batch } = rows[0];

    // Check active withdrawal period status
    const medRows = await this.db
      .select({
        item_name: schema.itemMaster.item_name,
        withdrawal_days: schema.itemMaster.withdrawal_days,
        administered_date: schema.animalMedicationLog.administered_date,
      })
      .from(schema.animalMedicationLog)
      .innerJoin(schema.itemMaster, eq(schema.animalMedicationLog.item_id, schema.itemMaster.item_id))
      .where(eq(schema.animalMedicationLog.animal_id, animal.animal_id));

    const todayMs = new Date().getTime();
    const activeWithdrawals: Array<{ item_name: string; daysRemaining: number; lastDose: string }> = [];

    for (const med of medRows) {
      if (med.withdrawal_days == null) continue;
      const daysSinceDose = Math.floor((todayMs - new Date(med.administered_date).getTime()) / 86400000);
      if (daysSinceDose < med.withdrawal_days) {
        activeWithdrawals.push({
          item_name: med.item_name,
          daysRemaining: med.withdrawal_days - daysSinceDose,
          lastDose: med.administered_date,
        });
      }
    }

    return {
      ...animal,
      breed_name: breed?.breed_name,
      stage_name: stage?.stage_name,
      batch_code: batch?.batch_code,
      hasActiveWithdrawal: activeWithdrawals.length > 0,
      activeWithdrawals,
    };
  }

  async findOne(id: string) {
    const [animal] = await this.db
      .select()
      .from(schema.animalRegister)

      .where(eq(schema.animalRegister.animal_id, id))
      .limit(1);

    if (!animal) {
      throw new NotFoundException(`Animal with ID '${id}' not found.`);
    }
    return animal;
  }

  async findAll(query: QueryAnimalDto, tenantId: string) {
    const conditions: any[] = [eq(schema.animalRegister.tenant_id, tenantId)];

    if (!query.includeDisposed) conditions.push(eq(schema.animalRegister.is_active, true));
    if (query.companyId) conditions.push(eq(schema.animalRegister.company_id, query.companyId));
    if (query.breedId) conditions.push(eq(schema.animalRegister.breed_id, query.breedId));
    if (query.animalType) conditions.push(eq(schema.animalRegister.animal_type, query.animalType));
    if (query.status) conditions.push(eq(schema.animalRegister.status, query.status));
    if (query.currentBatchId) conditions.push(eq(schema.animalRegister.current_batch_id, query.currentBatchId));
    if (query.currentLocationId) conditions.push(eq(schema.animalRegister.current_location_id, query.currentLocationId));
    if (query.search) {
      conditions.push(
        or(
          like(schema.animalRegister.animal_code, `%${query.search}%`),
          like(schema.animalRegister.rfid_tag, `%${query.search}%`),
          like(schema.animalRegister.ear_tag, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.animalRegister)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async update(id: string, dto: UpdateAnimalDto, tenantId: string, userPayload?: any) {
    const animal = await this.findOne(id);

    if (dto.breed_id) {
      await this.assertExists(
        this.db.select().from(schema.breedMaster).where(eq(schema.breedMaster.breed_id, dto.breed_id)),
        'Breed', dto.breed_id,
      );
    }
    if (dto.sire_animal_id) {
      if (dto.sire_animal_id === id) {
        throw new BadRequestException('An animal cannot be its own sire.');
      }
      await this.assertExists(
        this.db.select().from(schema.animalRegister).where(eq(schema.animalRegister.animal_id, dto.sire_animal_id)),
        'Sire animal', dto.sire_animal_id,
      );
    }
    if (dto.dam_animal_id) {
      if (dto.dam_animal_id === id) {
        throw new BadRequestException('An animal cannot be its own dam.');
      }
      await this.assertExists(
        this.db.select().from(schema.animalRegister).where(eq(schema.animalRegister.animal_id, dto.dam_animal_id)),
        'Dam animal', dto.dam_animal_id,
      );
    }
    if (dto.current_stage_id) {
      await this.assertExists(
        this.db.select().from(schema.stageMaster).where(eq(schema.stageMaster.stage_id, dto.current_stage_id)),
        'Stage', dto.current_stage_id,
      );
    }
    if (dto.current_batch_id) {
      await this.assertExists(
        this.db.select().from(schema.batchHeader).where(eq(schema.batchHeader.batch_id, dto.current_batch_id)),
        'Batch', dto.current_batch_id,
      );
    }
    if (dto.current_location_id) {
      await this.assertExists(
        this.db.select().from(schema.locationMaster).where(eq(schema.locationMaster.location_id, dto.current_location_id)),
        'Location', dto.current_location_id,
      );
    }
    if (dto.rfid_tag && dto.rfid_tag !== animal.rfid_tag) {
      const duplicateRfid = await this.db
        .select()
        .from(schema.animalRegister)
        .where(and(eq(schema.animalRegister.tenant_id, tenantId), eq(schema.animalRegister.rfid_tag, dto.rfid_tag)))
        .limit(1);
      if (duplicateRfid.length > 0) {
        throw new ConflictException(`RFID tag '${dto.rfid_tag}' is already registered to another animal.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.breed_id !== undefined) updates.breed_id = dto.breed_id;
    if (dto.dob !== undefined) updates.dob = dto.dob;
    if (dto.rfid_tag !== undefined) updates.rfid_tag = dto.rfid_tag;
    if (dto.ear_tag !== undefined) updates.ear_tag = dto.ear_tag;
    if (dto.sire_animal_id !== undefined) updates.sire_animal_id = dto.sire_animal_id;
    if (dto.dam_animal_id !== undefined) updates.dam_animal_id = dto.dam_animal_id;
    if (dto.current_stage_id !== undefined) updates.current_stage_id = dto.current_stage_id;
    if (dto.current_batch_id !== undefined) updates.current_batch_id = dto.current_batch_id;
    if (dto.current_location_id !== undefined) updates.current_location_id = dto.current_location_id;
    if (dto.parity_count !== undefined) updates.parity_count = dto.parity_count;
    if (dto.total_piglets_born_live !== undefined) updates.total_piglets_born_live = dto.total_piglets_born_live;
    if (dto.total_piglets_weaned !== undefined) updates.total_piglets_weaned = dto.total_piglets_weaned;
    if (dto.current_bio_asset_value !== undefined) updates.current_bio_asset_value = dto.current_bio_asset_value?.toString() ?? null;
    if (dto.total_amortised !== undefined) updates.total_amortised = dto.total_amortised?.toString() ?? null;
    if (dto.book_value !== undefined) updates.book_value = dto.book_value?.toString() ?? null;
    if (dto.residual_value !== undefined) updates.residual_value = dto.residual_value?.toString() ?? null;
    if (dto.amortisation_monthly !== undefined) updates.amortisation_monthly = dto.amortisation_monthly?.toString() ?? null;
    if (dto.productive_life_start !== undefined) updates.productive_life_start = dto.productive_life_start;
    if (dto.expected_cull_date !== undefined) updates.expected_cull_date = dto.expected_cull_date;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.notes !== undefined) updates.notes = dto.notes;

    await this.db
      .update(schema.animalRegister)
      .set(updates)
      .where(eq(schema.animalRegister.animal_id, id));

    await this.auditService.log({
      tenantId,
      companyId: animal.company_id,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'animal_register',
      entityId: id,
      oldValues: animal,
      newValues: updates,
    });

    return this.findOne(id);
  }

  /**
   * Animals are never physically deleted (spec: "must never be physically deleted").
   * Disposal is its own action rather than a generic remove()/restore() toggle —
   * it records how/when/for-how-much the animal left, and computes the gain/loss
   * only when book_value is already known (it's a plain column in this phase, not
   * ledger-derived — see schema.ts's animal_register comment).
   */
  async dispose(id: string, dto: DisposeAnimalDto, tenantId: string, userPayload?: any) {
    const animal = await this.findOne(id);

    if (!animal.is_active) {
      throw new BadRequestException(`Animal '${animal.animal_code}' has already been disposed.`);
    }

    if (dto.disposal_type === 'SLAUGHTERED') {
      await this.assertWithdrawalPeriodsElapsed(id, dto.disposal_date);
    }

    const bookValue = animal.book_value != null ? Number(animal.book_value) : null;
    const gainLoss = dto.disposal_value != null && bookValue != null ? dto.disposal_value - bookValue : null;
    const mappedStatus = DISPOSAL_STATUS_MAP[dto.disposal_type];

    const updates: any = {
      is_active: false,
      disposal_date: dto.disposal_date,
      disposal_type: dto.disposal_type,
      disposal_value: dto.disposal_value?.toString() ?? null,
      gain_loss_on_disposal: gainLoss != null ? gainLoss.toString() : null,
      notes: dto.notes !== undefined ? dto.notes : animal.notes,
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };
    if (mappedStatus) updates.status = mappedStatus;

    await this.db
      .update(schema.animalRegister)
      .set(updates)
      .where(eq(schema.animalRegister.animal_id, id));

    // Record IAS 41 Exit / Disposal in bio_asset_ledger for this tagged animal
    if (bookValue != null) {
      await this.db.insert(schema.bioAssetLedger).values({
        entry_id: randomUUID(),
        tenant_id: tenantId,
        company_id: animal.company_id,
        bio_asset_item_id: animal.item_id,
        animal_id: id,
        entry_type: 'TRANSFORMATION',
        document_no: animal.animal_code,
        posting_date: dto.disposal_date,
        stage: animal.current_stage_id || null,
        status: mappedStatus || 'CLOSED',
        quantity: '-1.0000',
        cost_amount: (-bookValue).toString(),
        cost_amount_each_unit: bookValue.toString(),
        costing_method: 'AMORTIZED_COST',
        nob_id: animal.nob_id,
        lob_id: animal.lob_id,
        created_by: userPayload?.userId || null,
      });
    }

    await this.auditService.log({
      tenantId,
      companyId: animal.company_id,
      userId: userPayload?.userId,
      action: 'DISPOSE',
      entityName: 'animal_register',
      entityId: id,
      oldValues: animal,
      newValues: updates,
    });

    return this.findOne(id);
  }

  async getBioAssetLedger(animalId: string) {
    await this.findOne(animalId);
    return this.db
      .select()
      .from(schema.bioAssetLedger)
      .where(eq(schema.bioAssetLedger.animal_id, animalId))
      .orderBy(schema.bioAssetLedger.posting_date);
  }

  /**
   * Move a group of animals to a stage in one action.
   *
   * A batch-level stage move deliberately carries only the animals in step with
   * the batch, which leaves the tail-enders behind by design. Advancing those
   * afterwards meant one modal per animal — and roughly a tenth of any cohort
   * are tail-enders, so that is the normal case, not an edge case.
   *
   * One animal failing its own validation (short of min_days_before_move, or
   * already disposed) must not block the rest, so each is attempted
   * independently and the refusals are reported back rather than thrown.
   */
  async bulkTransitionStage(
    dto: BulkTransitionAnimalStageDto,
    tenantId: string,
    userPayload?: any,
  ): Promise<{ moved: number; failed: Array<{ animal_id: string; reason: string }> }> {
    const animalIds = dto.animal_ids ?? [];
    if (animalIds.length === 0) {
      throw new BadRequestException('Select at least one animal to move.');
    }

    const failed: Array<{ animal_id: string; reason: string }> = [];
    let moved = 0;

    for (const animalId of animalIds) {
      try {
        await this.transitionStage(animalId, dto, tenantId, userPayload);
        moved += 1;
      } catch (err) {
        failed.push({
          animal_id: animalId,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { moved, failed };
  }

  async transitionStage(id: string, dto: TransitionAnimalStageDto, tenantId: string, userPayload?: any) {
    const animal = await this.findOne(id);
    if (!animal.is_active) {
      throw new BadRequestException(`Cannot transition disposed or inactive animal '${animal.animal_code}'.`);
    }

    // 1. Verify destination stage
    const [destStage] = await this.db
      .select()
      .from(schema.stageMaster)
      .where(and(eq(schema.stageMaster.stage_id, dto.to_stage_id), eq(schema.stageMaster.tenant_id, tenantId)))
      .limit(1);

    if (!destStage) {
      throw new NotFoundException(`Destination Stage with ID '${dto.to_stage_id}' not found.`);
    }

    // 2. Minimum duration validation if moving from a stage that specifies min_days_before_move
    let currentStage: typeof schema.stageMaster.$inferSelect | undefined;
    if (animal.current_stage_id) {
      [currentStage] = await this.db
        .select()
        .from(schema.stageMaster)
        .where(eq(schema.stageMaster.stage_id, animal.current_stage_id))
        .limit(1);

      if (currentStage?.min_days_before_move && currentStage.min_days_before_move > 0) {
        const entryDate = animal.entry_date ? new Date(animal.entry_date) : new Date(animal.created_at);
        const transDate = new Date(dto.transition_date);
        const daysPassed = Math.floor((transDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPassed < currentStage.min_days_before_move && !dto.reason) {
          throw new BadRequestException(
            `Minimum duration of ${currentStage.min_days_before_move} days required for '${currentStage.stage_name}' before transition (current: ${daysPassed} days). Provide a reason to override.`
          );
        }
      }
    }

    // 3. Optional location verification
    if (dto.to_location_id) {
      const [loc] = await this.db
        .select()
        .from(schema.locationMaster)
        .where(and(eq(schema.locationMaster.location_id, dto.to_location_id), eq(schema.locationMaster.tenant_id, tenantId)))
        .limit(1);
      if (!loc) {
        throw new NotFoundException(`Destination Location with ID '${dto.to_location_id}' not found.`);
      }
    }

    // 4. Optional batch verification
    if (dto.to_batch_id) {
      const [batch] = await this.db
        .select()
        .from(schema.batchHeader)
        .where(and(eq(schema.batchHeader.batch_id, dto.to_batch_id), eq(schema.batchHeader.tenant_id, tenantId)))
        .limit(1);
      if (!batch) {
        throw new NotFoundException(`Destination Batch with ID '${dto.to_batch_id}' not found.`);
      }
    }

    // 5. Parity count increment check: if moving through weaning/dry from farrowing
    let newParity = animal.parity_count || 0;
    const destCode = destStage.stage_code?.toUpperCase();
    if (
      animal.gender === 'F' &&
      (destCode === 'WEANING' || destCode === 'DRY_SOW_GESTATION' || destCode === 'FLUSH_SERVICE') &&
      currentStage?.stage_code?.toUpperCase()?.includes('FARROW')
    ) {
      newParity += 1;
    }

    const updates = {
      current_stage_id: dto.to_stage_id,
      current_location_id: dto.to_location_id !== undefined ? dto.to_location_id : animal.current_location_id,
      current_batch_id: dto.to_batch_id !== undefined ? dto.to_batch_id : animal.current_batch_id,
      parity_count: newParity,
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    await this.db
      .update(schema.animalRegister)
      .set(updates)
      .where(eq(schema.animalRegister.animal_id, id));

    await this.auditService.log({
      tenantId,
      companyId: animal.company_id,
      userId: userPayload?.userId,
      action: 'TRANSITION_STAGE',
      entityName: 'animal_register',
      entityId: id,
      oldValues: {
        current_stage_id: animal.current_stage_id,
        current_location_id: animal.current_location_id,
        current_batch_id: animal.current_batch_id,
      },
      newValues: {
        ...updates,
        transition_date: dto.transition_date,
        reason: dto.reason,
        remarks: dto.remarks,
      },
    });

    return this.findOne(id);
  }
}


