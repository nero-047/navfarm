import { Injectable, NotFoundException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

@Injectable()
export class CapaService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async createNcr(
    companyId: string,
    inspectionId: string | null,
    severity: string,
    description: string,
    rootCause: string | null,
    tenantId: string
  ) {
    const ncrId = randomUUID();
    const newNcr = {
      ncr_id: ncrId,
      tenant_id: tenantId,
      company_id: companyId,
      inspection_id: inspectionId,
      severity,
      description,
      root_cause: rootCause,
      status: 'OPEN',
    };

    await this.db.insert(schema.qualityNonConformance).values(newNcr);
    return newNcr;
  }

  async createCapa(
    companyId: string,
    ncrId: string,
    correctiveAction: string,
    preventiveAction: string,
    assignedTo: string | null,
    tenantId: string
  ) {
    const capaId = randomUUID();
    const newCapa = {
      capa_id: capaId,
      tenant_id: tenantId,
      company_id: companyId,
      ncr_id: ncrId,
      corrective_action: correctiveAction,
      preventive_action: preventiveAction,
      assigned_to: assignedTo,
      status: 'IN_PROGRESS',
    };

    await this.db.insert(schema.qualityCapa).values(newCapa);
    return newCapa;
  }

  async getNcrs(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.qualityNonConformance)
      .where(
        and(
          eq(schema.qualityNonConformance.tenant_id, tenantId),
          eq(schema.qualityNonConformance.company_id, companyId)
        )
      );
  }

  async getCapas(companyId: string, tenantId: string) {
    return this.db
      .select()
      .from(schema.qualityCapa)
      .where(
        and(
          eq(schema.qualityCapa.tenant_id, tenantId),
          eq(schema.qualityCapa.company_id, companyId)
        )
      );
  }
}
