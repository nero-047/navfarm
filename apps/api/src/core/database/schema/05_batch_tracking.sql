-- NAVFarm ERP Database Schema DDL
-- 05_BATCH_TRACKING.SQL (Production Batches & Daily Logs)

CREATE TABLE batch_master (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE RESTRICT,
    nob_id UUID NOT NULL REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_id UUID NOT NULL REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    batch_code VARCHAR(50) NOT NULL,
    batch_name VARCHAR(150) NOT NULL,
    location_id UUID NOT NULL REFERENCES location_master(location_id) ON DELETE RESTRICT,
    breed_id UUID REFERENCES breed_master(breed_id) ON DELETE RESTRICT,
    template_id UUID REFERENCES scheduler_template_master(template_id) ON DELETE SET NULL,
    costing_model VARCHAR(20) DEFAULT 'STANDARD' NOT NULL,
    status VARCHAR(30) DEFAULT 'DRAFT' NOT NULL, -- DRAFT, APPROVED, COMPLETED, CLOSED
    start_date DATE NOT NULL,
    estimated_close_date DATE,
    actual_close_date DATE,
    initial_qty DECIMAL(18,4) NOT NULL,
    current_qty DECIMAL(18,4) NOT NULL,
    dead_qty DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    cull_qty DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    harvest_qty DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    fcr_actual DECIMAL(8,4),
    total_feed_consumed DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    standard_wip_value DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    actual_wip_value DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    closed_by UUID REFERENCES user_master(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_tenant_batch_master_code UNIQUE(tenant_id, batch_code)
);

COMMENT ON TABLE batch_master IS 'Production cost batches tracking animal lifecycles';

CREATE TABLE batch_input_lines (
    input_line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch_master(batch_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES item_master(item_id) ON DELETE RESTRICT,
    qty_issued DECIMAL(18,4) NOT NULL,
    uom_code VARCHAR(20) NOT NULL,
    unit_cost DECIMAL(18,4) NOT NULL,
    total_cost DECIMAL(18,4) NOT NULL,
    lot_no VARCHAR(100),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    issued_by UUID REFERENCES user_master(user_id) ON DELETE SET NULL
);

COMMENT ON TABLE batch_input_lines IS 'Material and resource issuances consumed by the batch';

CREATE TABLE batch_output_lines (
    output_line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch_master(batch_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES item_master(item_id) ON DELETE RESTRICT,
    qty_harvested DECIMAL(18,4) NOT NULL,
    uom_code VARCHAR(20) NOT NULL,
    unit_cost DECIMAL(18,4) NOT NULL,
    total_cost DECIMAL(18,4) NOT NULL,
    lot_no VARCHAR(100) NOT NULL,
    grading VARCHAR(50),
    qc_passed BOOLEAN DEFAULT TRUE NOT NULL,
    harvested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    harvested_by UUID REFERENCES user_master(user_id) ON DELETE SET NULL
);

COMMENT ON TABLE batch_output_lines IS 'Finished products harvested from production batches';

CREATE TABLE batch_daily_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch_master(batch_id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    age_days INT NOT NULL,
    opening_count DECIMAL(18,4) NOT NULL,
    closing_count DECIMAL(18,4) NOT NULL,
    mortality_count INT DEFAULT 0 NOT NULL,
    cull_count INT DEFAULT 0 NOT NULL,
    feed_issued_kg DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    water_consumed_ltr DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    avg_weight_g DECIMAL(10,4),
    eggs_collected INT DEFAULT 0 NOT NULL,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    humidity_pct DECIMAL(5,2),
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES user_master(user_id) ON DELETE RESTRICT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_batch_daily_logs_date UNIQUE(batch_id, log_date)
);

COMMENT ON TABLE batch_daily_logs IS 'Daily operational measurements recorded on the farm';
