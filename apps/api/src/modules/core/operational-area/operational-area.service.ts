import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import * as schema from '../../../core/database/schema';
import { CreateOperationalAreaDto, UpdateOperationalAreaDto, AssignUserToAreaDto, PreseedSource } from './dto/operational-area.dto';
import * as crypto from 'crypto';

@Injectable()
export class OperationalAreaService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  private get tenantId(): string {
    const tid = this.cls.get<string>('tenantId');
    return tid || '00000000-0000-0000-0000-000000000000';
  }

  async findAll(companyId?: string) {
    const baseQuery = this.db
      .select({
        area_id: schema.operationalAreaMaster.area_id,
        tenant_id: schema.operationalAreaMaster.tenant_id,
        company_id: schema.operationalAreaMaster.company_id,
        company_name: schema.companyMaster.company_name,
        farm_id: schema.operationalAreaMaster.farm_id,
        nob_id: schema.operationalAreaMaster.nob_id,
        nob_code: schema.nobMaster.nob_code,
        nob_name: schema.nobMaster.nob_name,
        lob_id: schema.operationalAreaMaster.lob_id,
        lob_code: schema.lobMaster.lob_code,
        lob_name: schema.lobMaster.lob_name,
        area_code: schema.operationalAreaMaster.area_code,
        area_name: schema.operationalAreaMaster.area_name,
        description: schema.operationalAreaMaster.description,
        preseed_source: schema.operationalAreaMaster.preseed_source,
        is_active: schema.operationalAreaMaster.is_active,
        status: schema.operationalAreaMaster.status,
        created_at: schema.operationalAreaMaster.created_at,
      })
      .from(schema.operationalAreaMaster)
      .leftJoin(schema.companyMaster, eq(schema.operationalAreaMaster.company_id, schema.companyMaster.company_id))
      .leftJoin(schema.nobMaster, eq(schema.operationalAreaMaster.nob_id, schema.nobMaster.nob_id))
      .leftJoin(schema.lobMaster, eq(schema.operationalAreaMaster.lob_id, schema.lobMaster.lob_id));

    if (companyId) {
      return baseQuery
        .where(
          and(
            eq(schema.operationalAreaMaster.tenant_id, this.tenantId),
            eq(schema.operationalAreaMaster.company_id, companyId),
            eq(schema.operationalAreaMaster.is_active, true)
          )
        )
        .orderBy(desc(schema.operationalAreaMaster.created_at));
    }

    return baseQuery
      .where(
        and(
          eq(schema.operationalAreaMaster.tenant_id, this.tenantId),
          eq(schema.operationalAreaMaster.is_active, true)
        )
      )
      .orderBy(desc(schema.operationalAreaMaster.created_at));
  }

  async findOne(id: string) {
    const [area] = await this.db
      .select({
        area_id: schema.operationalAreaMaster.area_id,
        tenant_id: schema.operationalAreaMaster.tenant_id,
        company_id: schema.operationalAreaMaster.company_id,
        company_name: schema.companyMaster.company_name,
        farm_id: schema.operationalAreaMaster.farm_id,
        nob_id: schema.operationalAreaMaster.nob_id,
        nob_code: schema.nobMaster.nob_code,
        nob_name: schema.nobMaster.nob_name,
        lob_id: schema.operationalAreaMaster.lob_id,
        lob_code: schema.lobMaster.lob_code,
        lob_name: schema.lobMaster.lob_name,
        area_code: schema.operationalAreaMaster.area_code,
        area_name: schema.operationalAreaMaster.area_name,
        description: schema.operationalAreaMaster.description,
        preseed_source: schema.operationalAreaMaster.preseed_source,
        is_active: schema.operationalAreaMaster.is_active,
        status: schema.operationalAreaMaster.status,
        created_at: schema.operationalAreaMaster.created_at,
      })
      .from(schema.operationalAreaMaster)
      .leftJoin(schema.companyMaster, eq(schema.operationalAreaMaster.company_id, schema.companyMaster.company_id))
      .leftJoin(schema.nobMaster, eq(schema.operationalAreaMaster.nob_id, schema.nobMaster.nob_id))
      .leftJoin(schema.lobMaster, eq(schema.operationalAreaMaster.lob_id, schema.lobMaster.lob_id))
      .where(
        and(
          eq(schema.operationalAreaMaster.area_id, id),
          eq(schema.operationalAreaMaster.tenant_id, this.tenantId)
        )
      )
      .limit(1);

    if (!area) {
      throw new NotFoundException(`Operational Area with ID '${id}' not found.`);
    }

    return area;
  }

  async create(dto: CreateOperationalAreaDto, userId?: string) {
    // 1. Verify code uniqueness within company
    const existing = await this.db
      .select()
      .from(schema.operationalAreaMaster)
      .where(
        and(
          eq(schema.operationalAreaMaster.company_id, dto.company_id),
          eq(schema.operationalAreaMaster.area_code, dto.area_code.toUpperCase()),
          eq(schema.operationalAreaMaster.is_active, true)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Operational Area with code '${dto.area_code}' already exists in this company.`);
    }

    const areaId = crypto.randomUUID();

    // 2. Insert area record
    await this.db.insert(schema.operationalAreaMaster).values({
      area_id: areaId,
      tenant_id: this.tenantId,
      company_id: dto.company_id,
      farm_id: dto.farm_id || null,
      nob_id: dto.nob_id,
      lob_id: dto.lob_id,
      area_code: dto.area_code.toUpperCase(),
      area_name: dto.area_name,
      description: dto.description || null,
      preseed_source: dto.preseed_source || PreseedSource.TENANT,
      is_active: dto.is_active ?? true,
      created_by: userId || null,
    });

    // 3. Run Pre-seeding if requested
    if (dto.preseed_source && dto.preseed_source !== PreseedSource.NONE) {
      await this.preseedOperationalAreaMasterData(dto.company_id, areaId, dto.lob_id, dto.nob_id, dto.preseed_source);
    }

    return this.findOne(areaId);
  }

  async update(id: string, dto: UpdateOperationalAreaDto, userId?: string) {
    const area = await this.findOne(id);

    await this.db
      .update(schema.operationalAreaMaster)
      .set({
        area_name: dto.area_name ?? area.area_name,
        description: dto.description ?? area.description,
        farm_id: dto.farm_id ?? area.farm_id,
        is_active: dto.is_active ?? area.is_active,
        updated_by: userId || null,
      })
      .where(eq(schema.operationalAreaMaster.area_id, id));

    return this.findOne(id);
  }

  async delete(id: string) {
    const area = await this.findOne(id);
    await this.db
      .update(schema.operationalAreaMaster)
      .set({ is_active: false })
      .where(eq(schema.operationalAreaMaster.area_id, id));
    return { success: true, message: `Operational Area '${area.area_name}' deactivated.` };
  }

  async assignUser(dto: AssignUserToAreaDto) {
    const assignmentId = crypto.randomUUID();
    await this.db.insert(schema.userOperationalAreaAssignment).values({
      assignment_id: assignmentId,
      user_id: dto.user_id,
      area_id: dto.area_id,
      company_id: dto.company_id,
      is_primary: dto.is_primary ?? true,
    });
    return { success: true, assignmentId };
  }

  async getUserAssignedAreas(userId: string) {
    return this.db
      .select({
        assignment_id: schema.userOperationalAreaAssignment.assignment_id,
        area_id: schema.operationalAreaMaster.area_id,
        area_code: schema.operationalAreaMaster.area_code,
        area_name: schema.operationalAreaMaster.area_name,
        company_id: schema.operationalAreaMaster.company_id,
        lob_id: schema.operationalAreaMaster.lob_id,
        nob_id: schema.operationalAreaMaster.nob_id,
        is_primary: schema.userOperationalAreaAssignment.is_primary,
      })
      .from(schema.userOperationalAreaAssignment)
      .innerJoin(
        schema.operationalAreaMaster,
        eq(schema.userOperationalAreaAssignment.area_id, schema.operationalAreaMaster.area_id)
      )
      .where(eq(schema.userOperationalAreaAssignment.user_id, userId));
  }

  /**
   * Pre-seeds Company Master Data from Tenant Master Data templates
   */
  async preseedCompanyMasterDataFromTenant(companyId: string) {
    // 1. Fetch company's active operational areas to know its LOBs
    const areas = await this.db
      .select()
      .from(schema.operationalAreaMaster)
      .where(and(eq(schema.operationalAreaMaster.company_id, companyId), eq(schema.operationalAreaMaster.is_active, true)));

    const companyLobIds = new Set(areas.map((a) => a.lob_id).filter(Boolean));

    // 2. Fetch tenant-wide base items (where company_id is null)
    const tenantItems = await this.db
      .select()
      .from(schema.itemMaster)
      .where(and(eq(schema.itemMaster.tenant_id, this.tenantId), eq(schema.itemMaster.is_active, true)));

    // Clone into company scope only matching LOB items or common items (where lob_id is null)
    for (const item of tenantItems) {
      const matchesLob = !item.lob_id || companyLobIds.has(item.lob_id) || companyLobIds.size === 0;
      if (!item.company_id && matchesLob) {
        const [exists] = await this.db
          .select()
          .from(schema.itemMaster)
          .where(
            and(
              eq(schema.itemMaster.company_id, companyId),
              eq(schema.itemMaster.item_code, item.item_code)
            )
          )
          .limit(1);

        if (!exists) {
          await this.db.insert(schema.itemMaster).values({
            ...item,
            item_id: crypto.randomUUID(),
            company_id: companyId,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          });
        }
      }
    }

    return { success: true, message: `Company master data pre-seeded from tenant templates.` };
  }

  /**
   * Pre-seeds Operational Area Master Data from Company or Tenant catalog
   */
  private async preseedOperationalAreaMasterData(
    companyId: string,
    areaId: string,
    lobId: string,
    nobId: string,
    source: PreseedSource
  ) {
    // 1. Fetch available items for this LOB / NOB from source (or tenant-wide common)
    const availableItems = await this.db
      .select()
      .from(schema.itemMaster)
      .where(
        and(
          eq(schema.itemMaster.tenant_id, this.tenantId),
          source === PreseedSource.COMPANY ? eq(schema.itemMaster.company_id, companyId) : eq(schema.itemMaster.is_active, true),
          eq(schema.itemMaster.is_active, true)
        )
      );

    // Filter for matching NOB/LOB or common (lob_id is null) items
    const relevantItems = availableItems.filter(
      (item) => !item.lob_id || item.lob_id === lobId || (item.nob_id === nobId && !item.lob_id)
    );

    // Clone into company master data if not present
    for (const item of relevantItems) {
      const [exists] = await this.db
        .select()
        .from(schema.itemMaster)
        .where(
          and(
            eq(schema.itemMaster.company_id, companyId),
            eq(schema.itemMaster.item_code, item.item_code)
          )
        )
        .limit(1);

      if (!exists) {
        await this.db.insert(schema.itemMaster).values({
          ...item,
          item_id: crypto.randomUUID(),
          company_id: companyId,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        });
      }
    }

    // 2. Fetch standard breeds for this LOB
    const breeds = await this.db
      .select()
      .from(schema.breedMaster)
      .where(
        and(
          eq(schema.breedMaster.tenant_id, this.tenantId),
          eq(schema.breedMaster.is_active, true)
        )
      );

    const matchingBreeds = breeds.filter(
      (b) => !b.lob_id || b.lob_id === lobId || b.nob_id === nobId
    );

    // 3. Create initial standard shed / housing unit for this operational area if none exist
    const [existingShed] = await this.db
      .select()
      .from(schema.shedMaster)
      .where(
        and(
          eq(schema.shedMaster.company_id, companyId),
          eq(schema.shedMaster.lob_id, lobId),
          eq(schema.shedMaster.is_active, true)
        )
      )
      .limit(1);

    if (!existingShed) {
      // Find a farm or create a default farm
      const [farm] = await this.db
        .select()
        .from(schema.farmMaster)
        .where(and(eq(schema.farmMaster.company_id, companyId), eq(schema.farmMaster.is_active, true)))
        .limit(1);

      let farmId = farm?.farm_id;
      if (!farmId) {
        farmId = crypto.randomUUID();
        await this.db.insert(schema.farmMaster).values({
          farm_id: farmId,
          tenant_id: this.tenantId,
          company_id: companyId,
          farm_code: 'FARM-01',
          farm_name: 'Main Farm Complex',
          farm_type: 'COMMERCIAL',
          nob_id: nobId,
          lob_id: lobId,
          capacity: 1000,
          is_active: true,
        });
      }

      // Seed standard housing unit
      await this.db.insert(schema.shedMaster).values({
        shed_id: crypto.randomUUID(),
        tenant_id: this.tenantId,
        company_id: companyId,
        farm_id: farmId,
        shed_code: 'SHED-UNIT-01',
        shed_name: 'Main Housing Unit 1',
        shed_type: 'ENVIRONMENTALLY_CONTROLLED',
        nob_id: nobId,
        lob_id: lobId,
        capacity: 500,
        is_active: true,
      });
    }

    return {
      success: true,
      itemsCloned: relevantItems.length,
      breedsAvailable: matchingBreeds.length,
    };
  }
}
