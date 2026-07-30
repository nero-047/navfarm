import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { CreateNobLobConfigDto, UpdateNobLobConfigDto } from './dto/nob-lob-config.dto';

@Injectable()
export class NobLobConfigService {
  constructor(private readonly cls: ClsService) {}

  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async createConfig(dto: CreateNobLobConfigDto) {
    const id = randomUUID();
    const record = {
      config_id: id,
      nob_id: dto.nob_id || null,
      lob_id: dto.lob_id || null,
      config_key: dto.config_key,
      config_value: dto.config_value,
      data_type: dto.data_type,
    };
    await this.db.insert(schema.nobLobExtensionConfig).values(record);
    return record;
  }

  async getConfigByLob(lobId: string) {
    return this.db
      .select()
      .from(schema.nobLobExtensionConfig)
      .where(eq(schema.nobLobExtensionConfig.lob_id, lobId));
  }

  async getConfigByNob(nobId: string) {
    return this.db
      .select()
      .from(schema.nobLobExtensionConfig)
      .where(eq(schema.nobLobExtensionConfig.nob_id, nobId));
  }

  async updateConfig(configId: string, dto: UpdateNobLobConfigDto) {
    const [existing] = await this.db
      .select()
      .from(schema.nobLobExtensionConfig)
      .where(eq(schema.nobLobExtensionConfig.config_id, configId))
      .limit(1);

    if (!existing) throw new NotFoundException(`Config '${configId}' not found.`);

    await this.db
      .update(schema.nobLobExtensionConfig)
      .set({ config_value: dto.config_value })
      .where(eq(schema.nobLobExtensionConfig.config_id, configId));

    return { config_id: configId, config_value: dto.config_value };
  }

  async getEffectiveLobConfig(lobId: string) {
    const [lob] = await this.db
      .select()
      .from(schema.lobMaster)
      .where(eq(schema.lobMaster.lob_id, lobId))
      .limit(1);

    if (!lob) {
      throw new NotFoundException(`Line of Business with ID '${lobId}' not found.`);
    }

    const [nob] = await this.db
      .select()
      .from(schema.nobMaster)
      .where(eq(schema.nobMaster.nob_id, lob.nob_id))
      .limit(1);

    const overrides = await this.getConfigByLob(lobId);

    const baseConfig = (lob.extension_config as Record<string, any>) || {
      costing_methods: [lob.costing_method_allowed || 'STANDARD'],
      qc_required: lob.qc_required === 'YES',
      qr_required: lob.qr_required === 'YES',
      traceability_level: lob.traceability_required === 'YES' ? 'BATCH' : 'NONE',
      scheduler_required: lob.scheduler_copy_allowed === 'YES',
      resource_required: true,
      stages: [],
      enabled_modules: [],
    };

    const effectiveConfig = { ...baseConfig };
    for (const ov of overrides) {
      if (ov.config_key && ov.config_value !== null) {
        try {
          effectiveConfig[ov.config_key] = JSON.parse(ov.config_value);
        } catch {
          effectiveConfig[ov.config_key] = ov.config_value;
        }
      }
    }

    return {
      lob_id: lob.lob_id,
      lob_code: lob.lob_code,
      lob_name: lob.lob_name,
      nob_id: nob?.nob_id || lob.nob_id,
      nob_code: nob?.nob_code || null,
      nob_name: nob?.nob_name || null,
      effective_config: effectiveConfig,
    };
  }

  async validateCostingMethod(lobId: string, costingMethod: string): Promise<boolean> {
    const { effective_config } = await this.getEffectiveLobConfig(lobId);
    const allowedMethods: string[] = effective_config.costing_methods || ['STANDARD'];
    if (!allowedMethods.includes(costingMethod.toUpperCase())) {
      throw new BadRequestException(
        `Costing method '${costingMethod}' is not permitted for LOB '${lobId}'. Allowed methods: ${allowedMethods.join(', ')}`
      );
    }
    return true;
  }
}
