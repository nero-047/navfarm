-- NAVFarm ERP Database Schema DDL
-- 04_OPERATIONAL_PARAMETERS.SQL (Batch Parameter Schedulers & Templates)

CREATE TABLE parameter_type_config (
    parameter_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nob_id UUID NOT NULL REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_id UUID NOT NULL REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    parameter_code VARCHAR(50) NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL,
    uom VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_nob_lob_param_type UNIQUE(nob_id, lob_id, parameter_code)
);

COMMENT ON TABLE parameter_type_config IS 'Defines allowed measurement parameter codes per LOB';

CREATE TABLE scheduler_parameter_master (
    scheduler_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    parameter_type_id UUID NOT NULL REFERENCES parameter_type_config(parameter_type_id) ON DELETE RESTRICT,
    scheduler_name VARCHAR(150) NOT NULL,
    breed_id UUID REFERENCES breed_master(breed_id) ON DELETE SET NULL,
    target_value DECIMAL(12,4) NOT NULL,
    min_threshold DECIMAL(12,4),
    max_threshold DECIMAL(12,4),
    alert_priority VARCHAR(20) DEFAULT 'LOW' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_tenant_scheduler_parameter UNIQUE(tenant_id, parameter_type_id, breed_id)
);

COMMENT ON TABLE scheduler_parameter_master IS 'Standard alert rules and targets per biological breed';

CREATE TABLE scheduler_template_master (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    nob_id UUID NOT NULL REFERENCES nob_master(nob_id) ON DELETE RESTRICT,
    lob_id UUID NOT NULL REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    template_code VARCHAR(50) NOT NULL,
    template_name VARCHAR(150) NOT NULL,
    breed_id UUID REFERENCES breed_master(breed_id) ON DELETE RESTRICT,
    total_cycle_days INT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_tenant_scheduler_template_code UNIQUE(tenant_id, template_code)
);

COMMENT ON TABLE scheduler_template_master IS 'LOB cycle schedules (templates)';

CREATE TABLE scheduler_period_lines (
    line_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES scheduler_template_master(template_id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    parameter_type_id UUID NOT NULL REFERENCES parameter_type_config(parameter_type_id) ON DELETE RESTRICT,
    target_value DECIMAL(12,4) NOT NULL,
    min_threshold DECIMAL(12,4),
    max_threshold DECIMAL(12,4),
    notes TEXT,
    CONSTRAINT uq_scheduler_template_day_param UNIQUE(template_id, day_number, parameter_type_id)
);

COMMENT ON TABLE scheduler_period_lines IS 'Day-by-day standard target curves for templates';
