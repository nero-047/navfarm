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
  /** API path to fetch related records from, for type: "select-entity" */
  entityEndpoint?: string;
  /** Field on the related record to use as the option value (defaults to its idKey) */
  entityValueKey?: string;
  /** Fields on the related record to join (" — ") for the option label */
  entityLabelKeys?: string[];
  /** Excluded from the create/edit form (e.g. company_id, auto-injected) */
  hideInForm?: boolean;
  /** Excluded from the list table */
  hideInTable?: boolean;
  /** Column width hint for number inputs supporting decimals */
  step?: string;
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
