import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { AuditLogService } from '../../audit-log/audit-log.service';
import { CreateCostingProfileDto, CreateCostComponentDto } from '../dto/costing-profile.dto';

@Injectable()
export class CostingProfileService {
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

  async createCostingProfile(dto: CreateCostingProfileDto, tenantId: string, userId?: string) {
    if (!dto.item_id && !dto.item_category_id) {
      throw new BadRequestException('Costing profile must specify either an item_id or an item_category_id.');
    }

    const profileId = randomUUID();
    const newProfile = {
      profile_id: profileId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      item_id: dto.item_id || null,
      item_category_id: dto.item_category_id || null,
      costing_method: dto.costing_method,
      standard_cost: (dto.standard_cost || 0).toFixed(4),
      effective_from: dto.effective_from,
      effective_to: dto.effective_to || null,
      is_active: true,
    };

    await this.db.insert(schema.costingProfile).values(newProfile);

    await this.auditService.log({
      tenantId,
      companyId: dto.company_id,
      userId,
      action: 'CREATE',
      entityName: 'costing_profile',
      entityId: profileId,
      newValues: newProfile,
    });

    return newProfile;
  }

  async createCostComponent(dto: CreateCostComponentDto, tenantId: string, userId?: string) {
    const componentId = randomUUID();
    const newComponent = {
      component_id: componentId,
      tenant_id: tenantId,
      company_id: dto.company_id,
      component_code: dto.component_code,
      component_name: dto.component_name,
      cost_type: dto.cost_type,
      gl_account_id: dto.gl_account_id || null,
    };

    await this.db.insert(schema.costingComponent).values(newComponent);

    return newComponent;
  }

  async getCostingProfiles(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.costingProfile)
      .where(
        and(
          eq(schema.costingProfile.tenant_id, tenantId),
          eq(schema.costingProfile.company_id, companyId)
        )
      );
  }

  async getCostComponents(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.costingComponent)
      .where(
        and(
          eq(schema.costingComponent.tenant_id, tenantId),
          eq(schema.costingComponent.company_id, companyId)
        )
      );
  }
}
