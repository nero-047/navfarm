import type { MasterDataConfig } from "./types";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ARCHIVE", label: "Archive" },
];

// ── Farm Operations ─────────────────────────────────────────────────────────

const farm: MasterDataConfig = {
  key: "farm",
  label: "Farms",
  description: "Physical farm sites owned by the company.",
  apiBase: "/farm",
  idKey: "farm_id",
  group: "Farm Operations",
  supportsNobLobFilter: true,
  columns: [
    { key: "farm_code", label: "Code" },
    { key: "farm_name", label: "Name" },
    { key: "farm_type", label: "Type" },
    { key: "city", label: "City" },
    { key: "capacity", label: "Capacity" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "farm_code", label: "Farm Code", type: "text", required: true, placeholder: "e.g. FARM01" },
    { key: "farm_name", label: "Farm Name", type: "text", required: true, placeholder: "Green Valley Breeding Farm" },
    {
      key: "farm_type", label: "Farm Type", type: "select", required: true,
      options: ["BREEDER", "COMMERCIAL_LAYERS", "COMMERCIAL_BROILERS", "HATCHERY", "REARING", "DAIRY"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank if this farm is shared across all business verticals." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank if this farm is shared across all LOBs under the selected NOB." },
    { key: "capacity", label: "Capacity", type: "number" },
    { key: "address_line1", label: "Address Line 1", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "country", label: "Country", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
  ],
};

const warehouse: MasterDataConfig = {
  key: "warehouse",
  label: "Warehouses",
  description: "Storage facilities and silos, optionally linked to a farm.",
  apiBase: "/warehouse",
  idKey: "warehouse_id",
  group: "Farm Operations",
  columns: [
    { key: "warehouse_code", label: "Code" },
    { key: "warehouse_name", label: "Name" },
    { key: "warehouse_type", label: "Type" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "farm_id", label: "Farm", type: "select-entity", entityEndpoint: "/farm", entityValueKey: "farm_id", entityLabelKeys: ["farm_code", "farm_name"] },
    { key: "warehouse_code", label: "Warehouse Code", type: "text", required: true, placeholder: "WH01" },
    { key: "warehouse_name", label: "Warehouse Name", type: "text", required: true, placeholder: "Raw Material Feed Silo 1" },
    {
      key: "warehouse_type", label: "Warehouse Type", type: "select", required: true,
      options: ["COLD_STORAGE", "SILO", "GENERAL", "INGREDIENTS", "MEDICINE"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
  ],
};

const location: MasterDataConfig = {
  key: "location",
  label: "Locations",
  description: "Hierarchical storage/operational locations — set exactly one parent (Farm, Shed, or Warehouse).",
  apiBase: "/location",
  idKey: "location_id",
  group: "Farm Operations",
  columns: [
    { key: "location_code", label: "Code" },
    { key: "location_name", label: "Name" },
    { key: "location_type", label: "Type" },
    { key: "location_level", label: "Level" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "farm_id", label: "Parent: Farm", type: "select-entity", entityEndpoint: "/farm", entityValueKey: "farm_id", entityLabelKeys: ["farm_code", "farm_name"], helpText: "Set exactly one of Farm / Shed / Warehouse as this location's parent.", exclusiveWith: ["shed_id", "warehouse_id"] },
    { key: "shed_id", label: "Parent: Shed", type: "select-entity", entityEndpoint: "/shed", entityValueKey: "shed_id", entityLabelKeys: ["shed_code", "shed_name"], helpText: "Set exactly one of Farm / Shed / Warehouse as this location's parent.", exclusiveWith: ["farm_id", "warehouse_id"] },
    { key: "warehouse_id", label: "Parent: Warehouse", type: "select-entity", entityEndpoint: "/warehouse", entityValueKey: "warehouse_id", entityLabelKeys: ["warehouse_code", "warehouse_name"], helpText: "Set exactly one of Farm / Shed / Warehouse as this location's parent.", exclusiveWith: ["farm_id", "shed_id"] },
    { key: "parent_location_id", label: "Parent Location (sub-location nesting)", type: "select-entity", entityEndpoint: "/location", entityValueKey: "location_id", entityLabelKeys: ["location_code", "location_name"] },
    { key: "location_code", label: "Location Code", type: "text", required: true, placeholder: "LOC-A" },
    { key: "location_name", label: "Location Name", type: "text", required: true, placeholder: "Storage Area A" },
    { key: "location_address", label: "Location Address", type: "text", required: true, placeholder: "Porta Farm - ABC" },
    { key: "location_level", label: "Hierarchy Level", type: "number", required: true },
    {
      key: "location_type", label: "Location Type", type: "select", required: true,
      options: ["FARM", "SHED", "AREA", "SECTION", "ROOM", "AISLE", "SHELF", "PEN", "SILO"].map((v) => ({ value: v, label: v })),
    },
    { key: "area_size", label: "Area Size", type: "number", step: "0.01" },
    { key: "area_unit", label: "Area Unit", type: "select-entity", entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "max_capacity", label: "Max Capacity", type: "number", step: "0.01" },
    { key: "capacity_uom", label: "Capacity UOM", type: "select-entity", entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "current_count", label: "Current Count", type: "number", step: "0.01" },
    { key: "gps_latitude", label: "GPS Latitude", type: "number", step: "0.000001" },
    { key: "gps_longitude", label: "GPS Longitude", type: "number", step: "0.000001" },
    { key: "storage_type", label: "Storage Conditions", type: "text" },
    { key: "is_quarantine_zone", label: "Quarantine Zone", type: "boolean" },
    { key: "silo_capacity_kg", label: "Silo Capacity (KG)", type: "number", step: "0.01", helpText: "Required for SILO locations." },
    { key: "silo_reorder_days", label: "Silo Reorder Days", type: "number", helpText: "Required for SILO locations. Alerts when stock covers fewer than this many days." },
    { key: "downtime_days_required", label: "Downtime Days Required", type: "number", helpText: "Mandatory empty days between batches at this location for biosecurity." },
  ],
};

const shed: MasterDataConfig = {
  key: "shed",
  label: "Sheds",
  description: "Rearing sheds belonging to a farm.",
  apiBase: "/shed",
  idKey: "shed_id",
  group: "Farm Operations",
  supportsNobLobFilter: true,
  columns: [
    { key: "shed_code", label: "Code" },
    { key: "shed_name", label: "Name" },
    { key: "shed_type", label: "Type" },
    { key: "capacity", label: "Capacity" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "farm_id", label: "Farm", type: "select-entity", required: true, entityEndpoint: "/farm", entityValueKey: "farm_id", entityLabelKeys: ["farm_code", "farm_name"] },
    { key: "shed_code", label: "Shed Code", type: "text", required: true, placeholder: "SHED01" },
    { key: "shed_name", label: "Shed Name", type: "text", required: true, placeholder: "Broiler Grow-out Shed 1" },
    {
      key: "shed_type", label: "Shed Type", type: "select", required: true,
      options: ["OPEN_SIDED", "ENVIRONMENTALLY_CONTROLLED", "SEMI_EC"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank if this shed is shared across all business verticals." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank if this shed is shared across all LOBs under the selected NOB." },
    { key: "capacity", label: "Capacity", type: "number" },
  ],
};

// ── Production ───────────────────────────────────────────────────────────────

const stage: MasterDataConfig = {
  key: "stage",
  label: "Stages",
  description: "Production lifecycle stages per NOB/LOB (e.g. piggery: Quarantine → Gilt Grower → ... → Disposed) — sequencing and transition rules for batches.",
  apiBase: "/stage",
  idKey: "stage_id",
  group: "Production",
  supportsNobLobFilter: true,
  columns: [
    { key: "stage_sequence", label: "#" },
    { key: "stage_code", label: "Code" },
    { key: "stage_name", label: "Name" },
    { key: "stage_category", label: "Category" },
    { key: "transition_trigger", label: "Trigger" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", required: true, entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"] },
    { key: "lob_id", label: "Line of Business", type: "select-entity", required: true, entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id" },
    { key: "stage_code", label: "Stage Code", type: "text", required: true, placeholder: "QUARANTINE" },
    { key: "stage_name", label: "Stage Name", type: "text", required: true, placeholder: "Quarantine" },
    {
      key: "stage_category", label: "Category", type: "select", required: true,
      options: ["PRE_PRODUCTIVE", "PRODUCTIVE", "OUTPUT", "DISPOSAL"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "stage_sequence", label: "Display Order", type: "number", required: true, helpText: "Must be unique per Line of Business." },
    { key: "typical_duration_days", label: "Typical Duration (days)", type: "number" },
    { key: "min_days_before_move", label: "Min Days Before Move", type: "number", helpText: "Minimum days in this stage before a transition is allowed." },
    {
      key: "transition_trigger", label: "Transition Trigger", type: "select", required: true,
      options: ["AUTO_BY_DAY", "MANUAL", "EVENT_BASED", "KPI_BASED"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "auto_move_on_day", label: "Auto-Move On Day", type: "number", helpText: "Required when Transition Trigger is Auto By Day." },
    { key: "next_stage_id", label: "Next Stage", type: "select-entity", entityEndpoint: "/stage", entityValueKey: "stage_id", entityLabelKeys: ["stage_code", "stage_name"], helpText: "Leave blank for a terminal stage." },
    { key: "alt_next_stage_id", label: "Alternate Next Stage", type: "select-entity", entityEndpoint: "/stage", entityValueKey: "stage_id", entityLabelKeys: ["stage_code", "stage_name"] },
    { key: "alt_trigger_condition", label: "Alternate Trigger Condition", type: "text", placeholder: "PREGNANCY_FAILED" },
    {
      key: "data_entry_form", label: "Data Entry Form", type: "select",
      options: ["STANDARD", "FARROWING", "WEANING", "SLAUGHTER"].map((v) => ({ value: v, label: v })),
    },
    { key: "scheduler_auto_create", label: "Auto-Create Scheduler", type: "boolean" },
    { key: "show_on_animal_card", label: "Show on Animal Card", type: "boolean" },
    { key: "stage_description", label: "Description", type: "text" },
  ],
};

const numberSeries: MasterDataConfig = {
  key: "number-series",
  label: "Number Series",
  description: "Concurrency-safe business-code generators (e.g. \"BATCH\" → BATCH-000001) — other modules call these by series code instead of counting rows themselves.",
  apiBase: "/number-series",
  idKey: "series_id",
  group: "Production",
  columns: [
    { key: "series_code", label: "Code" },
    { key: "series_name", label: "Name" },
    { key: "document_type", label: "Document Type" },
    { key: "last_generated_code", label: "Last Generated" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank for a series shared across all business verticals." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id" },
    { key: "series_code", label: "Series Code", type: "text", required: true, placeholder: "BATCH" },
    { key: "series_name", label: "Series Name", type: "text", required: true, placeholder: "Batch Number" },
    { key: "document_type", label: "Document Type", type: "text", required: true, placeholder: "BATCH" },
    { key: "prefix", label: "Prefix", type: "text", placeholder: "BATCH" },
    { key: "date_format", label: "Date Format", type: "text", placeholder: "YYYY", helpText: "Leave blank for no date segment." },
    { key: "separator", label: "Separator", type: "text", placeholder: "-" },
    { key: "seq_length", label: "Sequence Digits", type: "number", required: true, placeholder: "6" },
    {
      key: "reset_frequency", label: "Reset Frequency", type: "select",
      options: ["NEVER", "MONTHLY", "YEARLY"].map((v) => ({ value: v, label: v })),
    },
    { key: "allow_manual", label: "Allow Manual Entry", type: "boolean", helpText: "Let a user type their own code instead of generating one." },
    { key: "current_seq", label: "Current Sequence", type: "number", hideInForm: true },
    { key: "last_generated_code", label: "Last Generated Code", type: "text", hideInForm: true },
  ],
};

// ── Piggery ──────────────────────────────────────────────────────────────────

const animal: MasterDataConfig = {
  key: "animal",
  label: "Animal Register",
  description: "Individual animal lifetime identity — lineage, entry, cost, current stage/location. Never physically deleted; use Dispose to record sale/slaughter/death.",
  apiBase: "/animal",
  idKey: "animal_id",
  group: "Piggery",
  columns: [
    { key: "animal_code", label: "Code" },
    { key: "animal_type", label: "Type" },
    { key: "gender", label: "Gender" },
    { key: "status", label: "Status" },
  ],
  fields: [
    { key: "animal_code", label: "Animal Code", type: "text", hideInForm: true, helpText: "Auto-generated (PIG-YYYY-SEQ)." },
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", required: true, entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"] },
    { key: "lob_id", label: "Line of Business", type: "select-entity", required: true, entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id" },
    {
      key: "animal_type", label: "Animal Type", type: "select", required: true,
      options: ["SOW", "BOAR", "GILT", "PIGLET", "COMMERCIAL_PIG"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "breed_id", label: "Breed", type: "select-entity", required: true, entityEndpoint: "/breed", entityValueKey: "breed_id", entityLabelKeys: ["breed_code", "breed_name"] },
    {
      key: "gender", label: "Gender", type: "select", required: true,
      options: [{ value: "F", label: "Female" }, { value: "M", label: "Male" }],
    },
    { key: "dob", label: "Date of Birth", type: "date", helpText: "Leave blank if born on this farm and unknown, or imported/unknown." },
    {
      key: "entry_type", label: "Entry Type", type: "select", required: true,
      options: ["PURCHASED_IMPORTED", "PURCHASED_LOCAL", "BORN_ON_FARM", "TRANSFERRED_IN"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "entry_date", label: "Entry Date", type: "date", required: true },
    { key: "source_receipt_id", label: "Source Goods Receipt", type: "select-entity", entityEndpoint: "/goods-receipt", entityValueKey: "receipt_id", entityLabelKeys: ["receipt_no"], helpText: "Required for PURCHASED_IMPORTED / PURCHASED_LOCAL entries." },
    { key: "source_batch_id", label: "Source Batch", type: "select-entity", entityEndpoint: "/batch", entityValueKey: "batch_id", entityLabelKeys: ["batch_no"], helpText: "Required for BORN_ON_FARM entries." },
    { key: "item_id", label: "Item (Living Asset)", type: "select-entity", required: true, entityEndpoint: "/item", entityValueKey: "item_id", entityLabelKeys: ["item_code", "item_name"] },
    { key: "rfid_tag", label: "RFID Tag", type: "text", helpText: "Unique if set." },
    { key: "ear_tag", label: "Ear Tag (Visual)", type: "text" },
    { key: "sire_animal_id", label: "Sire (Father)", type: "select-entity", entityEndpoint: "/animal", entityValueKey: "animal_id", entityLabelKeys: ["animal_code"] },
    { key: "dam_animal_id", label: "Dam (Mother)", type: "select-entity", entityEndpoint: "/animal", entityValueKey: "animal_id", entityLabelKeys: ["animal_code"] },
    { key: "acquisition_cost", label: "Acquisition Cost", type: "number", step: "0.01", required: true },
    { key: "landing_cost", label: "Landing Cost", type: "number", step: "0.01", helpText: "Transport/import duty/quarantine charges for imported animals." },
    { key: "total_opening_asset_value", label: "Total Opening Asset Value", type: "number", hideInForm: true },
    { key: "current_stage_id", label: "Current Stage", type: "select-entity", entityEndpoint: "/stage", entityValueKey: "stage_id", entityLabelKeys: ["stage_code", "stage_name"] },
    { key: "current_batch_id", label: "Current Batch", type: "select-entity", entityEndpoint: "/batch", entityValueKey: "batch_id", entityLabelKeys: ["batch_no"] },
    { key: "current_location_id", label: "Current Location", type: "select-entity", entityEndpoint: "/location", entityValueKey: "location_id", entityLabelKeys: ["location_code", "location_name"] },
    { key: "parity_count", label: "Parity Count", type: "number", hideInForm: true },
    { key: "total_piglets_born_live", label: "Total Piglets Born Live", type: "number", hideInForm: true },
    { key: "total_piglets_weaned", label: "Total Piglets Weaned", type: "number", hideInForm: true },
    { key: "productive_life_start", label: "Productive Life Start", type: "date" },
    {
      key: "status", label: "Status", type: "select",
      options: ["ACTIVE", "QUARANTINE", "SICK", "PREGNANT", "LACTATING", "DRY", "CULLED", "DEAD", "SOLD", "SLAUGHTERED"].map((v) => ({ value: v, label: v })),
    },
    { key: "notes", label: "Notes", type: "textarea" },
  ],
};

// ── Inventory ────────────────────────────────────────────────────────────────

const itemCategory: MasterDataConfig = {
  key: "item-category",
  label: "Item Categories",
  description: "Hierarchical classification for inventory items.",
  apiBase: "/item-category",
  idKey: "category_id",
  group: "Inventory",
  columns: [
    { key: "category_code", label: "Code" },
    { key: "category_name", label: "Name" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "category_code", label: "Category Code", type: "text", required: true, placeholder: "FEED" },
    { key: "category_name", label: "Category Name", type: "text", required: true, placeholder: "Animal Feed Products" },
    { key: "parent_category_id", label: "Parent Category", type: "select-entity", entityEndpoint: "/item-category", entityValueKey: "category_id", entityLabelKeys: ["category_code", "category_name"] },
  ],
};

const uom: MasterDataConfig = {
  key: "uom",
  label: "Units of Measure",
  description: "Measurement units used across items and transactions.",
  apiBase: "/uom",
  idKey: "uom_id",
  group: "Inventory",
  columns: [
    { key: "uom_code", label: "Code" },
    { key: "uom_name", label: "Name" },
    { key: "uom_type", label: "Type" },
    { key: "is_base_uom", label: "Base Unit" },
  ],
  fields: [
    { key: "company_id", label: "Company (blank = global)", type: "text", hideInForm: true },
    { key: "uom_code", label: "UOM Code", type: "text", required: true, placeholder: "KG" },
    { key: "uom_name", label: "UOM Name", type: "text", required: true, placeholder: "Kilogram" },
    {
      key: "uom_type", label: "UOM Type", type: "select", required: true,
      options: ["WEIGHT", "VOLUME", "COUNT", "AREA", "TIME", "OTHER"].map((v) => ({ value: v, label: v })),
    },
    { key: "decimal_places", label: "Decimal Places", type: "number" },
    { key: "is_base_uom", label: "Is Base Unit", type: "boolean" },
  ],
};

/**
 * Conversion factors are not decoration: batch data entry prices a line through
 * them (see standardRate() in batch.service.ts), so a missing or wrong factor
 * silently mis-prices consumption — medicine was being costed per vial as if it
 * were per ml until a VIAL→ML factor of 100 was added. Until now the five API
 * endpoints behind this had no screen at all.
 */
const uomConversion: MasterDataConfig = {
  key: "uom-conversion",
  label: "UOM Conversions",
  description: "Multiplier factors between units — From × Factor = To. Used to price data entry.",
  apiBase: "/uom/conversion",
  idKey: "conversion_id",
  group: "Inventory",
  columns: [
    { key: "from_uom", label: "From" },
    { key: "to_uom", label: "To" },
    { key: "conversion_factor", label: "Factor" },
    { key: "effective_from", label: "Effective From" },
    { key: "effective_to", label: "Effective To" },
  ],
  fields: [
    { key: "company_id", label: "Company (blank = global)", type: "text", hideInForm: true },
    {
      key: "item_id", label: "Item", type: "select-entity",
      entityEndpoint: "/item", entityValueKey: "item_id", entityLabelKeys: ["item_code", "item_name"],
      helpText: "Leave blank for a factor that applies to every item using these units.",
    },
    { key: "from_uom", label: "From UOM", type: "text", required: true, placeholder: "VIAL" },
    { key: "to_uom", label: "To UOM", type: "text", required: true, placeholder: "ML" },
    {
      key: "conversion_factor", label: "Conversion Factor", type: "number", required: true,
      placeholder: "100", helpText: "From × Factor = To. One vial of 100 ml is a factor of 100.",
    },
    { key: "effective_from", label: "Effective From", type: "date", required: true },
    { key: "effective_to", label: "Effective To", type: "date", helpText: "Leave blank while the factor is open-ended." },
  ],
};

const itemAttribute: MasterDataConfig = {
  key: "item-attribute",
  label: "Item Attributes",
  description: "Custom item attributes (e.g. Protein %, Colour) available to select when editing an item.",
  apiBase: "/item-attribute",
  idKey: "attribute_id",
  group: "Inventory",
  supportsNobLobFilter: true,
  columns: [
    { key: "attribute_code", label: "Code" },
    { key: "attribute_name", label: "Name" },
    { key: "data_type", label: "Type" },
    { key: "is_mandatory", label: "Mandatory" },
  ],
  fields: [
    { key: "company_id", label: "Company (blank = global)", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank to make this attribute available across all NOBs." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank to make this attribute available across all LOBs under the selected NOB." },
    { key: "attribute_code", label: "Attribute Code", type: "text", required: true, placeholder: "PROTEIN_PCT" },
    { key: "attribute_name", label: "Attribute Name", type: "text", required: true, placeholder: "Protein %" },
    {
      key: "data_type", label: "Value Type", type: "select", required: true,
      options: ["STRING", "NUMBER", "BOOLEAN", "LIST"].map((v) => ({ value: v, label: v })),
    },
    { key: "list_values", label: "List Options (JSON array)", type: "json", helpText: 'Only used when Value Type = LIST. Example: ["Grade A","Grade B"]' },
    { key: "unit", label: "Unit Label", type: "text", placeholder: "PCT" },
    { key: "is_mandatory", label: "Mandatory on every item in scope", type: "boolean" },
    { key: "affects_costing", label: "Affects Costing", type: "boolean" },
    { key: "is_variant", label: "Distinguishes Item Variants", type: "boolean" },
  ],
};

const item: MasterDataConfig = {
  key: "item",
  label: "Items",
  description: "Inventory item master — raw materials, finished goods, assets.",
  apiBase: "/item",
  idKey: "item_id",
  group: "Inventory",
  columns: [
    { key: "item_code", label: "Code" },
    { key: "item_name", label: "Name" },
    { key: "item_type", label: "Type" },
    { key: "uom_primary", label: "UOM" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "item_code", label: "Item Code", type: "text", required: true, placeholder: "ITEM-001" },
    { key: "item_name", label: "Item Name", type: "text", required: true, placeholder: "Cobb Broiler Chicks" },
    { key: "item_type", label: "Item Type", type: "text", required: true, placeholder: "RAW_MATERIAL" },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank if this item is used across all business verticals." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank if this item is used across all LOBs under the selected NOB." },
    { key: "category_id", label: "Category", type: "select-entity", entityEndpoint: "/item-category", entityValueKey: "category_id", entityLabelKeys: ["category_code", "category_name"] },
    { key: "uom_primary", label: "Primary UOM", type: "select-entity", required: true, entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "uom_secondary", label: "Secondary UOM", type: "select-entity", entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "valuation_method", label: "Valuation Method", type: "select", options: ["FIFO", "LIFO", "WEIGHTED_AVG", "STANDARD"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })) },
    { key: "standard_cost", label: "Standard Cost", type: "number", step: "0.01" },
    { key: "is_lot_tracked", label: "Lot Tracked", type: "boolean" },
    { key: "is_serial_tracked", label: "Serial Tracked", type: "boolean" },
    { key: "is_biological_asset", label: "Biological Asset", type: "boolean" },
    { key: "is_inventoriable", label: "Inventoriable", type: "boolean" },
    { key: "min_stock_level", label: "Min Stock Level", type: "number", step: "0.01" },
    { key: "max_stock_level", label: "Max Stock Level", type: "number", step: "0.01" },
    { key: "reorder_level", label: "Reorder Level", type: "number", step: "0.01" },
    { key: "shelf_life_days", label: "Shelf Life (days)", type: "number" },
    { key: "withdrawal_days", label: "Withdrawal Period (days)", type: "number", helpText: "Required for MEDICINE/VACCINE items — minimum days after last administration before an animal treated with this item may be slaughtered." },
    { key: "is_qr_enabled", label: "QR Tracking Enabled", type: "boolean" },
    {
      key: "attributes", label: "Attribute Values (JSON array)", type: "json",
      jsonListKeys: ["attribute_id", "attribute_value"],
      helpText: 'Array of { attribute_id, attribute_value }. Define available attributes first under Item Attributes. Example: [{"attribute_id":"...","attribute_value":"8.5"}]',
    },
  ],
};

// ── Livestock & Health ────────────────────────────────────────────────────────

const species: MasterDataConfig = {
  key: "species",
  label: "Species",
  description: "Base species catalog used by breeds (e.g. Chicken, Cattle).",
  apiBase: "/species",
  idKey: "species_id",
  group: "Livestock & Health",
  columns: [
    { key: "species_code", label: "Code" },
    { key: "species_name", label: "Name" },
  ],
  fields: [
    { key: "company_id", label: "Company (blank = global)", type: "text", hideInForm: true },
    { key: "species_code", label: "Species Code", type: "text", required: true, placeholder: "CHICKEN" },
    { key: "species_name", label: "Species Name", type: "text", required: true, placeholder: "Chicken" },
  ],
};

const breed: MasterDataConfig = {
  key: "breed",
  label: "Breeds",
  description: "Breed benchmarks — growth, FCR, mortality, laying rates.",
  apiBase: "/breed",
  idKey: "breed_id",
  group: "Livestock & Health",
  supportsNobLobFilter: true,
  columns: [
    { key: "breed_code", label: "Code" },
    { key: "breed_name", label: "Name" },
    { key: "breed_type", label: "Type" },
    { key: "avg_fcr", label: "Avg FCR" },
  ],
  fields: [
    { key: "company_id", label: "Company (blank = global)", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", required: true, entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"] },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank if this breed applies to all LOBs under the selected NOB." },
    { key: "breed_code", label: "Breed Code", type: "text", required: true, placeholder: "COBB500" },
    { key: "breed_name", label: "Breed Name", type: "text", required: true, placeholder: "Cobb 500 Broiler" },
    { key: "species_id", label: "Species", type: "select-entity", required: true, entityEndpoint: "/species", entityValueKey: "species_id", entityLabelKeys: ["species_code", "species_name"] },
    {
      key: "breed_type", label: "Breed Type", type: "select", required: true,
      options: ["BROILER", "LAYER", "BREEDER", "DUAL_PURPOSE", "DAIRY", "BEEF", "MEAT", "TREE", "FISH"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "avg_growth_rate_g_day", label: "Avg Growth Rate (g/day)", type: "number", step: "0.01" },
    { key: "avg_fcr", label: "Avg FCR", type: "number", step: "0.01" },
    { key: "avg_mortality_pct", label: "Avg Mortality %", type: "number", step: "0.01" },
    { key: "avg_lay_rate_pct", label: "Avg Lay Rate %", type: "number", step: "0.01" },
    { key: "incubation_days", label: "Incubation Days", type: "number" },
    { key: "gestation_days", label: "Gestation Days", type: "number" },
    { key: "lactation_days", label: "Lactation Days", type: "number" },
    { key: "avg_litter_size", label: "Avg Litter Size (legacy/generic)", type: "number", step: "0.01" },
    { key: "avg_litter_size_born", label: "Avg Litter Size Born", type: "number", step: "0.01" },
    { key: "avg_litter_size_weaned", label: "Avg Litter Size Weaned", type: "number", step: "0.01" },
    { key: "avg_weaning_weight_kg", label: "Avg Weaning Weight (KG)", type: "number", step: "0.001" },
    { key: "farrowing_rate_pct", label: "Farrowing Rate %", type: "number", step: "0.01" },
    { key: "mature_age_months", label: "Mature Age (months)", type: "number" },
    { key: "productive_life_months", label: "Productive Life (months)", type: "number" },
    { key: "productive_life_cycles", label: "Productive Life Cycles", type: "number", helpText: "Expected number of parities in productive life." },
    { key: "residual_value_pct", label: "Residual Value %", type: "number", step: "0.01", helpText: "Salvage value as percent of opening asset value — amortisation input." },
    { key: "boar_doses_per_week", label: "Boar Doses per Week", type: "number", step: "0.01", helpText: "Boar species only." },
    { key: "boar_productive_life_months", label: "Boar Productive Life (months)", type: "number", helpText: "Boar species only." },
    { key: "avg_yield_per_unit", label: "Avg Yield per Unit", type: "number", step: "0.01" },
    { key: "description", label: "Description", type: "textarea" },
  ],
};

const breedLifecycleStage: MasterDataConfig = {
  key: "breed-lifecycle-stage",
  label: "Breed Lifecycle Stages",
  description: "Per-breed, per-stage production standards — feed rate, ADG, FCR, mortality, expected output — for a period range within that stage.",
  apiBase: "/breed-lifecycle-stage",
  idKey: "lifecycle_id",
  group: "Livestock & Health",
  columns: [
    { key: "calc_unit", label: "Unit" },
    { key: "period_from", label: "From" },
    { key: "period_to", label: "To" },
    { key: "std_fcr", label: "Std FCR" },
  ],
  fields: [
    { key: "breed_id", label: "Breed", type: "select-entity", required: true, entityEndpoint: "/breed", entityValueKey: "breed_id", entityLabelKeys: ["breed_code", "breed_name"] },
    { key: "stage_id", label: "Stage", type: "select-entity", required: true, entityEndpoint: "/stage", entityValueKey: "stage_id", entityLabelKeys: ["stage_code", "stage_name"] },
    {
      key: "calc_unit", label: "Period Unit", type: "select", required: true,
      options: ["DAY", "WEEK", "MONTH"].map((v) => ({ value: v, label: v })),
    },
    { key: "period_from", label: "Period From", type: "number", required: true },
    { key: "period_to", label: "Period To", type: "number", required: true },
    { key: "season_type", label: "Season", type: "text", placeholder: "Winter" },
    { key: "feed_item_id", label: "Feed Item", type: "select-entity", entityEndpoint: "/item", entityValueKey: "item_id", entityLabelKeys: ["item_code", "item_name"] },
    { key: "feed_qty_per_head_per_day_kg", label: "Feed Qty per Head per Day (KG)", type: "number", step: "0.0001" },
    { key: "feed_wastage_pct", label: "Feed Wastage %", type: "number", step: "0.01" },
    { key: "std_body_weight_kg", label: "Std Body Weight (KG)", type: "number", step: "0.001" },
    { key: "std_adg_gpd", label: "Std ADG (g/day)", type: "number", step: "0.01" },
    { key: "std_fcr", label: "Std FCR", type: "number", step: "0.001" },
    { key: "std_mortality_rate_pct", label: "Std Mortality Rate %", type: "number", step: "0.001" },
    { key: "output_item_id", label: "Output Item", type: "select-entity", entityEndpoint: "/item", entityValueKey: "item_id", entityLabelKeys: ["item_code", "item_name"] },
    { key: "output_uom", label: "Output UOM", type: "text" },
    { key: "std_output_qty", label: "Std Output Qty", type: "number", step: "0.001" },
    { key: "kpi_lower_limit", label: "KPI Lower Limit", type: "number", step: "0.0001" },
    { key: "kpi_upper_limit", label: "KPI Upper Limit", type: "number", step: "0.0001" },
    {
      key: "alert_severity", label: "Alert Severity", type: "select",
      options: ["INFO", "WARNING", "CRITICAL"].map((v) => ({ value: v, label: v })),
    },
    // These two columns have existed on breed_lifecycle_stages since the schema
    // was written but were never exposed, so there was no way to record a
    // vaccination or medication plan for a breed at a stage at all.
    { key: "vaccination_protocol", label: "Vaccination Protocol", type: "json", helpText: "Entries of { vaccine, day, route, dose } for this breed at this stage." },
    { key: "medication_protocol", label: "Medication Protocol", type: "json", helpText: "Entries of { medicine, day, route, dose, withdrawal_days } for this breed at this stage." },
    { key: "notes", label: "Notes", type: "textarea", helpText: "Shown as a tooltip on the data entry screen." },
  ],
};

const disease: MasterDataConfig = {
  key: "disease",
  label: "Diseases",
  description: "Disease reference catalog with symptoms and treatment guidelines.",
  apiBase: "/disease",
  idKey: "disease_id",
  group: "Livestock & Health",
  columns: [
    { key: "disease_code", label: "Code" },
    { key: "disease_name", label: "Name" },
    { key: "scientific_name", label: "Scientific Name" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "disease_code", label: "Disease Code", type: "text", required: true, placeholder: "DIS-ND" },
    { key: "disease_name", label: "Disease Name", type: "text", required: true, placeholder: "Newcastle Disease" },
    { key: "scientific_name", label: "Scientific Name", type: "text", placeholder: "Avian paramyxovirus 1" },
    { key: "symptoms", label: "Symptoms", type: "textarea" },
    { key: "treatment_guideline", label: "Treatment Guideline", type: "textarea" },
  ],
};

const medicine: MasterDataConfig = {
  key: "medicine",
  label: "Medicines",
  description: "Medicine/vaccine profiles linked to an inventory item.",
  apiBase: "/medicine",
  idKey: "medicine_id",
  group: "Livestock & Health",
  columns: [
    { key: "composition", label: "Composition" },
    { key: "route_of_administration", label: "Route" },
    { key: "withdrawal_period_days", label: "Withdrawal (days)" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], filterOnly: true, helpText: "Scopes the Item picker below — medicines aren't NOB/LOB-scoped themselves." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", filterOnly: true },
    {
      key: "item_id", label: "Item", type: "select-entity", required: true, entityEndpoint: "/item", entityValueKey: "item_id", entityLabelKeys: ["item_code", "item_name"],
      dependsOn: ["nob_id", "lob_id"], dependsOnMode: "query", queryParams: { nob_id: "nobId", lob_id: "lobId" },
    },
    { key: "composition", label: "Composition", type: "text", placeholder: "Amoxicillin 10% w/w" },
    { key: "dosage_guideline", label: "Dosage Guideline", type: "textarea" },
    { key: "withdrawal_period_days", label: "Withdrawal Period (days)", type: "number" },
    {
      key: "route_of_administration", label: "Route of Administration", type: "select",
      options: ["ORAL", "INJECTION", "WATER", "TOPICAL"].map((v) => ({ value: v, label: v })),
    },
  ],
};

const feedFormula: MasterDataConfig = {
  key: "feed-formula",
  label: "Feed Formulas",
  description: "Feed recipes (BOM). Ingredients are edited as a JSON array — one entry per raw material.",
  apiBase: "/feed-formula",
  idKey: "formula_id",
  group: "Livestock & Health",
  columns: [
    { key: "formula_code", label: "Code" },
    { key: "formula_name", label: "Name" },
    { key: "batch_size", label: "Batch Size" },
    { key: "batch_unit", label: "Unit" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "formula_code", label: "Formula Code", type: "text", required: true, placeholder: "FORM-BR-STARTER" },
    { key: "formula_name", label: "Formula Name", type: "text", required: true, placeholder: "Broiler Starter Feed Formula" },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], filterOnly: true, helpText: "Scopes the Produced Item picker below — feed formulas aren't NOB/LOB-scoped themselves." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", filterOnly: true },
    {
      key: "target_item_id", label: "Produced Item", type: "select-entity", required: true, entityEndpoint: "/item", entityValueKey: "item_id", entityLabelKeys: ["item_code", "item_name"],
      dependsOn: ["nob_id", "lob_id"], dependsOnMode: "query", queryParams: { nob_id: "nobId", lob_id: "lobId" },
    },
    { key: "batch_size", label: "Batch Size", type: "number", required: true, step: "0.01" },
    { key: "batch_unit", label: "Batch Unit", type: "select-entity", required: true, entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "description", label: "Description", type: "textarea" },
    {
      key: "ingredients", label: "Ingredients (JSON array)", type: "json", required: true, createOnly: true,
      helpText: 'Array of { item_id, quantity, unit, inclusion_pct?, loss_pct? }. Example: [{"item_id":"...","quantity":650,"unit":"KG"}]. Set at creation only — the API does not yet support editing ingredients after a formula is created.',
    },
  ],
};

// ── Business Partners ─────────────────────────────────────────────────────────

const supplier: MasterDataConfig = {
  key: "supplier",
  label: "Suppliers",
  description: "Vendors and raw material suppliers.",
  apiBase: "/supplier",
  idKey: "supplier_id",
  group: "Business Partners",
  columns: [
    { key: "supplier_code", label: "Code" },
    { key: "supplier_name", label: "Name" },
    { key: "vendor_type", label: "Type" },
    { key: "is_approved", label: "Approved" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "supplier_code", label: "Supplier Code", type: "text", required: true, placeholder: "SUP-001" },
    { key: "supplier_name", label: "Supplier Name", type: "text", required: true, placeholder: "Feed Ingredients Corp Ltd" },
    {
      key: "vendor_type", label: "Vendor Type", type: "select",
      options: ["ANIMAL_SUPPLIER", "BREEDING_FARM", "SEMEN_SUPPLIER", "FEED_SUPPLIER", "MEDICINE_SUPPLIER", "EQUIPMENT_SUPPLIER", "SERVICES", "GENERAL"].map((v) => ({ value: v, label: v.replace(/_/g, " ") })),
    },
    { key: "email", label: "Email", type: "email", placeholder: "orders@feedingredients.com" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "tax_number", label: "Tax Registration No.", type: "text", placeholder: "GSTIN123456789A" },
    { key: "payment_terms", label: "Payment Terms", type: "text", placeholder: "NET30" },
    { key: "credit_limit", label: "Credit Limit", type: "number", step: "0.01" },
    { key: "address_line1", label: "Address Line 1", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "country", label: "Country", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "health_cert_url", label: "Health Certificate URL", type: "text", helpText: "Required for ANIMAL_SUPPLIER — checked before a Goods Receipt from this vendor can post." },
    { key: "breeding_farm_code", label: "Breeding Farm Registration No.", type: "text", helpText: "Required for ANIMAL_SUPPLIER / BREEDING_FARM." },
    { key: "bank_account_no", label: "Bank Account Number", type: "text", helpText: "Stored encrypted. Enter a value here to replace it; leave blank to keep the existing one." },
    { key: "bank_ifsc", label: "Bank IFSC / Routing Code", type: "text" },
    { key: "bank_account_last4", label: "Bank Account (masked)", type: "text", hideInForm: true },
    { key: "is_approved", label: "Approved", type: "boolean", hideInForm: true, helpText: "Use the Approve action, not direct edit." },
  ],
};

const customer: MasterDataConfig = {
  key: "customer",
  label: "Customers",
  description: "Buyers and wholesale/retail customer accounts.",
  apiBase: "/customer",
  idKey: "customer_id",
  group: "Business Partners",
  columns: [
    { key: "customer_code", label: "Code" },
    { key: "customer_name", label: "Name" },
    { key: "mobile", label: "Mobile" },
    { key: "credit_limit", label: "Credit Limit" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "customer_code", label: "Customer Code", type: "text", required: true, placeholder: "CUST-001" },
    { key: "customer_name", label: "Customer Name", type: "text", required: true, placeholder: "John Doe Wholesalers" },
    { key: "email", label: "Email", type: "email", placeholder: "billing@johndoe.com" },
    { key: "mobile", label: "Mobile", type: "text", required: true, placeholder: "+919876543210" },
    { key: "tax_number", label: "Tax Registration No.", type: "text" },
    { key: "credit_limit", label: "Credit Limit", type: "number", step: "0.01" },
    { key: "address_line1", label: "Address Line 1", type: "text" },
    { key: "city", label: "City", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "country", label: "Country", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
  ],
};

const resource: MasterDataConfig = {
  key: "resource",
  label: "Resources",
  description: "Labor, equipment and vehicles used in operations.",
  apiBase: "/resource",
  idKey: "resource_id",
  group: "Business Partners",
  supportsNobLobFilter: true,
  columns: [
    { key: "resource_code", label: "Code" },
    { key: "resource_name", label: "Name" },
    { key: "resource_type", label: "Type" },
    { key: "cost_rate", label: "Cost Rate" },
    { key: "next_maintenance_date", label: "Next Maintenance" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank if this resource is shared across all business verticals." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank if this resource is shared across all LOBs under the selected NOB." },
    { key: "resource_code", label: "Resource Code", type: "text", required: true, placeholder: "LBR-01" },
    { key: "resource_name", label: "Resource Name", type: "text", required: true, placeholder: "Senior Laborer" },
    {
      key: "resource_type", label: "Resource Type", type: "select", required: true,
      options: ["LABOR", "EQUIPMENT", "VEHICLE"].map((v) => ({ value: v, label: v })),
    },
    {
      key: "resource_sub_type", label: "Sub-Type", type: "select",
      options: ["PERMANENT", "CONTRACT", "DAILY", "OWNED", "LEASED", "RENTED"].map((v) => ({ value: v, label: v })),
      helpText: "PERMANENT/CONTRACT/DAILY for labor; OWNED/LEASED/RENTED for equipment or vehicles.",
    },
    { key: "employee_id", label: "Employee ID", type: "text", placeholder: "EMP-001", helpText: "Labor/manpower only." },
    { key: "designation", label: "Designation", type: "text", placeholder: "Senior Farm Worker", helpText: "Labor/manpower only." },
    { key: "capacity", label: "Capacity", type: "number", step: "0.01" },
    { key: "capacity_uom", label: "Capacity UOM", type: "select-entity", entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "unit", label: "Cost UOM", type: "select-entity", entityEndpoint: "/uom", entityValueKey: "uom_code", entityLabelKeys: ["uom_code", "uom_name"] },
    { key: "cost_rate", label: "Cost Rate", type: "number", step: "0.01" },
    { key: "asset_code", label: "Asset Code", type: "text", placeholder: "ASSET-PELLETISER-01", helpText: "Equipment/vehicle only." },
    { key: "asset_make", label: "Asset Make", type: "text" },
    { key: "asset_model", label: "Asset Model", type: "text" },
    { key: "asset_serial_no", label: "Asset Serial No.", type: "text" },
    { key: "purchase_date", label: "Purchase Date", type: "date" },
    { key: "warranty_expiry_date", label: "Warranty Expiry", type: "date" },
    { key: "maintenance_frequency_days", label: "Maintenance Frequency (days)", type: "number", helpText: "Days between scheduled services. Logging a completed service auto-calculates the next due date." },
    { key: "maintenance_cost_per_service", label: "Est. Cost per Service", type: "number", step: "0.01" },
    { key: "maintenance_vendor", label: "Preferred Maintenance Vendor", type: "text" },
    { key: "last_maintenance_date", label: "Last Maintenance (system-tracked)", type: "date", hideInForm: true },
    { key: "next_maintenance_date", label: "Next Maintenance (system-tracked)", type: "date", hideInForm: true },
  ],
};

// ── Finance ──────────────────────────────────────────────────────────────────

const glAccount: MasterDataConfig = {
  key: "gl-account",
  label: "GL Accounts",
  description: "Chart of Accounts.",
  apiBase: "/gl-account",
  idKey: "account_id",
  group: "Finance",
  columns: [
    { key: "account_code", label: "Code" },
    { key: "account_name", label: "Name" },
    { key: "account_type", label: "Type" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "account_code", label: "Account Code", type: "text", required: true, placeholder: "101000" },
    { key: "account_name", label: "Account Name", type: "text", required: true, placeholder: "Cash at Bank" },
    {
      key: "account_type", label: "Account Type", type: "select", required: true,
      options: ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"].map((v) => ({ value: v, label: v })),
    },
    { key: "parent_account_id", label: "Parent Account", type: "select-entity", entityEndpoint: "/gl-account", entityValueKey: "account_id", entityLabelKeys: ["account_code", "account_name"] },
    { key: "is_sub_account", label: "Sub-Account", type: "boolean" },
    { key: "is_reconciliation", label: "Reconciliation Account", type: "boolean" },
  ],
};

const glMapping: MasterDataConfig = {
  key: "gl-mapping",
  label: "GL Mappings",
  description: "Maps inventory transaction types to debit/credit GL accounts.",
  apiBase: "/gl-mapping",
  idKey: "mapping_id",
  group: "Finance",
  columns: [
    { key: "transaction_type", label: "Transaction Type" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "item_category_id", label: "Item Category", type: "select-entity", entityEndpoint: "/item-category", entityValueKey: "category_id", entityLabelKeys: ["category_code", "category_name"] },
    { key: "nob_id", label: "Nature of Business", type: "select-entity", entityEndpoint: "/setup/wizard/nobs", entityValueKey: "nob_id", entityLabelKeys: ["nob_code", "nob_name"], helpText: "Leave blank to match all NOBs." },
    { key: "lob_id", label: "Line of Business", type: "select-entity", entityEndpoint: "/setup/wizard/lobs/{value}", entityValueKey: "lob_id", entityLabelKeys: ["lob_code", "lob_name"], dependsOn: "nob_id", helpText: "Leave blank to match all LOBs under the selected NOB." },
    { key: "stage_id", label: "Production Stage", type: "select-entity", entityEndpoint: "/stage", entityValueKey: "stage_id", entityLabelKeys: ["stage_code", "stage_name"], helpText: "Leave blank to match all stages (wildcard). Set to make this mapping win only when the batch/animal is in this specific stage." },
    { key: "valuation_method", label: "Valuation Method", type: "select-entity", entityEndpoint: "/costing-method", entityValueKey: "method_code", entityLabelKeys: ["method_code", "method_name"], helpText: "Leave blank to match all costing methods." },
    {
      key: "transaction_type", label: "Transaction Type", type: "select", required: true,
      // Kept in sync with every transactionType string the GL posting engine actually
      // writes (GlPostingService.resolveMapping looks up by this exact value) — not a
      // curated subset. Grouped by originating document/flow for scannability.
      options: [
        // Inventory documents
        { value: "PURCHASE", label: "Purchase — Goods Receipt" },
        { value: "CONSUMPTION", label: "Consumption — Goods Issue" },
        { value: "TRANSFER_SHIPMENT", label: "Transfer Out — Stock Transfer (Shipment)" },
        { value: "TRANSFER_RECEIPT", label: "Transfer In — Stock Transfer (Receipt)" },
        { value: "VARIANCE_POSITIVE", label: "Stock Adjustment — Positive Variance" },
        { value: "VARIANCE_NEGATIVE", label: "Stock Adjustment — Negative Variance" },
        // Batch — STANDARD/FIFO costing
        { value: "BATCH_INPUT", label: "Batch — Input Draw (on Activation)" },
        { value: "BATCH_CONSUMPTION", label: "Batch — Daily Consumption" },
        { value: "BATCH_OUTPUT", label: "Batch — Output (on Close)" },
        { value: "BATCH_IMPAIRMENT", label: "Batch — By-Product / Waste Impairment (at-cost vs NRV)" },
        { value: "MORTALITY", label: "Batch — Mortality Write-off" },
        { value: "OVERHEAD", label: "Batch — Overhead" },
        { value: "PRICE_VARIANCE", label: "Batch — Price Variance (Standard Costing)" },
        { value: "USAGE_VARIANCE", label: "Batch — Usage Variance (Standard Costing)" },
        { value: "OUTPUT_VARIANCE", label: "Batch — Output Variance (Standard Costing)" },
        { value: "OVERHEAD_VARIANCE", label: "Batch — Overhead Variance (Standard Costing)" },
        // Batch — Bio-Asset (IAS 41) costing lifecycle
        { value: "BIO_ACQUISITION", label: "Bio-Asset — Acquisition" },
        { value: "BIO_CONSUMPTION_PREMATURE", label: "Bio-Asset — Consumption (Pre-mature, Capitalized)" },
        { value: "BIO_CONSUMPTION_MATURE", label: "Bio-Asset — Consumption (Mature, Expensed)" },
        { value: "BIO_OUTPUT", label: "Bio-Asset — Output" },
        { value: "BIO_MORTALITY_PREMATURE", label: "Bio-Asset — Mortality (Pre-mature)" },
        { value: "BIO_MORTALITY_MATURE", label: "Bio-Asset — Mortality (Mature)" },
        { value: "BIO_OVERHEAD_PREMATURE", label: "Bio-Asset — Overhead (Pre-mature)" },
        { value: "BIO_OVERHEAD_MATURE", label: "Bio-Asset — Overhead (Mature)" },
        { value: "BIO_TRANSFORMATION", label: "Bio-Asset — Transformation (Pre-mature → Mature)" },
        { value: "BIO_AMORTIZATION", label: "Bio-Asset — Amortization" },
        { value: "BIO_FAIR_VALUE", label: "Bio-Asset — Fair Value Adjustment" },
        { value: "BIO_HARVEST", label: "Bio-Asset — Disposal (Harvest)" },
        { value: "BIO_DISPOSAL_SOLD", label: "Bio-Asset — Disposal (Sold)" },
      ],
    },
    { key: "debit_gl_account_id", label: "Debit GL Account", type: "select-entity", entityEndpoint: "/gl-account", entityValueKey: "account_id", entityLabelKeys: ["account_code", "account_name"] },
    { key: "credit_gl_account_id", label: "Credit GL Account", type: "select-entity", entityEndpoint: "/gl-account", entityValueKey: "account_id", entityLabelKeys: ["account_code", "account_name"] },
  ],
};

const costCenter: MasterDataConfig = {
  key: "cost-center",
  label: "Cost Centers",
  description: "Dimensions for cost allocation and reporting.",
  apiBase: "/cost-center",
  idKey: "cost_center_id",
  group: "Finance",
  columns: [
    { key: "cost_center_code", label: "Code" },
    { key: "cost_center_name", label: "Name" },
    { key: "cost_center_type", label: "Type" },
  ],
  fields: [
    { key: "company_id", label: "Company", type: "text", hideInForm: true },
    { key: "cost_center_code", label: "Cost Center Code", type: "text", required: true, placeholder: "DEPT-ADMIN" },
    { key: "cost_center_name", label: "Cost Center Name", type: "text", required: true, placeholder: "Administrative Department" },
    {
      key: "cost_center_type", label: "Cost Center Type", type: "select", required: true,
      options: ["DEPARTMENT", "FARM", "WAREHOUSE", "PROJECT", "OTHER"].map((v) => ({ value: v, label: v })),
    },
    { key: "parent_cost_center_id", label: "Parent Cost Center", type: "select-entity", entityEndpoint: "/cost-center", entityValueKey: "cost_center_id", entityLabelKeys: ["cost_center_code", "cost_center_name"] },
  ],
};

export const MASTER_DATA_CONFIGS: MasterDataConfig[] = [
  farm, warehouse, location, shed,
  stage, numberSeries,
  animal,
  itemCategory, uom, uomConversion, item, itemAttribute,
  species, breed, breedLifecycleStage, disease, medicine, feedFormula,
  supplier, customer, resource,
  glAccount, glMapping, costCenter,
];

export const MASTER_DATA_GROUPS = ["Farm Operations", "Production", "Piggery", "Inventory", "Livestock & Health", "Business Partners", "Finance"] as const;

export function getConfig(key: string): MasterDataConfig | undefined {
  return MASTER_DATA_CONFIGS.find((c) => c.key === key);
}

export { STATUS_OPTIONS };
