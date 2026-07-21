-- NAVFarm ERP Database Schema DDL
-- 07_QUALITY_TRACEABILITY.SQL (QC Specs & QR Traceability)

CREATE TABLE qc_parameter_master (
    parameter_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    lob_id UUID NOT NULL REFERENCES lob_master(lob_id) ON DELETE RESTRICT,
    parameter_name VARCHAR(150) NOT NULL,
    specification_limit TEXT NOT NULL,
    test_method VARCHAR(150),
    is_mandatory BOOLEAN DEFAULT TRUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_tenant_qc_parameter UNIQUE(tenant_id, lob_id, parameter_name)
);

COMMENT ON TABLE qc_parameter_master IS 'Standard Quality Control limits and checklists per LOB';

CREATE TABLE qc_batch_master (
    qc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch_master(batch_id) ON DELETE CASCADE,
    inspector_id UUID NOT NULL REFERENCES user_master(user_id) ON DELETE RESTRICT,
    inspection_date DATE NOT NULL,
    inspection_result VARCHAR(30) DEFAULT 'PASS' NOT NULL,
    parameters_checked JSONB DEFAULT '{}'::jsonb NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE qc_batch_master IS 'Inspection logs and results recorded on output batches';

CREATE TABLE qr_payload_log (
    qr_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch_master(batch_id) ON DELETE CASCADE,
    lot_no VARCHAR(100) NOT NULL,
    package_serial_no VARCHAR(150) NOT NULL UNIQUE,
    qr_payload TEXT NOT NULL,
    generated_by UUID NOT NULL REFERENCES user_master(user_id) ON DELETE RESTRICT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE qr_payload_log IS 'Generated package QR codes encoding complete batch lineage';
