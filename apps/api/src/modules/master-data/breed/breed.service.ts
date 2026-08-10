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
  QueryBreedDto 
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
}
