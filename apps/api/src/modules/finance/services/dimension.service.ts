import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateDimensionDto, CreateDimensionValueDto, QueryDimensionDto, QueryDimensionValueDto } from '../dto/dimension.dto';
import { AuditLogService } from '../../audit-log/audit-log.service';

@Injectable()
export class DimensionService {
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

  async createDimension(dto: CreateDimensionDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify company
      const [company] = await trx
        .select()
        .from(schema.companyMaster)
        .where(and(eq(schema.companyMaster.company_id, dto.company_id), isNull(schema.companyMaster.deleted_at)))
        .limit(1);
      if (!company) {
        throw new NotFoundException(`Company with ID '${dto.company_id}' not found.`);
      }

      // 2. Duplicate check for code within company
      const [existing] = await trx
        .select()
        .from(schema.financialDimension)
        .where(
          and(
            eq(schema.financialDimension.tenant_id, tenantId),
            eq(schema.financialDimension.company_id, dto.company_id),
            eq(schema.financialDimension.dimension_code, dto.dimension_code.toUpperCase().trim()),
            isNull(schema.financialDimension.deleted_at)
          )
        )
        .limit(1);
      if (existing) {
        throw new ConflictException(`Financial Dimension with code '${dto.dimension_code}' already exists.`);
      }

      const dimensionId = randomUUID();
      const newDim = {
        dimension_id: dimensionId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        dimension_code: dto.dimension_code.toUpperCase().trim(),
        dimension_name: dto.dimension_name,
        is_active: true,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.financialDimension).values(newDim);

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'financial_dimension',
        entityId: dimensionId,
        newValues: newDim,
      });

      return this.findOneDimension(dimensionId, tenantId, trx);
    });
  }

  async createDimensionValue(dto: CreateDimensionValueDto, tenantId: string, userId?: string) {
    return this.db.transaction(async (trx) => {
      // 1. Verify dimension header
      const [dim] = await trx
        .select()
        .from(schema.financialDimension)
        .where(
          and(
            eq(schema.financialDimension.dimension_id, dto.dimension_id),
            eq(schema.financialDimension.tenant_id, tenantId)
          )
        )
        .limit(1);
      if (!dim) {
        throw new NotFoundException(`Financial Dimension with ID '${dto.dimension_id}' not found.`);
      }

      // 2. Duplicate check for value code
      const [existing] = await trx
        .select()
        .from(schema.financialDimensionValue)
        .where(
          and(
            eq(schema.financialDimensionValue.tenant_id, tenantId),
            eq(schema.financialDimensionValue.company_id, dto.company_id),
            eq(schema.financialDimensionValue.dimension_id, dto.dimension_id),
            eq(schema.financialDimensionValue.value_code, dto.value_code.trim()),
            isNull(schema.financialDimensionValue.deleted_at)
          )
        )
        .limit(1);
      if (existing) {
        throw new ConflictException(
          `Dimension Value code '${dto.value_code}' already exists for this dimension.`
        );
      }

      const valueId = randomUUID();
      const newValue = {
        value_id: valueId,
        tenant_id: tenantId,
        company_id: dto.company_id,
        dimension_id: dto.dimension_id,
        value_code: dto.value_code.trim(),
        value_name: dto.value_name,
        is_active: true,
        created_by: userId || null,
        updated_by: userId || null,
      };

      await trx.insert(schema.financialDimensionValue).values(newValue);

      await this.auditService.log({
        tenantId,
        companyId: dto.company_id,
        userId,
        action: 'CREATE',
        entityName: 'financial_dimension_value',
        entityId: valueId,
        newValues: newValue,
      });

      return this.findOneDimensionValue(valueId, tenantId, trx);
    });
  }

  async validateDimensionValues(
    companyId: string,
    dimensionValues: Record<string, string> | null | undefined,
    tenantId: string,
    tx?: any
  ) {
    if (!dimensionValues || Object.keys(dimensionValues).length === 0) {
      return true;
    }

    const dbClient = tx || this.db;

    for (const [dimCode, valCode] of Object.entries(dimensionValues)) {
      // 1. Find dimension
      const [dimension] = await dbClient
        .select()
        .from(schema.financialDimension)
        .where(
          and(
            eq(schema.financialDimension.tenant_id, tenantId),
            eq(schema.financialDimension.company_id, companyId),
            eq(schema.financialDimension.dimension_code, dimCode.toUpperCase().trim()),
            eq(schema.financialDimension.is_active, true),
            isNull(schema.financialDimension.deleted_at)
          )
        )
        .limit(1);

      if (!dimension) {
        throw new BadRequestException(
          `Invalid or inactive Financial Dimension code '${dimCode}' for this company.`
        );
      }

      // 2. Find value code
      const [value] = await dbClient
        .select()
        .from(schema.financialDimensionValue)
        .where(
          and(
            eq(schema.financialDimensionValue.tenant_id, tenantId),
            eq(schema.financialDimensionValue.dimension_id, dimension.dimension_id),
            eq(schema.financialDimensionValue.value_code, valCode.trim()),
            eq(schema.financialDimensionValue.is_active, true),
            isNull(schema.financialDimensionValue.deleted_at)
          )
        )
        .limit(1);

      if (!value) {
        throw new BadRequestException(
          `Dimension value '${valCode}' is invalid or inactive under Dimension code '${dimCode}'.`
        );
      }
    }

    return true;
  }

  async validateCostCenter(costCenterId: string | null | undefined, companyId: string, tenantId: string, tx?: any) {
    if (!costCenterId) {
      return true;
    }

    const dbClient = tx || this.db;

    const [costCenter] = await dbClient
      .select()
      .from(schema.costCenterMaster)
      .where(
        and(
          eq(schema.costCenterMaster.cost_center_id, costCenterId),
          eq(schema.costCenterMaster.company_id, companyId),
          eq(schema.costCenterMaster.tenant_id, tenantId),
          eq(schema.costCenterMaster.is_active, true),
          isNull(schema.costCenterMaster.deleted_at)
        )
      )
      .limit(1);

    if (!costCenter) {
      throw new BadRequestException(
        `Cost Center with ID '${costCenterId}' is invalid, inactive, or belongs to another company.`
      );
    }

    return true;
  }

  async findOneDimension(dimensionId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [dim] = await dbClient
      .select()
      .from(schema.financialDimension)
      .where(
        and(
          eq(schema.financialDimension.dimension_id, dimensionId),
          eq(schema.financialDimension.tenant_id, tenantId),
          isNull(schema.financialDimension.deleted_at)
        )
      )
      .limit(1);

    if (!dim) {
      throw new NotFoundException(`Financial Dimension with ID '${dimensionId}' not found.`);
    }

    return dim;
  }

  async findOneDimensionValue(valueId: string, tenantId: string, tx?: any) {
    const dbClient = tx || this.db;
    const [val] = await dbClient
      .select()
      .from(schema.financialDimensionValue)
      .where(
        and(
          eq(schema.financialDimensionValue.value_id, valueId),
          eq(schema.financialDimensionValue.tenant_id, tenantId),
          isNull(schema.financialDimensionValue.deleted_at)
        )
      )
      .limit(1);

    if (!val) {
      throw new NotFoundException(`Dimension Value with ID '${valueId}' not found.`);
    }

    return val;
  }

  async findAllDimensions(query: QueryDimensionDto, tenantId: string) {
    const conditions = [
      eq(schema.financialDimension.tenant_id, tenantId),
      isNull(schema.financialDimension.deleted_at)
    ];

    if (query.companyId) {
      conditions.push(eq(schema.financialDimension.company_id, query.companyId));
    }
    if (query.search) {
      conditions.push(like(schema.financialDimension.dimension_name, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.financialDimension)
      .where(and(...conditions));
  }

  async findAllDimensionValues(query: QueryDimensionValueDto, tenantId: string) {
    const conditions = [
      eq(schema.financialDimensionValue.tenant_id, tenantId),
      isNull(schema.financialDimensionValue.deleted_at)
    ];

    if (query.companyId) {
      conditions.push(eq(schema.financialDimensionValue.company_id, query.companyId));
    }
    if (query.dimensionId) {
      conditions.push(eq(schema.financialDimensionValue.dimension_id, query.dimensionId));
    }
    if (query.search) {
      conditions.push(like(schema.financialDimensionValue.value_name, `%${query.search}%`));
    }

    return this.db
      .select()
      .from(schema.financialDimensionValue)
      .where(and(...conditions));
  }
}
