/** Explicit mapping: GL/account_code and feed formula/formula_code are not
 * derivable by appending _code to the master name. UUID-only joins are absent. */
export const MASTER_CODE_COLUMNS: Record<string, string> = {
  ITEM: 'item_code', ITEM_TYPE: 'type_code', ITEM_CATEGORY: 'category_code',
  ITEM_ATTRIBUTE: 'attribute_code', LOCATION: 'location_code', LOCATION_TYPE: 'type_code',
  BREED: 'breed_code', SPECIES: 'species_code', UOM: 'uom_code', STAGE: 'stage_code',
  SUPPLIER: 'supplier_code', CUSTOMER: 'customer_code', RESOURCE: 'resource_code',
  REASON: 'reason_code', DISEASE: 'disease_code', FEED_FORMULA: 'formula_code',
  GL_ACCOUNT: 'account_code', COST_CENTER: 'cost_center_code', ANIMAL: 'animal_code',
};
