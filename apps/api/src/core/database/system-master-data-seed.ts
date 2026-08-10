/**
 * System-generated, tenant-wide reference master data.
 *
 * These are seeded into every tenant database (company_id left null) so
 * companies get a standard starting catalog instead of typing "KG" or
 * "Chicken" from scratch. Companies can still add their own company-scoped
 * entries alongside these via the normal master-data APIs.
 */

export const SYSTEM_UOM_SEED: Array<{
  uom_code: string;
  uom_name: string;
  uom_type: string;
  decimal_places: number;
  is_base_uom: boolean;
}> = [
  { uom_code: 'KG', uom_name: 'Kilogram', uom_type: 'WEIGHT', decimal_places: 3, is_base_uom: true },
  { uom_code: 'GRAM', uom_name: 'Gram', uom_type: 'WEIGHT', decimal_places: 0, is_base_uom: false },
  { uom_code: 'TONNE', uom_name: 'Metric Tonne', uom_type: 'WEIGHT', decimal_places: 3, is_base_uom: false },
  { uom_code: 'LITER', uom_name: 'Litre', uom_type: 'VOLUME', decimal_places: 3, is_base_uom: true },
  { uom_code: 'ML', uom_name: 'Millilitre', uom_type: 'VOLUME', decimal_places: 0, is_base_uom: false },
  { uom_code: 'PCS', uom_name: 'Pieces', uom_type: 'COUNT', decimal_places: 0, is_base_uom: true },
  { uom_code: 'DOZEN', uom_name: 'Dozen', uom_type: 'COUNT', decimal_places: 0, is_base_uom: false },
  { uom_code: 'BOX', uom_name: 'Box', uom_type: 'COUNT', decimal_places: 0, is_base_uom: false },
  { uom_code: 'BAG', uom_name: 'Bag', uom_type: 'COUNT', decimal_places: 0, is_base_uom: false },
  { uom_code: 'SQFT', uom_name: 'Square Feet', uom_type: 'AREA', decimal_places: 2, is_base_uom: true },
  { uom_code: 'SQM', uom_name: 'Square Meter', uom_type: 'AREA', decimal_places: 2, is_base_uom: false },
  { uom_code: 'HOUR', uom_name: 'Hour', uom_type: 'TIME', decimal_places: 2, is_base_uom: true },
  { uom_code: 'DAY', uom_name: 'Day', uom_type: 'TIME', decimal_places: 0, is_base_uom: false },
];

export const SYSTEM_SPECIES_SEED: Array<{
  species_code: string;
  species_name: string;
}> = [
  { species_code: 'CHICKEN', species_name: 'Chicken' },
  { species_code: 'DUCK', species_name: 'Duck' },
  { species_code: 'TURKEY', species_name: 'Turkey' },
  { species_code: 'QUAIL', species_name: 'Quail' },
  { species_code: 'CATTLE', species_name: 'Cattle' },
  { species_code: 'BUFFALO', species_name: 'Buffalo' },
  { species_code: 'GOAT', species_name: 'Goat' },
  { species_code: 'SHEEP', species_name: 'Sheep' },
  { species_code: 'PIG', species_name: 'Pig' },
  { species_code: 'FISH', species_name: 'Fish' },
  { species_code: 'SHRIMP', species_name: 'Shrimp' },
  { species_code: 'BEE', species_name: 'Honey Bee' },
];

/**
 * One representative breed per applicable LOB (breed_master.nob_id is
 * required, lob_id scopes it further — see breed.service.ts's wildcard
 * matching for lob_id: null). company_id is left null at insert time so
 * these are visible to every company in the tenant, same as UOM/species
 * above. Not exhaustive — just enough that every LOB's Breed dropdown has a
 * real starting option instead of being empty.
 */
export const SYSTEM_BREED_SEED: Array<{
  nob_code: string;
  lob_code: string;
  breed_code: string;
  breed_name: string;
  species_code: string;
  breed_type: string;
}> = [
  { nob_code: 'POULTRY', lob_code: 'PLT_REARING', breed_code: 'COBB-500', breed_name: 'Cobb 500', species_code: 'CHICKEN', breed_type: 'BROILER' },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', breed_code: 'BOVANS-WHITE', breed_name: 'Bovans White', species_code: 'CHICKEN', breed_type: 'LAYER' },
  { nob_code: 'POULTRY', lob_code: 'PLT_HATCHING', breed_code: 'ROSS-308', breed_name: 'Ross 308', species_code: 'CHICKEN', breed_type: 'BREEDER' },
  { nob_code: 'POULTRY', lob_code: 'PLT_CB', breed_code: 'COBB-500-CB', breed_name: 'Cobb 500 (Commercial Broiler)', species_code: 'CHICKEN', breed_type: 'BROILER' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_MILKING', breed_code: 'HOLSTEIN-FRIESIAN', breed_name: 'Holstein Friesian', species_code: 'CATTLE', breed_type: 'DAIRY' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', breed_code: 'YORKSHIRE', breed_name: 'Yorkshire', species_code: 'PIG', breed_type: 'MEAT' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_GOAT_SHEEP', breed_code: 'BOER-GOAT', breed_name: 'Boer Goat', species_code: 'GOAT', breed_type: 'MEAT' },
  { nob_code: 'AQUA', lob_code: 'AQA_FISH', breed_code: 'ROHU', breed_name: 'Rohu', species_code: 'FISH', breed_type: 'FISH' },
  { nob_code: 'INSECT', lob_code: 'INS_BEE', breed_code: 'ITALIAN-BEE', breed_name: 'Italian Honey Bee', species_code: 'BEE', breed_type: 'DUAL_PURPOSE' },
];

/**
 * A couple of representative items per LOB (input + main output), scoped by
 * nob_id/lob_id the same way batch-panel.tsx's item picker filters. Again,
 * company_id is left null (tenant-wide). item_type follows the values the
 * batch/inventory modules already recognize (RAW_MATERIAL / FINISHED_GOODS).
 */
export const SYSTEM_ITEM_SEED: Array<{
  nob_code: string;
  lob_code: string;
  item_code: string;
  item_name: string;
  item_type: string;
  uom_primary: string;
}> = [
  { nob_code: 'POULTRY', lob_code: 'PLT_REARING', item_code: 'PLT-DOC', item_name: 'Day-Old Chick', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'POULTRY', lob_code: 'PLT_REARING', item_code: 'PLT-STARTER-FEED', item_name: 'Starter Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', item_code: 'PLT-POL-PULLET', item_name: 'Point-of-Lay Pullet', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', item_code: 'PLT-TABLE-EGG', item_name: 'Table Eggs', item_type: 'FINISHED_GOODS', uom_primary: 'DOZEN' },
  { nob_code: 'POULTRY', lob_code: 'PLT_HATCHING', item_code: 'PLT-HATCH-EGG', item_name: 'Hatching Egg', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'POULTRY', lob_code: 'PLT_CB', item_code: 'PLT-BROILER-FEED', item_name: 'Broiler Grower Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'POULTRY', lob_code: 'PLT_CB', item_code: 'PLT-LIVE-BROILER', item_name: 'Live Broiler', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'POULTRY', lob_code: 'PLT_SLAUGHTER', item_code: 'PLT-LIVE-BIRD', item_name: 'Live Bird (Slaughter Input)', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'POULTRY', lob_code: 'PLT_SLAUGHTER', item_code: 'PLT-DRESSED-CHICKEN', item_name: 'Dressed Chicken', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_MILKING', item_code: 'LVS-DAIRY-FEED', item_name: 'Dairy Cattle Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_MILKING', item_code: 'LVS-RAW-MILK', item_name: 'Raw Milk', item_type: 'FINISHED_GOODS', uom_primary: 'LITER' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', item_code: 'LVS-PIGLET', item_name: 'Piglet', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', item_code: 'LVS-PIG-FEED', item_name: 'Pig Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', item_code: 'LVS-DRESSED-PORK', item_name: 'Dressed Pork', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_GOAT_SHEEP', item_code: 'LVS-GOAT-FEED', item_name: 'Goat Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_GOAT_SHEEP', item_code: 'LVS-LIVE-GOAT', item_name: 'Live Goat', item_type: 'FINISHED_GOODS', uom_primary: 'PCS' },
  { nob_code: 'AGRI', lob_code: 'AGRI_FRUIT', item_code: 'AGR-FRUIT-SAPLING', item_name: 'Fruit Sapling', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'AGRI', lob_code: 'AGRI_FRUIT', item_code: 'AGR-FRESH-FRUIT', item_name: 'Fresh Fruit', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'AGRI', lob_code: 'AGRI_CROP', item_code: 'AGR-SEED-STOCK', item_name: 'Seed Stock', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'AGRI', lob_code: 'AGRI_CROP', item_code: 'AGR-HARVEST-CROP', item_name: 'Harvested Crop', item_type: 'FINISHED_GOODS', uom_primary: 'TONNE' },
  { nob_code: 'AGRI', lob_code: 'AGRI_SEEDS', item_code: 'AGR-FOUNDATION-SEED', item_name: 'Foundation Seed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'AGRI', lob_code: 'AGRI_SEEDS', item_code: 'AGR-CERTIFIED-SEED', item_name: 'Certified Seed', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'AQUA', lob_code: 'AQA_FISH', item_code: 'AQA-FINGERLING', item_name: 'Fish Fingerling', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'AQUA', lob_code: 'AQA_FISH', item_code: 'AQA-FISH-FEED', item_name: 'Fish Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'AQUA', lob_code: 'AQA_SLAUGHTER', item_code: 'AQA-LIVE-FISH', item_name: 'Live Fish (Slaughter Input)', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'AQUA', lob_code: 'AQA_SLAUGHTER', item_code: 'AQA-PROCESSED-FISH', item_name: 'Processed Fish', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'INSECT', lob_code: 'INS_BEE', item_code: 'INS-BEE-COLONY', item_name: 'Bee Colony', item_type: 'RAW_MATERIAL', uom_primary: 'BOX' },
  { nob_code: 'INSECT', lob_code: 'INS_BEE', item_code: 'INS-RAW-HONEY', item_name: 'Raw Honey', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'INSECT', lob_code: 'BSF', item_code: 'INS-BSF-LARVAE-STOCK', item_name: 'BSF Larvae Stock', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'INSECT', lob_code: 'BSF', item_code: 'INS-BSF-PROCESSED-FRASS', item_name: 'Processed BSF Frass', item_type: 'FINISHED_GOODS', uom_primary: 'KG' },
  { nob_code: 'PRODUCTION', lob_code: 'FEED_PROD', item_code: 'PRD-RAW-GRAIN', item_name: 'Raw Grain', item_type: 'RAW_MATERIAL', uom_primary: 'TONNE' },
  { nob_code: 'PRODUCTION', lob_code: 'FEED_PROD', item_code: 'PRD-FINISHED-FEED', item_name: 'Finished Feed', item_type: 'FINISHED_GOODS', uom_primary: 'TONNE' },
];
