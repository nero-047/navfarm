/** Explicit table/column identities used by the pre-migration duplicate check.
 * Stage retains its existing per-LOB identity; every other catalog is per scope. */
export const MASTER_CODE_UNIQUE_KEYS: Record<string, string[]> = {
  uom_master: ['uom_code'], species_master: ['species_code'], breed_master: ['breed_code'],
  location_master: ['location_code'], location_type_master: ['type_code'],
  item_master: ['item_code'], item_type_master: ['type_code'], item_category_master: ['category_code'],
  item_attribute_master: ['attribute_code'], supplier_master: ['supplier_code'], customer_master: ['customer_code'],
  resource_master: ['resource_code'], disease_master: ['disease_code'], feed_formula_master: ['formula_code'],
  gl_account_master: ['account_code'], cost_center_master: ['cost_center_code'],
  no_series_master: ['series_code'], stage_master: ['lob_id', 'stage_code'],
};
