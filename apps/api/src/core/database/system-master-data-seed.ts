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
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', item_code: 'PLT-LAYER-FEED', item_name: 'Layer Feed', item_type: 'RAW_MATERIAL', uom_primary: 'KG' },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', item_code: 'PLT-TABLE-EGG', item_name: 'Table Eggs', item_type: 'FINISHED_GOODS', uom_primary: 'DOZEN' },
  { nob_code: 'POULTRY', lob_code: 'PLT_HATCHING', item_code: 'PLT-HATCH-EGG', item_name: 'Hatching Egg', item_type: 'RAW_MATERIAL', uom_primary: 'PCS' },
  { nob_code: 'POULTRY', lob_code: 'PLT_HATCHING', item_code: 'PLT-HATCHED-DOC', item_name: 'Hatched Day-Old Chick', item_type: 'FINISHED_GOODS', uom_primary: 'PCS' },
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

/**
 * Default batch KPI parameters per NOB/LOB — the same CONSUMPTION / MORTALITY
 * / OUTPUT / OVERHEAD types the batch transaction engine itself uses (see
 * TRANSACTION_TYPES in batch.dto.ts), scoped as tenant-wide templates
 * (company_id null) so every LOB's Scheduler/Parameter picker has real
 * options instead of an empty list. CONSUMPTION/OUTPUT parameters carry an
 * item_code resolved to the matching SYSTEM_ITEM_SEED entry above — the
 * parameter DTO treats item_id as required for those two types.
 * Values (feed intake rates, yields) are standard husbandry/agronomy
 * approximations, meant as an editable starting point per company, not a
 * precise breed-specific standard.
 */
export const SYSTEM_PARAMETER_SEED: Array<{
  nob_code: string;
  lob_code: string;
  parameter_code: string;
  parameter_name: string;
  parameter_type: 'CONSUMPTION' | 'MORTALITY' | 'OUTPUT' | 'OVERHEAD' | 'OBSERVATION';
  item_code?: string;
  default_uom?: string;
  qty_method: 'PER_UNIT' | 'PER_BATCH' | 'MANUAL_AT_ENTRY';
  default_qty_per_unit?: number;
  default_qty_per_batch?: number;
  is_mandatory?: boolean;
}> = [
  // Poultry
  { nob_code: 'POULTRY', lob_code: 'PLT_REARING', parameter_code: 'PARAM-PLT-REARING-FEED', parameter_name: 'Starter Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'PLT-STARTER-FEED', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 0.05, is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_REARING', parameter_code: 'PARAM-PLT-REARING-MORT', parameter_name: 'Rearing Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', parameter_code: 'PARAM-PLT-LAYING-FEED', parameter_name: 'Layer Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'PLT-LAYER-FEED', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 0.11, is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', parameter_code: 'PARAM-PLT-LAYING-MORT', parameter_name: 'Laying Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_LAYING', parameter_code: 'PARAM-PLT-LAYING-EGG', parameter_name: 'Egg Production (Hen-Day Rate)', parameter_type: 'OUTPUT', item_code: 'PLT-TABLE-EGG', default_uom: 'DOZEN', qty_method: 'PER_UNIT', default_qty_per_unit: 0.075, is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_HATCHING', parameter_code: 'PARAM-PLT-HATCH-OUTPUT', parameter_name: 'Hatch Output', parameter_type: 'OUTPUT', item_code: 'PLT-HATCHED-DOC', default_uom: 'PCS', qty_method: 'PER_BATCH', is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_CB', parameter_code: 'PARAM-PLT-CB-FEED', parameter_name: 'Broiler Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'PLT-BROILER-FEED', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 0.09, is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_CB', parameter_code: 'PARAM-PLT-CB-MORT', parameter_name: 'Broiler Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_CB', parameter_code: 'PARAM-PLT-CB-WEIGHT', parameter_name: 'Live Weight Output', parameter_type: 'OUTPUT', item_code: 'PLT-LIVE-BROILER', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 2.0, is_mandatory: true },
  { nob_code: 'POULTRY', lob_code: 'PLT_SLAUGHTER', parameter_code: 'PARAM-PLT-SLAUGHTER-OUTPUT', parameter_name: 'Dressed Output', parameter_type: 'OUTPUT', item_code: 'PLT-DRESSED-CHICKEN', default_uom: 'KG', qty_method: 'PER_BATCH', is_mandatory: true },
  // Livestock
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_MILKING', parameter_code: 'PARAM-LVS-MILKING-FEED', parameter_name: 'Dairy Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'LVS-DAIRY-FEED', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 12, is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_MILKING', parameter_code: 'PARAM-LVS-MILKING-MORT', parameter_name: 'Herd Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_MILKING', parameter_code: 'PARAM-LVS-MILKING-YIELD', parameter_name: 'Milk Yield', parameter_type: 'OUTPUT', item_code: 'LVS-RAW-MILK', default_uom: 'LITER', qty_method: 'PER_UNIT', default_qty_per_unit: 15, is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', parameter_code: 'PARAM-LVS-PIGGERY-FEED', parameter_name: 'Pig Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'LVS-PIG-FEED', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 2.2, is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', parameter_code: 'PARAM-LVS-PIGGERY-MORT', parameter_name: 'Herd Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_PIGGERY', parameter_code: 'PARAM-LVS-PIGGERY-WEIGHT', parameter_name: 'Dressed Weight Output', parameter_type: 'OUTPUT', item_code: 'LVS-DRESSED-PORK', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 65, is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_GOAT_SHEEP', parameter_code: 'PARAM-LVS-GOAT-FEED', parameter_name: 'Goat Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'LVS-GOAT-FEED', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 1.5, is_mandatory: true },
  { nob_code: 'LIVESTOCK', lob_code: 'LVS_GOAT_SHEEP', parameter_code: 'PARAM-LVS-GOAT-MORT', parameter_name: 'Herd Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  // Agriculture (no herd mortality — output/yield-driven instead)
  { nob_code: 'AGRI', lob_code: 'AGRI_FRUIT', parameter_code: 'PARAM-AGR-FRUIT-YIELD', parameter_name: 'Fruit Yield', parameter_type: 'OUTPUT', item_code: 'AGR-FRESH-FRUIT', default_uom: 'KG', qty_method: 'PER_BATCH', is_mandatory: true },
  { nob_code: 'AGRI', lob_code: 'AGRI_CROP', parameter_code: 'PARAM-AGR-CROP-YIELD', parameter_name: 'Crop Yield', parameter_type: 'OUTPUT', item_code: 'AGR-HARVEST-CROP', default_uom: 'TONNE', qty_method: 'PER_BATCH', is_mandatory: true },
  { nob_code: 'AGRI', lob_code: 'AGRI_SEEDS', parameter_code: 'PARAM-AGR-SEEDS-OUTPUT', parameter_name: 'Seed Multiplication Output', parameter_type: 'OUTPUT', item_code: 'AGR-CERTIFIED-SEED', default_uom: 'KG', qty_method: 'PER_BATCH', is_mandatory: true },
  // Aquaculture
  { nob_code: 'AQUA', lob_code: 'AQA_FISH', parameter_code: 'PARAM-AQA-FISH-FEED', parameter_name: 'Fish Feed Consumption', parameter_type: 'CONSUMPTION', item_code: 'AQA-FISH-FEED', default_uom: 'KG', qty_method: 'PER_BATCH', is_mandatory: true },
  { nob_code: 'AQUA', lob_code: 'AQA_FISH', parameter_code: 'PARAM-AQA-FISH-MORT', parameter_name: 'Pond Mortality', parameter_type: 'MORTALITY', default_uom: 'PCS', qty_method: 'MANUAL_AT_ENTRY', is_mandatory: true },
  { nob_code: 'AQUA', lob_code: 'AQA_SLAUGHTER', parameter_code: 'PARAM-AQA-SLAUGHTER-OUTPUT', parameter_name: 'Processed Fish Output', parameter_type: 'OUTPUT', item_code: 'AQA-PROCESSED-FISH', default_uom: 'KG', qty_method: 'PER_BATCH', is_mandatory: true },
  // Insect farming
  { nob_code: 'INSECT', lob_code: 'INS_BEE', parameter_code: 'PARAM-INS-BEE-YIELD', parameter_name: 'Honey Yield', parameter_type: 'OUTPUT', item_code: 'INS-RAW-HONEY', default_uom: 'KG', qty_method: 'PER_UNIT', default_qty_per_unit: 20, is_mandatory: true },
  { nob_code: 'INSECT', lob_code: 'BSF', parameter_code: 'PARAM-INS-BSF-OUTPUT', parameter_name: 'Frass Output', parameter_type: 'OUTPUT', item_code: 'INS-BSF-PROCESSED-FRASS', default_uom: 'KG', qty_method: 'PER_BATCH', is_mandatory: true },
  // Feed production
  { nob_code: 'PRODUCTION', lob_code: 'FEED_PROD', parameter_code: 'PARAM-PRD-FEED-GRAIN', parameter_name: 'Raw Grain Usage', parameter_type: 'CONSUMPTION', item_code: 'PRD-RAW-GRAIN', default_uom: 'TONNE', qty_method: 'PER_BATCH', is_mandatory: true },
  { nob_code: 'PRODUCTION', lob_code: 'FEED_PROD', parameter_code: 'PARAM-PRD-FEED-OUTPUT', parameter_name: 'Finished Feed Output', parameter_type: 'OUTPUT', item_code: 'PRD-FINISHED-FEED', default_uom: 'TONNE', qty_method: 'PER_BATCH', is_mandatory: true },
];
