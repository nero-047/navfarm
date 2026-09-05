import { Injectable } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';

export interface ResolvedNobLob {
  nob_id: string | null;
  lob_id: string | null;
}

/**
 * Derives NOB/LOB for masters that no longer ask the user for them (D1) — the
 * console removed the nob_id/lob_id form fields from stage, number-series,
 * animal, item, breed and resource, but every DTO still *accepts* them
 * (main.ts's global ValidationPipe has forbidNonWhitelisted, so a caller that
 * still sends one would 400 otherwise). This is the single place all six
 * services call into instead of each re-implementing the same lookup.
 *
 * Source of truth today is `operational_area_master` — BBP §4.4 plans to move
 * NOB/LOB onto `company_master` directly, but that move is NOT done yet. When
 * it lands, only `deriveFromCompany` below changes; none of the six call
 * sites need to.
 *
 * Precedence:
 *   1. A value already present on the incoming DTO always wins — a caller
 *      that still supplies nob_id/lob_id is trusted over any derivation.
 *      Only kicks in when the DTO supplies *neither* field; a partially
 *      filled DTO (one of the two given) is left exactly as given rather
 *      than guessing the other half.
 *   2. Else, if every one of the company's active operational areas agrees
 *      on a single NOB (and separately, a single LOB), use it.
 *   3. Else null. A tenant whose operational areas span multiple LOBs must
 *      never be blocked from creating a record — the taxonomy being
 *      ambiguous is not the record's fault.
 */
@Injectable()
export class NobLobResolutionService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) {
      throw new Error('Tenant database connection context not established.');
    }
    return tenantDb;
  }

  async resolve(
    tenantId: string,
    companyId: string | null | undefined,
    explicit?: { nob_id?: string | null; lob_id?: string | null },
  ): Promise<ResolvedNobLob> {
    const explicitNob = explicit?.nob_id ?? null;
    const explicitLob = explicit?.lob_id ?? null;

    if (explicitNob || explicitLob) {
      return { nob_id: explicitNob, lob_id: explicitLob };
    }

    if (!companyId) {
      return { nob_id: null, lob_id: null };
    }

    return this.deriveFromCompany(tenantId, companyId);
  }

  private async deriveFromCompany(tenantId: string, companyId: string): Promise<ResolvedNobLob> {
    const areas = await this.db
      .select({
        nob_id: schema.operationalAreaMaster.nob_id,
        lob_id: schema.operationalAreaMaster.lob_id,
      })
      .from(schema.operationalAreaMaster)
      .where(and(
        eq(schema.operationalAreaMaster.tenant_id, tenantId),
        eq(schema.operationalAreaMaster.company_id, companyId),
        eq(schema.operationalAreaMaster.is_active, true),
      ));

    if (areas.length === 0) {
      return { nob_id: null, lob_id: null };
    }

    const distinctNob = new Set(areas.map((a) => a.nob_id).filter((v): v is string => !!v));
    const distinctLob = new Set(areas.map((a) => a.lob_id).filter((v): v is string => !!v));

    return {
      nob_id: distinctNob.size === 1 ? [...distinctNob][0] : null,
      lob_id: distinctLob.size === 1 ? [...distinctLob][0] : null,
    };
  }
}
