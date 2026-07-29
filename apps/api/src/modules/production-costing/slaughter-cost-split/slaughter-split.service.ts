import { Injectable, BadRequestException } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import * as schema from '../../../core/database/schema';
import { ConfigureSlaughterSplitDto, ApplySlaughterSplitDto } from './dto/slaughter-split.dto';

@Injectable()
export class SlaughterSplitService {
  constructor(private readonly cls: ClsService) {}
  private get db(): MySql2Database<typeof schema> {
    const tenantDb = this.cls.get<MySql2Database<typeof schema>>('tenantDb');
    if (!tenantDb) throw new Error('Tenant DB context not established.');
    return tenantDb;
  }

  async configureSplit(dto: ConfigureSlaughterSplitDto) {
    // Validate splits sum to 100
    const totalPct = dto.products.reduce((sum, p) => sum + p.split_pct, 0);
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new BadRequestException(`Split percentages must sum to 100. Current sum: ${totalPct.toFixed(2)}`);
    }

    const config_id = randomUUID();
    const record = {
      config_id,
      lob_id: dto.lob_id,
      split_method: dto.split_method,
      product_splits: JSON.stringify(dto.products),
      is_active: true,
      created_at: new Date().toISOString(),
    };
    // Store in nobLobExtensionConfig table as JSON config
    await this.db.insert(schema.nobLobExtensionConfig).values({
      config_id,
      lob_id: dto.lob_id,
      config_key: 'slaughter_cost_split_config',
      config_value: JSON.stringify({ split_method: dto.split_method, products: dto.products }),
      data_type: 'JSON',
    });

    return { ...record, message: `Slaughter cost split configured for LOB '${dto.lob_id}' with ${dto.products.length} products.` };
  }

  async getSplitConfig(lobId: string) {
    const [config] = await this.db.select().from(schema.nobLobExtensionConfig)
      .where(and(
        eq(schema.nobLobExtensionConfig.lob_id, lobId),
        eq(schema.nobLobExtensionConfig.config_key, 'slaughter_cost_split_config')
      )).limit(1);

    if (!config) return null;
    return { lob_id: lobId, ...JSON.parse(config.config_value as string) };
  }

  async applySlaughterSplit(dto: ApplySlaughterSplitDto) {
    const splitConfig = await this.getSplitConfig(dto.lob_id);
    if (!splitConfig) {
      throw new BadRequestException(`No slaughter cost split config found for LOB '${dto.lob_id}'. Please configure it first.`);
    }

    const products: any[] = splitConfig.products || [];
    const result = products.map(p => {
      const allocatedCost = dto.total_cost * (p.split_pct / 100);
      const approxOutputKg = dto.input_kg * (p.split_pct / 100);
      const unitCost = approxOutputKg > 0 ? allocatedCost / approxOutputKg : 0;
      return {
        product_code: p.product_code,
        product_name: p.product_name,
        split_pct: p.split_pct,
        output_item_id: p.output_item_id || null,
        allocated_cost: parseFloat(allocatedCost.toFixed(4)),
        approx_output_kg: parseFloat(approxOutputKg.toFixed(3)),
        unit_cost_per_kg: parseFloat(unitCost.toFixed(6)),
      };
    });

    return {
      lob_id: dto.lob_id,
      input_kg: dto.input_kg,
      total_cost: dto.total_cost,
      split_method: splitConfig.split_method,
      split_result: result,
    };
  }
}
