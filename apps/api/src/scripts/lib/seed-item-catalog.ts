/**
 * The demo item catalogues, and the one way to find a seeded item again.
 *
 * `key` is the seed's own handle — RAW-MAIZE-CORN — and is NOT what lands in
 * item_master.item_code. The code comes from the ITEM series, which composes
 * <item_type>-<category_code>-<sub_category>-ITM-<seq>, so it is not known
 * until insert time and changes whenever the category codes do.
 *
 * The three seed scripts used to find items by their hand-written code, which
 * silently stopped matching the moment the code was generated. They resolve by
 * `key` now, via loadItemsByKey(), which joins on item_name — the one property
 * of a seeded item that the numbering cannot move.
 */
import { eq } from 'drizzle-orm';
import * as schema from '../../core/database/schema';

export interface SeedItem {
  key: string;
  name: string;
  type: string;
  cat: string;
  uom: string;
  val: string;
  cost: string;
  bio: boolean;
}

export const ITEM_CATALOG_1: SeedItem[] = [
      { key: 'RAW-MAIZE-CORN', name: 'Yellow Feed Maize / Corn Grains', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '22.0000', bio: false },
      { key: 'RAW-SOYA-MEAL', name: 'De-hulled Soya Meal (46% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '42.0000', bio: false },
      { key: 'RAW-WHEAT-BRAN', name: 'Coarse Wheat Bran (14% CP)', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '18.5000', bio: false },
      { key: 'RAW-FISH-MEAL', name: 'Steam-Dried Fish Meal (60% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '65.0000', bio: false },
      { key: 'RAW-SWINE-PREMIX', name: 'Swine Vitamin & Trace Mineral Premix', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '180.0000', bio: false },
      { key: 'RAW-WHEY-POWDER', name: 'Spray Dried Sweet Whey Powder', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '95.0000', bio: false },
      { key: 'FEED-CREEP-PRE', name: 'Creep Feed Pre-Starter (22% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '55.0000', bio: false },
      { key: 'FEED-GEST-SOW', name: 'Dry Sow Gestation Mash (14% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '28.0000', bio: false },
      { key: 'FEED-LACT-SOW', name: 'High-Density Lactation Diet (17.5% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '38.0000', bio: false },
      { key: 'MED-IRON-DEX', name: 'Iron Dextran 100mg/ml 100ml Injection', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '180.0000', bio: false },
      { key: 'MED-PENICILLIN', name: 'Penicillin G Procaine 300K IU 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '220.0000', bio: false },
      { key: 'MED-OXYTOCIN', name: 'Oxytocin 10 IU/ml 50ml Injection', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '150.0000', bio: false },
      { key: 'MED-IVERMECTIN', name: 'Ivermectin 1% Swine Dewormer 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '280.0000', bio: false },
      { key: 'VAC-PARVO-LEPTO', name: 'Parvo-Shield L5 Swine Vaccine (50 Doses)', type: 'VACCINE', cat: 'CAT-VET-VACCINES', uom: 'DOSE', val: 'FIFO', cost: '85.0000', bio: false },
      { key: 'VAC-PRRS-MLV', name: 'Ingelvac PRRS MLV Swine Vaccine (50 Doses)', type: 'VACCINE', cat: 'CAT-VET-VACCINES', uom: 'DOSE', val: 'FIFO', cost: '120.0000', bio: false },
      { key: 'BIO-SWINE-PIGLET', name: 'Suckling Live Piglet (0-4 Wks)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '3500.0000', bio: true },
      { key: 'BIO-SWINE-GILT', name: 'Replacement Breeding Gilt', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '18000.0000', bio: true },
      { key: 'BIO-SWINE-SOW', name: 'Mature Parity Breeding Sow', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '28000.0000', bio: true },
      { key: 'BIO-SWINE-BOAR', name: 'Mature Herd Sire Boar', type: 'LIVESTOCK', cat: 'CAT-BIO-BREEDING', uom: 'HEAD', val: 'BIO_ASSET', cost: '45000.0000', bio: true },
];

export const ITEM_CATALOG_2: SeedItem[] = [
      { key: 'RAW-MAIZE-CORN', name: 'Yellow Feed Maize / Corn Grains', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '22.0000', bio: false },
      { key: 'RAW-SOYA-MEAL', name: 'De-hulled Soya Meal (46% CP)', type: 'RAW_MATERIAL', cat: 'CAT-PROTEIN-SUPP', uom: 'KG', val: 'FIFO', cost: '42.0000', bio: false },
      { key: 'RAW-WHEAT-BRAN', name: 'Coarse Wheat Bran (14% CP)', type: 'RAW_MATERIAL', cat: 'CAT-RAW-GRAINS', uom: 'KG', val: 'FIFO', cost: '18.5000', bio: false },
      { key: 'RAW-SWINE-PREMIX', name: 'Swine Vitamin & Trace Mineral Premix', type: 'RAW_MATERIAL', cat: 'CAT-FEED-PREMIX', uom: 'KG', val: 'FIFO', cost: '180.0000', bio: false },
      { key: 'FEED-WEAN-GROW', name: 'Weaner Grower Mash (18% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '34.5000', bio: false },
      { key: 'FEED-FINISHER', name: 'Finisher High-Gain Porker Feed (15.5% CP)', type: 'FEED', cat: 'CAT-SWINE-FEEDS', uom: 'KG', val: 'FIFO', cost: '31.0000', bio: false },
      { key: 'MED-IVERMECTIN', name: 'Ivermectin 1% Swine Dewormer 100ml', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'VIAL', val: 'FIFO', cost: '280.0000', bio: false },
      { key: 'MED-TYLOSIN', name: 'Tylosin Tartrate 100g Soluble Powder', type: 'MEDICINE', cat: 'CAT-VET-MEDS', uom: 'PACK', val: 'FIFO', cost: '350.0000', bio: false },
      { key: 'BIO-SWINE-PIGLET', name: 'Weaned Feeder Piglet (7-10kg)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '4200.0000', bio: true },
      { key: 'BIO-SWINE-FINISHER', name: 'Finished Market Porker (105kg Live)', type: 'LIVESTOCK', cat: 'CAT-BIO-COMMERCIAL', uom: 'HEAD', val: 'BIO_ASSET', cost: '12500.0000', bio: true },
      { key: 'LVS-DRESSED-PORK', name: 'Dressed Pork Carcass (Wholesale Cut)', type: 'FINISHED_GOODS', cat: 'CAT-BIO-COMMERCIAL', uom: 'KG', val: 'FIFO', cost: '185.0000', bio: false },
];

/** name -> seed key, across both catalogues. Names are unique within the demo. */
export const SEED_KEY_BY_ITEM_NAME: Record<string, string> = Object.fromEntries(
  [...ITEM_CATALOG_1, ...ITEM_CATALOG_2].map((i) => [i.name, i.key]),
);

/**
 * A company's items keyed by seed key, so `get('FEED-GEST-SOW')` keeps working
 * regardless of what the ITEM series composed for that item's actual code.
 * Items with no catalogue entry are keyed by their code, so anything seeded
 * outside these catalogues is still reachable.
 */
export async function loadItemsByKey(db: any, companyId: string): Promise<Map<string, any>> {
  const rows = await db.select().from(schema.itemMaster).where(eq(schema.itemMaster.company_id, companyId));
  return new Map(rows.map((r: any) => [SEED_KEY_BY_ITEM_NAME[r.item_name] ?? r.item_code, r]));
}
