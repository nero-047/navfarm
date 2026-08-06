export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "email"
  | "date"
  | "select"
  | "select-entity"
  | "json";

export interface SelectOption {
  value: string;
  label: string;
}

export interface MasterDataField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  /** Static dropdown options, for type: "select" */
  options?: SelectOption[];
  /** API path to fetch related records from, for type: "select-entity". If dependsOn is set, include "{value}" as a placeholder for the parent field's current value. */
  entityEndpoint?: string;
  /** Field on the related record to use as the option value (defaults to its idKey) */
  entityValueKey?: string;
  /** Fields on the related record to join (" — ") for the option label */
  entityLabelKeys?: string[];
  /** For type "select-entity": key of another field in this form whose value this dropdown depends on (e.g. lob_id depending on nob_id). Disabled until the parent has a value; resets when the parent changes. */
  dependsOn?: string;
  /** Excluded from the create/edit form (e.g. company_id, auto-injected) */
  hideInForm?: boolean;
  /** Excluded from the list table */
  hideInTable?: boolean;
  /** Column width hint for number inputs supporting decimals */
  step?: string;
  /**
   * For type "json" holding an array of objects: when the API's read shape has
   * more keys than its write shape accepts (e.g. a joined display field), list
   * the keys to keep when pre-filling the edit form so the round-tripped JSON
   * doesn't get rejected by a strict (forbidNonWhitelisted) update DTO.
   */
  jsonListKeys?: string[];
  /** Only sent on create — omit from the edit form/payload (e.g. the API's update endpoint doesn't accept this field). */
  createOnly?: boolean;
}

export interface MasterDataConfig {
  key: string;
  label: string;
  description?: string;
  apiBase: string;
  idKey: string;
  fields: MasterDataField[];
  /** Table columns; defaults to all non-hidden fields plus status if omitted */
  columns?: { key: string; label: string }[];
  group: string;
}
