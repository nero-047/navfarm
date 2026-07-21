// NAVFarm ERP Consolidated Drizzle Schema Definitions
// Target Database: PostgreSQL

import { 
  mysqlTable, 
  varchar, 
  int, 
  boolean, 
  timestamp, 
  date, 
  decimal, 
  char, 
  json, 
  text, 
  primaryKey,
  foreignKey,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// ==========================================
// 2. COMPANY PROFILE & CONFIGURATION
// ==========================================

export const companyMaster = mysqlTable('company_master', {
  company_id: varchar('company_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_code: varchar('company_code', { length: 20 }).notNull(),
  company_name: varchar('company_name', { length: 200 }).notNull(),
  company_display_name: varchar('company_display_name', { length: 100 }),
  company_type: varchar('company_type', { length: 30 }).notNull(),
  industry_type: varchar('industry_type', { length: 30 }).notNull(),
  registration_no: varchar('registration_no', { length: 100 }),
  tax_id: varchar('tax_id', { length: 100 }),
  tax_regime: varchar('tax_regime', { length: 20 }).default('STANDARD'),
  incorporation_date: date('incorporation_date', { mode: 'string' }),
  financial_year_start: int('financial_year_start').default(4).notNull(),
  base_currency_id: varchar('base_currency_id', { length: 36 }).notNull(),
  default_language_id: varchar('default_language_id', { length: 36 }).notNull(),
  default_timezone_id: varchar('default_timezone_id', { length: 100 }).notNull(),
  country_id: varchar('country_id', { length: 36 }).notNull(),
  company_logo_url: varchar('company_logo_url', { length: 500 }),
  company_logo_dark_url: varchar('company_logo_dark_url', { length: 500 }),
  primary_color_hex: varchar('primary_color_hex', { length: 7 }).default('#1F4E79').notNull(),
  website: varchar('website', { length: 300 }),
  email_domain: varchar('email_domain', { length: 100 }),
  support_email: varchar('support_email', { length: 200 }),
  phone_primary: varchar('phone_primary', { length: 30 }),
  is_multi_farm: boolean('is_multi_farm').default(false).notNull(),
  max_farm_locations: int('max_farm_locations').default(1).notNull(),
  onboarding_status: varchar('onboarding_status', { length: 20 }).default('PENDING').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  extension_config: json('extension_config')
});

export const companyAddress = mysqlTable('company_address', {
  address_id: varchar('address_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  address_type: varchar('address_type', { length: 30 }).default('REGISTERED').notNull(),
  address_label: varchar('address_label', { length: 100 }),
  line1: varchar('line1', { length: 200 }).notNull(),
  line2: varchar('line2', { length: 200 }),
  city: varchar('city', { length: 100 }).notNull(),
  state_id: varchar('state_id', { length: 36 }).notNull(),
  country_id: varchar('country_id', { length: 36 }).notNull(),
  pincode: varchar('pincode', { length: 20 }).notNull(),
  gps_latitude: decimal('gps_latitude', { precision: 10, scale: 6 }),
  gps_longitude: decimal('gps_longitude', { precision: 10, scale: 6 }),
  is_primary: boolean('is_primary').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull()
});

export const companyContacts = mysqlTable('company_contacts', {
  contact_id: varchar('contact_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  contact_type: varchar('contact_type', { length: 30 }).notNull(),
  full_name: varchar('full_name', { length: 200 }).notNull(),
  designation: varchar('designation', { length: 100 }),
  email: varchar('email', { length: 200 }).notNull(),
  phone_primary: varchar('phone_primary', { length: 30 }),
  phone_secondary: varchar('phone_secondary', { length: 30 }),
  receives_alerts: boolean('receives_alerts').default(false).notNull(),
  receives_reports: boolean('receives_reports').default(false).notNull(),
  is_primary: boolean('is_primary').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull()
});

export const companyFiscal = mysqlTable('company_fiscal', {
  fiscal_id: varchar('fiscal_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().unique().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  fiscal_year_format: varchar('fiscal_year_format', { length: 20 }).default('FY APR MAR').notNull(),
  fiscal_start_month: int('fiscal_start_month').default(4).notNull(),
  fiscal_start_day: int('fiscal_start_day').default(1).notNull(),
  fiscal_end_day: int('fiscal_end_day').default(31).notNull(),
  current_fiscal_year: varchar('current_fiscal_year', { length: 20 }).notNull(),
  period_type: varchar('period_type', { length: 20 }).default('MONTHLY').notNull(),
  accounting_standard: varchar('accounting_standard', { length: 20 }).default('IND AS').notNull(),
  depreciation_method: varchar('depreciation_method', { length: 30 }).default('SLM').notNull(),
  inventory_valuation: varchar('inventory_valuation', { length: 20 }).default('STANDARD').notNull(),
  gst_filing_frequency: varchar('gst_filing_frequency', { length: 20 }),
  tax_audit_applicable: boolean('tax_audit_applicable').default(false).notNull(),
  decimal_places: int('decimal_places').default(2).notNull(),
  is_active: boolean('is_active').default(true).notNull()
});

export const companyModules = mysqlTable('company_modules', {
  module_id: varchar('module_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  module_code: varchar('module_code', { length: 50 }).notNull(),
  is_active: boolean('is_active').default(false).notNull(),
  activated_on: date('activated_on', { mode: 'string' }),
  activated_by: varchar('activated_by', { length: 36 }),
  license_expiry: date('license_expiry', { mode: 'string' }),
  config_json: json('config_json')
});

// ==========================================
// 3. LANGUAGE & LOCALIZATION ENGINE
// ==========================================

export const languageMaster = mysqlTable('language_master', {
  lang_id: varchar('lang_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  lang_code: varchar('lang_code', { length: 10 }).notNull().unique(),
  lang_name_english: varchar('lang_name_english', { length: 100 }).notNull(),
  lang_name_native: varchar('lang_name_native', { length: 100 }).notNull(),
  script: varchar('script', { length: 30 }).notNull(),
  is_rtl: boolean('is_rtl').default(false).notNull(),
  is_system_default: boolean('is_system_default').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  translation_coverage_pct: decimal('translation_coverage_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  date_format: varchar('date_format', { length: 30 }).default('DD/MM/YYYY').notNull(),
  number_format: varchar('number_format', { length: 20 }).default('IN').notNull(),
  decimal_separator: char('decimal_separator', { length: 1 }).default('.').notNull(),
  thousands_separator: char('thousands_separator', { length: 1 }).default(',').notNull(),
  flag_emoji: varchar('flag_emoji', { length: 10 })
});

export const languageTranslations = mysqlTable('language_translations', {
  trans_id: varchar('trans_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  lang_id: varchar('lang_id', { length: 36 }).notNull().references(() => languageMaster.lang_id, { onDelete: 'cascade' }),
  module_code: varchar('module_code', { length: 50 }).notNull(),
  translation_key: varchar('translation_key', { length: 200 }).notNull(),
  translation_value: text('translation_value').notNull(),
  is_html: boolean('is_html').default(false).notNull(),
  is_auto_translated: boolean('is_auto_translated').default(false).notNull(),
  verified_by: varchar('verified_by', { length: 36 }),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

export const companyLanguageConfig = mysqlTable('company_language_config', {
  config_id: varchar('config_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  lang_id: varchar('lang_id', { length: 36 }).notNull().references(() => languageMaster.lang_id, { onDelete: 'cascade' }),
  is_default: boolean('is_default').default(false).notNull(),
  is_enabled: boolean('is_enabled').default(true).notNull(),
  set_by: varchar('set_by', { length: 36 }),
  set_at: timestamp('set_at', { mode: 'string' }).defaultNow().notNull()
});

export const userLanguagePref = mysqlTable('user_language_pref', {
  pref_id: varchar('pref_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  user_id: varchar('user_id', { length: 36 }).notNull(), // reference will be added via relations or ALTER constraint
  lang_id: varchar('lang_id', { length: 36 }).notNull().references(() => languageMaster.lang_id, { onDelete: 'restrict' }),
  date_format_override: varchar('date_format_override', { length: 30 }),
  number_format_override: varchar('number_format_override', { length: 20 }),
  is_active: boolean('is_active').default(true).notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

// ==========================================
// 4. CURRENCY & EXCHANGE RATES
// ==========================================

export const currencyMaster = mysqlTable('currency_master', {
  currency_id: varchar('currency_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  iso_code: char('iso_code', { length: 3 }).notNull().unique(),
  currency_name: varchar('currency_name', { length: 100 }).notNull(),
  symbol: varchar('symbol', { length: 5 }).notNull(),
  symbol_position: varchar('symbol_position', { length: 10 }).default('PREFIX').notNull(),
  decimal_places: int('decimal_places').default(2).notNull(),
  is_system_default: boolean('is_system_default').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull()
});

export const exchangeRate = mysqlTable('exchange_rate', {
  rate_id: varchar('rate_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  from_currency_id: varchar('from_currency_id', { length: 36 }).notNull().references(() => currencyMaster.currency_id, { onDelete: 'cascade' }),
  to_currency_id: varchar('to_currency_id', { length: 36 }).notNull().references(() => currencyMaster.currency_id, { onDelete: 'cascade' }),
  rate: decimal('rate', { precision: 18, scale: 6 }).notNull(),
  rate_date: date('rate_date', { mode: 'string' }).notNull(),
  rate_source: varchar('rate_source', { length: 30 }).default('MANUAL').notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const companyCurrencyConfig = mysqlTable('company_currency_config', {
  curr_config_id: varchar('curr_config_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  currency_id: varchar('currency_id', { length: 36 }).notNull(),
  is_base: boolean('is_base').default(false).notNull(),
  is_reporting: boolean('is_reporting').default(false).notNull(),
  display_order: int('display_order').default(1).notNull()
}, (table) => ({
  currencyFk: foreignKey({
    columns: [table.currency_id],
    foreignColumns: [currencyMaster.currency_id],
    name: 'comp_curr_config_curr_id_fk'
  }).onDelete('restrict')
}));

// ==========================================
// 5. USERS & Granular RBAC Permissions
// ==========================================

export const userMaster = mysqlTable('user_master', {
  user_id: varchar('user_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  full_name: varchar('full_name', { length: 200 }).notNull(),
  email: varchar('email', { length: 200 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  password_hash: varchar('password_hash', { length: 200 }).notNull(),
  auth_provider: varchar('auth_provider', { length: 20 }).default('EMAIL').notNull(),
  auth_provider_id: varchar('auth_provider_id', { length: 200 }),
  mfa_enabled: boolean('mfa_enabled').default(false).notNull(),
  mfa_method: varchar('mfa_method', { length: 20 }),
  mfa_secret: varchar('mfa_secret', { length: 100 }),
  user_type: varchar('user_type', { length: 20 }).default('STAFF').notNull(),
  employee_id: varchar('employee_id', { length: 50 }),
  department: varchar('department', { length: 100 }),
  designation: varchar('designation', { length: 100 }),
  profile_photo_url: varchar('profile_photo_url', { length: 500 }),
  lang_pref_id: varchar('lang_pref_id', { length: 36 }),
  timezone_pref_id: varchar('timezone_pref_id', { length: 100 }),
  last_login_at: timestamp('last_login_at', { mode: 'string' }),
  last_login_ip: varchar('last_login_ip', { length: 50 }),
  failed_login_count: int('failed_login_count').default(0).notNull(),
  locked_until: timestamp('locked_until', { mode: 'string' }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  invited_by: varchar('invited_by', { length: 36 }),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  deleted_by: varchar('deleted_by', { length: 36 })
});

export const roleMaster = mysqlTable('role_master', {
  role_id: varchar('role_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  role_code: varchar('role_code', { length: 50 }).notNull(),
  role_name: varchar('role_name', { length: 100 }).notNull(),
  role_description: text('role_description'),
  is_system_role: boolean('is_system_role').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull()
});

export const rolePermissions = mysqlTable('role_permissions', {
  perm_id: varchar('perm_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  role_id: varchar('role_id', { length: 36 }).notNull().references(() => roleMaster.role_id, { onDelete: 'cascade' }),
  module_code: varchar('module_code', { length: 50 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  can_view: boolean('can_view').default(false).notNull(),
  can_create: boolean('can_create').default(false).notNull(),
  can_edit: boolean('can_edit').default(false).notNull(),
  can_delete: boolean('can_delete').default(false).notNull(),
  can_approve: boolean('can_approve').default(false).notNull(),
  can_export: boolean('can_export').default(false).notNull(),
  can_print: boolean('can_print').default(false).notNull(),
  field_restrictions: json('field_restrictions')
});

export const userRoleAssignment = mysqlTable('user_role_assignment', {
  assign_id: varchar('assign_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  user_id: varchar('user_id', { length: 36 }).notNull().references(() => userMaster.user_id, { onDelete: 'cascade' }),
  role_id: varchar('role_id', { length: 36 }).notNull().references(() => roleMaster.role_id, { onDelete: 'restrict' }),
  assigned_by: varchar('assigned_by', { length: 36 }).notNull(),
  assigned_at: timestamp('assigned_at', { mode: 'string' }).defaultNow().notNull(),
  expires_at: timestamp('expires_at', { mode: 'string' }),
  is_active: boolean('is_active').default(true).notNull()
});

export const userCompanyAssignments = mysqlTable('user_company_assignments', {
  assign_id: varchar('assign_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  user_id: varchar('user_id', { length: 36 }).notNull().references(() => userMaster.user_id, { onDelete: 'cascade' }),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  is_primary: boolean('is_primary').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  assigned_by: varchar('assigned_by', { length: 36 }).notNull(),
  assigned_at: timestamp('assigned_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('uq_user_company').on(table.user_id, table.company_id),
]);

// ==========================================
// 6. SETUP WIZARD & NOTIFICATIONS
// ==========================================

export const setupStepMaster = mysqlTable('setup_step_master', {
  step_id: varchar('step_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  step_code: varchar('step_code', { length: 50 }).notNull().unique(),
  step_name: varchar('step_name', { length: 100 }).notNull(),
  step_description: text('step_description'),
  step_order: int('step_order').notNull(),
  is_mandatory: boolean('is_mandatory').default(true).notNull(),
  step_category: varchar('step_category', { length: 30 }).notNull(),
  estimated_minutes: int('estimated_minutes'),
  help_url: varchar('help_url', { length: 300 }),
  is_active: boolean('is_active').default(true).notNull()
});

export const setupWizardLog = mysqlTable('setup_wizard_log', {
  log_id: varchar('log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  step_id: varchar('step_id', { length: 36 }).notNull().references(() => setupStepMaster.step_id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  completed_at: timestamp('completed_at', { mode: 'string' }),
  completed_by: varchar('completed_by', { length: 36 }),
  attempt_count: int('attempt_count').default(0).notNull(),
  data_snapshot: json('data_snapshot'),
  notes: text('notes')
});

export const notificationConfig = mysqlTable('notification_config', {
  notif_id: varchar('notif_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  channel: varchar('channel', { length: 20 }).notNull(),
  is_enabled: boolean('is_enabled').default(true).notNull(),
  smtp_host: varchar('smtp_host', { length: 200 }),
  smtp_port: int('smtp_port'),
  smtp_user: varchar('smtp_user', { length: 200 }),
  smtp_password_enc: text('smtp_password_enc'),
  from_email: varchar('from_email', { length: 200 }),
  from_name: varchar('from_name', { length: 100 }),
  sms_provider: varchar('sms_provider', { length: 30 }),
  sms_api_key_enc: text('sms_api_key_enc'),
  sms_sender_id: varchar('sms_sender_id', { length: 20 }),
  push_fcm_key_enc: text('push_fcm_key_enc'),
  webhook_url: varchar('webhook_url', { length: 500 }),
  webhook_secret_enc: text('webhook_secret_enc'),
  test_sent_at: timestamp('test_sent_at', { mode: 'string' }),
  test_status: varchar('test_status', { length: 20 }),
  is_active: boolean('is_active').default(true).notNull()
});

// ==========================================
// 7. BUSINESS VERTICALS (NOB / LOB)
// ==========================================

export const nobMaster = mysqlTable('nob_master', {
  nob_id: varchar('nob_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  nob_code: varchar('nob_code', { length: 50 }).notNull().unique(),
  nob_name: varchar('nob_name', { length: 100 }).notNull(),
  default_costing_method: varchar('default_costing_method', { length: 20 }).default('STANDARD').notNull(),
  description: text('description'),
  sort_order: int('sort_order'),
  is_system: boolean('is_system').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: date('created_at', { mode: 'string' }),
  updated_at: date('updated_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const lobMaster = mysqlTable('lob_master', {
  lob_id: varchar('lob_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  nob_id: varchar('nob_id', { length: 36 }).notNull().references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_code: varchar('lob_code', { length: 50 }).notNull().unique(),
  lob_name: varchar('lob_name', { length: 100 }).notNull(),
  costing_method_allowed: varchar('costing_method_allowed', { length: 100 }).notNull(),
  qc_required: varchar('qc_required', { length: 10 }).default('NO').notNull(),
  qr_required: varchar('qr_required', { length: 10 }).default('NO').notNull(),
  batch_copy_allowed: varchar('batch_copy_allowed', { length: 10 }).default('NO').notNull(),
  scheduler_copy_allowed: varchar('scheduler_copy_allowed', { length: 10 }).default('NO').notNull(),
  traceability_required: varchar('traceability_required', { length: 10 }).default('YES').notNull(),
  description: text('description'),
  sort_order: int('sort_order'),
  is_system: boolean('is_system').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: date('created_at', { mode: 'string' }),
  updated_at: date('updated_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const nobLobExtensionConfig = mysqlTable('nob_lob_extension_config', {
  config_id: varchar('config_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'cascade' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'cascade' }),
  config_key: varchar('config_key', { length: 100 }).notNull(),
  config_value: varchar('config_value', { length: 200 }).notNull(),
  data_type: varchar('data_type', { length: 30 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull()
});

// ==========================================
// 8. MASTER TABLES (UOM, ITEM, BREED, LOCATION)
// ==========================================

export const uomMaster = mysqlTable('uom_master', {
  uom_id: varchar('uom_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }),
  uom_code: varchar('uom_code', { length: 20 }).notNull(),
  uom_name: varchar('uom_name', { length: 100 }).notNull(),
  uom_type: varchar('uom_type', { length: 20 }).notNull(),
  decimal_places: int('decimal_places').default(0).notNull(),
  is_base_uom: boolean('is_base_uom').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  extension_config: json('extension_config')
});

export const itemMaster = mysqlTable('item_master', {
  item_id: varchar('item_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  item_code: varchar('item_code', { length: 50 }).notNull(),
  item_name: varchar('item_name', { length: 200 }).notNull(),
  item_type: varchar('item_type', { length: 30 }).notNull(),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  category: varchar('category', { length: 100 }),
  sub_category: varchar('sub_category', { length: 100 }),
  uom_primary: varchar('uom_primary', { length: 20 }).notNull(),
  uom_secondary: varchar('uom_secondary', { length: 20 }),
  uom_conversion_factor: decimal('uom_conversion_factor', { precision: 18, scale: 6 }),
  valuation_method: varchar('valuation_method', { length: 20 }),
  standard_cost: decimal('standard_cost', { precision: 18, scale: 6 }),
  is_lot_tracked: boolean('is_lot_tracked').default(false).notNull(),
  is_serial_tracked: boolean('is_serial_tracked').default(false).notNull(),
  is_biological_asset: boolean('is_biological_asset').default(false).notNull(),
  is_biological_costing_method: varchar('is_biological_costing_method', { length: 30 }),
  is_inventoriable: boolean('is_inventoriable').default(true).notNull(),
  min_stock_level: decimal('min_stock_level', { precision: 18, scale: 4 }),
  max_stock_level: decimal('max_stock_level', { precision: 18, scale: 4 }),
  reorder_level: decimal('reorder_level', { precision: 18, scale: 4 }),
  shelf_life_days: int('shelf_life_days'),
  storage_temp_min: decimal('storage_temp_min', { precision: 6, scale: 2 }),
  storage_temp_max: decimal('storage_temp_max', { precision: 6, scale: 2 }),
  is_qr_enabled: boolean('is_qr_enabled').default(false).notNull(),
  qr_trigger_event: varchar('qr_trigger_event', { length: 30 }),
  is_active: boolean('is_active').default(true).notNull(),
  extension_config: json('extension_config'),
  created_by: varchar('created_by', { length: 36 }).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

export const uomConversionMaster = mysqlTable('uom_conversion_master', {
  conversion_id: varchar('conversion_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  from_uom: varchar('from_uom', { length: 20 }).notNull(),
  to_uom: varchar('to_uom', { length: 20 }).notNull(),
  conversion_factor: decimal('conversion_factor', { precision: 18, scale: 8 }).notNull(),
  effective_from: date('effective_from', { mode: 'string' }).notNull(),
  effective_to: date('effective_to', { mode: 'string' }),
  is_active: boolean('is_active').default(true).notNull()
});

export const itemAttributeMaster = mysqlTable('item_attribute_master', {
  attribute_id: varchar('attribute_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'cascade' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'cascade' }),
  attribute_code: varchar('attribute_code', { length: 50 }).notNull(),
  attribute_name: varchar('attribute_name', { length: 100 }).notNull(),
  data_type: varchar('data_type', { length: 20 }).notNull(),
  list_values: json('list_values'),
  unit: varchar('unit', { length: 20 }),
  is_mandatory: boolean('is_mandatory').default(false).notNull(),
  affects_costing: boolean('affects_costing').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  is_variant: boolean('is_variant').default(false).notNull()
});

export const itemAttributeValues = mysqlTable('item_attribute_values', {
  value_id: varchar('value_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  attribute_id: varchar('attribute_id', { length: 36 }).notNull(),
  attribute_value: text('attribute_value').notNull()
}, (table) => ({
  attributeFk: foreignKey({
    columns: [table.attribute_id],
    foreignColumns: [itemAttributeMaster.attribute_id],
    name: 'item_attr_vals_attr_id_fk'
  }).onDelete('restrict')
}));

export const breedMaster = mysqlTable('breed_master', {
  breed_id: varchar('breed_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  nob_id: varchar('nob_id', { length: 36 }).notNull().references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  breed_code: varchar('breed_code', { length: 50 }).notNull(),
  breed_name: varchar('breed_name', { length: 100 }).notNull(),
  species: varchar('species', { length: 100 }).notNull(),
  breed_type: varchar('breed_type', { length: 50 }).notNull(),
  avg_growth_rate_g_day: decimal('avg_growth_rate_g_day', { precision: 10, scale: 4 }),
  avg_fcr: decimal('avg_fcr', { precision: 8, scale: 4 }),
  avg_mortality_pct: decimal('avg_mortality_pct', { precision: 6, scale: 2 }),
  avg_lay_rate_pct: decimal('avg_lay_rate_pct', { precision: 6, scale: 2 }),
  incubation_days: int('incubation_days'),
  gestation_days: int('gestation_days'),
  avg_litter_size: decimal('avg_litter_size', { precision: 6, scale: 2 }),
  mature_age_months: int('mature_age_months'),
  productive_life_months: int('productive_life_months'),
  premature_years: decimal('premature_years', { precision: 5, scale: 2 }),
  avg_yield_per_unit: decimal('avg_yield_per_unit', { precision: 10, scale: 4 }),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  extension_config: json('extension_config')
});

export const locationMaster = mysqlTable('location_master', {
  location_id: varchar('location_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  location_code: varchar('location_code', { length: 50 }).notNull(),
  location_name: varchar('location_name', { length: 200 }).notNull(),
  location_level: int('location_level').notNull(),
  location_type: varchar('location_type', { length: 50 }).notNull(),
  parent_location_id: varchar('parent_location_id', { length: 36 }),
  area_size: decimal('area_size', { precision: 18, scale: 4 }),
  area_unit: varchar('area_unit', { length: 10 }),
  max_capacity: decimal('max_capacity', { precision: 18, scale: 4 }),
  capacity_uom: varchar('capacity_uom', { length: 20 }),
  current_count: decimal('current_count', { precision: 18, scale: 4 }).default('0.00').notNull(),
  gps_latitude: decimal('gps_latitude', { precision: 10, scale: 8 }),
  gps_longitude: decimal('gps_longitude', { precision: 11, scale: 8 }),
  storage_type: varchar('storage_type', { length: 30 }),
  is_quarantine_zone: boolean('is_quarantine_zone').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  extension_config: json('extension_config')
}, (table) => ({
  parentLocationFk: foreignKey({
    columns: [table.parent_location_id],
    foreignColumns: [table.location_id],
    name: 'loc_master_parent_loc_id_fk'
  }).onDelete('restrict')
}));

// ==========================================
// DRIZZLE SCHEMA RELATIONSHIPS
// ==========================================




export const companyMasterRelations = relations(companyMaster, ({ one, many }) => ({
  addresses: many(companyAddress),
  contacts: many(companyContacts),
  fiscal: one(companyFiscal, {
    fields: [companyMaster.company_id],
    references: [companyFiscal.company_id]
  }),
  modules: many(companyModules),
  users: many(userMaster),
  roles: many(roleMaster),
  languages: many(companyLanguageConfig),
  currencies: many(companyCurrencyConfig)
}));

export const companyAddressRelations = relations(companyAddress, ({ one }) => ({
  company: one(companyMaster, {
    fields: [companyAddress.company_id],
    references: [companyMaster.company_id]
  })
}));

export const companyContactsRelations = relations(companyContacts, ({ one }) => ({
  company: one(companyMaster, {
    fields: [companyContacts.company_id],
    references: [companyMaster.company_id]
  })
}));

export const companyFiscalRelations = relations(companyFiscal, ({ one }) => ({
  company: one(companyMaster, {
    fields: [companyFiscal.company_id],
    references: [companyMaster.company_id]
  })
}));

export const companyModulesRelations = relations(companyModules, ({ one }) => ({
  company: one(companyMaster, {
    fields: [companyModules.company_id],
    references: [companyMaster.company_id]
  })
}));

export const userMasterRelations = relations(userMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [userMaster.company_id],
    references: [companyMaster.company_id]
  }),
  roleAssignments: many(userRoleAssignment)
}));

export const roleMasterRelations = relations(roleMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [roleMaster.company_id],
    references: [companyMaster.company_id]
  }),
  permissions: many(rolePermissions),
  assignments: many(userRoleAssignment)
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roleMaster, {
    fields: [rolePermissions.role_id],
    references: [roleMaster.role_id]
  })
}));

export const userRoleAssignmentRelations = relations(userRoleAssignment, ({ one }) => ({
  user: one(userMaster, {
    fields: [userRoleAssignment.user_id],
    references: [userMaster.user_id]
  }),
  role: one(roleMaster, {
    fields: [userRoleAssignment.role_id],
    references: [roleMaster.role_id]
  })
}));

export const userCompanyAssignmentsRelations = relations(userCompanyAssignments, ({ one }) => ({
  user: one(userMaster, {
    fields: [userCompanyAssignments.user_id],
    references: [userMaster.user_id]
  }),
  company: one(companyMaster, {
    fields: [userCompanyAssignments.company_id],
    references: [companyMaster.company_id]
  })
}));

export const itemMasterRelations = relations(itemMaster, ({ one, many }) => ({
  nob: one(nobMaster, {
    fields: [itemMaster.nob_id],
    references: [nobMaster.nob_id]
  }),
  lob: one(lobMaster, {
    fields: [itemMaster.lob_id],
    references: [lobMaster.lob_id]
  }),
  attributes: many(itemAttributeValues)
}));

export const breedMasterRelations = relations(breedMaster, ({ one }) => ({
  nob: one(nobMaster, {
    fields: [breedMaster.nob_id],
    references: [nobMaster.nob_id]
  }),
  lob: one(lobMaster, {
    fields: [breedMaster.lob_id],
    references: [lobMaster.lob_id]
  })
}));

export const locationMasterRelations = relations(locationMaster, ({ one }) => ({
  nob: one(nobMaster, {
    fields: [locationMaster.nob_id],
    references: [nobMaster.nob_id]
  }),
  lob: one(lobMaster, {
    fields: [locationMaster.lob_id],
    references: [lobMaster.lob_id]
  }),
  parent: one(locationMaster, {
    fields: [locationMaster.parent_location_id],
    references: [locationMaster.location_id],
    relationName: 'parentLocation'
  })
}));

export const auditLog = mysqlTable('audit_log', {
  audit_id: varchar('audit_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  user_id: varchar('user_id', { length: 36 }).references(() => userMaster.user_id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(), // INSERT, UPDATE, DELETE, LOGIN, MFA_VERIFY, etc.
  entity_name: varchar('entity_name', { length: 100 }).notNull(), // e.g. company_master
  entity_id: varchar('entity_id', { length: 36 }).notNull(),
  old_values: json('old_values'),
  new_values: json('new_values'),
  ip_address: varchar('ip_address', { length: 50 }),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  company: one(companyMaster, {
    fields: [auditLog.company_id],
    references: [companyMaster.company_id]
  }),
  user: one(userMaster, {
    fields: [auditLog.user_id],
    references: [userMaster.user_id]
  })
}));

export const notificationLog = mysqlTable('notification_log', {
  log_id: varchar('log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('PENDING').notNull(),
  error_message: text('error_message'),
  sent_at: timestamp('sent_at', { mode: 'string' }).defaultNow().notNull()
});

export const notificationLogRelations = relations(notificationLog, ({ one }) => ({
  company: one(companyMaster, {
    fields: [notificationLog.company_id],
    references: [companyMaster.company_id]
  })
}));
