-- NAVFarm ERP Database Schema DDL
-- 01_FOUNDATION.SQL (Tenant, Company, RBAC Security, Setup Onboarding)
-- Target Database: PostgreSQL 14+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TENANT & SUBSCRIPTION ISOLATION
-- ==========================================

CREATE TABLE tenant_master (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_code VARCHAR(20) NOT NULL UNIQUE,
    tenant_name VARCHAR(200) NOT NULL,
    tenant_type VARCHAR(20), -- INDIVIDUAL / SME / ENTERPRISE
    plan_id VARCHAR(30),
    plan_start_date DATE NOT NULL,
    plan_end_date DATE,
    billing_cycle VARCHAR(20),
    billing_email VARCHAR(200) NOT NULL,
    billing_currency_id UUID, -- Refers to currency_master.currency_id
    max_companies INT DEFAULT 1 NOT NULL,
    max_users INT DEFAULT 5 NOT NULL,
    max_batches_per_month INT,
    api_rate_limit INT DEFAULT 1000 NOT NULL,
    is_trial BOOLEAN DEFAULT FALSE NOT NULL,
    trial_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE tenant_master IS 'Root tenant record for multi-tenant isolation';
COMMENT ON COLUMN tenant_master.tenant_code IS 'Short unique code for tenant subdomains';

CREATE TABLE tenant_subscription (
    sub_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE CASCADE,
    plan_code VARCHAR(30) NOT NULL,
    feature_flags JSONB,
    storage_limit_gb DECIMAL(8,2) DEFAULT 5.00 NOT NULL,
    support_tier VARCHAR(20) DEFAULT 'STANDARD' NOT NULL,
    sla_uptime_pct DECIMAL(5,2) DEFAULT 99.50 NOT NULL,
    renewal_auto BOOLEAN DEFAULT TRUE NOT NULL,
    payment_method VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE tenant_subscription IS 'Plan details and feature limits per tenant';

-- ==========================================
-- 2. COMPANY PROFILE & CONFIGURATION
-- ==========================================

CREATE TABLE company_master (
    company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    company_code VARCHAR(20) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_display_name VARCHAR(100),
    company_type VARCHAR(30) NOT NULL,
    industry_type VARCHAR(30) NOT NULL,
    registration_no VARCHAR(100),
    tax_id VARCHAR(100),
    tax_regime VARCHAR(20) DEFAULT 'STANDARD',
    incorporation_date DATE,
    financial_year_start INT DEFAULT 4 NOT NULL,
    base_currency_id UUID NOT NULL, -- Refers to currency_master
    default_language_id UUID NOT NULL, -- Refers to language_master
    default_timezone_id UUID NOT NULL,
    country_id UUID NOT NULL,
    company_logo_url VARCHAR(500),
    company_logo_dark_url VARCHAR(500),
    primary_color_hex VARCHAR(7) DEFAULT '#1F4E79' NOT NULL,
    website VARCHAR(300),
    email_domain VARCHAR(100),
    support_email VARCHAR(200),
    phone_primary VARCHAR(30),
    is_multi_farm BOOLEAN DEFAULT FALSE NOT NULL,
    max_farm_locations INT DEFAULT 1 NOT NULL,
    onboarding_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    extension_config JSONB,
    CONSTRAINT uq_tenant_company_code UNIQUE(tenant_id, company_code)
);

COMMENT ON TABLE company_master IS 'Core company profile, setup during onboarding';
COMMENT ON COLUMN company_master.company_code IS 'Unique per tenant';

CREATE TABLE company_address (
    address_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    address_type VARCHAR(30) DEFAULT 'REGISTERED' NOT NULL,
    address_label VARCHAR(100),
    line1 VARCHAR(200) NOT NULL,
    line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state_id UUID NOT NULL,
    country_id UUID NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    gps_latitude DECIMAL(10,6),
    gps_longitude DECIMAL(10,6),
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE company_address IS 'Physical addresses scoped to a company';

CREATE TABLE company_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    contact_type VARCHAR(30) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    designation VARCHAR(100),
    email VARCHAR(200) NOT NULL,
    phone_primary VARCHAR(30),
    phone_secondary VARCHAR(30),
    receives_alerts BOOLEAN DEFAULT FALSE NOT NULL,
    receives_reports BOOLEAN DEFAULT FALSE NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE company_contacts IS 'Key personnel contact records';

CREATE TABLE company_fiscal (
    fiscal_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID UNIQUE NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    fiscal_year_format VARCHAR(20) DEFAULT 'FY APR MAR' NOT NULL,
    fiscal_start_month INT DEFAULT 4 NOT NULL,
    fiscal_start_day INT DEFAULT 1 NOT NULL,
    current_fiscal_year VARCHAR(20) NOT NULL,
    period_type VARCHAR(20) DEFAULT 'MONTHLY' NOT NULL,
    accounting_standard VARCHAR(20) DEFAULT 'IND AS' NOT NULL,
    depreciation_method VARCHAR(30) DEFAULT 'SLM' NOT NULL,
    inventory_valuation VARCHAR(20) DEFAULT 'STANDARD' NOT NULL,
    gst_filing_frequency VARCHAR(20),
    tax_audit_applicable BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE company_fiscal IS 'Fiscal year, closing period, and accounting standard configs';

CREATE TABLE company_modules (
    module_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    module_code VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT FALSE NOT NULL,
    activated_on DATE,
    activated_by UUID,
    license_expiry DATE,
    config_json JSONB
);

COMMENT ON TABLE company_modules IS 'Enabled modules per company';

-- ==========================================
-- 3. USERS & Granular RBAC Permissions
-- ==========================================

CREATE TABLE user_master (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE RESTRICT,
    tenant_id UUID NOT NULL REFERENCES tenant_master(tenant_id) ON DELETE RESTRICT,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    password_hash VARCHAR(200) NOT NULL,
    auth_provider VARCHAR(20) DEFAULT 'EMAIL' NOT NULL,
    auth_provider_id VARCHAR(200),
    mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    mfa_method VARCHAR(20),
    user_type VARCHAR(20) DEFAULT 'STAFF' NOT NULL,
    employee_id VARCHAR(50),
    department VARCHAR(100),
    designation VARCHAR(100),
    profile_photo_url VARCHAR(500),
    lang_pref_id UUID, -- Refers to language_master.lang_id
    timezone_pref_id UUID,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(50),
    failed_login_count INT DEFAULT 0 NOT NULL,
    locked_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    invited_by UUID,
    CONSTRAINT uq_tenant_username_email UNIQUE(tenant_id, email)
);

COMMENT ON TABLE user_master IS 'All user accounts scoped to a company and tenant';

CREATE TABLE role_master (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    role_code VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_company_role_master UNIQUE(company_id, role_code)
);

COMMENT ON TABLE role_master IS 'Role definitions (system default & custom)';

CREATE TABLE role_permissions (
    perm_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES role_master(role_id) ON DELETE CASCADE,
    module_code VARCHAR(50) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT FALSE NOT NULL,
    can_create BOOLEAN DEFAULT FALSE NOT NULL,
    can_edit BOOLEAN DEFAULT FALSE NOT NULL,
    can_delete BOOLEAN DEFAULT FALSE NOT NULL,
    can_approve BOOLEAN DEFAULT FALSE NOT NULL,
    can_export BOOLEAN DEFAULT FALSE NOT NULL,
    can_print BOOLEAN DEFAULT FALSE NOT NULL,
    field_restrictions JSONB,
    CONSTRAINT uq_role_permission_unique UNIQUE(role_id, module_code, resource)
);

COMMENT ON TABLE role_permissions IS 'Granular permissions matrix per role';

CREATE TABLE user_role_assignment (
    assign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_master(user_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role_master(role_id) ON DELETE RESTRICT,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT uq_user_role_assignment_unique UNIQUE(user_id, role_id)
);

COMMENT ON TABLE user_role_assignment IS 'Many-to-Many assignment of roles to users';

-- ==========================================
-- 4. SETUP WIZARD & NOTIFICATIONS
-- ==========================================

CREATE TABLE setup_step_master (
    step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_code VARCHAR(50) NOT NULL UNIQUE,
    step_name VARCHAR(100) NOT NULL,
    step_description TEXT,
    step_order INT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE NOT NULL,
    step_category VARCHAR(30) NOT NULL,
    estimated_minutes INT,
    help_url VARCHAR(300),
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE setup_step_master IS 'Seeded onboarding steps list';

CREATE TABLE setup_wizard_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES setup_step_master(step_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES user_master(user_id) ON DELETE SET NULL,
    attempt_count INT DEFAULT 0 NOT NULL,
    data_snapshot JSONB,
    notes TEXT,
    CONSTRAINT uq_company_setup_step UNIQUE(company_id, step_id)
);

COMMENT ON TABLE setup_wizard_log IS 'Per-company onboarding wizard tracking log';

CREATE TABLE notification_config (
    notif_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    smtp_host VARCHAR(200),
    smtp_port INT,
    smtp_user VARCHAR(200),
    smtp_password_enc TEXT,
    from_email VARCHAR(200),
    from_name VARCHAR(100),
    sms_provider VARCHAR(30),
    sms_api_key_enc TEXT,
    sms_sender_id VARCHAR(20),
    push_fcm_key_enc TEXT,
    webhook_url VARCHAR(500),
    webhook_secret_enc TEXT,
    test_sent_at TIMESTAMP,
    test_status VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE notification_config IS 'Outgoing communication gateway credentials';
