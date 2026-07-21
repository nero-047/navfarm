-- NAVFarm ERP Database Schema DDL
-- 02_LOCALIZATION.SQL (Languages, Translations, Currencies & Rates)

-- ==========================================
-- 1. LANGUAGE & LOCALIZATION ENGINE
-- ==========================================

CREATE TABLE language_master (
    lang_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lang_code VARCHAR(10) NOT NULL UNIQUE,
    lang_name_english VARCHAR(100) NOT NULL,
    lang_name_native VARCHAR(100) NOT NULL,
    script VARCHAR(30) NOT NULL,
    is_rtl BOOLEAN DEFAULT FALSE NOT NULL,
    is_system_default BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    translation_coverage_pct DECIMAL(5,2) DEFAULT 0.00 NOT NULL,
    date_format VARCHAR(30) DEFAULT 'DD/MM/YYYY' NOT NULL,
    number_format VARCHAR(20) DEFAULT 'IN' NOT NULL,
    decimal_separator CHAR(1) DEFAULT '.' NOT NULL,
    thousands_separator CHAR(1) DEFAULT ',' NOT NULL,
    flag_emoji VARCHAR(10)
);

COMMENT ON TABLE language_master IS 'Seeded languages supported by NAVFarm';

CREATE TABLE language_translations (
    trans_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lang_id UUID NOT NULL REFERENCES language_master(lang_id) ON DELETE CASCADE,
    module_code VARCHAR(50) NOT NULL,
    translation_key VARCHAR(200) NOT NULL,
    translation_value TEXT NOT NULL,
    is_html BOOLEAN DEFAULT FALSE NOT NULL,
    is_auto_translated BOOLEAN DEFAULT FALSE NOT NULL,
    verified_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_lang_trans_key UNIQUE(lang_id, module_code, translation_key)
);

COMMENT ON TABLE language_translations IS 'i18n translation strings';

CREATE TABLE company_language_config (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    lang_id UUID NOT NULL REFERENCES language_master(lang_id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT FALSE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    set_by UUID,
    set_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_company_lang_config_unique UNIQUE(company_id, lang_id)
);

COMMENT ON TABLE company_language_config IS 'Languages enabled for a company and default company locale';

CREATE TABLE user_language_pref (
    pref_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_master(user_id) ON DELETE CASCADE,
    lang_id UUID NOT NULL REFERENCES language_master(lang_id) ON DELETE RESTRICT,
    date_format_override VARCHAR(30),
    number_format_override VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_lang_pref UNIQUE(user_id)
);

COMMENT ON TABLE user_language_pref IS 'User UI localization preferences';

-- ==========================================
-- 2. CURRENCY & EXCHANGE RATES
-- ==========================================

CREATE TABLE currency_master (
    currency_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    iso_code CHAR(3) NOT NULL UNIQUE,
    currency_name VARCHAR(100) NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    symbol_position VARCHAR(10) DEFAULT 'PREFIX' NOT NULL,
    decimal_places INT DEFAULT 2 NOT NULL,
    is_system_default BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

COMMENT ON TABLE currency_master IS 'All supported system currencies';

CREATE TABLE exchange_rate (
    rate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency_id UUID NOT NULL REFERENCES currency_master(currency_id) ON DELETE CASCADE,
    to_currency_id UUID NOT NULL REFERENCES currency_master(currency_id) ON DELETE CASCADE,
    rate DECIMAL(18,6) NOT NULL,
    rate_date DATE NOT NULL,
    rate_source VARCHAR(30) DEFAULT 'MANUAL' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_exchange_rate_unique UNIQUE(from_currency_id, to_currency_id, rate_date)
);

COMMENT ON TABLE exchange_rate IS 'Daily exchange rates';

CREATE TABLE company_currency_config (
    curr_config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company_master(company_id) ON DELETE CASCADE,
    currency_id UUID NOT NULL REFERENCES currency_master(currency_id) ON DELETE RESTRICT,
    is_base BOOLEAN DEFAULT FALSE NOT NULL,
    is_reporting BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INT DEFAULT 1 NOT NULL,
    CONSTRAINT uq_company_currency_config UNIQUE(company_id, currency_id)
);

COMMENT ON TABLE company_currency_config IS 'Base and reporting currencies defined per company';

-- Add cross-file Foreign Key Alterations
ALTER TABLE tenant_master ADD CONSTRAINT fk_tenant_billing_currency FOREIGN KEY (billing_currency_id) REFERENCES currency_master(currency_id) ON DELETE RESTRICT;
ALTER TABLE company_master ADD CONSTRAINT fk_company_base_currency FOREIGN KEY (base_currency_id) REFERENCES currency_master(currency_id) ON DELETE RESTRICT;
ALTER TABLE company_master ADD CONSTRAINT fk_company_default_language FOREIGN KEY (default_language_id) REFERENCES language_master(lang_id) ON DELETE RESTRICT;
ALTER TABLE user_master ADD CONSTRAINT fk_user_lang_pref FOREIGN KEY (lang_pref_id) REFERENCES language_master(lang_id) ON DELETE RESTRICT;
