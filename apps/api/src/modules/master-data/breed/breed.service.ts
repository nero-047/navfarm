import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, or, isNull, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import {
  CreateSpeciesDto,
  UpdateSpeciesDto,
  QuerySpeciesDto,
  CreateBreedDto,
  UpdateBreedDto,
  QueryBreedDto,
  CreateBreedLifecycleStageDto,
  UpdateBreedLifecycleStageDto,
  QueryBreedLifecycleStageDto,
} from './dto/breed.dto';
import { AuditLogService } from '../../system/audit-log/audit-log.service';

const toMysqlTimestamp = (date: Date = new Date()) => {
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

@Injectable()
export class BreedService {
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

  // ========================================================
  // SPECIES MASTER CRUD
  // ========================================================

  async createSpecies(dto: CreateSpeciesDto, tenantId: string, userPayload?: any) {
    const companyId = dto.company_id || null;

    // Check duplicate code
    const duplicateConditions = [
      eq(schema.speciesMaster.tenant_id, tenantId),
      eq(schema.speciesMaster.species_code, dto.species_code.toUpperCase()),
      isNull(schema.speciesMaster.deleted_at),
    ];
    if (companyId) {
      duplicateConditions.push(eq(schema.speciesMaster.company_id, companyId));
    } else {
      duplicateConditions.push(isNull(schema.speciesMaster.company_id));
    }

    const existing = await this.db
      .select()
      .from(schema.speciesMaster)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Species with code '${dto.species_code}' already exists.`);
    }

    const speciesId = randomUUID();
    const newSpecies = {
      species_id: speciesId,
      tenant_id: tenantId,
      company_id: companyId,
      species_code: dto.species_code.toUpperCase(),
      species_name: dto.species_name,
      status: 'ACTIVE',
      is_active: true,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.speciesMaster).values(newSpecies);

    await this.auditService.log({
      tenantId,
      companyId: companyId || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'species_master',
      entityId: speciesId,
      newValues: newSpecies,
    });

    return this.findOneSpecies(speciesId);
  }

  async findOneSpecies(id: string) {
    const [species] = await this.db
      .select()
      .from(schema.speciesMaster)
      .where(and(eq(schema.speciesMaster.species_id, id), isNull(schema.speciesMaster.deleted_at)))
      .limit(1);

    if (!species) {
      throw new NotFoundException(`Species with ID '${id}' not found.`);
    }

    return species;
  }

  async findAllSpecies(query: QuerySpeciesDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.speciesMaster.tenant_id, tenantId),
      isNull(schema.speciesMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(
        or(
          eq(schema.speciesMaster.company_id, query.companyId),
          isNull(schema.speciesMaster.company_id)
        )
      );
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.speciesMaster.species_code, `%${query.search}%`),
          like(schema.speciesMaster.species_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.speciesMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async updateSpecies(id: string, dto: UpdateSpeciesDto, tenantId: string, userPayload?: any) {
    const species = await this.findOneSpecies(id);

    if (dto.species_code && dto.species_code.toUpperCase() !== species.species_code) {
      const duplicateConditions = [
        eq(schema.speciesMaster.tenant_id, tenantId),
        eq(schema.speciesMaster.species_code, dto.species_code.toUpperCase()),
        ne(schema.speciesMaster.species_id, id),
        isNull(schema.speciesMaster.deleted_at),
      ];
      if (species.company_id) {
        duplicateConditions.push(eq(schema.speciesMaster.company_id, species.company_id));
      } else {
        duplicateConditions.push(isNull(schema.speciesMaster.company_id));
      }

      const existing = await this.db
        .select()
        .from(schema.speciesMaster)
        .where(and(...duplicateConditions))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Species with code '${dto.species_code}' already exists.`);
      }
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.species_code !== undefined) updates.species_code = dto.species_code.toUpperCase();
    if (dto.species_name !== undefined) updates.species_name = dto.species_name;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;

    await this.db
      .update(schema.speciesMaster)
      .set(updates)
      .where(eq(schema.speciesMaster.species_id, id));

    await this.auditService.log({
      tenantId,
      companyId: species.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'species_master',
      entityId: id,
      oldValues: species,
      newValues: updates,
    });

    return this.findOneSpecies(id);
  }

  async removeSpecies(id: string, tenantId: string, userPayload?: any) {
    const species = await this.findOneSpecies(id);
    const deletedTime = toMysqlTimestamp();

    // Soft delete
    await this.db
      .update(schema.speciesMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.speciesMaster.species_id, id));

    await this.auditService.log({
      tenantId,
      companyId: species.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'species_master',
      entityId: id,
      oldValues: species,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Species '${species.species_name}' has been soft-deleted.` };
  }

  async restoreSpecies(id: string, tenantId: string, userPayload?: any) {
    const [species] = await this.db
      .select()
      .from(schema.speciesMaster)
      .where(eq(schema.speciesMaster.species_id, id))
      .limit(1);

    if (!species) {
      throw new NotFoundException(`Species with ID '${id}' not found.`);
    }

    if (!species.deleted_at) {
      return species;
    }

    await this.db
      .update(schema.speciesMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.speciesMaster.species_id, id));

    await this.auditService.log({
      tenantId,
      companyId: species.company_id || undefined,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'species_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOneSpecies(id);
  }

  // ========================================================
  // BREED MASTER CRUD
  // ========================================================

  async createBreed(dto: CreateBreedDto, tenantId: string, userPayload?: any) {
    const companyId = dto.company_id || null;

    // Verify species exists
    const species = await this.findOneSpecies(dto.species_id);

    // Verify duplicate breed code in company scope
    const duplicateConditions = [
      eq(schema.breedMaster.tenant_id, tenantId),
      eq(schema.breedMaster.breed_code, dto.breed_code.toUpperCase()),
      isNull(schema.breedMaster.deleted_at),
    ];
    if (companyId) {
      duplicateConditions.push(eq(schema.breedMaster.company_id, companyId));
    } else {
      duplicateConditions.push(isNull(schema.breedMaster.company_id));
    }

    const existing = await this.db
      .select()
      .from(schema.breedMaster)
      .where(and(...duplicateConditions))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Breed with code '${dto.breed_code}' already exists.`);
    }

    const breedId = randomUUID();
    const newBreed = {
      breed_id: breedId,
      tenant_id: tenantId,
      company_id: companyId,
      nob_id: dto.nob_id,
      lob_id: dto.lob_id || null,
      breed_code: dto.breed_code.toUpperCase(),
      breed_name: dto.breed_name,
      species_id: dto.species_id,
      species: dto.species || species.species_name, // legacy fallback
      breed_type: dto.breed_type,
      avg_growth_rate_g_day: dto.avg_growth_rate_g_day?.toString() || null,
      avg_fcr: dto.avg_fcr?.toString() || null,
      avg_mortality_pct: dto.avg_mortality_pct?.toString() || null,
      avg_lay_rate_pct: dto.avg_lay_rate_pct?.toString() || null,
      incubation_days: dto.incubation_days ?? null,
      gestation_days: dto.gestation_days ?? null,
      avg_litter_size: dto.avg_litter_size?.toString() || null,
      mature_age_months: dto.mature_age_months ?? null,
      productive_life_months: dto.productive_life_months ?? null,
      premature_years: dto.premature_years?.toString() || null,
      avg_yield_per_unit: dto.avg_yield_per_unit?.toString() || null,
      lactation_days: dto.lactation_days ?? null,
      residual_value_pct: dto.residual_value_pct?.toString() || null,
      productive_life_cycles: dto.productive_life_cycles ?? null,
      avg_litter_size_born: dto.avg_litter_size_born?.toString() || null,
      avg_litter_size_weaned: dto.avg_litter_size_weaned?.toString() || null,
      avg_weaning_weight_kg: dto.avg_weaning_weight_kg?.toString() || null,
      farrowing_rate_pct: dto.farrowing_rate_pct?.toString() || null,
      boar_doses_per_week: dto.boar_doses_per_week?.toString() || null,
      boar_productive_life_months: dto.boar_productive_life_months ?? null,
      vaccination_schedule: dto.vaccination_schedule ? JSON.stringify(dto.vaccination_schedule) : null,
      age_labels: dto.age_labels ? JSON.stringify(dto.age_labels) : null,
      description: dto.description || null,
      is_active: true,
      status: 'ACTIVE',
      extension_config: dto.extension_config ? JSON.stringify(dto.extension_config) : null,
      created_by: userPayload?.userId || null,
      updated_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.breedMaster).values(newBreed);

    await this.auditService.log({
      tenantId,
      companyId: companyId || undefined,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'breed_master',
      entityId: breedId,
      newValues: newBreed,
    });

    return this.findOneBreed(breedId);
  }

  async findOneBreed(id: string) {
    const [breed] = await this.db
      .select()
      .from(schema.breedMaster)
      .where(and(eq(schema.breedMaster.breed_id, id), isNull(schema.breedMaster.deleted_at)))
      .limit(1);

    if (!breed) {
      throw new NotFoundException(`Breed with ID '${id}' not found.`);
    }

    return breed;
  }

  async findAllBreeds(query: QueryBreedDto, tenantId: string) {
    const conditions: any[] = [
      eq(schema.breedMaster.tenant_id, tenantId),
      isNull(schema.breedMaster.deleted_at),
    ];

    if (query.companyId) {
      conditions.push(
        or(
          eq(schema.breedMaster.company_id, query.companyId),
          isNull(schema.breedMaster.company_id)
        )
      );
    }
    if (query.speciesId) {
      conditions.push(eq(schema.breedMaster.species_id, query.speciesId));
    }
    if (query.nobId) {
      conditions.push(eq(schema.breedMaster.nob_id, query.nobId));
    }
    if (query.lobId) {
      // A breed with lob_id IS NULL applies to every LOB under its NOB — eq() never
      // matches NULL, so without the wildcard these breeds would be wrongly excluded
      // whenever a specific LOB is requested.
      conditions.push(or(eq(schema.breedMaster.lob_id, query.lobId), isNull(schema.breedMaster.lob_id))!);
    }
    if (query.breedType) {
      conditions.push(eq(schema.breedMaster.breed_type, query.breedType));
    }
    if (query.isActive !== undefined) {
      conditions.push(eq(schema.breedMaster.is_active, query.isActive));
    }
    if (query.search) {
      conditions.push(
        or(
          like(schema.breedMaster.breed_code, `%${query.search}%`),
          like(schema.breedMaster.breed_name, `%${query.search}%`)
        )
      );
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    return this.db
      .select()
      .from(schema.breedMaster)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset);
  }

  async updateBreed(id: string, dto: UpdateBreedDto, tenantId: string, userPayload?: any) {
    const breed = await this.findOneBreed(id);

    if (dto.breed_code && dto.breed_code.toUpperCase() !== breed.breed_code) {
      const duplicateConditions = [
        eq(schema.breedMaster.tenant_id, tenantId),
        eq(schema.breedMaster.breed_code, dto.breed_code.toUpperCase()),
        ne(schema.breedMaster.breed_id, id),
        isNull(schema.breedMaster.deleted_at),
      ];
      if (breed.company_id) {
        duplicateConditions.push(eq(schema.breedMaster.company_id, breed.company_id));
      } else {
        duplicateConditions.push(isNull(schema.breedMaster.company_id));
      }

      const existing = await this.db
        .select()
        .from(schema.breedMaster)
        .where(and(...duplicateConditions))
        .limit(1);

      if (existing.length > 0) {
        throw new ConflictException(`Breed with code '${dto.breed_code}' already exists.`);
      }
    }

    if (dto.species_id) {
      await this.findOneSpecies(dto.species_id);
    }

    const updates: any = {
      updated_by: userPayload?.userId || null,
      updated_at: toMysqlTimestamp(),
    };

    if (dto.nob_id !== undefined) updates.nob_id = dto.nob_id;
    if (dto.lob_id !== undefined) updates.lob_id = dto.lob_id;
    if (dto.breed_code !== undefined) updates.breed_code = dto.breed_code.toUpperCase();
    if (dto.breed_name !== undefined) updates.breed_name = dto.breed_name;
    if (dto.species_id !== undefined) updates.species_id = dto.species_id;
    if (dto.species !== undefined) updates.species = dto.species;
    if (dto.breed_type !== undefined) updates.breed_type = dto.breed_type;
    if (dto.avg_growth_rate_g_day !== undefined) updates.avg_growth_rate_g_day = dto.avg_growth_rate_g_day?.toString() || null;
    if (dto.avg_fcr !== undefined) updates.avg_fcr = dto.avg_fcr?.toString() || null;
    if (dto.avg_mortality_pct !== undefined) updates.avg_mortality_pct = dto.avg_mortality_pct?.toString() || null;
    if (dto.avg_lay_rate_pct !== undefined) updates.avg_lay_rate_pct = dto.avg_lay_rate_pct?.toString() || null;
    if (dto.incubation_days !== undefined) updates.incubation_days = dto.incubation_days;
    if (dto.gestation_days !== undefined) updates.gestation_days = dto.gestation_days;
    if (dto.avg_litter_size !== undefined) updates.avg_litter_size = dto.avg_litter_size?.toString() || null;
    if (dto.mature_age_months !== undefined) updates.mature_age_months = dto.mature_age_months;
    if (dto.productive_life_months !== undefined) updates.productive_life_months = dto.productive_life_months;
    if (dto.premature_years !== undefined) updates.premature_years = dto.premature_years?.toString() || null;
    if (dto.avg_yield_per_unit !== undefined) updates.avg_yield_per_unit = dto.avg_yield_per_unit?.toString() || null;
    if (dto.lactation_days !== undefined) updates.lactation_days = dto.lactation_days;
    if (dto.residual_value_pct !== undefined) updates.residual_value_pct = dto.residual_value_pct?.toString() || null;
    if (dto.productive_life_cycles !== undefined) updates.productive_life_cycles = dto.productive_life_cycles;
    if (dto.avg_litter_size_born !== undefined) updates.avg_litter_size_born = dto.avg_litter_size_born?.toString() || null;
    if (dto.avg_litter_size_weaned !== undefined) updates.avg_litter_size_weaned = dto.avg_litter_size_weaned?.toString() || null;
    if (dto.avg_weaning_weight_kg !== undefined) updates.avg_weaning_weight_kg = dto.avg_weaning_weight_kg?.toString() || null;
    if (dto.farrowing_rate_pct !== undefined) updates.farrowing_rate_pct = dto.farrowing_rate_pct?.toString() || null;
    if (dto.boar_doses_per_week !== undefined) updates.boar_doses_per_week = dto.boar_doses_per_week?.toString() || null;
    if (dto.boar_productive_life_months !== undefined) updates.boar_productive_life_months = dto.boar_productive_life_months;
    if (dto.vaccination_schedule !== undefined) updates.vaccination_schedule = JSON.stringify(dto.vaccination_schedule);
    if (dto.age_labels !== undefined) updates.age_labels = JSON.stringify(dto.age_labels);
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.extension_config !== undefined) updates.extension_config = JSON.stringify(dto.extension_config);

    await this.db
      .update(schema.breedMaster)
      .set(updates)
      .where(eq(schema.breedMaster.breed_id, id));

    await this.auditService.log({
      tenantId,
      companyId: breed.company_id || undefined,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'breed_master',
      entityId: id,
      oldValues: breed,
      newValues: updates,
    });

    return this.findOneBreed(id);
  }

  async removeBreed(id: string, tenantId: string, userPayload?: any) {
    const breed = await this.findOneBreed(id);
    const deletedTime = toMysqlTimestamp();

    await this.db
      .update(schema.breedMaster)
      .set({
        is_active: false,
        status: 'INACTIVE',
        deleted_at: deletedTime as any,
        updated_by: userPayload?.userId || null,
      })
      .where(eq(schema.breedMaster.breed_id, id));

    await this.auditService.log({
      tenantId,
      companyId: breed.company_id || undefined,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'breed_master',
      entityId: id,
      oldValues: breed,
      newValues: { status: 'INACTIVE', deleted_at: deletedTime },
    });

    return { success: true, message: `Breed '${breed.breed_name}' has been soft-deleted.` };
  }

  async restoreBreed(id: string, tenantId: string, userPayload?: any) {
    const [breed] = await this.db
      .select()
      .from(schema.breedMaster)
      .where(eq(schema.breedMaster.breed_id, id))
      .limit(1);

    if (!breed) {
      throw new NotFoundException(`Breed with ID '${id}' not found.`);
    }

    if (!breed.deleted_at) {
      return breed;
    }

    await this.db
      .update(schema.breedMaster)
      .set({
        is_active: true,
        status: 'ACTIVE',
        deleted_at: null,
        updated_by: userPayload?.userId || null,
        updated_at: toMysqlTimestamp(),
      })
      .where(eq(schema.breedMaster.breed_id, id));

    await this.auditService.log({
      tenantId,
      companyId: breed.company_id || undefined,
      userId: userPayload?.userId,
      action: 'RESTORE',
      entityName: 'breed_master',
      entityId: id,
      newValues: { status: 'ACTIVE', deleted_at: null },
    });

    return this.findOneBreed(id);
  }

  // ==========================================
  // BREED LIFECYCLE STAGES
  // ==========================================

  private async assertItemExists(itemId: string) {
    const [item] = await this.db
      .select()
      .from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.item_id, itemId), isNull(schema.itemMaster.deleted_at)))
      .limit(1);
    if (!item) {
      throw new NotFoundException(`Item with ID '${itemId}' not found.`);
    }
  }

  async createLifecycleStage(dto: CreateBreedLifecycleStageDto, tenantId: string, userPayload?: any) {
    await this.findOneBreed(dto.breed_id);

    const [stage] = await this.db
      .select()
      .from(schema.stageMaster)
      .where(and(eq(schema.stageMaster.stage_id, dto.stage_id), isNull(schema.stageMaster.deleted_at)))
      .limit(1);
    if (!stage) {
      throw new NotFoundException(`Stage with ID '${dto.stage_id}' not found.`);
    }

    if (dto.feed_item_id) await this.assertItemExists(dto.feed_item_id);
    if (dto.output_item_id) await this.assertItemExists(dto.output_item_id);

    const lifecycleId = randomUUID();
    const newLifecycleStage = {
      lifecycle_id: lifecycleId,
      tenant_id: tenantId,
      breed_id: dto.breed_id,
      stage_id: dto.stage_id,
      calc_unit: dto.calc_unit,
      period_from: dto.period_from,
      period_to: dto.period_to,
      season_type: dto.season_type || null,
      feed_item_id: dto.feed_item_id || null,
      feed_qty_per_head_per_day_kg: dto.feed_qty_per_head_per_day_kg?.toString() || null,
      feed_wastage_pct: dto.feed_wastage_pct?.toString() || null,
      std_body_weight_kg: dto.std_body_weight_kg?.toString() || null,
      std_adg_gpd: dto.std_adg_gpd?.toString() || null,
      std_fcr: dto.std_fcr?.toString() || null,
      std_mortality_rate_pct: dto.std_mortality_rate_pct?.toString() || null,
      output_item_id: dto.output_item_id || null,
      output_uom: dto.output_uom || null,
      std_output_qty: dto.std_output_qty?.toString() || null,
      medication_protocol: dto.medication_protocol ? JSON.stringify(dto.medication_protocol) : null,
      vaccination_protocol: dto.vaccination_protocol ? JSON.stringify(dto.vaccination_protocol) : null,
      resource_requirements: dto.resource_requirements ? JSON.stringify(dto.resource_requirements) : null,
      kpi_lower_limit: dto.kpi_lower_limit?.toString() || null,
      kpi_upper_limit: dto.kpi_upper_limit?.toString() || null,
      alert_severity: dto.alert_severity || null,
      notes: dto.notes || null,
      is_active: true,
      created_by: userPayload?.userId || null,
    };

    await this.db.insert(schema.breedLifecycleStages).values(newLifecycleStage);

    await this.auditService.log({
      tenantId,
      userId: userPayload?.userId,
      action: 'CREATE',
      entityName: 'breed_lifecycle_stages',
      entityId: lifecycleId,
      newValues: newLifecycleStage,
    });

    return this.findOneLifecycleStage(lifecycleId);
  }

  async findOneLifecycleStage(id: string) {
    const [lifecycleStage] = await this.db
      .select()
      .from(schema.breedLifecycleStages)
      .where(eq(schema.breedLifecycleStages.lifecycle_id, id))
      .limit(1);

    if (!lifecycleStage) {
      throw new NotFoundException(`Breed lifecycle stage with ID '${id}' not found.`);
    }
    return lifecycleStage;
  }

  async findAllLifecycleStages(query: QueryBreedLifecycleStageDto, tenantId: string) {
    const conditions: any[] = [eq(schema.breedLifecycleStages.tenant_id, tenantId)];

    if (query.breedId) conditions.push(eq(schema.breedLifecycleStages.breed_id, query.breedId));
    if (query.stageId) conditions.push(eq(schema.breedLifecycleStages.stage_id, query.stageId));

    const limit = query.limit || (query.pageSize ? Number(query.pageSize) : 100);
    const offset = query.offset || (query.page ? (Number(query.page) - 1) * limit : 0);

    const rows = await this.db
      .select({
        stage: schema.breedLifecycleStages,
        breed_code: schema.breedMaster.breed_code,
        breed_name: schema.breedMaster.breed_name,
        stage_code: schema.stageMaster.stage_code,
        stage_name: schema.stageMaster.stage_name,
        feed_item_code: schema.itemMaster.item_code,
        feed_item_name: schema.itemMaster.item_name,
      })
      .from(schema.breedLifecycleStages)
      .leftJoin(schema.breedMaster, eq(schema.breedLifecycleStages.breed_id, schema.breedMaster.breed_id))
      .leftJoin(schema.stageMaster, eq(schema.breedLifecycleStages.stage_id, schema.stageMaster.stage_id))
      .leftJoin(schema.itemMaster, eq(schema.breedLifecycleStages.feed_item_id, schema.itemMaster.item_id))
      .where(and(...conditions))
      .orderBy(schema.breedLifecycleStages.period_from)
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      ...r.stage,
      breed_code: r.breed_code,
      breed_name: r.breed_name ? `${r.breed_code} — ${r.breed_name}` : r.breed_code,
      stage_code: r.stage_code,
      stage_name: r.stage_name ? `${r.stage_code} — ${r.stage_name}` : r.stage_code,
      feed_item_name: r.feed_item_name ? `${r.feed_item_code} — ${r.feed_item_name}` : r.feed_item_code,
    }));
  }

  async updateLifecycleStage(id: string, dto: UpdateBreedLifecycleStageDto, tenantId: string, userPayload?: any) {
    const lifecycleStage = await this.findOneLifecycleStage(id);

    if (dto.stage_id) {
      const [stage] = await this.db
        .select()
        .from(schema.stageMaster)
        .where(and(eq(schema.stageMaster.stage_id, dto.stage_id), isNull(schema.stageMaster.deleted_at)))
        .limit(1);
      if (!stage) {
        throw new NotFoundException(`Stage with ID '${dto.stage_id}' not found.`);
      }
    }
    if (dto.feed_item_id) await this.assertItemExists(dto.feed_item_id);
    if (dto.output_item_id) await this.assertItemExists(dto.output_item_id);

    const updates: any = {};
    if (dto.stage_id !== undefined) updates.stage_id = dto.stage_id;
    if (dto.calc_unit !== undefined) updates.calc_unit = dto.calc_unit;
    if (dto.period_from !== undefined) updates.period_from = dto.period_from;
    if (dto.period_to !== undefined) updates.period_to = dto.period_to;
    if (dto.season_type !== undefined) updates.season_type = dto.season_type;
    if (dto.feed_item_id !== undefined) updates.feed_item_id = dto.feed_item_id;
    if (dto.feed_qty_per_head_per_day_kg !== undefined) updates.feed_qty_per_head_per_day_kg = dto.feed_qty_per_head_per_day_kg?.toString() || null;
    if (dto.feed_wastage_pct !== undefined) updates.feed_wastage_pct = dto.feed_wastage_pct?.toString() || null;
    if (dto.std_body_weight_kg !== undefined) updates.std_body_weight_kg = dto.std_body_weight_kg?.toString() || null;
    if (dto.std_adg_gpd !== undefined) updates.std_adg_gpd = dto.std_adg_gpd?.toString() || null;
    if (dto.std_fcr !== undefined) updates.std_fcr = dto.std_fcr?.toString() || null;
    if (dto.std_mortality_rate_pct !== undefined) updates.std_mortality_rate_pct = dto.std_mortality_rate_pct?.toString() || null;
    if (dto.output_item_id !== undefined) updates.output_item_id = dto.output_item_id;
    if (dto.output_uom !== undefined) updates.output_uom = dto.output_uom;
    if (dto.std_output_qty !== undefined) updates.std_output_qty = dto.std_output_qty?.toString() || null;
    if (dto.medication_protocol !== undefined) updates.medication_protocol = JSON.stringify(dto.medication_protocol);
    if (dto.vaccination_protocol !== undefined) updates.vaccination_protocol = JSON.stringify(dto.vaccination_protocol);
    if (dto.resource_requirements !== undefined) updates.resource_requirements = JSON.stringify(dto.resource_requirements);
    if (dto.kpi_lower_limit !== undefined) updates.kpi_lower_limit = dto.kpi_lower_limit?.toString() || null;
    if (dto.kpi_upper_limit !== undefined) updates.kpi_upper_limit = dto.kpi_upper_limit?.toString() || null;
    if (dto.alert_severity !== undefined) updates.alert_severity = dto.alert_severity;
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.is_active !== undefined) updates.is_active = dto.is_active;

    await this.db
      .update(schema.breedLifecycleStages)
      .set(updates)
      .where(eq(schema.breedLifecycleStages.lifecycle_id, id));

    await this.auditService.log({
      tenantId,
      userId: userPayload?.userId,
      action: 'UPDATE',
      entityName: 'breed_lifecycle_stages',
      entityId: id,
      oldValues: lifecycleStage,
      newValues: updates,
    });

    return this.findOneLifecycleStage(id);
  }

  async removeLifecycleStage(id: string, tenantId: string, userPayload?: any) {
    const lifecycleStage = await this.findOneLifecycleStage(id);

    await this.db
      .update(schema.breedLifecycleStages)
      .set({ is_active: false })
      .where(eq(schema.breedLifecycleStages.lifecycle_id, id));

    await this.auditService.log({
      tenantId,
      userId: userPayload?.userId,
      action: 'DELETE',
      entityName: 'breed_lifecycle_stages',
      entityId: id,
      oldValues: lifecycleStage,
    });

    return { success: true, message: 'Breed lifecycle stage has been deactivated.' };
  }
}
