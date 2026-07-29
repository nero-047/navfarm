import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../../core/database/schema';
import {
  RegisterAnimalDto, RecordWeightDto, RecordVaccinationDto, RecordTreatmentDto,
  RecordMovementDto, RecordBreedingDto, ConfirmPregnancyDto, RecordCalvingDto,
  RecordMilkProductionDto, RecordMortalityDto
} from '../dto/animal.dto';
import { HerdService } from './herd.service';

@Injectable()
export class AnimalService {
  constructor(private readonly cls: ClsService, private readonly herdService: HerdService) {}
  private get db(): MySql2Database<typeof schema> {
    const db = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!db) throw new Error('Tenant DB context not established.');
    return db;
  }

  // ── Registration ──
  async registerAnimal(dto: RegisterAnimalDto, tenantId: string, companyId: string, userId: string) {
    const existing = await this.db.select().from(schema.lvsAnimal)
      .where(and(eq(schema.lvsAnimal.tenant_id, tenantId), eq(schema.lvsAnimal.ear_tag, dto.ear_tag))).limit(1);
    if (existing.length) throw new ConflictException(`Ear tag '${dto.ear_tag}' already registered.`);

    const animal_id = randomUUID();
    const record = {
      animal_id, tenant_id: tenantId, company_id: companyId,
      herd_id: dto.herd_id, ear_tag: dto.ear_tag, rfid_tag: dto.rfid_tag || null,
      animal_name: dto.animal_name || null, species_id: dto.species_id || null,
      breed_id: dto.breed_id || null, sex: dto.sex, date_of_birth: dto.date_of_birth || null,
      origin: dto.origin, dam_id: dto.dam_id || null, sire_id: dto.sire_id || null,
      purchase_date: dto.purchase_date || null,
      purchase_cost: dto.purchase_cost ? String(dto.purchase_cost) : null,
      supplier_id: dto.supplier_id || null,
      current_location_id: dto.current_location_id || null,
      animal_status: 'ACTIVE', lactation_no: 0, pregnancy_status: 'NOT_PREGNANT',
      notes: dto.notes || null, created_by: userId, updated_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsAnimal).values(record);
    // Increment herd size
    if (dto.herd_id) await this.herdService.updateHerdSize(dto.herd_id, +1);
    return record;
  }

  async getAnimal(animalId: string, tenantId: string) {
    const [animal] = await this.db.select().from(schema.lvsAnimal)
      .where(and(eq(schema.lvsAnimal.animal_id, animalId), eq(schema.lvsAnimal.tenant_id, tenantId), isNull(schema.lvsAnimal.deleted_at))).limit(1);
    if (!animal) throw new NotFoundException(`Animal '${animalId}' not found.`);
    return animal;
  }

  async listAnimals(tenantId: string, herdId?: string) {
    const conditions: any[] = [eq(schema.lvsAnimal.tenant_id, tenantId), isNull(schema.lvsAnimal.deleted_at)];
    if (herdId) conditions.push(eq(schema.lvsAnimal.herd_id, herdId));
    return this.db.select().from(schema.lvsAnimal).where(and(...conditions));
  }

  // ── Weight ──
  async recordWeight(animalId: string, dto: RecordWeightDto, tenantId: string, userId: string) {
    await this.getAnimal(animalId, tenantId);
    const weight_id = randomUUID();
    const record = {
      weight_id, tenant_id: tenantId, animal_id: animalId,
      weigh_date: dto.weigh_date, weight_kg: String(dto.weight_kg),
      body_condition_score: dto.body_condition_score ? String(dto.body_condition_score) : null,
      method: dto.method || 'SCALE', recorded_by: userId, notes: dto.notes || null,
      created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsWeightRecord).values(record);
    // Update animal current weight
    await this.db.update(schema.lvsAnimal)
      .set({ current_weight_kg: String(dto.weight_kg), last_weighed_at: dto.weigh_date, updated_at: new Date().toISOString() })
      .where(eq(schema.lvsAnimal.animal_id, animalId));
    return record;
  }

  async getWeightHistory(animalId: string, tenantId: string) {
    await this.getAnimal(animalId, tenantId);
    return this.db.select().from(schema.lvsWeightRecord)
      .where(eq(schema.lvsWeightRecord.animal_id, animalId))
      .orderBy(desc(schema.lvsWeightRecord.weigh_date));
  }

  // ── Vaccination ──
  async recordVaccination(animalId: string, dto: RecordVaccinationDto, tenantId: string, userId: string) {
    const vaccination_id = randomUUID();
    const record = {
      vaccination_id, tenant_id: tenantId, animal_id: animalId, herd_id: null,
      vaccine_name: dto.vaccine_name, medicine_id: dto.medicine_id || null,
      disease_id: dto.disease_id || null, vaccination_date: dto.vaccination_date,
      dose_ml: dto.dose_ml ? String(dto.dose_ml) : null, route: dto.route || null,
      batch_no: dto.batch_no || null, expiry_date: dto.expiry_date || null,
      next_due_date: dto.next_due_date || null, vet_name: dto.vet_name || null,
      cost_per_dose: dto.cost_per_dose ? String(dto.cost_per_dose) : null,
      recorded_by: userId, notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsVaccinationRecord).values(record);
    return record;
  }

  async getVaccinationHistory(animalId: string, tenantId: string) {
    await this.getAnimal(animalId, tenantId);
    return this.db.select().from(schema.lvsVaccinationRecord)
      .where(eq(schema.lvsVaccinationRecord.animal_id, animalId))
      .orderBy(desc(schema.lvsVaccinationRecord.vaccination_date));
  }

  // ── Treatment ──
  async recordTreatment(animalId: string, dto: RecordTreatmentDto, tenantId: string, userId: string) {
    const treatment_id = randomUUID();
    const withdrawalEnd = dto.withdrawal_period_days
      ? new Date(new Date(dto.treatment_date).getTime() + dto.withdrawal_period_days * 86400000).toISOString().split('T')[0]
      : null;
    const record = {
      treatment_id, tenant_id: tenantId, animal_id: animalId, herd_id: null,
      treatment_date: dto.treatment_date, diagnosis: dto.diagnosis || null,
      disease_id: dto.disease_id || null, medicine_id: dto.medicine_id || null,
      dosage: dto.dosage || null, route: dto.route || null,
      duration_days: dto.duration_days || null,
      withdrawal_period_days: dto.withdrawal_period_days || null,
      safe_to_milk_date: withdrawalEnd, treatment_cost: dto.treatment_cost ? String(dto.treatment_cost) : null,
      outcome: 'ONGOING', vet_name: dto.vet_name || null,
      recorded_by: userId, notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsTreatmentRecord).values(record);
    return { ...record, withdrawalNote: withdrawalEnd ? `Milk safe after: ${withdrawalEnd}` : null };
  }

  // ── Breeding ──
  async recordBreeding(animalId: string, dto: RecordBreedingDto, tenantId: string, userId: string) {
    await this.getAnimal(animalId, tenantId);
    const breeding_id = randomUUID();
    const record = {
      breeding_id, tenant_id: tenantId, dam_animal_id: animalId,
      breeding_date: dto.breeding_date, method: dto.method,
      sire_animal_id: dto.sire_animal_id || null, sire_code: dto.sire_code || null,
      sire_breed: dto.sire_breed || null, technician: dto.technician || null,
      outcome: 'PENDING', cost: dto.cost ? String(dto.cost) : null,
      notes: dto.notes || null, created_by: userId,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsBreedingRecord).values(record);
    return record;
  }

  async confirmPregnancy(breedingId: string, dto: ConfirmPregnancyDto, tenantId: string) {
    const [breeding] = await this.db.select().from(schema.lvsBreedingRecord)
      .where(and(eq(schema.lvsBreedingRecord.breeding_id, breedingId), eq(schema.lvsBreedingRecord.tenant_id, tenantId))).limit(1);
    if (!breeding) throw new NotFoundException(`Breeding record '${breedingId}' not found.`);

    const outcome = dto.pd_result === 'POSITIVE' ? 'PREGNANT' : 'NOT_IN_CALF';
    await this.db.update(schema.lvsBreedingRecord).set({
      pd_date: dto.pd_date, pd_result: dto.pd_result,
      expected_calving_date: dto.expected_calving_date || null,
      outcome, updated_at: new Date().toISOString(),
    }).where(eq(schema.lvsBreedingRecord.breeding_id, breedingId));

    // Update animal pregnancy status
    if (breeding.dam_animal_id) {
      await this.db.update(schema.lvsAnimal)
        .set({ pregnancy_status: dto.pd_result === 'POSITIVE' ? 'PREGNANT' : 'NOT_PREGNANT', updated_at: new Date().toISOString() })
        .where(eq(schema.lvsAnimal.animal_id, breeding.dam_animal_id));
    }
    return { breedingId, pd_result: dto.pd_result, outcome, expected_calving_date: dto.expected_calving_date };
  }

  async recordCalving(breedingId: string, dto: RecordCalvingDto, tenantId: string, userId: string) {
    const [breeding] = await this.db.select().from(schema.lvsBreedingRecord)
      .where(and(eq(schema.lvsBreedingRecord.breeding_id, breedingId), eq(schema.lvsBreedingRecord.tenant_id, tenantId))).limit(1);
    if (!breeding) throw new NotFoundException(`Breeding record not found.`);

    const calving_id = randomUUID();
    const record = {
      calving_id, tenant_id: tenantId, breeding_id: breedingId,
      dam_animal_id: breeding.dam_animal_id,
      calving_date: dto.calving_date, calving_ease: dto.calving_ease || 'NORMAL',
      calves_born: dto.calves_born, calves_alive: dto.calves_alive,
      calves_dead: dto.calves_born - dto.calves_alive,
      avg_birth_weight_kg: dto.avg_birth_weight_kg ? String(dto.avg_birth_weight_kg) : null,
      dam_condition_post: dto.dam_condition_post || null,
      lactation_start_date: dto.calving_date,
      notes: dto.notes || null, recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsCalvingRecord).values(record);

    // Update animal: pregnancy = NOT_PREGNANT, lactation_no++
    if (breeding.dam_animal_id) {
      const [dam] = await this.db.select().from(schema.lvsAnimal).where(eq(schema.lvsAnimal.animal_id, breeding.dam_animal_id)).limit(1);
      const newLactNo = (dam?.lactation_no || 0) + 1;
      await this.db.update(schema.lvsAnimal)
        .set({ pregnancy_status: 'NOT_PREGNANT', lactation_no: newLactNo, updated_at: new Date().toISOString() })
        .where(eq(schema.lvsAnimal.animal_id, breeding.dam_animal_id));
    }
    // Update breeding outcome
    await this.db.update(schema.lvsBreedingRecord).set({ outcome: 'CALVED', updated_at: new Date().toISOString() })
      .where(eq(schema.lvsBreedingRecord.breeding_id, breedingId));

    return { ...record, message: `${dto.calves_alive} live calf/calves recorded. Dam lactation started.` };
  }

  // ── Milk ──
  async recordMilkProduction(animalId: string, dto: RecordMilkProductionDto, tenantId: string, userId: string) {
    const record_id = randomUUID();
    const totalValue = dto.litres * (dto.unit_rate || 0);
    const record = {
      record_id, tenant_id: tenantId, animal_id: animalId,
      group_id: dto.group_id || null,
      record_date: dto.record_date, session: dto.session || 'TOTAL',
      litres: String(dto.litres), fat_pct: dto.fat_pct ? String(dto.fat_pct) : null,
      snf_pct: dto.snf_pct ? String(dto.snf_pct) : null,
      protein_pct: dto.protein_pct ? String(dto.protein_pct) : null,
      somatic_cell_count: dto.somatic_cell_count || null,
      unit_rate: dto.unit_rate ? String(dto.unit_rate) : null,
      total_value: String(totalValue),
      recorded_by: userId, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsMilkProduction).values(record);
    // SCC alert
    if (dto.somatic_cell_count && dto.somatic_cell_count > 400000) {
      return { ...record, alert: `⚠️ HIGH SCC (${dto.somatic_cell_count.toLocaleString()}) — Possible mastitis. Check animal.` };
    }
    return record;
  }

  async getMilkHistory(animalId: string, tenantId: string) {
    return this.db.select().from(schema.lvsMilkProduction)
      .where(and(eq(schema.lvsMilkProduction.animal_id, animalId), eq(schema.lvsMilkProduction.tenant_id, tenantId)))
      .orderBy(desc(schema.lvsMilkProduction.record_date));
  }

  // ── Movement ──
  async recordMovement(animalId: string, dto: RecordMovementDto, tenantId: string, userId: string) {
    const animal = await this.getAnimal(animalId, tenantId);
    const movement_id = randomUUID();
    const record = {
      movement_id, tenant_id: tenantId, animal_id: animalId,
      movement_date: dto.movement_date,
      from_location_id: dto.from_location_id || animal.current_location_id,
      to_location_id: dto.to_location_id || null,
      from_herd_id: dto.from_herd_id || animal.herd_id,
      to_herd_id: dto.to_herd_id || null,
      reason: dto.reason, transport_method: null,
      movement_weight_kg: dto.movement_weight_kg ? String(dto.movement_weight_kg) : null,
      recorded_by: userId, notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsMovementRecord).values(record);

    // Update animal location/herd
    const updates: any = { updated_at: new Date().toISOString() };
    if (dto.to_location_id) updates.current_location_id = dto.to_location_id;
    if (dto.to_herd_id) {
      updates.herd_id = dto.to_herd_id;
      // Update herd sizes
      if (dto.from_herd_id) await this.herdService.updateHerdSize(dto.from_herd_id, -1);
      await this.herdService.updateHerdSize(dto.to_herd_id, +1);
    }
    await this.db.update(schema.lvsAnimal).set(updates).where(eq(schema.lvsAnimal.animal_id, animalId));
    return record;
  }

  // ── Mortality ──
  async recordMortality(animalId: string, dto: RecordMortalityDto, tenantId: string, companyId: string, userId: string) {
    const animal = await this.getAnimal(animalId, tenantId);
    const mortality_id = randomUUID();
    const record = {
      mortality_id, tenant_id: tenantId, company_id: companyId,
      animal_id: animalId, herd_id: animal.herd_id,
      death_date: dto.death_date, cause_of_death: dto.cause_of_death,
      disease_id: dto.disease_id || null,
      weight_at_death_kg: dto.weight_at_death_kg ? String(dto.weight_at_death_kg) : null,
      book_value: animal.purchase_cost || null,
      salvage_value: dto.salvage_value ? String(dto.salvage_value) : null,
      disposal_method: dto.disposal_method || null,
      insured: false, vet_certified: false,
      recorded_by: userId, notes: dto.notes || null, created_at: new Date().toISOString(),
    };
    await this.db.insert(schema.lvsMortalityRecord).values(record);
    // Update animal status
    await this.db.update(schema.lvsAnimal)
      .set({ animal_status: 'DEAD', updated_at: new Date().toISOString() })
      .where(eq(schema.lvsAnimal.animal_id, animalId));
    // Decrement herd size
    if (animal.herd_id) await this.herdService.updateHerdSize(animal.herd_id, -1);
    return { ...record, bookValue: animal.purchase_cost, message: 'Animal marked DEAD. Herd size decremented.' };
  }
}
