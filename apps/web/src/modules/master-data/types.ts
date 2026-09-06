export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "email"
  | "date"
  | "select"
  | "select-entity"
  | "json"
  | "string-list";

export interface SelectOption {
  value: string;
  label: string;
}

/** One condition for `requiredWhen`: matches when `key`'s current form value equals `equals`
 * (or one of `equals`, if an array), or — when `equals` is omitted — simply has any non-empty
 * value. */
export interface RequiredCondition {
  key: string;
  equals?: string | boolean | Array<string | boolean>;
}

export interface MasterDataField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /**
   * Marks this field conditionally required — required only when at least one of `anyOf`'s
   * conditions currently matches the form's live values (e.g. `standard_cost` required only
   * when `valuation_method` is `STANDARD`). Shown with the same asterisk as `required`, and
   * enforced client-side on save; the API enforces the same rule independently.
   */
  requiredWhen?: { anyOf: RequiredCondition[] };
  /** Render and submit only while at least one condition matches. */
  visibleWhen?: { anyOf: RequiredCondition[] };
  placeholder?: string;
  helpText?: string;
  /** Static dropdown options, for type: "select" */
  options?: SelectOption[];
  /** API path to fetch related records from, for type: "select-entity". In "path" mode (default), include "{value}" as a placeholder for the (single) parent field's current value. */
  entityEndpoint?: string;
  /** Field on the related record to use as the option value (defaults to its idKey) */
  entityValueKey?: string;
  /** Fields on the related record to join (" — ") for the option label */
  entityLabelKeys?: string[];
  /** Select multiple related values with checkboxes (submitted as an array). */
  multiple?: boolean;
  /**
   * For type "select-entity": key(s) of other field(s) in this form whose value this dropdown
   * depends on (e.g. lob_id depending on nob_id). Disabled until every parent has a value;
   * resets when any parent changes.
   */
  dependsOn?: string | string[];
  /**
   * How dependsOn resolves into the fetch endpoint:
   * - "path" (default): a single dependsOn key substituted for "{value}" in entityEndpoint
   *   (e.g. entityEndpoint "/setup/wizard/lobs/{value}").
   * - "query": each dependsOn key is appended to entityEndpoint as a query param, named via
   *   queryParams (e.g. entityEndpoint "/item", queryParams { nob_id: "nobId", lob_id: "lobId" }
   *   produces "/item?nobId=...&lobId=..."). Unlike "path", a parent left unset simply omits
   *   that param rather than blocking the fetch — matches the backend treating an absent
   *   filter as "show all".
   */
  dependsOnMode?: "path" | "query";
  /** Required when dependsOnMode is "query": maps each dependsOn field key to its query-param name. */
  queryParams?: Record<string, string>;
  /**
   * For dependsOnMode "query": hide this field until every parent has a value,
   * and hide it when the filtered picker would be empty.
   *
   * Query mode deliberately omits an unset parent rather than blocking the
   * fetch, which is right for an optional filter but wrong for a hierarchy —
   * without this, Sub Category listed every category in the tenant while no
   * Category was chosen, and Category listed every one while no Item Type was.
   * A picker that cannot be filtered yet should not be offered at all.
   */
  requiresParent?: boolean;
  /**
   * Field exists purely to scope a sibling select-entity field's options (e.g. a helper
   * nob_id/lob_id pair on a form whose own table has no such column) — collected in the form
   * but excluded from the save payload.
   */
  filterOnly?: boolean;
  /** Excluded from the create/edit form (e.g. company_id, auto-injected) */
  hideInForm?: boolean;
  /** Visible for context but never editable or included in a save payload. */
  readOnly?: boolean;
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
  /**
   * Only shown once editing — omit from the create form/payload (e.g. a value the service
   * computes on create, such as an animal's opening bio-asset value, that the API's create
   * endpoint doesn't accept but its update endpoint does).
   */
  editOnly?: boolean;
  /**
   * Key(s) of other field(s) in this form that must be left empty when this one is set (e.g.
   * a location's farm_id/shed_id/warehouse_id, where exactly one may be chosen) — setting this
   * field to a non-empty value clears each listed field, so the mutual-exclusivity the backend
   * enforces can't be violated from the form itself.
   */
  exclusiveWith?: string[];
  /** Card this field belongs to. Fields with no section land in the first card. */
  section?: string;
  /** Show this optional field in the compact inline lookup creator. */
  showInLookup?: boolean;
}

export interface MasterDataConfig {
  key: string;
  /** Plural — the list heading and sidebar entry, e.g. "Item Categories". */
  label: string;
  /**
   * Singular form for "Add X" / "Edit X", when `label` is not simply the
   * singular plus an `s` (or `y` → `ies`). English plurals that are their own
   * singular ("Number Series", "Species") and heads that are not the last word
   * ("Units of Measure") must declare it — otherwise `singularLabel()` guesses,
   * and guessing produced "Add Number Serie".
   */
  singular?: string;
  description?: string;
  apiBase: string;
  idKey: string;
  fields: MasterDataField[];
  /** Frontend-only BC references. Never part of creation/edit payloads. */
  bcFields?: { key: string; label: string }[];
  /** BC owns this catalog; local users may browse but cannot mutate it. */
  owner?: "BC";
  /** BBP business administrator mapped to Tenant/Company Admin by the user. */
  businessAdminOnly?: boolean;
  /** Table columns; defaults to all non-hidden fields plus status if omitted */
  columns?: { key: string; label: string }[];
  group: string;
  /** Show a Nature of Business / Line of Business filter pair in the list toolbar (for entities whose table carries nob_id/lob_id). */
  supportsNobLobFilter?: boolean;
  /**
   * Whether `apiBase` exposes `PATCH /:id/restore` to un-block a soft-deleted row. Defaults to
   * true (the pattern nearly every master-data controller follows) — set false for the handful
   * that don't (e.g. Stage, Number Series, Animal Register, Breed Lifecycle Stages, UOM
   * Conversions), so the table doesn't offer a Restore action that would 404.
   */
  supportsRestore?: boolean;
  /**
   * Shown in the master-data sub-sidebar. A master that is only a lookup for
   * another master (item category, UOM) is not primary — it is reached
   * through the card in its parent's dialog, not through its own nav entry.
   */
  isPrimary?: boolean;
  /** Primary master whose workbook contains this independently editable sheet. */
  tabOf?: string;
  /** Short label for this sheet in its master's tab bar. */
  tabLabel?: string;
  /**
   * Keys of the primary masters whose dialog renders this master as an
   * inline card. Order here is the order the cards appear.
   */
  lookupFor?: string[];
}
