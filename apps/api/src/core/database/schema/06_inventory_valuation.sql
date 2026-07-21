-- NAVFarm ERP Database Schema DDL
-- 06_INVENTORY_VALUATION.SQL (FIFO layers & Ledger Journals)

CREATE TABLE lot_serial_master (
    lot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES item_master(item_id) ON DELETE RESTRICT,
    lot_no VARCHAR(100) NOT NULL,
    serial_no VARCHAR(100),
    location_id UUID NOT NULL REFERENCES location_master(location_id) ON DELETE RESTRICT,
    qty_initial DECIMAL(18,4) NOT NULL,
    qty_on_hand DECIMAL(18,4) NOT NULL,
    actual_unit_cost DECIMAL(18,4) NOT NULL,
    layer_status VARCHAR(30) DEFAULT 'OPEN' NOT NULL,
    source_ref_type VARCHAR(50) NOT NULL,
    source_ref_id UUID NOT NULL,
    expiry_date DATE,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_tenant_lot_serial UNIQUE(tenant_id, item_id, lot_no)
);

COMMENT ON TABLE lot_serial_master IS 'Chronological FIFO costing layers and tracking lots';

CREATE TABLE lot_layer_consumption (
    consumption_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lot_id UUID NOT NULL REFERENCES lot_serial_master(lot_id) ON DELETE CASCADE,
    drawdown_ref_type VARCHAR(50) NOT NULL,
    drawdown_ref_id UUID NOT NULL,
    qty_drawn DECIMAL(18,4) NOT NULL,
    cost_drawn DECIMAL(18,4) NOT NULL,
    drawn_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE lot_layer_consumption IS 'Audit ledger tracking which FIFO cost layers were consumed';

CREATE TABLE gl_journal (
    journal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE RESTRICT,
    posting_date DATE NOT NULL,
    entry_type_code VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    gl_account VARCHAR(30) NOT NULL,
    debit_amount DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    credit_amount DECIMAL(18,4) DEFAULT 0.0000 NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES user_master(user_id) ON DELETE SET NULL
);

COMMENT ON TABLE gl_journal IS 'Atomic double-entry general ledger journal postings';
