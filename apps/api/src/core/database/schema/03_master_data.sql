-- NAVFarm ERP Database Schema DDL
-- 03_MASTER_DATA.SQL (NOB/LOB, UOM, Location, Breeds, Items & Mappings)

-- ==========================================
-- 1. BUSINESS VERTICALS (NOB / LOB)
-- ==========================================

CREATE TABLE nob_master (
    nob_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nob_code VARCHAR(50) NOT NULL UNIQUE,
    nob_name VARCHAR(100) NOT NULL,
    default_costing_method VARCHAR(20) DEFAULT 'STANDARD' NOT NULL,
    description TEXT,
    sort_order INT,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at DATE,
    updated_at DATE,
    extension_config JSONB
);

COMMENT ON TABLE nob_master IS 'Nature of Business definitions (Poultry, Livestock, Agri, etc.)';

CREATE TABLE lob_master (
    lob_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nob_id UUID NOT NULL REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_code VARCHAR(50) NOT NULL UNIQUE,
    lob_name VARCHAR(100) NOT NULL,
    costing_method_allowed VARCHAR(100) NOT NULL,
    qc_required VARCHAR(10) DEFAULT 'NO' NOT NULL,
    qr_required VARCHAR(10) DEFAULT 'NO' NOT NULL,
    batch_copy_allowed VARCHAR(10) DEFAULT 'NO' NOT NULL,
    scheduler_copy_allowed VARCHAR(10) DEFAULT 'NO' NOT NULL,
    traceability_required VARCHAR(10) DEFAULT 'YES' NOT NULL,
    description TEXT,
    sort_order INT,
    is_system BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at DATE,
    updated_at DATE,
    extension_config JSONB
);

COMMENT ON TABLE lob_master IS 'Line of Business definitions (Broiler, Rearing, Laying, Hatching, etc.)';

CREATE TABLE nob_lob_extension_config (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nob_id UUID REFERENCES nob_master(nob_id) ON DELETE CASCADE,
    lob_id UUID REFERENCES lob_master(lob_id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value VARCHAR(200) NOT NULL,
    data_type VARCHAR(30) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_nob_lob_ext_config_unique UNIQUE(nob_id, lob_id, config_key)
);

COMMENT ON TABLE nob_lob_extension_config IS 'Flexible configuration overrides without schema migrations';

-- ==========================================
-- 2. MASTER TABLES (UOM, ITEM, BREED, LOCATION)
-- ==========================================

CREATE TABLE uom_master (
    uom_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    uom_code VARCHAR(20) NOT NULL,
    uom_name VARCHAR(100) NOT NULL,
    uom_type VARCHAR(20) NOT NULL,
    decimal_places INT DEFAULT 0 NOT NULL,
    is_base_uom BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    extension_config JSONB,
    CONSTRAINT uq_tenant_uom_code UNIQUE(tenant_id, uom_code)
);

COMMENT ON TABLE uom_master IS 'Units of Measure (null tenant = system-wide UOM)';

CREATE TABLE item_master (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    item_type VARCHAR(30) NOT NULL, -- RAW_MATERIAL / LIVING_ASSET / etc.
    nob_id UUID REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_id UUID REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    uom_primary VARCHAR(20) NOT NULL,
    uom_secondary VARCHAR(20),
    uom_conversion_factor DECIMAL(18,6),
    valuation_method VARCHAR(20),
    standard_cost DECIMAL(18,6),
    is_lot_tracked BOOLEAN DEFAULT FALSE NOT NULL,
    is_serial_tracked BOOLEAN DEFAULT FALSE NOT NULL,
    is_biological_asset BOOLEAN DEFAULT FALSE NOT NULL,
    is_biological_costing_method VARCHAR(30),
    is_inventoriable BOOLEAN DEFAULT TRUE NOT NULL,
    min_stock_level DECIMAL(18,4),
    max_stock_level DECIMAL(18,4),
    reorder_level DECIMAL(18,4),
    shelf_life_days INT,
    storage_temp_min DECIMAL(6,2),
    storage_temp_max DECIMAL(6,2),
    is_qr_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    qr_trigger_event VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    extension_config JSONB,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_tenant_item_code UNIQUE(tenant_id, item_code)
);

COMMENT ON TABLE item_master IS 'All materials, assets, and outputs definitions';

CREATE TABLE uom_conversion_master (
    conversion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE CASCADE,
    item_id UUID REFERENCES item_master(item_id) ON DELETE CASCADE,
    from_uom VARCHAR(20) NOT NULL,
    to_uom VARCHAR(20) NOT NULL,
    conversion_factor DECIMAL(18,8) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE uom_conversion_master IS 'UOM conversion factors (null item = generic conversion)';

CREATE TABLE item_attribute_master (
    attribute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenant_master(tenant_id) ON DELETE CASCADE,
    nob_id UUID REFERENCES nob_master(nob_id) ON DELETE CASCADE,
    lob_id UUID REFERENCES lob_master(lob_id) ON DELETE CASCADE,
    attribute_code VARCHAR(50) NOT NULL,
    attribute_name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    list_values JSONB,
    unit VARCHAR(20),
    is_mandatory BOOLEAN DEFAULT FALSE NOT NULL,
    affects_costing BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_variant BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT uq_tenant_attribute_code UNIQUE(tenant_id, attribute_code)
);

COMMENT ON TABLE item_attribute_master IS 'Attribute templates scoped per LOB';

CREATE TABLE item_attribute_values (
    value_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES item_master(item_id) ON DELETE CASCADE,
    attribute_id UUID NOT NULL REFERENCES item_attribute_master(attribute_id) ON DELETE RESTRICT,
    attribute_value TEXT NOT NULL,
    CONSTRAINT uq_item_attribute_value_unique UNIQUE(item_id, attribute_id)
);

COMMENT ON TABLE item_attribute_values IS 'Actual attribute values per item';

CREATE TABLE breed_master (
    breed_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    nob_id UUID NOT NULL REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_id UUID REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    breed_code VARCHAR(50) NOT NULL,
    breed_name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    breed_type VARCHAR(50) NOT NULL,
    avg_growth_rate_g_day DECIMAL(10,4),
    avg_fcr DECIMAL(8,4),
    avg_mortality_pct DECIMAL(6,2),
    avg_lay_rate_pct DECIMAL(6,2),
    incubation_days INT,
    gestation_days INT,
    avg_litter_size DECIMAL(6,2),
    mature_age_months INT,
    productive_life_months INT,
    premature_years DECIMAL(5,2),
    avg_yield_per_unit DECIMAL(10,4),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    extension_config JSONB,
    CONSTRAINT uq_tenant_breed_code UNIQUE(tenant_id, breed_code)
);

COMMENT ON TABLE breed_master IS 'Biological specifications and benchmarks';

CREATE TABLE location_master (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    nob_id UUID REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_id UUID REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    location_code VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    location_level INT NOT NULL,
    location_type VARCHAR(50) NOT NULL,
    parent_location_id UUID REFERENCES location_master(location_id) ON DELETE RESTRICT,
    area_size DECIMAL(18,4),
    area_unit VARCHAR(10),
    max_capacity DECIMAL(18,4),
    capacity_uom VARCHAR(20),
    current_count DECIMAL(18,4) DEFAULT 0.00 NOT NULL,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    storage_type VARCHAR(30),
    is_quarantine_zone BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    extension_config JSONB,
    CONSTRAINT uq_tenant_location_code UNIQUE(tenant_id, location_code)
);

COMMENT ON TABLE location_master IS 'Recursive location hierarchies (Plot, Pond, Pen, Shed)';
