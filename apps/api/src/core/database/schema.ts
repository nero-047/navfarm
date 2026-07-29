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
  default_warehouse_id: varchar('default_warehouse_id', { length: 36 }),
  default_location_id: varchar('default_location_id', { length: 36 }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  updated_by: varchar('updated_by', { length: 36 }),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
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
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }), // Null for tenant-wide global UOMs
  uom_code: varchar('uom_code', { length: 20 }).notNull(),
  uom_name: varchar('uom_name', { length: 100 }).notNull(),
  uom_type: varchar('uom_type', { length: 20 }).notNull(),
  decimal_places: int('decimal_places').default(0).notNull(),
  is_base_uom: boolean('is_base_uom').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  extension_config: json('extension_config'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
});

export const itemCategoryMaster = mysqlTable('item_category_master', {
  category_id: varchar('category_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }), // null means global tenant-wide category
  category_code: varchar('category_code', { length: 50 }).notNull(),
  category_name: varchar('category_name', { length: 100 }).notNull(),
  parent_category_id: varchar('parent_category_id', { length: 36 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  parentCategoryFk: foreignKey({
    columns: [table.parent_category_id],
    foreignColumns: [table.category_id],
    name: 'item_cat_master_parent_cat_id_fk'
  }).onDelete('restrict')
}));

export const itemMaster = mysqlTable('item_master', {
  item_id: varchar('item_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  category_id: varchar('category_id', { length: 36 }).references(() => itemCategoryMaster.category_id, { onDelete: 'restrict' }),
  item_code: varchar('item_code', { length: 50 }).notNull(),
  item_name: varchar('item_name', { length: 200 }).notNull(),
  item_type: varchar('item_type', { length: 30 }).notNull(),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  category: varchar('category', { length: 100 }), // Legacy text category field
  sub_category: varchar('sub_category', { length: 100 }), // Legacy text sub_category field
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
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const uomConversionMaster = mysqlTable('uom_conversion_master', {
  conversion_id: varchar('conversion_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  from_uom: varchar('from_uom', { length: 20 }).notNull(),
  to_uom: varchar('to_uom', { length: 20 }).notNull(),
  conversion_factor: decimal('conversion_factor', { precision: 18, scale: 8 }).notNull(),
  effective_from: date('effective_from', { mode: 'string' }).notNull(),
  effective_to: date('effective_to', { mode: 'string' }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
});

export const itemAttributeMaster = mysqlTable('item_attribute_master', {
  attribute_id: varchar('attribute_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'cascade' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'cascade' }),
  attribute_code: varchar('attribute_code', { length: 50 }).notNull(),
  attribute_name: varchar('attribute_name', { length: 100 }).notNull(),
  data_type: varchar('data_type', { length: 20 }).notNull(), // STRING, NUMBER, BOOLEAN, LIST
  list_values: json('list_values'),
  unit: varchar('unit', { length: 20 }),
  is_mandatory: boolean('is_mandatory').default(false).notNull(),
  affects_costing: boolean('affects_costing').default(false).notNull(),
  is_variant: boolean('is_variant').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
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

export const speciesMaster = mysqlTable('species_master', {
  species_id: varchar('species_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  species_code: varchar('species_code', { length: 50 }).notNull(),
  species_name: varchar('species_name', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
});

export const breedMaster = mysqlTable('breed_master', {
  breed_id: varchar('breed_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  nob_id: varchar('nob_id', { length: 36 }).notNull().references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  breed_code: varchar('breed_code', { length: 50 }).notNull(),
  breed_name: varchar('breed_name', { length: 100 }).notNull(),
  species_id: varchar('species_id', { length: 36 }).references(() => speciesMaster.species_id, { onDelete: 'restrict' }),
  species: varchar('species', { length: 100 }), // Legacy text field (nullable now)
  breed_type: varchar('breed_type', { length: 50 }).notNull(), // BROILER/LAYER/BREEDER/DUAL_PURPOSE/DAIRY/BEEF/TREE/FISH
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
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const farmMaster = mysqlTable('farm_master', {
  farm_id: varchar('farm_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  farm_code: varchar('farm_code', { length: 50 }).notNull(),
  farm_name: varchar('farm_name', { length: 100 }).notNull(),
  farm_type: varchar('farm_type', { length: 50 }).notNull(), // BREEDER, COMMERCIAL_LAYERS, COMMERCIAL_BROILERS, HATCHERY, REARING, DAIRY, etc.
  capacity: int('capacity').default(0).notNull(),
  address_line1: varchar('address_line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const warehouseMaster = mysqlTable('warehouse_master', {
  warehouse_id: varchar('warehouse_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  farm_id: varchar('farm_id', { length: 36 }).references(() => farmMaster.farm_id, { onDelete: 'restrict' }),
  warehouse_code: varchar('warehouse_code', { length: 50 }).notNull(),
  warehouse_name: varchar('warehouse_name', { length: 100 }).notNull(),
  warehouse_type: varchar('warehouse_type', { length: 50 }).notNull(), // COLD_STORAGE, SILO, GENERAL, INGREDIENTS, MEDICINE, etc.
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const shedMaster = mysqlTable('shed_master', {
  shed_id: varchar('shed_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  farm_id: varchar('farm_id', { length: 36 }).notNull().references(() => farmMaster.farm_id, { onDelete: 'restrict' }),
  shed_code: varchar('shed_code', { length: 50 }).notNull(),
  shed_name: varchar('shed_name', { length: 100 }).notNull(),
  shed_type: varchar('shed_type', { length: 50 }).notNull(), // OPEN_SIDED, ENVIRONMENTALLY_CONTROLLED, SEMI_EC
  capacity: int('capacity').default(0).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const locationMaster = mysqlTable('location_master', {
  location_id: varchar('location_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  warehouse_id: varchar('warehouse_id', { length: 36 }).references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  location_code: varchar('location_code', { length: 50 }).notNull(),
  location_name: varchar('location_name', { length: 200 }).notNull(),
  location_level: int('location_level').notNull(),
  location_type: varchar('location_type', { length: 50 }).notNull(), // FARM, SHED, AREA, SECTION etc.
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
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
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

export const itemCategoryMasterRelations = relations(itemCategoryMaster, ({ one, many }) => ({
  parent: one(itemCategoryMaster, {
    fields: [itemCategoryMaster.parent_category_id],
    references: [itemCategoryMaster.category_id],
    relationName: 'parentCategory'
  }),
  items: many(itemMaster)
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
  category: one(itemCategoryMaster, {
    fields: [itemMaster.category_id],
    references: [itemCategoryMaster.category_id]
  }),
  attributes: many(itemAttributeValues)
}));

export const itemAttributeMasterRelations = relations(itemAttributeMaster, ({ many }) => ({
  values: many(itemAttributeValues)
}));

export const itemAttributeValuesRelations = relations(itemAttributeValues, ({ one }) => ({
  item: one(itemMaster, {
    fields: [itemAttributeValues.item_id],
    references: [itemMaster.item_id]
  }),
  attribute: one(itemAttributeMaster, {
    fields: [itemAttributeValues.attribute_id],
    references: [itemAttributeMaster.attribute_id]
  })
}));

export const speciesMasterRelations = relations(speciesMaster, ({ many }) => ({
  breeds: many(breedMaster)
}));

export const breedMasterRelations = relations(breedMaster, ({ one }) => ({
  nob: one(nobMaster, {
    fields: [breedMaster.nob_id],
    references: [nobMaster.nob_id]
  }),
  lob: one(lobMaster, {
    fields: [breedMaster.lob_id],
    references: [lobMaster.lob_id]
  }),
  species: one(speciesMaster, {
    fields: [breedMaster.species_id],
    references: [speciesMaster.species_id]
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
  warehouse: one(warehouseMaster, {
    fields: [locationMaster.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  parent: one(locationMaster, {
    fields: [locationMaster.parent_location_id],
    references: [locationMaster.location_id],
    relationName: 'parentLocation'
  })
}));

export const farmMasterRelations = relations(farmMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [farmMaster.company_id],
    references: [companyMaster.company_id]
  }),
  sheds: many(shedMaster),
  warehouses: many(warehouseMaster)
}));

export const warehouseMasterRelations = relations(warehouseMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [warehouseMaster.company_id],
    references: [companyMaster.company_id]
  }),
  farm: one(farmMaster, {
    fields: [warehouseMaster.farm_id],
    references: [farmMaster.farm_id]
  }),
  locations: many(locationMaster)
}));

export const shedMasterRelations = relations(shedMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [shedMaster.company_id],
    references: [companyMaster.company_id]
  }),
  farm: one(farmMaster, {
    fields: [shedMaster.farm_id],
    references: [farmMaster.farm_id]
  })
}));

export const supplierMaster = mysqlTable('supplier_master', {
  supplier_id: varchar('supplier_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  supplier_code: varchar('supplier_code', { length: 50 }).notNull(),
  supplier_name: varchar('supplier_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 200 }),
  phone: varchar('phone', { length: 30 }),
  tax_number: varchar('tax_number', { length: 50 }),
  payment_terms: varchar('payment_terms', { length: 50 }), // e.g. COD, NET30
  address_line1: varchar('address_line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const supplierMasterRelations = relations(supplierMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [supplierMaster.company_id],
    references: [companyMaster.company_id]
  })
}));

export const customerMaster = mysqlTable('customer_master', {
  customer_id: varchar('customer_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  customer_code: varchar('customer_code', { length: 50 }).notNull(),
  customer_name: varchar('customer_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 200 }),
  mobile: varchar('mobile', { length: 30 }).notNull(),
  tax_number: varchar('tax_number', { length: 50 }),
  credit_limit: decimal('credit_limit', { precision: 18, scale: 4 }),
  address_line1: varchar('address_line1', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  country: varchar('country', { length: 100 }),
  pincode: varchar('pincode', { length: 20 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const customerMasterRelations = relations(customerMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [customerMaster.company_id],
    references: [companyMaster.company_id]
  })
}));

export const resourceMaster = mysqlTable('resource_master', {
  resource_id: varchar('resource_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  resource_code: varchar('resource_code', { length: 50 }).notNull(),
  resource_name: varchar('resource_name', { length: 150 }).notNull(),
  resource_type: varchar('resource_type', { length: 30 }).notNull(), // LABOR, EQUIPMENT, VEHICLE
  capacity: decimal('capacity', { precision: 18, scale: 4 }),
  unit: varchar('unit', { length: 20 }),
  cost_rate: decimal('cost_rate', { precision: 18, scale: 4 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'res_master_company_id_fk'
  }).onDelete('restrict')
}));

export const resourceMaintenanceLog = mysqlTable('resource_maintenance_log', {
  log_id: varchar('log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  resource_id: varchar('resource_id', { length: 36 }).notNull(),
  maintenance_date: date('maintenance_date', { mode: 'string' }).notNull(),
  maintenance_type: varchar('maintenance_type', { length: 50 }).notNull(), // PREVENTIVE, BREAKDOWN
  description: text('description'),
  cost: decimal('cost', { precision: 18, scale: 4 }),
  performed_by: varchar('performed_by', { length: 100 }),
  status: varchar('status', { length: 20 }).default('COMPLETED').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'res_maint_log_company_id_fk'
  }).onDelete('restrict'),
  resourceFk: foreignKey({
    columns: [table.resource_id],
    foreignColumns: [resourceMaster.resource_id],
    name: 'res_maint_log_res_id_fk'
  }).onDelete('cascade')
}));

export const resourceMasterRelations = relations(resourceMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [resourceMaster.company_id],
    references: [companyMaster.company_id]
  }),
  maintenanceLogs: many(resourceMaintenanceLog)
}));

export const resourceMaintenanceLogRelations = relations(resourceMaintenanceLog, ({ one }) => ({
  resource: one(resourceMaster, {
    fields: [resourceMaintenanceLog.resource_id],
    references: [resourceMaster.resource_id]
  })
}));

export const diseaseMaster = mysqlTable('disease_master', {
  disease_id: varchar('disease_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  disease_code: varchar('disease_code', { length: 50 }).notNull(),
  disease_name: varchar('disease_name', { length: 150 }).notNull(),
  scientific_name: varchar('scientific_name', { length: 150 }),
  symptoms: text('symptoms'),
  treatment_guideline: text('treatment_guideline'),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const diseaseMasterRelations = relations(diseaseMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [diseaseMaster.company_id],
    references: [companyMaster.company_id]
  })
}));

export const medicineMaster = mysqlTable('medicine_master', {
  medicine_id: varchar('medicine_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  composition: varchar('composition', { length: 255 }),
  dosage_guideline: text('dosage_guideline'),
  withdrawal_period_days: int('withdrawal_period_days'),
  route_of_administration: varchar('route_of_administration', { length: 50 }), // e.g. ORAL, INJECTION, WATER
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
});

export const medicineMasterRelations = relations(medicineMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [medicineMaster.company_id],
    references: [companyMaster.company_id]
  }),
  item: one(itemMaster, {
    fields: [medicineMaster.item_id],
    references: [itemMaster.item_id]
  })
}));

export const feedFormulaMaster = mysqlTable('feed_formula_master', {
  formula_id: varchar('formula_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  formula_code: varchar('formula_code', { length: 50 }).notNull(),
  formula_name: varchar('formula_name', { length: 150 }).notNull(),
  target_item_id: varchar('target_item_id', { length: 36 }).notNull(),
  batch_size: decimal('batch_size', { precision: 18, scale: 4 }).notNull(),
  batch_unit: varchar('batch_unit', { length: 20 }).notNull(), // e.g. KG
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'feed_form_company_id_fk'
  }).onDelete('restrict'),
  targetItemFk: foreignKey({
    columns: [table.target_item_id],
    foreignColumns: [itemMaster.item_id],
    name: 'feed_form_target_item_id_fk'
  }).onDelete('restrict')
}));

export const feedFormulaIngredients = mysqlTable('feed_formula_ingredients', {
  ingredient_id: varchar('ingredient_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  formula_id: varchar('formula_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(), // raw ingredient item
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(), // e.g. KG
  inclusion_pct: decimal('inclusion_pct', { precision: 6, scale: 2 }),
  loss_pct: decimal('loss_pct', { precision: 6, scale: 2 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'feed_ingr_company_id_fk'
  }).onDelete('restrict'),
  formulaFk: foreignKey({
    columns: [table.formula_id],
    foreignColumns: [feedFormulaMaster.formula_id],
    name: 'feed_ingr_formula_id_fk'
  }).onDelete('cascade'),
  itemFk: foreignKey({
    columns: [table.item_id],
    foreignColumns: [itemMaster.item_id],
    name: 'feed_ingr_item_id_fk'
  }).onDelete('restrict')
}));

export const feedFormulaMasterRelations = relations(feedFormulaMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [feedFormulaMaster.company_id],
    references: [companyMaster.company_id]
  }),
  targetItem: one(itemMaster, {
    fields: [feedFormulaMaster.target_item_id],
    references: [itemMaster.item_id]
  }),
  ingredients: many(feedFormulaIngredients)
}));

export const feedFormulaIngredientsRelations = relations(feedFormulaIngredients, ({ one }) => ({
  company: one(companyMaster, {
    fields: [feedFormulaIngredients.company_id],
    references: [companyMaster.company_id]
  }),
  formula: one(feedFormulaMaster, {
    fields: [feedFormulaIngredients.formula_id],
    references: [feedFormulaMaster.formula_id]
  }),
  item: one(itemMaster, {
    fields: [feedFormulaIngredients.item_id],
    references: [itemMaster.item_id]
  })
}));

export const glAccountMaster = mysqlTable('gl_account_master', {
  gl_account_id: varchar('gl_account_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  account_code: varchar('account_code', { length: 50 }).notNull(),
  account_name: varchar('account_name', { length: 150 }).notNull(),
  account_type: varchar('account_type', { length: 50 }).notNull(), // ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
  parent_account_id: varchar('parent_account_id', { length: 36 }),
  is_sub_account: boolean('is_sub_account').default(false).notNull(),
  is_reconciliation: boolean('is_reconciliation').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  cost_center_required: boolean('cost_center_required').default(false).notNull(),
  dimension_required: boolean('dimension_required').default(false).notNull(),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'gl_account_company_id_fk'
  }).onDelete('restrict'),
  parentAccountFk: foreignKey({
    columns: [table.parent_account_id],
    foreignColumns: [table.gl_account_id],
    name: 'gl_account_parent_id_fk'
  }).onDelete('restrict')
}));

export const glAccountMasterRelations = relations(glAccountMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [glAccountMaster.company_id],
    references: [companyMaster.company_id]
  }),
  parentAccount: one(glAccountMaster, {
    fields: [glAccountMaster.parent_account_id],
    references: [glAccountMaster.gl_account_id],
    relationName: 'gl_account_hierarchy'
  }),
  subAccounts: many(glAccountMaster, {
    relationName: 'gl_account_hierarchy'
  })
}));

export const glMappingMaster = mysqlTable('gl_mapping_master', {
  mapping_id: varchar('mapping_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  item_category_id: varchar('item_category_id', { length: 36 }),
  transaction_type: varchar('transaction_type', { length: 50 }).notNull(), // PURCHASE, CONSUMPTION, OUTPUT, SALE, ADJUSTMENT, MORTALITY, etc.
  debit_gl_account_id: varchar('debit_gl_account_id', { length: 36 }),
  credit_gl_account_id: varchar('credit_gl_account_id', { length: 36 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'gl_map_company_id_fk'
  }).onDelete('restrict'),
  categoryFk: foreignKey({
    columns: [table.item_category_id],
    foreignColumns: [itemCategoryMaster.category_id],
    name: 'gl_map_category_id_fk'
  }).onDelete('restrict'),
  debitGlFk: foreignKey({
    columns: [table.debit_gl_account_id],
    foreignColumns: [glAccountMaster.gl_account_id],
    name: 'gl_map_debit_gl_id_fk'
  }).onDelete('restrict'),
  creditGlFk: foreignKey({
    columns: [table.credit_gl_account_id],
    foreignColumns: [glAccountMaster.gl_account_id],
    name: 'gl_map_credit_gl_id_fk'
  }).onDelete('restrict')
}));

export const glMappingMasterRelations = relations(glMappingMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [glMappingMaster.company_id],
    references: [companyMaster.company_id]
  }),
  itemCategory: one(itemCategoryMaster, {
    fields: [glMappingMaster.item_category_id],
    references: [itemCategoryMaster.category_id]
  }),
  debitGlAccount: one(glAccountMaster, {
    fields: [glMappingMaster.debit_gl_account_id],
    references: [glAccountMaster.gl_account_id],
    relationName: 'debit_gl_relation'
  }),
  creditGlAccount: one(glAccountMaster, {
    fields: [glMappingMaster.credit_gl_account_id],
    references: [glAccountMaster.gl_account_id],
    relationName: 'credit_gl_relation'
  })
}));

export const costCenterMaster = mysqlTable('cost_center_master', {
  cost_center_id: varchar('cost_center_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  cost_center_code: varchar('cost_center_code', { length: 50 }).notNull(),
  cost_center_name: varchar('cost_center_name', { length: 150 }).notNull(),
  cost_center_type: varchar('cost_center_type', { length: 50 }).notNull(), // DEPARTMENT, FARM, WAREHOUSE, PROJECT, OTHER
  parent_cost_center_id: varchar('parent_cost_center_id', { length: 36 }),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
  extension_config: json('extension_config')
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.company_id],
    foreignColumns: [companyMaster.company_id],
    name: 'cost_center_company_id_fk'
  }).onDelete('restrict'),
  parentCostCenterFk: foreignKey({
    columns: [table.parent_cost_center_id],
    foreignColumns: [table.cost_center_id],
    name: 'cost_center_parent_id_fk'
  }).onDelete('restrict')
}));

export const costCenterMasterRelations = relations(costCenterMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [costCenterMaster.company_id],
    references: [companyMaster.company_id]
  }),
  parentCostCenter: one(costCenterMaster, {
    fields: [costCenterMaster.parent_cost_center_id],
    references: [costCenterMaster.cost_center_id],
    relationName: 'cost_center_hierarchy'
  }),
  subCostCenters: many(costCenterMaster, {
    relationName: 'cost_center_hierarchy'
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

// ==========================================
// 9. INVENTORY ENGINE SCHEMAS
// ==========================================

export const lotMaster = mysqlTable('lot_master', {
  lot_id: varchar('lot_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  lot_code: varchar('lot_code', { length: 100 }).notNull(),
  mfg_date: date('mfg_date', { mode: 'string' }),
  expiry_date: date('expiry_date', { mode: 'string' }),
  qty_initial: decimal('qty_initial', { precision: 18, scale: 4 }).notNull(),
  qty_on_hand: decimal('qty_on_hand', { precision: 18, scale: 4 }).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_item_lot').on(table.tenant_id, table.item_id, table.lot_code),
]);

export const serialMaster = mysqlTable('serial_master', {
  serial_id: varchar('serial_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  lot_id: varchar('lot_id', { length: 36 }).references(() => lotMaster.lot_id, { onDelete: 'set null' }),
  serial_no: varchar('serial_no', { length: 100 }).notNull(),
  status: varchar('status', { length: 30 }).default('IN_STOCK').notNull(), // IN_STOCK, CONSUMED, RESERVED
  warranty_expiry_date: date('warranty_expiry_date', { mode: 'string' }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_item_serial').on(table.tenant_id, table.item_id, table.serial_no),
]);

export const inventoryLedger = mysqlTable('inventory_ledger', {
  ledger_id: varchar('ledger_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  transaction_type: varchar('transaction_type', { length: 50 }).notNull(), // GOODS_RECEIPT, GOODS_ISSUE, TRANSFER, ADJUSTMENT, JOURNAL_CORRECTION
  transaction_date: date('transaction_date', { mode: 'string' }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(), // positive = in, negative = out
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  total_value: decimal('total_value', { precision: 18, scale: 4 }).notNull(),
  ref_doc_type: varchar('ref_doc_type', { length: 50 }).notNull(), // GoodsReceipt, GoodsIssue, TransferOrder, InventoryAdjustment, InventoryJournal
  ref_doc_id: varchar('ref_doc_id', { length: 36 }).notNull(),
  ref_doc_line_id: varchar('ref_doc_line_id', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_inv_ledg_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_inv_ledg_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_inv_ledg_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_inv_ledg_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_inv_ledg_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_inv_ledg_ser' }).onDelete('restrict'),
]);

export const inventoryBalance = mysqlTable('inventory_balance', {
  balance_id: varchar('balance_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  qty_on_hand: decimal('qty_on_hand', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  qty_reserved: decimal('qty_reserved', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  qty_available: decimal('qty_available', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('uq_tenant_inv_balance_comp_wh_loc_item_lot_serial').on(
    table.tenant_id,
    table.company_id,
    table.warehouse_id,
    table.location_id,
    table.item_id,
    table.lot_id,
    table.serial_id
  ),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_inv_bal_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_inv_bal_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_inv_bal_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_inv_bal_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_inv_bal_lot' }).onDelete('cascade'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_inv_bal_ser' }).onDelete('cascade'),
]);

export const fifoLayer = mysqlTable('fifo_layer', {
  layer_id: varchar('layer_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  ledger_id: varchar('ledger_id', { length: 36 }).notNull(),
  qty_initial: decimal('qty_initial', { precision: 18, scale: 4 }).notNull(),
  qty_remaining: decimal('qty_remaining', { precision: 18, scale: 4 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  is_exhausted: boolean('is_exhausted').default(false).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_fifo_lay_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_fifo_lay_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_fifo_lay_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_fifo_lay_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_fifo_lay_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.ledger_id], foreignColumns: [inventoryLedger.ledger_id], name: 'fk_fifo_lay_ledg' }).onDelete('restrict'),
]);

export const fifoConsumptionLog = mysqlTable('fifo_consumption_log', {
  consumption_id: varchar('consumption_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  layer_id: varchar('layer_id', { length: 36 }).notNull(),
  ledger_id: varchar('ledger_id', { length: 36 }).notNull(), // issue ledger entry
  qty_consumed: decimal('qty_consumed', { precision: 18, scale: 4 }).notNull(),
  cost_consumed: decimal('cost_consumed', { precision: 18, scale: 4 }).notNull(),
  consumed_at: timestamp('consumed_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.layer_id], foreignColumns: [fifoLayer.layer_id], name: 'fk_fcl_layer' }).onDelete('restrict'),
  foreignKey({ columns: [table.ledger_id], foreignColumns: [inventoryLedger.ledger_id], name: 'fk_fcl_ledger' }).onDelete('restrict'),
]);

export const stockReservation = mysqlTable('stock_reservation', {
  reservation_id: varchar('reservation_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  qty_reserved: decimal('qty_reserved', { precision: 18, scale: 4 }).notNull(),
  reservation_type: varchar('reservation_type', { length: 30 }).notNull(), // SALES, PRODUCTION, MANUAL
  ref_doc_type: varchar('ref_doc_type', { length: 50 }),
  ref_doc_id: varchar('ref_doc_id', { length: 36 }),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, CONSUMED, RELEASED, EXPIRED
  expires_at: timestamp('expires_at', { mode: 'string' }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_st_res_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_st_res_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_st_res_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_st_res_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_st_res_lot' }).onDelete('set null'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_st_res_ser' }).onDelete('set null'),
]);

export const goodsReceipt = mysqlTable('goods_receipt', {
  receipt_id: varchar('receipt_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  receipt_no: varchar('receipt_no', { length: 50 }).notNull(),
  receipt_type: varchar('receipt_type', { length: 30 }).notNull(), // MANUAL, PURCHASE, PRODUCTION, ADJUSTMENT, TRANSFER
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_receipt_no').on(table.tenant_id, table.receipt_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_gr_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_gr_wh' }).onDelete('restrict'),
]);

export const goodsReceiptLine = mysqlTable('goods_receipt_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  receipt_id: varchar('receipt_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  uom_code: varchar('uom_code', { length: 20 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  total_value: decimal('total_value', { precision: 18, scale: 4 }).notNull(),
  lot_no: varchar('lot_no', { length: 100 }),
  serial_no: varchar('serial_no', { length: 100 }),
  mfg_date: date('mfg_date', { mode: 'string' }),
  expiry_date: date('expiry_date', { mode: 'string' }),
}, (table) => [
  foreignKey({ columns: [table.receipt_id], foreignColumns: [goodsReceipt.receipt_id], name: 'fk_grl_receipt' }).onDelete('cascade'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_grl_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_grl_loc' }).onDelete('restrict'),
]);

export const goodsIssue = mysqlTable('goods_issue', {
  issue_id: varchar('issue_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  issue_no: varchar('issue_no', { length: 50 }).notNull(),
  issue_type: varchar('issue_type', { length: 30 }).notNull(), // CONSUMPTION, SALES, TRANSFER, ADJUSTMENT
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_issue_no').on(table.tenant_id, table.issue_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_gi_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_gi_wh' }).onDelete('restrict'),
]);

export const goodsIssueLine = mysqlTable('goods_issue_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  issue_id: varchar('issue_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  uom_code: varchar('uom_code', { length: 20 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
}, (table) => [
  foreignKey({ columns: [table.issue_id], foreignColumns: [goodsIssue.issue_id], name: 'fk_gil_issue' }).onDelete('cascade'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_gil_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_gil_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_gil_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_gil_ser' }).onDelete('restrict'),
]);

export const transferOrder = mysqlTable('transfer_order', {
  transfer_id: varchar('transfer_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  transfer_no: varchar('transfer_no', { length: 50 }).notNull(),
  from_warehouse_id: varchar('from_warehouse_id', { length: 36 }).notNull(),
  to_warehouse_id: varchar('to_warehouse_id', { length: 36 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_transfer_no').on(table.tenant_id, table.transfer_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_to_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.from_warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_to_from_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.to_warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_to_to_wh' }).onDelete('restrict'),
]);

export const transferOrderLine = mysqlTable('transfer_order_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  transfer_id: varchar('transfer_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  from_location_id: varchar('from_location_id', { length: 36 }).notNull(),
  to_location_id: varchar('to_location_id', { length: 36 }).notNull(),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  uom_code: varchar('uom_code', { length: 20 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
}, (table) => [
  foreignKey({ columns: [table.transfer_id], foreignColumns: [transferOrder.transfer_id], name: 'fk_tol_transfer' }).onDelete('cascade'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_tol_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.from_location_id], foreignColumns: [locationMaster.location_id], name: 'fk_tol_from_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.to_location_id], foreignColumns: [locationMaster.location_id], name: 'fk_tol_to_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_tol_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_tol_ser' }).onDelete('restrict'),
]);

export const inventoryAdjustment = mysqlTable('inventory_adjustment', {
  adjustment_id: varchar('adjustment_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  adjustment_no: varchar('adjustment_no', { length: 50 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  adjustment_type: varchar('adjustment_type', { length: 20 }).notNull(), // POSITIVE, NEGATIVE
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, POSTED
  reason_code: varchar('reason_code', { length: 50 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  uom_code: varchar('uom_code', { length: 20 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  lot_no: varchar('lot_no', { length: 100 }),
  serial_no: varchar('serial_no', { length: 100 }),
  mfg_date: date('mfg_date', { mode: 'string' }),
  expiry_date: date('expiry_date', { mode: 'string' }),
  notes: text('notes'),
  approved_by: varchar('approved_by', { length: 36 }),
  approved_at: timestamp('approved_at', { mode: 'string' }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_adjustment_no').on(table.tenant_id, table.adjustment_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_inv_adj_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_inv_adj_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_inv_adj_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_inv_adj_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_inv_adj_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_inv_adj_ser' }).onDelete('restrict'),
]);

export const inventoryJournal = mysqlTable('inventory_journal', {
  journal_id: varchar('journal_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  journal_no: varchar('journal_no', { length: 50 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_journal_no').on(table.tenant_id, table.journal_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_ij_comp' }).onDelete('restrict'),
]);

export const inventoryJournalLine = mysqlTable('inventory_journal_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  journal_id: varchar('journal_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  reason_code: varchar('reason_code', { length: 50 }).notNull(),
}, (table) => [
  foreignKey({ columns: [table.journal_id], foreignColumns: [inventoryJournal.journal_id], name: 'fk_ijl_journal' }).onDelete('cascade'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_ijl_wh' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_ijl_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_ijl_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_ijl_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_ijl_ser' }).onDelete('restrict'),
]);

export const inventoryCount = mysqlTable('inventory_count', {
  count_id: varchar('count_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  count_no: varchar('count_no', { length: 50 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  count_date: date('count_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, COUNTED, ADJUSTED, CANCELLED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_count_no').on(table.tenant_id, table.count_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_ic_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.warehouse_id], foreignColumns: [warehouseMaster.warehouse_id], name: 'fk_ic_wh' }).onDelete('restrict'),
]);

export const inventoryCountLine = mysqlTable('inventory_count_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  count_id: varchar('count_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  qty_expected: decimal('qty_expected', { precision: 18, scale: 4 }).notNull(),
  qty_counted: decimal('qty_counted', { precision: 18, scale: 4 }).notNull(),
  variance: decimal('variance', { precision: 18, scale: 4 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  reason_code: varchar('reason_code', { length: 50 }),
}, (table) => [
  foreignKey({ columns: [table.count_id], foreignColumns: [inventoryCount.count_id], name: 'fk_icl_count' }).onDelete('cascade'),
  foreignKey({ columns: [table.item_id], foreignColumns: [itemMaster.item_id], name: 'fk_icl_item' }).onDelete('restrict'),
  foreignKey({ columns: [table.location_id], foreignColumns: [locationMaster.location_id], name: 'fk_icl_loc' }).onDelete('restrict'),
  foreignKey({ columns: [table.lot_id], foreignColumns: [lotMaster.lot_id], name: 'fk_icl_lot' }).onDelete('restrict'),
  foreignKey({ columns: [table.serial_id], foreignColumns: [serialMaster.serial_id], name: 'fk_icl_ser' }).onDelete('restrict'),
]);

// ==========================================
// RELATIONSHIPS FOR NEW INVENTORY SCHEMAS
// ==========================================

export const lotMasterRelations = relations(lotMaster, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [lotMaster.company_id],
    references: [companyMaster.company_id]
  }),
  item: one(itemMaster, {
    fields: [lotMaster.item_id],
    references: [itemMaster.item_id]
  }),
  serials: many(serialMaster)
}));

export const serialMasterRelations = relations(serialMaster, ({ one }) => ({
  company: one(companyMaster, {
    fields: [serialMaster.company_id],
    references: [companyMaster.company_id]
  }),
  item: one(itemMaster, {
    fields: [serialMaster.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [serialMaster.lot_id],
    references: [lotMaster.lot_id]
  })
}));

export const inventoryLedgerRelations = relations(inventoryLedger, ({ one }) => ({
  company: one(companyMaster, {
    fields: [inventoryLedger.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [inventoryLedger.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  location: one(locationMaster, {
    fields: [inventoryLedger.location_id],
    references: [locationMaster.location_id]
  }),
  item: one(itemMaster, {
    fields: [inventoryLedger.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [inventoryLedger.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [inventoryLedger.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const inventoryBalanceRelations = relations(inventoryBalance, ({ one }) => ({
  company: one(companyMaster, {
    fields: [inventoryBalance.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [inventoryBalance.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  location: one(locationMaster, {
    fields: [inventoryBalance.location_id],
    references: [locationMaster.location_id]
  }),
  item: one(itemMaster, {
    fields: [inventoryBalance.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [inventoryBalance.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [inventoryBalance.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const fifoLayerRelations = relations(fifoLayer, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [fifoLayer.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [fifoLayer.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  location: one(locationMaster, {
    fields: [fifoLayer.location_id],
    references: [locationMaster.location_id]
  }),
  item: one(itemMaster, {
    fields: [fifoLayer.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [fifoLayer.lot_id],
    references: [lotMaster.lot_id]
  }),
  ledger: one(inventoryLedger, {
    fields: [fifoLayer.ledger_id],
    references: [inventoryLedger.ledger_id]
  }),
  consumptions: many(fifoConsumptionLog)
}));

export const fifoConsumptionLogRelations = relations(fifoConsumptionLog, ({ one }) => ({
  layer: one(fifoLayer, {
    fields: [fifoConsumptionLog.layer_id],
    references: [fifoLayer.layer_id]
  }),
  ledger: one(inventoryLedger, {
    fields: [fifoConsumptionLog.ledger_id],
    references: [inventoryLedger.ledger_id]
  })
}));

export const stockReservationRelations = relations(stockReservation, ({ one }) => ({
  company: one(companyMaster, {
    fields: [stockReservation.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [stockReservation.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  location: one(locationMaster, {
    fields: [stockReservation.location_id],
    references: [locationMaster.location_id]
  }),
  item: one(itemMaster, {
    fields: [stockReservation.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [stockReservation.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [stockReservation.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const goodsReceiptRelations = relations(goodsReceipt, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [goodsReceipt.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [goodsReceipt.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  lines: many(goodsReceiptLine)
}));

export const goodsReceiptLineRelations = relations(goodsReceiptLine, ({ one }) => ({
  receipt: one(goodsReceipt, {
    fields: [goodsReceiptLine.receipt_id],
    references: [goodsReceipt.receipt_id]
  }),
  item: one(itemMaster, {
    fields: [goodsReceiptLine.item_id],
    references: [itemMaster.item_id]
  }),
  location: one(locationMaster, {
    fields: [goodsReceiptLine.location_id],
    references: [locationMaster.location_id]
  })
}));

export const goodsIssueRelations = relations(goodsIssue, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [goodsIssue.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [goodsIssue.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  lines: many(goodsIssueLine)
}));

export const goodsIssueLineRelations = relations(goodsIssueLine, ({ one }) => ({
  issue: one(goodsIssue, {
    fields: [goodsIssueLine.issue_id],
    references: [goodsIssue.issue_id]
  }),
  item: one(itemMaster, {
    fields: [goodsIssueLine.item_id],
    references: [itemMaster.item_id]
  }),
  location: one(locationMaster, {
    fields: [goodsIssueLine.location_id],
    references: [locationMaster.location_id]
  }),
  lot: one(lotMaster, {
    fields: [goodsIssueLine.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [goodsIssueLine.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const transferOrderRelations = relations(transferOrder, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [transferOrder.company_id],
    references: [companyMaster.company_id]
  }),
  fromWarehouse: one(warehouseMaster, {
    fields: [transferOrder.from_warehouse_id],
    references: [warehouseMaster.warehouse_id],
    relationName: 'fromWarehouseRelation'
  }),
  toWarehouse: one(warehouseMaster, {
    fields: [transferOrder.to_warehouse_id],
    references: [warehouseMaster.warehouse_id],
    relationName: 'toWarehouseRelation'
  }),
  lines: many(transferOrderLine)
}));

export const transferOrderLineRelations = relations(transferOrderLine, ({ one }) => ({
  transfer: one(transferOrder, {
    fields: [transferOrderLine.transfer_id],
    references: [transferOrder.transfer_id]
  }),
  item: one(itemMaster, {
    fields: [transferOrderLine.item_id],
    references: [itemMaster.item_id]
  }),
  fromLocation: one(locationMaster, {
    fields: [transferOrderLine.from_location_id],
    references: [locationMaster.location_id],
    relationName: 'fromLocationRelation'
  }),
  toLocation: one(locationMaster, {
    fields: [transferOrderLine.to_location_id],
    references: [locationMaster.location_id],
    relationName: 'toLocationRelation'
  }),
  lot: one(lotMaster, {
    fields: [transferOrderLine.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [transferOrderLine.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const inventoryAdjustmentRelations = relations(inventoryAdjustment, ({ one }) => ({
  company: one(companyMaster, {
    fields: [inventoryAdjustment.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [inventoryAdjustment.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  location: one(locationMaster, {
    fields: [inventoryAdjustment.location_id],
    references: [locationMaster.location_id]
  }),
  item: one(itemMaster, {
    fields: [inventoryAdjustment.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [inventoryAdjustment.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [inventoryAdjustment.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const inventoryJournalRelations = relations(inventoryJournal, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [inventoryJournal.company_id],
    references: [companyMaster.company_id]
  }),
  lines: many(inventoryJournalLine)
}));

export const inventoryJournalLineRelations = relations(inventoryJournalLine, ({ one }) => ({
  journal: one(inventoryJournal, {
    fields: [inventoryJournalLine.journal_id],
    references: [inventoryJournal.journal_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [inventoryJournalLine.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  location: one(locationMaster, {
    fields: [inventoryJournalLine.location_id],
    references: [locationMaster.location_id]
  }),
  item: one(itemMaster, {
    fields: [inventoryJournalLine.item_id],
    references: [itemMaster.item_id]
  }),
  lot: one(lotMaster, {
    fields: [inventoryJournalLine.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [inventoryJournalLine.serial_id],
    references: [serialMaster.serial_id]
  })
}));

export const inventoryCountRelations = relations(inventoryCount, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [inventoryCount.company_id],
    references: [companyMaster.company_id]
  }),
  warehouse: one(warehouseMaster, {
    fields: [inventoryCount.warehouse_id],
    references: [warehouseMaster.warehouse_id]
  }),
  lines: many(inventoryCountLine)
}));

export const inventoryCountLineRelations = relations(inventoryCountLine, ({ one }) => ({
  count: one(inventoryCount, {
    fields: [inventoryCountLine.count_id],
    references: [inventoryCount.count_id]
  }),
  item: one(itemMaster, {
    fields: [inventoryCountLine.item_id],
    references: [itemMaster.item_id]
  }),
  location: one(locationMaster, {
    fields: [inventoryCountLine.location_id],
    references: [locationMaster.location_id]
  }),
  lot: one(lotMaster, {
    fields: [inventoryCountLine.lot_id],
    references: [lotMaster.lot_id]
  }),
  serial: one(serialMaster, {
    fields: [inventoryCountLine.serial_id],
    references: [serialMaster.serial_id]
  })
}));

// ==========================================
// 10. FINANCE & ACCOUNTING SCHEMAS
// ==========================================

export const fiscalYear = mysqlTable('fiscal_year', {
  fiscal_year_id: varchar('fiscal_year_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  year_code: varchar('year_code', { length: 20 }).notNull(), // e.g. FY2026
  start_date: date('start_date', { mode: 'string' }).notNull(),
  end_date: date('end_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('OPEN').notNull(), // OPEN, CLOSED
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_company_fy').on(table.tenant_id, table.company_id, table.year_code),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_fy_comp' }).onDelete('restrict'),
]);

export const accountingPeriod = mysqlTable('accounting_period', {
  period_id: varchar('period_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  fiscal_year_id: varchar('fiscal_year_id', { length: 36 }).notNull(),
  period_name: varchar('period_name', { length: 50 }).notNull(), // e.g. July 2026
  period_no: int('period_no').notNull(), // 1 to 12
  start_date: date('start_date', { mode: 'string' }).notNull(),
  end_date: date('end_date', { mode: 'string' }).notNull(),
  is_locked: boolean('is_locked').default(false).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_comp_period').on(table.tenant_id, table.company_id, table.fiscal_year_id, table.period_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_ap_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.fiscal_year_id], foreignColumns: [fiscalYear.fiscal_year_id], name: 'fk_ap_fy' }).onDelete('cascade'),
]);

export const financialDimension = mysqlTable('financial_dimension', {
  dimension_id: varchar('dimension_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  dimension_code: varchar('dimension_code', { length: 50 }).notNull(), // e.g. FARM, PROJECT, DEPT
  dimension_name: varchar('dimension_name', { length: 100 }).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_comp_dim').on(table.tenant_id, table.company_id, table.dimension_code),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_fd_comp' }).onDelete('restrict'),
]);

export const financialDimensionValue = mysqlTable('financial_dimension_value', {
  value_id: varchar('value_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  dimension_id: varchar('dimension_id', { length: 36 }).notNull(),
  value_code: varchar('value_code', { length: 50 }).notNull(), // e.g. Farm01, ProjB
  value_name: varchar('value_name', { length: 100 }).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_comp_dim_val').on(table.tenant_id, table.company_id, table.dimension_id, table.value_code),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_fdv_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.dimension_id], foreignColumns: [financialDimension.dimension_id], name: 'fk_fdv_dim' }).onDelete('cascade'),
]);

export const financialJournal = mysqlTable('financial_journal', {
  journal_id: varchar('journal_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  journal_no: varchar('journal_no', { length: 50 }).notNull(),
  journal_type: varchar('journal_type', { length: 30 }).notNull(), // GENERAL, PURCHASE, SALES, INVENTORY, PAYMENT, RECEIPT, ADJUSTMENT
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  uniqueIndex('uq_tenant_fin_journal_no').on(table.tenant_id, table.journal_no),
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_fj_comp' }).onDelete('restrict'),
]);

export const financialJournalLine = mysqlTable('financial_journal_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  journal_id: varchar('journal_id', { length: 36 }).notNull(),
  gl_account_id: varchar('gl_account_id', { length: 36 }).notNull(),
  debit: decimal('debit', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  credit: decimal('credit', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  description: varchar('description', { length: 255 }),
  cost_center_id: varchar('cost_center_id', { length: 36 }),
  dimension_values: json('dimension_values'), // e.g. { "FARM": "Farm01", "PROJECT": "ProjectX" }
  ref_doc_type: varchar('ref_doc_type', { length: 50 }),
  ref_doc_id: varchar('ref_doc_id', { length: 36 }),
}, (table) => [
  foreignKey({ columns: [table.journal_id], foreignColumns: [financialJournal.journal_id], name: 'fk_fjl_jour' }).onDelete('cascade'),
  foreignKey({ columns: [table.gl_account_id], foreignColumns: [glAccountMaster.gl_account_id], name: 'fk_fjl_gl' }).onDelete('restrict'),
  foreignKey({ columns: [table.cost_center_id], foreignColumns: [costCenterMaster.cost_center_id], name: 'fk_fjl_cc' }).onDelete('restrict'),
]);

export const generalLedgerEntry = mysqlTable('general_ledger_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  gl_account_id: varchar('gl_account_id', { length: 36 }).notNull(),
  debit: decimal('debit', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  credit: decimal('credit', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  running_balance: decimal('running_balance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  fiscal_year_id: varchar('fiscal_year_id', { length: 36 }).notNull(),
  period_id: varchar('period_id', { length: 36 }).notNull(),
  cost_center_id: varchar('cost_center_id', { length: 36 }),
  dimension_values: json('dimension_values'),
  ref_doc_type: varchar('ref_doc_type', { length: 50 }).notNull(), // e.g. FinancialJournal, GoodsReceipt, etc
  ref_doc_id: varchar('ref_doc_id', { length: 36 }).notNull(),
  ref_doc_line_id: varchar('ref_doc_line_id', { length: 36 }),
  notes: varchar('notes', { length: 255 }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_gle_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.gl_account_id], foreignColumns: [glAccountMaster.gl_account_id], name: 'fk_gle_gl' }).onDelete('restrict'),
  foreignKey({ columns: [table.fiscal_year_id], foreignColumns: [fiscalYear.fiscal_year_id], name: 'fk_gle_fy' }).onDelete('restrict'),
  foreignKey({ columns: [table.period_id], foreignColumns: [accountingPeriod.period_id], name: 'fk_gle_ap' }).onDelete('restrict'),
  foreignKey({ columns: [table.cost_center_id], foreignColumns: [costCenterMaster.cost_center_id], name: 'fk_gle_cc' }).onDelete('restrict'),
]);

export const customerLedgerEntry = mysqlTable('customer_ledger_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  customer_id: varchar('customer_id', { length: 36 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  document_type: varchar('document_type', { length: 30 }).notNull(), // INVOICE, PAYMENT, CREDIT_NOTE
  document_no: varchar('document_no', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 18, scale: 4 }).notNull(), // positive for invoice (debit), negative for payment (credit)
  remaining_amount: decimal('remaining_amount', { precision: 18, scale: 4 }).notNull(),
  due_date: date('due_date', { mode: 'string' }),
  gl_entry_id: varchar('gl_entry_id', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_cle_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.customer_id], foreignColumns: [customerMaster.customer_id], name: 'fk_cle_cust' }).onDelete('restrict'),
  foreignKey({ columns: [table.gl_entry_id], foreignColumns: [generalLedgerEntry.entry_id], name: 'fk_cle_gle' }).onDelete('set null'),
]);

export const supplierLedgerEntry = mysqlTable('supplier_ledger_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  supplier_id: varchar('supplier_id', { length: 36 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  document_type: varchar('document_type', { length: 30 }).notNull(), // INVOICE, PAYMENT, DEBIT_NOTE
  document_no: varchar('document_no', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 18, scale: 4 }).notNull(), // negative for invoice (credit), positive for payment (debit)
  remaining_amount: decimal('remaining_amount', { precision: 18, scale: 4 }).notNull(),
  due_date: date('due_date', { mode: 'string' }),
  gl_entry_id: varchar('gl_entry_id', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.company_id], foreignColumns: [companyMaster.company_id], name: 'fk_sle_comp' }).onDelete('restrict'),
  foreignKey({ columns: [table.supplier_id], foreignColumns: [supplierMaster.supplier_id], name: 'fk_sle_supp' }).onDelete('restrict'),
  foreignKey({ columns: [table.gl_entry_id], foreignColumns: [generalLedgerEntry.entry_id], name: 'fk_sle_gle' }).onDelete('set null'),
]);

// RELATIONS DEFINITIONS

export const fiscalYearRelations = relations(fiscalYear, ({ one, many }) => ({
  company: one(companyMaster, {
    fields: [fiscalYear.company_id],
    references: [companyMaster.company_id]
  }),
  periods: many(accountingPeriod)
}));

export const accountingPeriodRelations = relations(accountingPeriod, ({ one }) => ({
  fiscalYear: one(fiscalYear, {
    fields: [accountingPeriod.fiscal_year_id],
    references: [fiscalYear.fiscal_year_id]
  })
}));

export const financialDimensionRelations = relations(financialDimension, ({ many }) => ({
  values: many(financialDimensionValue)
}));

export const financialDimensionValueRelations = relations(financialDimensionValue, ({ one }) => ({
  dimension: one(financialDimension, {
    fields: [financialDimensionValue.dimension_id],
    references: [financialDimension.dimension_id]
  })
}));

export const financialJournalRelations = relations(financialJournal, ({ many }) => ({
  lines: many(financialJournalLine)
}));

export const financialJournalLineRelations = relations(financialJournalLine, ({ one }) => ({
  journal: one(financialJournal, {
    fields: [financialJournalLine.journal_id],
    references: [financialJournal.journal_id]
  }),
  account: one(glAccountMaster, {
    fields: [financialJournalLine.gl_account_id],
    references: [glAccountMaster.gl_account_id]
  }),
  costCenter: one(costCenterMaster, {
    fields: [financialJournalLine.cost_center_id],
    references: [costCenterMaster.cost_center_id]
  })
}));

export const generalLedgerEntryRelations = relations(generalLedgerEntry, ({ one }) => ({
  account: one(glAccountMaster, {
    fields: [generalLedgerEntry.gl_account_id],
    references: [glAccountMaster.gl_account_id]
  }),
  costCenter: one(costCenterMaster, {
    fields: [generalLedgerEntry.cost_center_id],
    references: [costCenterMaster.cost_center_id]
  }),
  fiscalYear: one(fiscalYear, {
    fields: [generalLedgerEntry.fiscal_year_id],
    references: [fiscalYear.fiscal_year_id]
  }),
  period: one(accountingPeriod, {
    fields: [generalLedgerEntry.period_id],
    references: [accountingPeriod.period_id]
  })
}));

export const customerLedgerEntryRelations = relations(customerLedgerEntry, ({ one }) => ({
  customer: one(customerMaster, {
    fields: [customerLedgerEntry.customer_id],
    references: [customerMaster.customer_id]
  }),
  glEntry: one(generalLedgerEntry, {
    fields: [customerLedgerEntry.gl_entry_id],
    references: [generalLedgerEntry.entry_id]
  })
}));

export const supplierLedgerEntryRelations = relations(supplierLedgerEntry, ({ one }) => ({
  supplier: one(supplierMaster, {
    fields: [supplierLedgerEntry.supplier_id],
    references: [supplierMaster.supplier_id]
  }),
  glEntry: one(generalLedgerEntry, {
    fields: [supplierLedgerEntry.gl_entry_id],
    references: [generalLedgerEntry.entry_id]
  })
}));

// ==========================================
// 12. PRODUCTION ENGINE (PHASE 5)
// ==========================================

export const productionOrder = mysqlTable('production_order', {
  order_id: varchar('order_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  order_no: varchar('order_no', { length: 50 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull().references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  location_id: varchar('location_id', { length: 36 }).notNull().references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  planned_qty: decimal('planned_qty', { precision: 18, scale: 4 }).notNull(),
  actual_qty: decimal('actual_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  uom_id: varchar('uom_id', { length: 36 }).notNull().references(() => uomMaster.uom_id, { onDelete: 'restrict' }),
  start_date: date('start_date', { mode: 'string' }).notNull(),
  end_date: date('end_date', { mode: 'string' }),
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT, PLANNED, RELEASED, IN_PROGRESS, FINISHED, CLOSED, CANCELLED
  cost_center_id: varchar('cost_center_id', { length: 36 }),
  dimension_values: json('dimension_values'),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
});

export const productionBatch = mysqlTable('production_batch', {
  batch_id: varchar('batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  order_id: varchar('order_id', { length: 36 }).references(() => productionOrder.order_id, { onDelete: 'cascade' }),
  batch_no: varchar('batch_no', { length: 50 }).notNull(),
  parent_batch_id: varchar('parent_batch_id', { length: 36 }),
  formula_id: varchar('formula_id', { length: 36 }),
  farm_id: varchar('farm_id', { length: 36 }),
  shed_id: varchar('shed_id', { length: 36 }),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  planned_qty: decimal('planned_qty', { precision: 18, scale: 4 }).notNull(),
  actual_qty: decimal('actual_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  scrap_qty: decimal('scrap_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  status: varchar('status', { length: 30 }).default('DRAFT').notNull(), // DRAFT, PLANNED, RELEASED, MATERIAL_ISSUED, IN_PROGRESS, QUALITY_CHECK, FINISHED, CLOSED
  start_time: timestamp('start_time', { mode: 'string' }),
  end_time: timestamp('end_time', { mode: 'string' }),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
});

export const productionBatchInput = mysqlTable('production_batch_input', {
  input_id: varchar('input_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  uom_id: varchar('uom_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  serial_id: varchar('serial_id', { length: 36 }),
  planned_qty: decimal('planned_qty', { precision: 18, scale: 4 }).notNull(),
  actual_qty: decimal('actual_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  goods_issue_id: varchar('goods_issue_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const productionBatchOutput = mysqlTable('production_batch_output', {
  output_id: varchar('output_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  uom_id: varchar('uom_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  lot_id: varchar('lot_id', { length: 36 }),
  output_type: varchar('output_type', { length: 30 }).default('FINISHED_GOOD').notNull(), // FINISHED_GOOD, BY_PRODUCT, SCRAP, WASTE
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  cost_split_pct: decimal('cost_split_pct', { precision: 5, scale: 2 }).default('100.00').notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  goods_receipt_id: varchar('goods_receipt_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const productionResourceUsage = mysqlTable('production_resource_usage', {
  usage_id: varchar('usage_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  resource_id: varchar('resource_id', { length: 36 }).notNull(),
  usage_type: varchar('usage_type', { length: 30 }).default('LABOR').notNull(), // LABOR, MACHINE, ELECTRICITY, WATER, OVERHEAD
  planned_hours: decimal('planned_hours', { precision: 10, scale: 2 }).default('0.00').notNull(),
  actual_hours: decimal('actual_hours', { precision: 10, scale: 2 }).default('0.00').notNull(),
  hourly_rate: decimal('hourly_rate', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const productionDailyEntry = mysqlTable('production_daily_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  entry_date: date('entry_date', { mode: 'string' }).notNull(),
  produced_qty: decimal('produced_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  consumed_qty: decimal('consumed_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  mortality_qty: decimal('mortality_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  scrap_qty: decimal('scrap_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  downtime_minutes: int('downtime_minutes').default(0).notNull(),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const productionWip = mysqlTable('production_wip', {
  wip_id: varchar('wip_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().unique().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  material_cost: decimal('material_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  labor_cost: decimal('labor_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  machine_cost: decimal('machine_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  overhead_cost: decimal('overhead_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_wip_cost: decimal('total_wip_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  completion_pct: decimal('completion_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

export const productionCost = mysqlTable('production_cost', {
  cost_id: varchar('cost_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().unique().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  total_material_cost: decimal('total_material_cost', { precision: 18, scale: 4 }).notNull(),
  total_resource_cost: decimal('total_resource_cost', { precision: 18, scale: 4 }).notNull(),
  total_overhead_cost: decimal('total_overhead_cost', { precision: 18, scale: 4 }).notNull(),
  total_batch_cost: decimal('total_batch_cost', { precision: 18, scale: 4 }).notNull(),
  actual_yield_qty: decimal('actual_yield_qty', { precision: 18, scale: 4 }).notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const productionVariance = mysqlTable('production_variance', {
  variance_id: varchar('variance_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().unique().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  planned_qty: decimal('planned_qty', { precision: 18, scale: 4 }).notNull(),
  actual_qty: decimal('actual_qty', { precision: 18, scale: 4 }).notNull(),
  qty_variance: decimal('qty_variance', { precision: 18, scale: 4 }).notNull(),
  material_cost_variance: decimal('material_cost_variance', { precision: 18, scale: 4 }).notNull(),
  labor_variance: decimal('labor_variance', { precision: 18, scale: 4 }).notNull(),
  total_variance_cost: decimal('total_variance_cost', { precision: 18, scale: 4 }).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

// ==========================================
// 13. POULTRY INDUSTRY VERTICAL (PHASE 6)
// ==========================================

export const poultryBatch = mysqlTable('poultry_batch', {
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  farm_id: varchar('farm_id', { length: 36 }).notNull().references(() => farmMaster.farm_id, { onDelete: 'restrict' }),
  shed_id: varchar('shed_id', { length: 36 }).notNull().references(() => shedMaster.shed_id, { onDelete: 'restrict' }),
  production_batch_id: varchar('production_batch_id', { length: 36 }).notNull().unique().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  batch_type: varchar('batch_type', { length: 30 }).notNull(), // REARING, LAYER, HATCHERY, BROILER, SLAUGHTER
  breed_id: varchar('breed_id', { length: 36 }),
  species_id: varchar('species_id', { length: 36 }),
  placement_date: date('placement_date', { mode: 'string' }).notNull(),
  initial_bird_count: int('initial_bird_count').notNull(),
  current_bird_count: int('current_bird_count').notNull(),
  total_mortality: int('total_mortality').default(0).notNull(),
  status: varchar('status', { length: 30 }).default('ACTIVE').notNull(), // ACTIVE, TRANSFERRED, COMPLETED, CLOSED
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' })
});

export const poultryDailyEntry = mysqlTable('poultry_daily_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  farm_id: varchar('farm_id', { length: 36 }).notNull(),
  shed_id: varchar('shed_id', { length: 36 }).notNull(),
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).notNull().references(() => poultryBatch.poultry_batch_id, { onDelete: 'cascade' }),
  entry_date: date('entry_date', { mode: 'string' }).notNull(),
  feed_item_id: varchar('feed_item_id', { length: 36 }),
  feed_consumed_kg: decimal('feed_consumed_kg', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  water_consumed_liters: decimal('water_consumed_liters', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  mortality_count: int('mortality_count').default(0).notNull(),
  culling_count: int('culling_count').default(0).notNull(),
  avg_weight_grams: decimal('avg_weight_grams', { precision: 10, scale: 2 }).default('0.00').notNull(),
  temperature_celsius: decimal('temperature_celsius', { precision: 5, scale: 2 }),
  humidity_pct: decimal('humidity_pct', { precision: 5, scale: 2 }),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const poultryEggProduction = mysqlTable('poultry_egg_production', {
  egg_log_id: varchar('egg_log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).notNull().references(() => poultryBatch.poultry_batch_id, { onDelete: 'cascade' }),
  log_date: date('log_date', { mode: 'string' }).notNull(),
  good_eggs: int('good_eggs').default(0).notNull(),
  cracked_eggs: int('cracked_eggs').default(0).notNull(),
  dirty_eggs: int('dirty_eggs').default(0).notNull(),
  double_yolk: int('double_yolk').default(0).notNull(),
  total_eggs: int('total_eggs').notNull(),
  hdp_pct: decimal('hdp_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  goods_receipt_id: varchar('goods_receipt_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const poultryHatchery = mysqlTable('poultry_hatchery', {
  hatch_id: varchar('hatch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).notNull().references(() => poultryBatch.poultry_batch_id, { onDelete: 'cascade' }),
  setting_date: date('setting_date', { mode: 'string' }).notNull(),
  hatch_date: date('hatch_date', { mode: 'string' }),
  eggs_set_qty: int('eggs_set_qty').notNull(),
  candled_fertile_qty: int('candled_fertile_qty').default(0).notNull(),
  chicks_hatched_qty: int('chicks_hatched_qty').default(0).notNull(),
  hatch_loss_qty: int('hatch_loss_qty').default(0).notNull(),
  hatchability_pct: decimal('hatchability_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const poultrySlaughter = mysqlTable('poultry_slaughter', {
  slaughter_id: varchar('slaughter_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).notNull().references(() => poultryBatch.poultry_batch_id, { onDelete: 'cascade' }),
  slaughter_date: date('slaughter_date', { mode: 'string' }).notNull(),
  live_birds_received: int('live_birds_received').notNull(),
  total_live_weight_kg: decimal('total_live_weight_kg', { precision: 18, scale: 4 }).notNull(),
  dressed_weight_kg: decimal('dressed_weight_kg', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  yield_pct: decimal('yield_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  goods_receipt_id: varchar('goods_receipt_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const poultryKpi = mysqlTable('poultry_kpi', {
  kpi_id: varchar('kpi_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).notNull().unique().references(() => poultryBatch.poultry_batch_id, { onDelete: 'cascade' }),
  fcr: decimal('fcr', { precision: 5, scale: 2 }).default('0.00').notNull(),
  livability_pct: decimal('livability_pct', { precision: 5, scale: 2 }).default('100.00').notNull(),
  mortality_rate_pct: decimal('mortality_rate_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  hdp_pct: decimal('hdp_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  hatchability_pct: decimal('hatchability_pct', { precision: 5, scale: 2 }).default('0.00').notNull(),
  cost_per_bird: decimal('cost_per_bird', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  cost_per_egg: decimal('cost_per_egg', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  cost_per_kg: decimal('cost_per_kg', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

// ==========================================
// 14. ENTERPRISE COSTING ENGINE (PHASE 7)
// ==========================================

export const costingProfile = mysqlTable('costing_profile', {
  profile_id: varchar('profile_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  item_id: varchar('item_id', { length: 36 }),
  item_category_id: varchar('item_category_id', { length: 36 }),
  costing_method: varchar('costing_method', { length: 30 }).default('FIFO').notNull(), // STANDARD, FIFO, WEIGHTED_AVG, BIOLOGICAL_ASSET
  standard_cost: decimal('standard_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  effective_from: date('effective_from', { mode: 'string' }).notNull(),
  effective_to: date('effective_to', { mode: 'string' }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

export const costingComponent = mysqlTable('costing_component', {
  component_id: varchar('component_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  component_code: varchar('component_code', { length: 50 }).notNull(),
  component_name: varchar('component_name', { length: 100 }).notNull(),
  cost_type: varchar('cost_type', { length: 30 }).default('DIRECT_MATERIAL').notNull(), // DIRECT_MATERIAL, DIRECT_LABOR, INDIRECT_OVERHEAD, FREIGHT, DUTY
  gl_account_id: varchar('gl_account_id', { length: 36 }).references(() => glAccountMaster.gl_account_id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const itemCostHistory = mysqlTable('item_cost_history', {
  history_id: varchar('history_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  old_cost: decimal('old_cost', { precision: 18, scale: 4 }).notNull(),
  new_cost: decimal('new_cost', { precision: 18, scale: 4 }).notNull(),
  change_reason: varchar('change_reason', { length: 255 }),
  revaluation_journal_id: varchar('revaluation_journal_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const batchCostSummary = mysqlTable('batch_cost_summary', {
  summary_id: varchar('summary_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().unique().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  opening_wip_cost: decimal('opening_wip_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  material_cost: decimal('material_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  labor_cost: decimal('labor_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  machine_cost: decimal('machine_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  overhead_cost: decimal('overhead_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_batch_cost: decimal('total_batch_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  actual_output_qty: decimal('actual_output_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  finalized_at: timestamp('finalized_at', { mode: 'string' })
});

export const biologicalAssetCost = mysqlTable('biological_asset_cost', {
  asset_cost_id: varchar('asset_cost_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  poultry_batch_id: varchar('poultry_batch_id', { length: 36 }).notNull().references(() => poultryBatch.poultry_batch_id, { onDelete: 'cascade' }),
  acquisition_cost: decimal('acquisition_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  feed_cost: decimal('feed_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  medicine_cost: decimal('medicine_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  labor_cost: decimal('labor_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  overhead_cost: decimal('overhead_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  mortality_loss_cost: decimal('mortality_loss_cost', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  net_asset_value: decimal('net_asset_value', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  current_bird_count: int('current_bird_count').default(0).notNull(),
  cost_per_bird: decimal('cost_per_bird', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

export const varianceAnalysis = mysqlTable('variance_analysis', {
  analysis_id: varchar('analysis_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => productionBatch.batch_id, { onDelete: 'cascade' }),
  usage_variance: decimal('usage_variance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  price_variance: decimal('price_variance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  yield_variance: decimal('yield_variance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  labor_variance: decimal('labor_variance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  overhead_variance: decimal('overhead_variance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_variance: decimal('total_variance', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  posted_journal_id: varchar('posted_journal_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

// ==========================================
// 15. RAK DOCS EXTENSION TABLES (QC/QR, SLAUGHTER SPLIT, PARAMETER SCHEDULER)
// ==========================================

export const qcParameterTemplate = mysqlTable('qc_parameter_template', {
  template_id: varchar('template_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  template_code: varchar('template_code', { length: 50 }).notNull(),
  template_name: varchar('template_name', { length: 100 }).notNull(),
  item_category_id: varchar('item_category_id', { length: 36 }),
  min_acceptable_value: decimal('min_acceptable_value', { precision: 18, scale: 4 }),
  max_acceptable_value: decimal('max_acceptable_value', { precision: 18, scale: 4 }),
  uom_id: varchar('uom_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const qcInspectionResult = mysqlTable('qc_inspection_result', {
  inspection_id: varchar('inspection_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  template_id: varchar('template_id', { length: 36 }).references(() => qcParameterTemplate.template_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }),
  lot_number: varchar('lot_number', { length: 100 }),
  measured_value: decimal('measured_value', { precision: 18, scale: 4 }).notNull(),
  inspection_status: varchar('inspection_status', { length: 30 }).default('PASSED').notNull(), // PASSED, FAILED, QUARANTINE
  inspected_by: varchar('inspected_by', { length: 36 }),
  inspected_at: timestamp('inspected_at', { mode: 'string' }).defaultNow().notNull(),
  notes: text('notes')
});

export const quarantineHold = mysqlTable('quarantine_hold', {
  hold_id: varchar('hold_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  inspection_id: varchar('inspection_id', { length: 36 }).references(() => qcInspectionResult.inspection_id, { onDelete: 'cascade' }),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull(),
  location_id: varchar('location_id', { length: 36 }).notNull(),
  hold_qty: decimal('hold_qty', { precision: 18, scale: 4 }).notNull(),
  hold_reason: varchar('hold_reason', { length: 255 }).notNull(),
  status: varchar('status', { length: 30 }).default('ON_HOLD').notNull(), // ON_HOLD, RELEASED, REJECTED
  released_by: varchar('released_by', { length: 36 }),
  released_at: timestamp('released_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const slaughterCostSplitConfig = mysqlTable('slaughter_cost_split_config', {
  config_id: varchar('config_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  is_main_product: boolean('is_main_product').default(false).notNull(),
  cost_split_pct: decimal('cost_split_pct', { precision: 5, scale: 2 }).notNull(), // e.g. 85.00 for main meat, 5.00 for offal
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const systemParameter = mysqlTable('system_parameter', {
  param_id: varchar('param_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }),
  company_id: varchar('company_id', { length: 36 }),
  param_key: varchar('param_key', { length: 100 }).notNull().unique(),
  param_value: text('param_value').notNull(),
  data_type: varchar('data_type', { length: 30 }).default('STRING').notNull(),
  description: text('description'),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull()
});

export const jobScheduleMaster = mysqlTable('job_schedule_master', {
  job_id: varchar('job_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }),
  company_id: varchar('company_id', { length: 36 }),
  job_name: varchar('job_name', { length: 100 }).notNull(),
  cron_expression: varchar('cron_expression', { length: 100 }).notNull(),
  is_enabled: boolean('is_enabled').default(true).notNull(),
  last_run_at: timestamp('last_run_at', { mode: 'string' }),
  next_run_at: timestamp('next_run_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

// ==========================================
// 16. ENTERPRISE QUALITY & TRACEABILITY ENGINE (PHASE 8)
// ==========================================

export const qualityPlan = mysqlTable('quality_plan', {
  plan_id: varchar('plan_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  plan_code: varchar('plan_code', { length: 50 }).notNull(),
  plan_name: varchar('plan_name', { length: 100 }).notNull(),
  inspection_type: varchar('inspection_type', { length: 30 }).default('INCOMING').notNull(), // INCOMING, IN_PROCESS, FINAL, OUTGOING
  item_id: varchar('item_id', { length: 36 }),
  item_category_id: varchar('item_category_id', { length: 36 }),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const qualityParameter = mysqlTable('quality_parameter', {
  parameter_id: varchar('parameter_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  plan_id: varchar('plan_id', { length: 36 }).notNull().references(() => qualityPlan.plan_id, { onDelete: 'cascade' }),
  parameter_name: varchar('parameter_name', { length: 100 }).notNull(),
  target_value: decimal('target_value', { precision: 18, scale: 4 }),
  min_value: decimal('min_value', { precision: 18, scale: 4 }),
  max_value: decimal('max_value', { precision: 18, scale: 4 }),
  uom_id: varchar('uom_id', { length: 36 }),
  is_mandatory: boolean('is_mandatory').default(true).notNull()
});

export const qualityInspection = mysqlTable('quality_inspection', {
  inspection_id: varchar('inspection_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  plan_id: varchar('plan_id', { length: 36 }).references(() => qualityPlan.plan_id, { onDelete: 'restrict' }),
  batch_id: varchar('batch_id', { length: 36 }),
  lot_number: varchar('lot_number', { length: 100 }),
  sample_size: decimal('sample_size', { precision: 18, scale: 4 }).default('1.0000').notNull(),
  overall_result: varchar('overall_result', { length: 30 }).default('PASSED').notNull(), // PASSED, FAILED, QUARANTINE, REWORK
  inspected_by: varchar('inspected_by', { length: 36 }),
  inspected_at: timestamp('inspected_at', { mode: 'string' }).defaultNow().notNull()
});

export const qualityResult = mysqlTable('quality_result', {
  result_id: varchar('result_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  inspection_id: varchar('inspection_id', { length: 36 }).notNull().references(() => qualityInspection.inspection_id, { onDelete: 'cascade' }),
  parameter_id: varchar('parameter_id', { length: 36 }).notNull().references(() => qualityParameter.parameter_id, { onDelete: 'cascade' }),
  measured_value: decimal('measured_value', { precision: 18, scale: 4 }).notNull(),
  pass_fail_status: varchar('pass_fail_status', { length: 10 }).default('PASS').notNull()
});

export const qualityNonConformance = mysqlTable('quality_non_conformance', {
  ncr_id: varchar('ncr_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  inspection_id: varchar('inspection_id', { length: 36 }).references(() => qualityInspection.inspection_id, { onDelete: 'cascade' }),
  severity: varchar('severity', { length: 20 }).default('MAJOR').notNull(), // CRITICAL, MAJOR, MINOR
  description: text('description').notNull(),
  root_cause: text('root_cause'),
  status: varchar('status', { length: 30 }).default('OPEN').notNull(), // OPEN, INVESTIGATING, CLOSED
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const qualityCapa = mysqlTable('quality_capa', {
  capa_id: varchar('capa_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  ncr_id: varchar('ncr_id', { length: 36 }).notNull().references(() => qualityNonConformance.ncr_id, { onDelete: 'cascade' }),
  corrective_action: text('corrective_action').notNull(),
  preventive_action: text('preventive_action').notNull(),
  assigned_to: varchar('assigned_to', { length: 36 }),
  status: varchar('status', { length: 30 }).default('IN_PROGRESS').notNull(), // DRAFT, IN_PROGRESS, VERIFIED, CLOSED
  closed_at: timestamp('closed_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const qrBarcodeMaster = mysqlTable('qr_barcode_master', {
  qr_id: varchar('qr_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  qr_code_hash: varchar('qr_code_hash', { length: 100 }).notNull().unique(),
  barcode_type: varchar('barcode_type', { length: 30 }).default('QR_CODE').notNull(), // GS1_128, QR_CODE, EAN_13
  entity_type: varchar('entity_type', { length: 30 }).notNull(), // BATCH, LOT, PRODUCT, DISPATCH
  entity_id: varchar('entity_id', { length: 36 }).notNull(),
  payload_json: json('payload_json'),
  scanned_count: int('scanned_count').default(0).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const batchTraceability = mysqlTable('batch_traceability', {
  trace_id: varchar('trace_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  parent_batch_id: varchar('parent_batch_id', { length: 36 }),
  origin_farm_id: varchar('origin_farm_id', { length: 36 }),
  origin_shed_id: varchar('origin_shed_id', { length: 36 }),
  feed_batch_no: varchar('feed_batch_no', { length: 100 }),
  medicine_batch_no: varchar('medicine_batch_no', { length: 100 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const traceabilityEvent = mysqlTable('traceability_event', {
  event_id: varchar('event_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  trace_id: varchar('trace_id', { length: 36 }).notNull().references(() => batchTraceability.trace_id, { onDelete: 'cascade' }),
  event_type: varchar('event_type', { length: 50 }).notNull(), // PLACEMENT, FEEDING, MEDICATION, EGG_HARVEST, SLAUGHTER, PACKAGING, DISPATCH
  source_location_id: varchar('source_location_id', { length: 36 }),
  destination_location_id: varchar('destination_location_id', { length: 36 }),
  event_date: timestamp('event_date', { mode: 'string' }).defaultNow().notNull(),
  event_details: json('event_details')
});

export const recallManagement = mysqlTable('recall_management', {
  recall_id: varchar('recall_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  recall_number: varchar('recall_number', { length: 50 }).notNull().unique(),
  reason: varchar('reason', { length: 255 }).notNull(),
  severity: varchar('severity', { length: 30 }).default('CLASS_1_HIGH').notNull(), // CLASS_1_HIGH, CLASS_2_MEDIUM, CLASS_3_LOW
  status: varchar('status', { length: 30 }).default('INITIATED').notNull(), // INITIATED, STOCK_BLOCKED, NOTIFIED, CLOSED
  initiated_by: varchar('initiated_by', { length: 36 }),
  initiated_at: timestamp('initiated_at', { mode: 'string' }).defaultNow().notNull()
});

export const recallAffectedBatch = mysqlTable('recall_affected_batch', {
  affected_id: varchar('affected_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  recall_id: varchar('recall_id', { length: 36 }).notNull().references(() => recallManagement.recall_id, { onDelete: 'cascade' }),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  lot_number: varchar('lot_number', { length: 100 }),
  blocked_qty: decimal('blocked_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  quarantine_hold_id: varchar('quarantine_hold_id', { length: 36 }).references(() => quarantineHold.hold_id, { onDelete: 'set null' })
});

// ==========================================
// 17. ENTERPRISE SCHEDULER, ALERTS & KPI ENGINE (PHASE 9)
// ==========================================

export const schedulerJob = mysqlTable('scheduler_job', {
  job_id: varchar('job_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  job_name: varchar('job_name', { length: 100 }).notNull(),
  job_group: varchar('job_group', { length: 50 }).default('OPERATIONAL').notNull(),
  cron_expression: varchar('cron_expression', { length: 100 }).notNull(),
  target_service: varchar('target_service', { length: 100 }).notNull(),
  target_method: varchar('target_method', { length: 100 }).notNull(),
  is_enabled: boolean('is_enabled').default(true).notNull(),
  last_run_at: timestamp('last_run_at', { mode: 'string' }),
  next_run_at: timestamp('next_run_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const schedulerHistory = mysqlTable('scheduler_history', {
  history_id: varchar('history_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  job_id: varchar('job_id', { length: 36 }).notNull().references(() => schedulerJob.job_id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('SUCCESS').notNull(), // SUCCESS, FAILED, SKIPPED
  execution_duration_ms: int('execution_duration_ms').default(0).notNull(),
  error_message: text('error_message'),
  executed_at: timestamp('executed_at', { mode: 'string' }).defaultNow().notNull()
});

export const vaccinationSchedule = mysqlTable('vaccination_schedule', {
  schedule_id: varchar('schedule_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  disease_id: varchar('disease_id', { length: 36 }),
  medicine_id: varchar('medicine_id', { length: 36 }),
  due_date: timestamp('due_date', { mode: 'string' }).notNull(),
  assigned_to: varchar('assigned_to', { length: 36 }),
  status: varchar('status', { length: 30 }).default('SCHEDULED').notNull(), // SCHEDULED, COMPLETED, OVERDUE, SKIPPED
  completed_at: timestamp('completed_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const feedSchedule = mysqlTable('feed_schedule', {
  feed_schedule_id: varchar('feed_schedule_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  feed_formula_id: varchar('feed_formula_id', { length: 36 }),
  scheduled_qty: decimal('scheduled_qty', { precision: 18, scale: 4 }).notNull(),
  scheduled_time: varchar('scheduled_time', { length: 20 }).notNull(), // e.g. '08:00', '16:00'
  status: varchar('status', { length: 30 }).default('PENDING').notNull(), // PENDING, DISPATCHED, COMPLETED
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const weightRecord = mysqlTable('weight_record', {
  weight_id: varchar('weight_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  record_date: timestamp('record_date', { mode: 'string' }).defaultNow().notNull(),
  sample_count: int('sample_count').default(1).notNull(),
  average_weight_grams: decimal('average_weight_grams', { precision: 18, scale: 4 }).notNull(),
  target_weight_grams: decimal('target_weight_grams', { precision: 18, scale: 4 }),
  daily_gain_grams: decimal('daily_gain_grams', { precision: 18, scale: 4 })
});

export const mortalityRecord = mysqlTable('mortality_record', {
  mortality_id: varchar('mortality_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  record_date: timestamp('record_date', { mode: 'string' }).defaultNow().notNull(),
  mortality_count: int('mortality_count').notNull(),
  cull_count: int('cull_count').default(0).notNull(),
  disease_id: varchar('disease_id', { length: 36 }),
  reason: varchar('reason', { length: 255 }),
  cost_impact: decimal('cost_impact', { precision: 18, scale: 4 }).default('0.0000')
});

export const alertRule = mysqlTable('alert_rule', {
  rule_id: varchar('rule_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  rule_name: varchar('rule_name', { length: 100 }).notNull(),
  event_type: varchar('event_type', { length: 50 }).notNull(),
  metric_name: varchar('metric_name', { length: 50 }).notNull(),
  operator: varchar('operator', { length: 10 }).default('GT').notNull(), // GT, LT, EQ, GTE, LTE
  threshold_value: decimal('threshold_value', { precision: 18, scale: 4 }).notNull(),
  severity: varchar('severity', { length: 20 }).default('WARNING').notNull(), // INFO, WARNING, CRITICAL
  is_enabled: boolean('is_enabled').default(true).notNull()
});

export const alertEvent = mysqlTable('alert_event', {
  alert_id: varchar('alert_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  rule_id: varchar('rule_id', { length: 36 }).references(() => alertRule.rule_id, { onDelete: 'cascade' }),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  message: text('message').notNull(),
  status: varchar('status', { length: 30 }).default('ACTIVE').notNull(), // ACTIVE, ACKNOWLEDGED, RESOLVED
  acknowledged_by: varchar('acknowledged_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const notificationHistory = mysqlTable('notification_history', {
  notification_id: varchar('notification_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  user_id: varchar('user_id', { length: 36 }),
  channel: varchar('channel', { length: 30 }).default('IN_APP').notNull(), // IN_APP, EMAIL, SMS, WEBSOCKET
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body').notNull(),
  is_read: boolean('is_read').default(false).notNull(),
  dispatched_at: timestamp('dispatched_at', { mode: 'string' }).defaultNow().notNull()
});

export const kpiDefinition = mysqlTable('kpi_definition', {
  kpi_id: varchar('kpi_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  kpi_code: varchar('kpi_code', { length: 50 }).notNull(),
  kpi_name: varchar('kpi_name', { length: 100 }).notNull(),
  category: varchar('category', { length: 30 }).default('PRODUCTION').notNull(), // PRODUCTION, INVENTORY, FINANCE, POULTRY, QUALITY
  unit_of_measure: varchar('unit_of_measure', { length: 30 }).default('PCT').notNull()
});

export const kpiThreshold = mysqlTable('kpi_threshold', {
  threshold_id: varchar('threshold_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  kpi_id: varchar('kpi_id', { length: 36 }).notNull().references(() => kpiDefinition.kpi_id, { onDelete: 'cascade' }),
  green_min: decimal('green_min', { precision: 18, scale: 4 }),
  green_max: decimal('green_max', { precision: 18, scale: 4 }),
  yellow_min: decimal('yellow_min', { precision: 18, scale: 4 }),
  yellow_max: decimal('yellow_max', { precision: 18, scale: 4 }),
  red_min: decimal('red_min', { precision: 18, scale: 4 }),
  red_max: decimal('red_max', { precision: 18, scale: 4 })
});

export const kpiResult = mysqlTable('kpi_result', {
  result_id: varchar('result_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  kpi_id: varchar('kpi_id', { length: 36 }).notNull().references(() => kpiDefinition.kpi_id, { onDelete: 'cascade' }),
  evaluated_at: timestamp('evaluated_at', { mode: 'string' }).defaultNow().notNull(),
  metric_value: decimal('metric_value', { precision: 18, scale: 4 }).notNull(),
  zone: varchar('zone', { length: 10 }).default('GREEN').notNull() // GREEN, YELLOW, RED
});

// ==========================================
// 18. ENTERPRISE REPORTING & BUSINESS INTELLIGENCE ENGINE (PHASE 10)
// ==========================================

export const reportCategory = mysqlTable('report_category', {
  category_id: varchar('category_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  category_code: varchar('category_code', { length: 50 }).notNull().unique(),
  category_name: varchar('category_name', { length: 100 }).notNull(),
  description: text('description'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const reportDefinition = mysqlTable('report_definition', {
  report_id: varchar('report_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'cascade' }),
  category_id: varchar('category_id', { length: 36 }).notNull().references(() => reportCategory.category_id, { onDelete: 'cascade' }),
  report_code: varchar('report_code', { length: 50 }).notNull(),
  report_name: varchar('report_name', { length: 100 }).notNull(),
  data_source_service: varchar('data_source_service', { length: 100 }).notNull(),
  required_permission: varchar('required_permission', { length: 100 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const reportExecution = mysqlTable('report_execution', {
  execution_id: varchar('execution_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  report_id: varchar('report_id', { length: 36 }).notNull().references(() => reportDefinition.report_id, { onDelete: 'cascade' }),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  executed_by: varchar('executed_by', { length: 36 }),
  parameters_json: json('parameters_json'),
  execution_duration_ms: int('execution_duration_ms').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('SUCCESS').notNull(), // SUCCESS, FAILED
  executed_at: timestamp('executed_at', { mode: 'string' }).defaultNow().notNull()
});

export const reportExport = mysqlTable('report_export', {
  export_id: varchar('export_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  execution_id: varchar('execution_id', { length: 36 }).notNull().references(() => reportExecution.execution_id, { onDelete: 'cascade' }),
  export_format: varchar('export_format', { length: 10 }).default('PDF').notNull(), // PDF, XLSX, CSV
  file_path: varchar('file_path', { length: 255 }).notNull(),
  file_name: varchar('file_name', { length: 200 }).notNull(),
  file_size_bytes: int('file_size_bytes').default(0).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const reportSchedule = mysqlTable('report_schedule', {
  schedule_id: varchar('schedule_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  report_id: varchar('report_id', { length: 36 }).notNull().references(() => reportDefinition.report_id, { onDelete: 'cascade' }),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  cron_expression: varchar('cron_expression', { length: 100 }).notNull(),
  export_format: varchar('export_format', { length: 10 }).default('PDF').notNull(),
  recipient_emails: text('recipient_emails').notNull(),
  is_enabled: boolean('is_enabled').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const dashboard = mysqlTable('dashboard', {
  dashboard_id: varchar('dashboard_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  dashboard_name: varchar('dashboard_name', { length: 100 }).notNull(),
  dashboard_type: varchar('dashboard_type', { length: 30 }).default('EXECUTIVE').notNull(), // EXECUTIVE, OPERATIONS, FINANCE, INVENTORY, PRODUCTION, POULTRY, QUALITY
  owner_id: varchar('owner_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const dashboardWidget = mysqlTable('dashboard_widget', {
  widget_id: varchar('widget_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  dashboard_id: varchar('dashboard_id', { length: 36 }).notNull().references(() => dashboard.dashboard_id, { onDelete: 'cascade' }),
  widget_title: varchar('widget_title', { length: 100 }).notNull(),
  widget_type: varchar('widget_type', { length: 30 }).default('CARD').notNull(), // CARD, LINE_CHART, BAR_CHART, PIE_CHART, KPI_CARD, TABLE
  report_id: varchar('report_id', { length: 36 }).references(() => reportDefinition.report_id, { onDelete: 'set null' }),
  layout_json: json('layout_json')
});

// ============================================================
// PHASE 11A — GAP 12: Tenant Subscription Management
// ============================================================
export const tenantSubscription = mysqlTable('tenant_subscription', {
  sub_id: varchar('sub_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  plan_code: varchar('plan_code', { length: 30 }).notNull().default('STARTER'), // STARTER/GROWTH/PROFESSIONAL/ENTERPRISE
  feature_flags: json('feature_flags').default({}),
  storage_limit_gb: decimal('storage_limit_gb', { precision: 8, scale: 2 }).default('5.00'),
  support_tier: varchar('support_tier', { length: 20 }).default('STANDARD'), // COMMUNITY/STANDARD/PRIORITY/DEDICATED
  sla_uptime_pct: decimal('sla_uptime_pct', { precision: 5, scale: 2 }).default('99.50'),
  plan_start_date: date('plan_start_date', { mode: 'string' }),
  plan_end_date: date('plan_end_date', { mode: 'string' }),
  renewal_auto: boolean('renewal_auto').default(true),
  payment_method: varchar('payment_method', { length: 30 }), // CARD/BANK_TRANSFER/UPI/CHEQUE/INVOICE
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11A — GAP 11: Egg Grading Batch (Poultry Extension)
// ============================================================
export const eggGradingBatch = mysqlTable('egg_grading_batch', {
  grading_id: varchar('grading_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  source_batch_id: varchar('source_batch_id', { length: 36 }).references(() => poultryBatch.batch_id, { onDelete: 'restrict' }),
  source_egg_production_id: varchar('source_egg_production_id', { length: 36 }),
  grading_date: date('grading_date', { mode: 'string' }).notNull(),
  total_eggs_input: decimal('total_eggs_input', { precision: 12, scale: 0 }).notNull(),
  grade_xl_qty: decimal('grade_xl_qty', { precision: 12, scale: 0 }).default('0'),
  grade_l_qty: decimal('grade_l_qty', { precision: 12, scale: 0 }).default('0'),
  grade_m_qty: decimal('grade_m_qty', { precision: 12, scale: 0 }).default('0'),
  grade_s_qty: decimal('grade_s_qty', { precision: 12, scale: 0 }).default('0'),
  grade_reject_qty: decimal('grade_reject_qty', { precision: 12, scale: 0 }).default('0'),
  graded_by: varchar('graded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11B — GAP 1: Livestock Module
// ============================================================
export const livestockBatch = mysqlTable('livestock_batch', {
  batch_id: varchar('batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  batch_code: varchar('batch_code', { length: 100 }).notNull(),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),  // LVS_COW / LVS_PIGGERY / LVS_GOAT
  costing_method: varchar('costing_method', { length: 20 }).default('BIO_ASSET'), // BIO_ASSET / STANDARD
  opening_qty: decimal('opening_qty', { precision: 12, scale: 2 }).notNull(),
  current_qty: decimal('current_qty', { precision: 12, scale: 2 }),
  uom_id: varchar('uom_id', { length: 36 }),
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  batch_status: varchar('batch_status', { length: 20 }).default('ACTIVE'), // ACTIVE / CLOSED / SOLD
  bio_asset_stage: varchar('bio_asset_stage', { length: 20 }), // PREMATURE / MATURE
  nca_purchase_cost: decimal('nca_purchase_cost', { precision: 18, scale: 4 }),      // Net Carrying Amount at purchase
  nca_current: decimal('nca_current', { precision: 18, scale: 4 }),                  // Running NCA
  residual_value: decimal('residual_value', { precision: 18, scale: 4 }),
  useful_life_months: int('useful_life_months'),
  monthly_amortisation: decimal('monthly_amortisation', { precision: 18, scale: 4 }),
  fair_value_latest: decimal('fair_value_latest', { precision: 18, scale: 4 }),
  placement_date: date('placement_date', { mode: 'string' }),
  maturity_date: date('maturity_date', { mode: 'string' }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const livestockDailyEntry = mysqlTable('livestock_daily_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => livestockBatch.batch_id, { onDelete: 'cascade' }),
  entry_date: date('entry_date', { mode: 'string' }).notNull(),
  entry_type: varchar('entry_type', { length: 30 }).notNull(), // CONS_FEED / CONS_MEDICINE / OVHD_LABOR / DESC_WEIGHT / MORT_M
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  qty: decimal('qty', { precision: 18, scale: 4 }),
  uom_id: varchar('uom_id', { length: 36 }),
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  notes: text('notes'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const livestockMilkRecord = mysqlTable('livestock_milk_record', {
  record_id: varchar('record_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => livestockBatch.batch_id, { onDelete: 'cascade' }),
  record_date: date('record_date', { mode: 'string' }).notNull(),
  litres_produced: decimal('litres_produced', { precision: 12, scale: 3 }).notNull(),
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  total_value: decimal('total_value', { precision: 18, scale: 4 }),
  fat_pct: decimal('fat_pct', { precision: 5, scale: 2 }),
  snf_pct: decimal('snf_pct', { precision: 5, scale: 2 }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const livestockOffspringRecord = mysqlTable('livestock_offspring_record', {
  record_id: varchar('record_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  parent_batch_id: varchar('parent_batch_id', { length: 36 }).notNull().references(() => livestockBatch.batch_id, { onDelete: 'cascade' }),
  record_date: date('record_date', { mode: 'string' }).notNull(),
  offspring_type: varchar('offspring_type', { length: 50 }), // PIGLET / KID / CALF / LAMB
  qty_born: int('qty_born').notNull(),
  qty_alive: int('qty_alive'),
  qty_dead: int('qty_dead').default(0),
  avg_birth_weight_kg: decimal('avg_birth_weight_kg', { precision: 8, scale: 3 }),
  child_batch_id: varchar('child_batch_id', { length: 36 }), // If new batch created from offspring
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const livestockAmortisationSchedule = mysqlTable('livestock_amortisation_schedule', {
  schedule_id: varchar('schedule_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => livestockBatch.batch_id, { onDelete: 'cascade' }),
  period_month: int('period_month').notNull(),
  period_year: int('period_year').notNull(),
  amortisation_amount: decimal('amortisation_amount', { precision: 18, scale: 4 }).notNull(),
  nca_before: decimal('nca_before', { precision: 18, scale: 4 }),
  nca_after: decimal('nca_after', { precision: 18, scale: 4 }),
  is_posted: boolean('is_posted').default(false),
  posted_at: timestamp('posted_at', { mode: 'string' }),
  gl_journal_id: varchar('gl_journal_id', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const livestockFairValueUpdate = mysqlTable('livestock_fair_value_update', {
  fv_id: varchar('fv_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => livestockBatch.batch_id, { onDelete: 'cascade' }),
  update_date: date('update_date', { mode: 'string' }).notNull(),
  fair_value_per_unit: decimal('fair_value_per_unit', { precision: 18, scale: 4 }).notNull(),
  total_fair_value: decimal('total_fair_value', { precision: 18, scale: 4 }),
  nca_at_date: decimal('nca_at_date', { precision: 18, scale: 4 }),
  gain_loss_amount: decimal('gain_loss_amount', { precision: 18, scale: 4 }), // Positive = gain, Negative = loss
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11B — GAP 2: Agriculture Module
// ============================================================
export const agriBatch = mysqlTable('agri_batch', {
  batch_id: varchar('batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  batch_code: varchar('batch_code', { length: 100 }).notNull(),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }), // AGRI_FRUIT / AGRI_CROP / AGRI_SEEDS / AGRI_FLOWER
  costing_method: varchar('costing_method', { length: 20 }).default('STANDARD'), // STANDARD / BIO_ASSET / FIFO
  crop_item_id: varchar('crop_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  area_acres: decimal('area_acres', { precision: 10, scale: 2 }), // For crop farming
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  batch_status: varchar('batch_status', { length: 20 }).default('ACTIVE'), // ACTIVE / HARVESTED / CLOSED
  bio_asset_stage: varchar('bio_asset_stage', { length: 20 }), // PREMATURE / MATURE (for fruit farming)
  premature_years: int('premature_years').default(0), // Years before maturity (e.g. 5 for fruit trees)
  nca_cost: decimal('nca_cost', { precision: 18, scale: 4 }),   // Bio Asset NCA
  annual_amortisation: decimal('annual_amortisation', { precision: 18, scale: 4 }),
  season_year: int('season_year'),
  sowing_date: date('sowing_date', { mode: 'string' }),
  expected_harvest_date: date('expected_harvest_date', { mode: 'string' }),
  actual_harvest_date: date('actual_harvest_date', { mode: 'string' }),
  parent_batch_id: varchar('parent_batch_id', { length: 36 }), // For batch copy (fruit tree next year)
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const agriFieldInput = mysqlTable('agri_field_input', {
  input_id: varchar('input_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => agriBatch.batch_id, { onDelete: 'cascade' }),
  input_date: date('input_date', { mode: 'string' }).notNull(),
  entry_type: varchar('entry_type', { length: 30 }).notNull(), // CONS_OTHER (fertiliser/seed/pesticide) / OVHD_LABOR / CONS_MEDICINE
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  qty: decimal('qty', { precision: 18, scale: 4 }).notNull(),
  uom_id: varchar('uom_id', { length: 36 }),
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  notes: text('notes'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const agriHarvestRecord = mysqlTable('agri_harvest_record', {
  harvest_id: varchar('harvest_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => agriBatch.batch_id, { onDelete: 'cascade' }),
  harvest_date: date('harvest_date', { mode: 'string' }).notNull(),
  harvest_type: varchar('harvest_type', { length: 20 }).default('FULL'), // FULL / PARTIAL
  output_item_id: varchar('output_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  qty_harvested: decimal('qty_harvested', { precision: 18, scale: 4 }).notNull(),
  uom_id: varchar('uom_id', { length: 36 }),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 6 }),
  total_value: decimal('total_value', { precision: 18, scale: 4 }),
  lot_no: varchar('lot_no', { length: 100 }),
  qc_result: varchar('qc_result', { length: 20 }), // PASS / FAIL / HOLD
  notes: text('notes'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11B — GAP 9: Parameter Master & Daily Entry System
// ============================================================
export const parameterMaster = mysqlTable('parameter_master', {
  parameter_id: varchar('parameter_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  parameter_code: varchar('parameter_code', { length: 50 }).notNull(),
  parameter_name: varchar('parameter_name', { length: 200 }).notNull(),
  parameter_type: varchar('parameter_type', { length: 30 }).notNull(), // CONSUMPTION / OUTPUT / DESCRIPTIVE / OVERHEAD / RESOURCE / QC
  entry_type_code: varchar('entry_type_code', { length: 30 }), // CONS_FEED / MORT_M / DESC_WEIGHT / OVHD_POWER / PROD_CROP
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'set null' }),
  default_uom: varchar('default_uom', { length: 20 }),
  qty_method: varchar('qty_method', { length: 20 }).default('MANUAL'), // PER_UNIT / PER_BATCH / FORMULA / MANUAL
  default_qty_per_unit: decimal('default_qty_per_unit', { precision: 18, scale: 8 }),
  default_qty_per_batch: decimal('default_qty_per_batch', { precision: 18, scale: 4 }),
  qty_formula: text('qty_formula'),
  description: text('description'),
  is_mandatory: boolean('is_mandatory').default(false),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const batchParameterLog = mysqlTable('batch_parameter_log', {
  log_id: varchar('log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull(), // Generic FK - references any batch table by nob/lob context
  parameter_id: varchar('parameter_id', { length: 36 }).notNull().references(() => parameterMaster.parameter_id, { onDelete: 'restrict' }),
  entry_date: date('entry_date', { mode: 'string' }).notNull(),
  actual_qty: decimal('actual_qty', { precision: 18, scale: 4 }),
  actual_value: text('actual_value'), // For DESCRIPTIVE type (weight, temperature etc.)
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  expected_qty: decimal('expected_qty', { precision: 18, scale: 4 }), // Computed from qty_method for variance
  notes: text('notes'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11C — GAP 3: Aquaculture Module
// ============================================================
export const aquaBatch = mysqlTable('aqua_batch', {
  batch_id: varchar('batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  batch_code: varchar('batch_code', { length: 100 }).notNull(),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }), // AQA_FISH / AQA_SLAUGHTER
  costing_method: varchar('costing_method', { length: 20 }).default('BIO_ASSET'), // BIO_ASSET / STANDARD / FIFO
  species_item_id: varchar('species_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  stocking_date: date('stocking_date', { mode: 'string' }),
  fingerlings_qty: int('fingerlings_qty'),
  nca_stocking_cost: decimal('nca_stocking_cost', { precision: 18, scale: 4 }),
  current_biomass_kg: decimal('current_biomass_kg', { precision: 12, scale: 3 }),
  batch_status: varchar('batch_status', { length: 20 }).default('ACTIVE'), // ACTIVE / PARTIAL_HARVEST / COMPLETED
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const aquaDailyEntry = mysqlTable('aqua_daily_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => aquaBatch.batch_id, { onDelete: 'cascade' }),
  entry_date: date('entry_date', { mode: 'string' }).notNull(),
  entry_type: varchar('entry_type', { length: 30 }).notNull(), // CONS_FEED / DESC_WEIGHT / MORT_M
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  qty: decimal('qty', { precision: 18, scale: 4 }),
  sample_weight_g: decimal('sample_weight_g', { precision: 8, scale: 2 }), // For DESC_WEIGHT type
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const aquaHarvestRecord = mysqlTable('aqua_harvest_record', {
  harvest_id: varchar('harvest_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => aquaBatch.batch_id, { onDelete: 'cascade' }),
  harvest_date: date('harvest_date', { mode: 'string' }).notNull(),
  harvest_type: varchar('harvest_type', { length: 20 }).default('PARTIAL'), // PARTIAL / FULL
  live_fish_kg: decimal('live_fish_kg', { precision: 12, scale: 3 }).notNull(),
  avg_weight_kg: decimal('avg_weight_kg', { precision: 8, scale: 3 }),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 6 }),
  total_value: decimal('total_value', { precision: 18, scale: 4 }),
  lot_no: varchar('lot_no', { length: 100 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const aquaSlaughterRecord = mysqlTable('aqua_slaughter_record', {
  slaughter_id: varchar('slaughter_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  source_batch_id: varchar('source_batch_id', { length: 36 }).references(() => aquaBatch.batch_id, { onDelete: 'restrict' }),
  slaughter_date: date('slaughter_date', { mode: 'string' }).notNull(),
  input_kg: decimal('input_kg', { precision: 12, scale: 3 }).notNull(),
  input_cost: decimal('input_cost', { precision: 18, scale: 4 }),
  overhead_cost: decimal('overhead_cost', { precision: 18, scale: 4 }).default('0'),
  // Joint cost split outputs
  fillet_kg: decimal('fillet_kg', { precision: 12, scale: 3 }),
  fillet_split_pct: decimal('fillet_split_pct', { precision: 5, scale: 2 }).default('70.00'),
  fillet_unit_cost: decimal('fillet_unit_cost', { precision: 18, scale: 6 }),
  meal_kg: decimal('meal_kg', { precision: 12, scale: 3 }),
  meal_split_pct: decimal('meal_split_pct', { precision: 5, scale: 2 }).default('15.00'),
  meal_unit_cost: decimal('meal_unit_cost', { precision: 18, scale: 6 }),
  skin_kg: decimal('skin_kg', { precision: 12, scale: 3 }),
  skin_split_pct: decimal('skin_split_pct', { precision: 5, scale: 2 }).default('10.00'),
  skin_unit_cost: decimal('skin_unit_cost', { precision: 18, scale: 6 }),
  other_kg: decimal('other_kg', { precision: 12, scale: 3 }),
  other_split_pct: decimal('other_split_pct', { precision: 5, scale: 2 }).default('5.00'),
  qc_freshness_grade: varchar('qc_freshness_grade', { length: 10 }), // A / B / C
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11C — GAP 4: Insect Farming Module
// ============================================================
export const insectBatch = mysqlTable('insect_batch', {
  batch_id: varchar('batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  batch_code: varchar('batch_code', { length: 100 }).notNull(),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }), // INS_BEE
  insect_type: varchar('insect_type', { length: 50 }), // BEE / BSF (Black Soldier Fly)
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  hive_count: int('hive_count'),
  hive_cost_per_unit: decimal('hive_cost_per_unit', { precision: 18, scale: 4 }),
  total_setup_cost: decimal('total_setup_cost', { precision: 18, scale: 4 }),
  setup_date: date('setup_date', { mode: 'string' }),
  batch_status: varchar('batch_status', { length: 20 }).default('ACTIVE'), // ACTIVE / HARVESTED / CLOSED
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const insectDailyEntry = mysqlTable('insect_daily_entry', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => insectBatch.batch_id, { onDelete: 'cascade' }),
  entry_date: date('entry_date', { mode: 'string' }).notNull(),
  entry_type: varchar('entry_type', { length: 30 }).notNull(), // CONS_FEED / OVHD_LABOR / OVHD_OTHER
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  qty: decimal('qty', { precision: 18, scale: 4 }),
  uom_id: varchar('uom_id', { length: 36 }),
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const insectHarvestRecord = mysqlTable('insect_harvest_record', {
  harvest_id: varchar('harvest_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => insectBatch.batch_id, { onDelete: 'cascade' }),
  harvest_date: date('harvest_date', { mode: 'string' }).notNull(),
  // Main product
  main_product_item_id: varchar('main_product_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  main_qty_kg: decimal('main_qty_kg', { precision: 12, scale: 3 }),
  main_split_pct: decimal('main_split_pct', { precision: 5, scale: 2 }).default('95.00'),
  main_unit_cost: decimal('main_unit_cost', { precision: 18, scale: 6 }),
  // By-product
  byproduct_item_id: varchar('byproduct_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  byproduct_qty_kg: decimal('byproduct_qty_kg', { precision: 12, scale: 3 }),
  byproduct_split_pct: decimal('byproduct_split_pct', { precision: 5, scale: 2 }).default('5.00'),
  byproduct_unit_cost: decimal('byproduct_unit_cost', { precision: 18, scale: 6 }),
  // QC
  moisture_pct: decimal('moisture_pct', { precision: 5, scale: 2 }),
  qc_result: varchar('qc_result', { length: 20 }), // PASS / FAIL
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// ============================================================
// PHASE 11C — GAP 5: Feed Mill BOR (Bill of Recipe) System
// ============================================================
export const borMaster = mysqlTable('bor_master', {
  bor_id: varchar('bor_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  bor_code: varchar('bor_code', { length: 100 }).notNull(), // BOR-2025-001
  version: int('version').notNull().default(1),             // V1, V2...
  bor_name: varchar('bor_name', { length: 200 }).notNull(),
  output_item_id: varchar('output_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  output_qty: decimal('output_qty', { precision: 18, scale: 4 }).notNull(), // Target output qty
  output_uom_id: varchar('output_uom_id', { length: 36 }),
  is_active: boolean('is_active').default(true),
  approved_by: varchar('approved_by', { length: 36 }),
  approved_at: timestamp('approved_at', { mode: 'string' }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const borIngredientLine = mysqlTable('bor_ingredient_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  bor_id: varchar('bor_id', { length: 36 }).notNull().references(() => borMaster.bor_id, { onDelete: 'cascade' }),
  line_no: int('line_no').notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  std_qty: decimal('std_qty', { precision: 18, scale: 4 }).notNull(), // Standard qty per BOR output qty
  uom_id: varchar('uom_id', { length: 36 }),
  pct_of_output: decimal('pct_of_output', { precision: 8, scale: 4 }), // e.g. 52.0000 = 52%
  std_unit_rate: decimal('std_unit_rate', { precision: 18, scale: 6 }),
  std_amount: decimal('std_amount', { precision: 18, scale: 4 }),
  is_active: boolean('is_active').default(true),
});

export const borNutritionalProfile = mysqlTable('bor_nutritional_profile', {
  profile_id: varchar('profile_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  bor_id: varchar('bor_id', { length: 36 }).notNull().references(() => borMaster.bor_id, { onDelete: 'cascade' }),
  crude_protein_pct: decimal('crude_protein_pct', { precision: 6, scale: 3 }),
  crude_fat_pct: decimal('crude_fat_pct', { precision: 6, scale: 3 }),
  crude_fibre_pct: decimal('crude_fibre_pct', { precision: 6, scale: 3 }),
  moisture_pct: decimal('moisture_pct', { precision: 6, scale: 3 }),
  ash_pct: decimal('ash_pct', { precision: 6, scale: 3 }),
  metabolisable_energy_kcal_kg: decimal('metabolisable_energy_kcal_kg', { precision: 10, scale: 2 }),
  calcium_pct: decimal('calcium_pct', { precision: 6, scale: 3 }),
  phosphorus_pct: decimal('phosphorus_pct', { precision: 6, scale: 3 }),
  calculated_at: timestamp('calculated_at', { mode: 'string' }).defaultNow(),
});

export const feedProductionBatch = mysqlTable('feed_production_batch', {
  fp_batch_id: varchar('fp_batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  fp_batch_code: varchar('fp_batch_code', { length: 100 }).notNull(),
  bor_id: varchar('bor_id', { length: 36 }).notNull().references(() => borMaster.bor_id, { onDelete: 'restrict' }),
  planned_output_qty: decimal('planned_output_qty', { precision: 18, scale: 4 }).notNull(),
  actual_output_qty: decimal('actual_output_qty', { precision: 18, scale: 4 }),
  output_item_id: varchar('output_item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  batch_status: varchar('batch_status', { length: 20 }).default('PLANNED'), // PLANNED / IN_PROGRESS / COMPLETED / CLOSED
  total_ingredient_cost: decimal('total_ingredient_cost', { precision: 18, scale: 4 }).default('0'),
  total_resource_cost: decimal('total_resource_cost', { precision: 18, scale: 4 }).default('0'),
  total_overhead_cost: decimal('total_overhead_cost', { precision: 18, scale: 4 }).default('0'),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }).default('0'),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 6 }),
  usage_variance_amount: decimal('usage_variance_amount', { precision: 18, scale: 4 }), // Actual vs BOR std
  production_date: date('production_date', { mode: 'string' }),
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const feedProductionBatchInput = mysqlTable('feed_production_batch_input', {
  input_id: varchar('input_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  fp_batch_id: varchar('fp_batch_id', { length: 36 }).notNull().references(() => feedProductionBatch.fp_batch_id, { onDelete: 'cascade' }),
  bor_line_id: varchar('bor_line_id', { length: 36 }).references(() => borIngredientLine.line_id, { onDelete: 'set null' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  std_qty: decimal('std_qty', { precision: 18, scale: 4 }),   // From BOR
  actual_qty: decimal('actual_qty', { precision: 18, scale: 4 }).notNull(),
  uom_id: varchar('uom_id', { length: 36 }),
  unit_rate: decimal('unit_rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  usage_variance: decimal('usage_variance', { precision: 18, scale: 4 }), // (actual_qty - std_qty) * std_rate
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});





// ════════════════════════════════════════════════════════════════════════════
// PHASE 11 — MULTI-INDUSTRY VERTICAL EXTENSION PLATFORM
// ════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL 1: LIVESTOCK (15 tables — lvs_*)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Herd Master — logical grouping of animals on a farm
export const lvsHerd = mysqlTable('lvs_herd', {
  herd_id: varchar('herd_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  farm_id: varchar('farm_id', { length: 36 }).references(() => farmMaster.farm_id, { onDelete: 'restrict' }),
  herd_code: varchar('herd_code', { length: 100 }).notNull(),
  herd_name: varchar('herd_name', { length: 200 }).notNull(),
  herd_type: varchar('herd_type', { length: 50 }).notNull(), // DAIRY / BEEF / MIXED / PIGGERY / GOAT / SHEEP
  species_id: varchar('species_id', { length: 36 }).references(() => speciesMaster.species_id, { onDelete: 'restrict' }),
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  target_size: int('target_size'),
  current_size: int('current_size').default(0),
  herd_status: varchar('herd_status', { length: 20 }).default('ACTIVE'), // ACTIVE / INACTIVE / CLOSED
  manager_name: varchar('manager_name', { length: 200 }),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
});

// 2. Animal — individual animal with unique ear tag
export const lvsAnimal = mysqlTable('lvs_animal', {
  animal_id: varchar('animal_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id, { onDelete: 'restrict' }),
  ear_tag: varchar('ear_tag', { length: 100 }).notNull(),         // Unique identifier printed on ear tag
  rfid_tag: varchar('rfid_tag', { length: 100 }),                 // Electronic RFID
  animal_name: varchar('animal_name', { length: 100 }),           // Optional name
  species_id: varchar('species_id', { length: 36 }).references(() => speciesMaster.species_id),
  breed_id: varchar('breed_id', { length: 36 }).references(() => breedMaster.breed_id),
  sex: varchar('sex', { length: 10 }).notNull(),                  // MALE / FEMALE / CASTRATED
  date_of_birth: date('date_of_birth', { mode: 'string' }),
  origin: varchar('origin', { length: 30 }).default('PURCHASED'), // PURCHASED / BORN_ON_FARM / IMPORTED
  dam_id: varchar('dam_id', { length: 36 }),                      // Mother animal_id
  sire_id: varchar('sire_id', { length: 36 }),                    // Father animal_id / AI bull code
  purchase_date: date('purchase_date', { mode: 'string' }),
  purchase_cost: decimal('purchase_cost', { precision: 18, scale: 4 }),
  supplier_id: varchar('supplier_id', { length: 36 }).references(() => supplierMaster.supplier_id),
  current_location_id: varchar('current_location_id', { length: 36 }).references(() => locationMaster.location_id),
  animal_status: varchar('animal_status', { length: 20 }).default('ACTIVE'), // ACTIVE / SOLD / DEAD / CULLED / TRANSFERRED
  current_weight_kg: decimal('current_weight_kg', { precision: 10, scale: 2 }),
  last_weighed_at: date('last_weighed_at', { mode: 'string' }),
  lactation_no: int('lactation_no').default(0),                   // Lactation number for dairy
  pregnancy_status: varchar('pregnancy_status', { length: 20 }).default('NOT_PREGNANT'), // PREGNANT / NOT_PREGNANT / OPEN
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
});

// 3. Animal Group — sub-grouping within a herd (e.g. Milking, Dry, Heifer)
export const lvsAnimalGroup = mysqlTable('lvs_animal_group', {
  group_id: varchar('group_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id, { onDelete: 'cascade' }),
  group_code: varchar('group_code', { length: 100 }).notNull(),
  group_name: varchar('group_name', { length: 200 }).notNull(),
  group_type: varchar('group_type', { length: 50 }),              // MILKING / DRY / HEIFER / CALF / FATTENING
  animal_count: int('animal_count').default(0),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 4. Weight Record — individual or batch weigh-in
export const lvsWeightRecord = mysqlTable('lvs_weight_record', {
  weight_id: varchar('weight_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  animal_id: varchar('animal_id', { length: 36 }).references(() => lvsAnimal.animal_id, { onDelete: 'cascade' }),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id),  // For batch weighing
  weigh_date: date('weigh_date', { mode: 'string' }).notNull(),
  weight_kg: decimal('weight_kg', { precision: 10, scale: 2 }).notNull(),
  age_days: int('age_days'),
  body_condition_score: decimal('body_condition_score', { precision: 4, scale: 1 }), // 1.0 – 5.0 BCS scale
  method: varchar('method', { length: 30 }).default('SCALE'),    // SCALE / TAPE / ESTIMATED
  recorded_by: varchar('recorded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 5. Vaccination Record — individual or herd-level vaccination
export const lvsVaccinationRecord = mysqlTable('lvs_vaccination_record', {
  vaccination_id: varchar('vaccination_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  animal_id: varchar('animal_id', { length: 36 }).references(() => lvsAnimal.animal_id, { onDelete: 'cascade' }),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id), // Batch vaccination
  vaccine_name: varchar('vaccine_name', { length: 200 }).notNull(),
  medicine_id: varchar('medicine_id', { length: 36 }).references(() => medicineMaster.medicine_id),
  disease_id: varchar('disease_id', { length: 36 }).references(() => diseaseMaster.disease_id),
  vaccination_date: date('vaccination_date', { mode: 'string' }).notNull(),
  dose_ml: decimal('dose_ml', { precision: 8, scale: 2 }),
  route: varchar('route', { length: 30 }),                        // IM / SC / ORAL / IV / INTRANASAL
  batch_no: varchar('batch_no', { length: 100 }),                 // Vaccine batch/lot number
  expiry_date: date('expiry_date', { mode: 'string' }),
  next_due_date: date('next_due_date', { mode: 'string' }),
  vet_name: varchar('vet_name', { length: 200 }),
  cost_per_dose: decimal('cost_per_dose', { precision: 10, scale: 4 }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 6. Treatment Record — veterinary treatment / medicine administration
export const lvsTreatmentRecord = mysqlTable('lvs_treatment_record', {
  treatment_id: varchar('treatment_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  animal_id: varchar('animal_id', { length: 36 }).references(() => lvsAnimal.animal_id, { onDelete: 'cascade' }),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id),
  treatment_date: date('treatment_date', { mode: 'string' }).notNull(),
  diagnosis: varchar('diagnosis', { length: 500 }),
  disease_id: varchar('disease_id', { length: 36 }).references(() => diseaseMaster.disease_id),
  medicine_id: varchar('medicine_id', { length: 36 }).references(() => medicineMaster.medicine_id),
  dosage: varchar('dosage', { length: 100 }),
  route: varchar('route', { length: 30 }),                        // IM / IV / ORAL / TOPICAL
  duration_days: int('duration_days'),
  withdrawal_period_days: int('withdrawal_period_days'),          // Milk/meat withdrawal after medicine
  safe_to_milk_date: date('safe_to_milk_date', { mode: 'string' }), // Milk safe after withdrawal
  treatment_cost: decimal('treatment_cost', { precision: 12, scale: 4 }),
  outcome: varchar('outcome', { length: 30 }),                    // RECOVERED / ONGOING / CHRONIC / DIED
  vet_name: varchar('vet_name', { length: 200 }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 7. Breeding Record — AI or natural service event
export const lvsBreedingRecord = mysqlTable('lvs_breeding_record', {
  breeding_id: varchar('breeding_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  dam_animal_id: varchar('dam_animal_id', { length: 36 }).notNull().references(() => lvsAnimal.animal_id),
  breeding_date: date('breeding_date', { mode: 'string' }).notNull(),
  method: varchar('method', { length: 20 }).notNull(),            // AI / NATURAL / EMBRYO_TRANSFER
  sire_animal_id: varchar('sire_animal_id', { length: 36 }).references(() => lvsAnimal.animal_id), // Bull animal_id
  sire_code: varchar('sire_code', { length: 100 }),               // AI straw code if sire not in system
  sire_breed: varchar('sire_breed', { length: 100 }),
  technician: varchar('technician', { length: 200 }),
  pd_date: date('pd_date', { mode: 'string' }),                   // Pregnancy diagnosis date
  pd_result: varchar('pd_result', { length: 30 }),                // POSITIVE / NEGATIVE / INCONCLUSIVE
  expected_calving_date: date('expected_calving_date', { mode: 'string' }),
  outcome: varchar('outcome', { length: 30 }).default('PENDING'), // PENDING / PREGNANT / NOT_IN_CALF / ABORTED / CALVED
  cost: decimal('cost', { precision: 10, scale: 4 }),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 8. Calving Record — birth event linked to a breeding record
export const lvsCalvingRecord = mysqlTable('lvs_calving_record', {
  calving_id: varchar('calving_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  breeding_id: varchar('breeding_id', { length: 36 }).references(() => lvsBreedingRecord.breeding_id),
  dam_animal_id: varchar('dam_animal_id', { length: 36 }).references(() => lvsAnimal.animal_id),
  calving_date: date('calving_date', { mode: 'string' }).notNull(),
  calving_ease: varchar('calving_ease', { length: 20 }).default('NORMAL'), // NORMAL / ASSISTED / VET_REQUIRED / CAESARIAN
  calves_born: int('calves_born').notNull().default(1),
  calves_alive: int('calves_alive').notNull().default(1),
  calves_dead: int('calves_dead').default(0),
  avg_birth_weight_kg: decimal('avg_birth_weight_kg', { precision: 8, scale: 2 }),
  dam_condition_post: varchar('dam_condition_post', { length: 30 }), // NORMAL / RETAINED_PLACENTA / MILK_FEVER
  lactation_start_date: date('lactation_start_date', { mode: 'string' }),
  notes: text('notes'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 9. Milk Production — per-animal per-milking session
export const lvsMilkProduction = mysqlTable('lvs_milk_production', {
  record_id: varchar('record_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  animal_id: varchar('animal_id', { length: 36 }).references(() => lvsAnimal.animal_id, { onDelete: 'cascade' }),
  group_id: varchar('group_id', { length: 36 }).references(() => lvsAnimalGroup.group_id), // Group recording
  record_date: date('record_date', { mode: 'string' }).notNull(),
  session: varchar('session', { length: 20 }).default('AM'),      // AM / PM / TOTAL
  litres: decimal('litres', { precision: 10, scale: 2 }).notNull(),
  fat_pct: decimal('fat_pct', { precision: 5, scale: 2 }),
  snf_pct: decimal('snf_pct', { precision: 5, scale: 2 }),        // Solids-Not-Fat
  protein_pct: decimal('protein_pct', { precision: 5, scale: 2 }),
  somatic_cell_count: int('somatic_cell_count'),                  // SCC for mastitis monitoring
  milk_quality_grade: varchar('milk_quality_grade', { length: 10 }), // A / B / C
  lactation_day: int('lactation_day'),                            // Day of current lactation
  unit_rate: decimal('unit_rate', { precision: 10, scale: 4 }),   // Price per litre
  total_value: decimal('total_value', { precision: 12, scale: 4 }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 10. Movement Record — animal transfer between locations
export const lvsMovementRecord = mysqlTable('lvs_movement_record', {
  movement_id: varchar('movement_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  animal_id: varchar('animal_id', { length: 36 }).references(() => lvsAnimal.animal_id, { onDelete: 'cascade' }),
  movement_date: date('movement_date', { mode: 'string' }).notNull(),
  from_location_id: varchar('from_location_id', { length: 36 }).references(() => locationMaster.location_id),
  to_location_id: varchar('to_location_id', { length: 36 }).references(() => locationMaster.location_id),
  from_herd_id: varchar('from_herd_id', { length: 36 }).references(() => lvsHerd.herd_id),
  to_herd_id: varchar('to_herd_id', { length: 36 }).references(() => lvsHerd.herd_id),
  reason: varchar('reason', { length: 30 }).notNull(),            // SALE / GRAZING / TREATMENT / WEANING / TRANSFER
  transport_method: varchar('transport_method', { length: 50 }),
  movement_weight_kg: decimal('movement_weight_kg', { precision: 10, scale: 2 }),
  approved_by: varchar('approved_by', { length: 36 }),
  notes: text('notes'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 11. Grazing Schedule — pasture rotation plan
export const lvsGrazingSchedule = mysqlTable('lvs_grazing_schedule', {
  grazing_id: varchar('grazing_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id, { onDelete: 'cascade' }),
  field_name: varchar('field_name', { length: 200 }).notNull(),   // Pasture / field reference
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id),
  from_date: date('from_date', { mode: 'string' }).notNull(),
  to_date: date('to_date', { mode: 'string' }),
  area_acres: decimal('area_acres', { precision: 10, scale: 2 }),
  estimated_biomass_kg: decimal('estimated_biomass_kg', { precision: 12, scale: 2 }),
  actual_consumption_kg: decimal('actual_consumption_kg', { precision: 12, scale: 2 }),
  status: varchar('status', { length: 20 }).default('PLANNED'),   // PLANNED / ACTIVE / COMPLETED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 12. Mortality Record — individual animal death
export const lvsMortalityRecord = mysqlTable('lvs_mortality_record', {
  mortality_id: varchar('mortality_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  animal_id: varchar('animal_id', { length: 36 }).references(() => lvsAnimal.animal_id),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id),
  death_date: date('death_date', { mode: 'string' }).notNull(),
  cause_of_death: varchar('cause_of_death', { length: 300 }).notNull(), // DISEASE / ACCIDENT / NATURAL / UNKNOWN
  disease_id: varchar('disease_id', { length: 36 }).references(() => diseaseMaster.disease_id),
  weight_at_death_kg: decimal('weight_at_death_kg', { precision: 10, scale: 2 }),
  book_value: decimal('book_value', { precision: 18, scale: 4 }), // NCA / cost at death
  salvage_value: decimal('salvage_value', { precision: 18, scale: 4 }),
  disposal_method: varchar('disposal_method', { length: 50 }),    // BURIED / CREMATED / RENDERING / SOLD_CULL
  insured: boolean('insured').default(false),
  insurance_claim_no: varchar('insurance_claim_no', { length: 100 }),
  vet_certified: boolean('vet_certified').default(false),
  reported_to: varchar('reported_to', { length: 100 }),           // Authority notification (if zoonotic)
  recorded_by: varchar('recorded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 13. Animal Purchase — formal purchase record → links to inventory GR
export const lvsAnimalPurchase = mysqlTable('lvs_animal_purchase', {
  purchase_id: varchar('purchase_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  purchase_no: varchar('purchase_no', { length: 100 }).notNull(),
  purchase_date: date('purchase_date', { mode: 'string' }).notNull(),
  supplier_id: varchar('supplier_id', { length: 36 }).references(() => supplierMaster.supplier_id),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id),
  species_id: varchar('species_id', { length: 36 }).references(() => speciesMaster.species_id),
  qty_purchased: int('qty_purchased').notNull(),
  avg_weight_kg: decimal('avg_weight_kg', { precision: 10, scale: 2 }),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 4 }).notNull(),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }).notNull(),
  transport_cost: decimal('transport_cost', { precision: 12, scale: 4 }),
  quarantine_days: int('quarantine_days').default(0),
  quarantine_end_date: date('quarantine_end_date', { mode: 'string' }),
  inventory_gr_id: varchar('inventory_gr_id', { length: 36 }),    // Link to goods_receipt
  status: varchar('status', { length: 20 }).default('PENDING'),   // PENDING / RECEIVED / QUARANTINE / RELEASED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 14. Animal Sale — formal sale record → links to inventory GI
export const lvsAnimalSale = mysqlTable('lvs_animal_sale', {
  sale_id: varchar('sale_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  sale_no: varchar('sale_no', { length: 100 }).notNull(),
  sale_date: date('sale_date', { mode: 'string' }).notNull(),
  customer_id: varchar('customer_id', { length: 36 }).references(() => customerMaster.customer_id),
  sale_type: varchar('sale_type', { length: 30 }).notNull(),      // LIVE / SLAUGHTER / BREEDING
  qty_sold: int('qty_sold').notNull(),
  avg_weight_kg: decimal('avg_weight_kg', { precision: 10, scale: 2 }),
  unit_price: decimal('unit_price', { precision: 18, scale: 4 }).notNull(),
  total_revenue: decimal('total_revenue', { precision: 18, scale: 4 }).notNull(),
  transport_cost: decimal('transport_cost', { precision: 12, scale: 4 }),
  inventory_gi_id: varchar('inventory_gi_id', { length: 36 }),    // Link to goods_issue
  payment_status: varchar('payment_status', { length: 20 }).default('PENDING'),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 15. Livestock KPI Snapshot — periodic KPI calculation results
export const lvsKpiSnapshot = mysqlTable('lvs_kpi_snapshot', {
  snapshot_id: varchar('snapshot_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  herd_id: varchar('herd_id', { length: 36 }).references(() => lvsHerd.herd_id),
  period_date: date('period_date', { mode: 'string' }).notNull(),
  herd_size: int('herd_size'),
  mortality_count: int('mortality_count'),
  mortality_pct: decimal('mortality_pct', { precision: 6, scale: 2 }),
  avg_daily_gain_kg: decimal('avg_daily_gain_kg', { precision: 8, scale: 4 }), // ADG
  total_milk_litres: decimal('total_milk_litres', { precision: 14, scale: 2 }),
  avg_milk_per_cow: decimal('avg_milk_per_cow', { precision: 10, scale: 2 }),
  conceptions_this_period: int('conceptions_this_period'),
  calvings_this_period: int('calvings_this_period'),
  calving_rate_pct: decimal('calving_rate_pct', { precision: 6, scale: 2 }),
  total_feed_cost: decimal('total_feed_cost', { precision: 18, scale: 4 }),
  feed_cost_per_litre: decimal('feed_cost_per_litre', { precision: 10, scale: 4 }),
  calculated_at: timestamp('calculated_at', { mode: 'string' }).defaultNow(),
});


// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL 2: AGRICULTURE (10 tables — agri_extended_*)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Field / Plot Master — persistent farm infrastructure (multi-season)
export const agriField = mysqlTable('agri_field', {
  field_id: varchar('field_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  farm_id: varchar('farm_id', { length: 36 }).references(() => farmMaster.farm_id, { onDelete: 'restrict' }),
  field_code: varchar('field_code', { length: 100 }).notNull(),
  field_name: varchar('field_name', { length: 200 }).notNull(),
  area_acres: decimal('area_acres', { precision: 12, scale: 4 }).notNull(),
  area_hectares: decimal('area_hectares', { precision: 12, scale: 4 }),
  soil_type: varchar('soil_type', { length: 100 }),                // LOAM / CLAY / SANDY / SILT
  soil_ph: decimal('soil_ph', { precision: 5, scale: 2 }),
  gps_lat: decimal('gps_lat', { precision: 11, scale: 8 }),
  gps_long: decimal('gps_long', { precision: 11, scale: 8 }),
  irrigation_type: varchar('irrigation_type', { length: 50 }),     // DRIP / SPRINKLER / FLOOD / RAINFED
  water_source: varchar('water_source', { length: 100 }),          // BOREWELL / CANAL / POND / RAIN
  field_status: varchar('field_status', { length: 20 }).default('AVAILABLE'), // AVAILABLE / IN_CROP / FALLOW / RESTING
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
});

// 2. Soil Analysis — per-field soil test records
export const agriSoilAnalysis = mysqlTable('agri_soil_analysis', {
  analysis_id: varchar('analysis_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id, { onDelete: 'cascade' }),
  test_date: date('test_date', { mode: 'string' }).notNull(),
  lab_name: varchar('lab_name', { length: 200 }),
  report_no: varchar('report_no', { length: 100 }),
  ph: decimal('ph', { precision: 5, scale: 2 }),
  nitrogen_kg_ha: decimal('nitrogen_kg_ha', { precision: 10, scale: 2 }),
  phosphorus_kg_ha: decimal('phosphorus_kg_ha', { precision: 10, scale: 2 }),
  potassium_kg_ha: decimal('potassium_kg_ha', { precision: 10, scale: 2 }),
  organic_matter_pct: decimal('organic_matter_pct', { precision: 6, scale: 2 }),
  ec_ds_m: decimal('ec_ds_m', { precision: 8, scale: 4 }),          // Electrical Conductivity
  recommendations: text('recommendations'),
  next_test_due: date('next_test_due', { mode: 'string' }),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 3. Crop Plan — seasonal plan linking field + crop
export const agriCropPlan = mysqlTable('agri_crop_plan', {
  plan_id: varchar('plan_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id, { onDelete: 'restrict' }),
  season: varchar('season', { length: 50 }).notNull(),              // KHARIF-2026 / RABI-2026 / Q1-2026
  crop_item_id: varchar('crop_item_id', { length: 36 }).references(() => itemMaster.item_id), // Crop = item
  crop_variety: varchar('crop_variety', { length: 200 }),
  sowing_method: varchar('sowing_method', { length: 50 }),          // DIRECT_SEED / TRANSPLANT / CUTTING
  planned_sowing_date: date('planned_sowing_date', { mode: 'string' }),
  actual_sowing_date: date('actual_sowing_date', { mode: 'string' }),
  planned_harvest_date: date('planned_harvest_date', { mode: 'string' }),
  actual_harvest_date: date('actual_harvest_date', { mode: 'string' }),
  target_yield_kg_acre: decimal('target_yield_kg_acre', { precision: 10, scale: 2 }),
  actual_yield_kg_acre: decimal('actual_yield_kg_acre', { precision: 10, scale: 2 }),
  seed_qty_kg: decimal('seed_qty_kg', { precision: 10, scale: 2 }),
  seed_rate_kg_acre: decimal('seed_rate_kg_acre', { precision: 8, scale: 2 }),
  plan_status: varchar('plan_status', { length: 20 }).default('PLANNED'), // PLANNED / SOWING / GROWING / HARVESTED / CLOSED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 4. Crop Calendar Activity — scheduled/actual activities per crop plan
export const agriCropCalendar = mysqlTable('agri_crop_calendar', {
  activity_id: varchar('activity_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id, { onDelete: 'cascade' }),
  activity_type: varchar('activity_type', { length: 50 }).notNull(), // LAND_PREP / SOWING / FERTILIZING / IRRIGATION / PESTICIDE / WEEDING / HARVESTING
  activity_name: varchar('activity_name', { length: 200 }).notNull(),
  scheduled_date: date('scheduled_date', { mode: 'string' }),
  actual_date: date('actual_date', { mode: 'string' }),
  status: varchar('status', { length: 20 }).default('PENDING'),    // PENDING / DONE / SKIPPED / OVERDUE
  assigned_to: varchar('assigned_to', { length: 200 }),
  cost_estimated: decimal('cost_estimated', { precision: 12, scale: 4 }),
  cost_actual: decimal('cost_actual', { precision: 12, scale: 4 }),
  remarks: text('remarks'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 5. Irrigation Log — per-event irrigation tracking
export const agriIrrigationLog = mysqlTable('agri_irrigation_log', {
  log_id: varchar('log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id),
  irrigation_date: date('irrigation_date', { mode: 'string' }).notNull(),
  method: varchar('method', { length: 50 }),                       // DRIP / SPRINKLER / FLOOD / FURROW
  duration_hrs: decimal('duration_hrs', { precision: 8, scale: 2 }),
  volume_litre: decimal('volume_litre', { precision: 14, scale: 2 }),
  water_source: varchar('water_source', { length: 100 }),
  cost: decimal('cost', { precision: 10, scale: 4 }),
  remarks: text('remarks'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 6. Fertilizer Application — per-event fertilizer tracking
export const agriFertilizerApp = mysqlTable('agri_fertilizer_app', {
  app_id: varchar('app_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id),
  app_date: date('app_date', { mode: 'string' }).notNull(),
  fertilizer_item_id: varchar('fertilizer_item_id', { length: 36 }).references(() => itemMaster.item_id),
  fertilizer_name: varchar('fertilizer_name', { length: 200 }),
  qty_kg: decimal('qty_kg', { precision: 10, scale: 2 }).notNull(),
  qty_per_acre: decimal('qty_per_acre', { precision: 10, scale: 2 }),
  method: varchar('method', { length: 50 }),                       // BROADCAST / SIDE_DRESS / DRIP_FEED / FOLIAR
  growth_stage: varchar('growth_stage', { length: 100 }),          // BASAL / TILLERING / FLOWERING / GRAIN_FILL
  cost: decimal('cost', { precision: 10, scale: 4 }),
  inventory_gi_id: varchar('inventory_gi_id', { length: 36 }),     // Link to GI when issued from warehouse
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 7. Pesticide Application — pest/disease spray tracking with PHI
export const agriPesticideApp = mysqlTable('agri_pesticide_app', {
  app_id: varchar('app_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id),
  app_date: date('app_date', { mode: 'string' }).notNull(),
  pest_type: varchar('pest_type', { length: 100 }),                // INSECT / FUNGAL / WEED / BACTERIAL / VIRAL
  pest_name: varchar('pest_name', { length: 200 }),
  pesticide_item_id: varchar('pesticide_item_id', { length: 36 }).references(() => itemMaster.item_id),
  pesticide_name: varchar('pesticide_name', { length: 200 }),
  qty_litre: decimal('qty_litre', { precision: 10, scale: 2 }),
  dilution_ratio: varchar('dilution_ratio', { length: 50 }),       // e.g. "1:100"
  phi_days: int('phi_days'),                                       // Pre-Harvest Interval (days)
  safe_harvest_date: date('safe_harvest_date', { mode: 'string' }), // app_date + phi_days
  applicator: varchar('applicator', { length: 200 }),
  weather_conditions: varchar('weather_conditions', { length: 100 }),
  cost: decimal('cost', { precision: 10, scale: 4 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 8. Harvest Plan — planned harvest for a crop plan
export const agriHarvestPlan = mysqlTable('agri_harvest_plan', {
  harvest_plan_id: varchar('harvest_plan_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id, { onDelete: 'cascade' }),
  target_harvest_date: date('target_harvest_date', { mode: 'string' }).notNull(),
  expected_yield_kg: decimal('expected_yield_kg', { precision: 14, scale: 2 }),
  harvest_method: varchar('harvest_method', { length: 50 }),       // MANUAL / MECHANICAL
  resources_required: text('resources_required'),
  status: varchar('status', { length: 20 }).default('PLANNED'),   // PLANNED / IN_PROGRESS / COMPLETED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 9. Yield Analysis — post-harvest actual vs planned analysis
export const agriYieldAnalysis = mysqlTable('agri_yield_analysis', {
  analysis_id: varchar('analysis_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id),
  harvest_plan_id: varchar('harvest_plan_id', { length: 36 }).references(() => agriHarvestPlan.harvest_plan_id),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id),
  actual_yield_kg: decimal('actual_yield_kg', { precision: 14, scale: 2 }).notNull(),
  actual_yield_kg_acre: decimal('actual_yield_kg_acre', { precision: 10, scale: 2 }),
  planned_yield_kg: decimal('planned_yield_kg', { precision: 14, scale: 2 }),
  yield_variance_kg: decimal('yield_variance_kg', { precision: 14, scale: 2 }),
  yield_variance_pct: decimal('yield_variance_pct', { precision: 8, scale: 2 }),
  total_production_cost: decimal('total_production_cost', { precision: 18, scale: 4 }),
  cost_per_kg: decimal('cost_per_kg', { precision: 10, scale: 4 }),
  cost_per_acre: decimal('cost_per_acre', { precision: 12, scale: 4 }),
  sale_price_per_kg: decimal('sale_price_per_kg', { precision: 10, scale: 4 }),
  total_revenue: decimal('total_revenue', { precision: 18, scale: 4 }),
  gross_margin: decimal('gross_margin', { precision: 18, scale: 4 }),
  gross_margin_pct: decimal('gross_margin_pct', { precision: 8, scale: 2 }),
  inventory_gr_id: varchar('inventory_gr_id', { length: 36 }),    // Link to GR for harvest output
  calculated_by: varchar('calculated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 10. Resource Assignment — assign labour/equipment to field activities
export const agriResourceAssignment = mysqlTable('agri_resource_assignment', {
  assignment_id: varchar('assignment_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  plan_id: varchar('plan_id', { length: 36 }).references(() => agriCropPlan.plan_id),
  activity_id: varchar('activity_id', { length: 36 }).references(() => agriCropCalendar.activity_id),
  field_id: varchar('field_id', { length: 36 }).references(() => agriField.field_id),
  resource_id: varchar('resource_id', { length: 36 }).references(() => resourceMaster.resource_id),
  assigned_date: date('assigned_date', { mode: 'string' }).notNull(),
  hours_planned: decimal('hours_planned', { precision: 8, scale: 2 }),
  hours_actual: decimal('hours_actual', { precision: 8, scale: 2 }),
  rate_per_hour: decimal('rate_per_hour', { precision: 10, scale: 4 }),
  total_cost: decimal('total_cost', { precision: 12, scale: 4 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});


// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL 3: AQUACULTURE EXTENSION (10 tables — aqua_ext_*)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Pond Master — physical pond infrastructure
export const aquaPond = mysqlTable('aqua_pond', {
  pond_id: varchar('pond_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  farm_id: varchar('farm_id', { length: 36 }).references(() => farmMaster.farm_id),
  pond_code: varchar('pond_code', { length: 100 }).notNull(),
  pond_name: varchar('pond_name', { length: 200 }).notNull(),
  pond_type: varchar('pond_type', { length: 30 }).default('EARTHEN'), // EARTHEN / CONCRETE / CAGE / RAS / BIOFLOC
  area_sqm: decimal('area_sqm', { precision: 12, scale: 2 }),
  depth_m: decimal('depth_m', { precision: 6, scale: 2 }),
  water_volume_m3: decimal('water_volume_m3', { precision: 14, scale: 2 }),
  water_source: varchar('water_source', { length: 100 }),             // BOREWELL / RIVER / CANAL / SEAWATER
  aerator_count: int('aerator_count'),
  aerator_hp: decimal('aerator_hp', { precision: 6, scale: 2 }),
  pond_status: varchar('pond_status', { length: 20 }).default('EMPTY'), // EMPTY / STOCKED / HARVESTED / UNDER_PREP
  current_batch_id: varchar('current_batch_id', { length: 36 }),
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
});

// 2. Tank Master — indoor recirculating / tank systems
export const aquaTank = mysqlTable('aqua_tank', {
  tank_id: varchar('tank_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  farm_id: varchar('farm_id', { length: 36 }).references(() => farmMaster.farm_id),
  tank_code: varchar('tank_code', { length: 100 }).notNull(),
  tank_name: varchar('tank_name', { length: 200 }).notNull(),
  system_type: varchar('system_type', { length: 50 }),               // RAS / BIOFLOC / FLOW_THROUGH / RACEWAY
  capacity_litre: decimal('capacity_litre', { precision: 14, scale: 2 }),
  shape: varchar('shape', { length: 30 }),                           // ROUND / RECTANGULAR / OVAL
  material: varchar('material', { length: 50 }),                     // FIBERGLASS / HDPE / CONCRETE
  filter_type: varchar('filter_type', { length: 100 }),              // BIO_FILTER / MECHANICAL / UV
  tank_status: varchar('tank_status', { length: 20 }).default('EMPTY'),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 3. Stocking Event — formal fingerling stocking linked to a pond/tank
export const aquaStockingEvent = mysqlTable('aqua_stocking_event', {
  stocking_id: varchar('stocking_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  tank_id: varchar('tank_id', { length: 36 }).references(() => aquaTank.tank_id),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),   // Links to existing aqua_batch
  species_id: varchar('species_id', { length: 36 }).references(() => speciesMaster.species_id),
  stocking_date: date('stocking_date', { mode: 'string' }).notNull(),
  fingerlings_qty: int('fingerlings_qty').notNull(),
  avg_fingerling_weight_g: decimal('avg_fingerling_weight_g', { precision: 8, scale: 2 }),
  source: varchar('source', { length: 200 }),                        // Hatchery name
  supplier_id: varchar('supplier_id', { length: 36 }).references(() => supplierMaster.supplier_id),
  stocking_density_per_sqm: decimal('stocking_density_per_sqm', { precision: 8, scale: 2 }),
  unit_cost: decimal('unit_cost', { precision: 10, scale: 4 }),
  total_cost: decimal('total_cost', { precision: 14, scale: 4 }),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 4. Water Quality Log — periodic water parameter monitoring
export const aquaWaterQuality = mysqlTable('aqua_water_quality', {
  log_id: varchar('log_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  tank_id: varchar('tank_id', { length: 36 }).references(() => aquaTank.tank_id),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),
  log_date: date('log_date', { mode: 'string' }).notNull(),
  log_time: varchar('log_time', { length: 10 }),                     // HH:MM
  ph: decimal('ph', { precision: 5, scale: 2 }),                     // Optimal 7.0–8.5
  do_mg_l: decimal('do_mg_l', { precision: 6, scale: 2 }),           // Dissolved Oxygen — ALERT < 5.0
  temperature_c: decimal('temperature_c', { precision: 5, scale: 2 }),
  ammonia_ppm: decimal('ammonia_ppm', { precision: 8, scale: 4 }),   // ALERT > 0.5 ppm
  nitrite_ppm: decimal('nitrite_ppm', { precision: 8, scale: 4 }),   // ALERT > 0.1 ppm
  nitrate_ppm: decimal('nitrate_ppm', { precision: 8, scale: 4 }),
  turbidity_ntu: decimal('turbidity_ntu', { precision: 8, scale: 2 }),
  salinity_ppt: decimal('salinity_ppt', { precision: 6, scale: 2 }),
  water_quality_index: decimal('water_quality_index', { precision: 5, scale: 2 }), // Computed 0-100
  status: varchar('status', { length: 20 }).default('NORMAL'),       // NORMAL / WARNING / CRITICAL
  alerts: text('alerts'),                                             // JSON array of alert messages
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 5. Feeding Schedule — automated/planned feed schedule per pond
export const aquaFeedingSchedule = mysqlTable('aqua_feeding_schedule', {
  schedule_id: varchar('schedule_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),
  feed_item_id: varchar('feed_item_id', { length: 36 }).references(() => itemMaster.item_id),
  daily_rate_pct: decimal('daily_rate_pct', { precision: 5, scale: 2 }), // % of biomass per day
  feeds_per_day: int('feeds_per_day').default(2),
  feed_times: varchar('feed_times', { length: 200 }),                // e.g. "08:00,17:00"
  effective_from: date('effective_from', { mode: 'string' }),
  effective_to: date('effective_to', { mode: 'string' }),
  is_active: boolean('is_active').default(true),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 6. Growth Sample — periodic sample weighing for ABW / FCR calculation
export const aquaGrowthSample = mysqlTable('aqua_growth_sample', {
  sample_id: varchar('sample_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),
  sample_date: date('sample_date', { mode: 'string' }).notNull(),
  culture_day: int('culture_day'),                                   // Day since stocking
  sample_count: int('sample_count').notNull(),                       // Fish sampled
  avg_weight_g: decimal('avg_weight_g', { precision: 10, scale: 2 }).notNull(), // ABW
  total_estimated_biomass_kg: decimal('total_estimated_biomass_kg', { precision: 14, scale: 2 }),
  survival_rate_pct: decimal('survival_rate_pct', { precision: 6, scale: 2 }),
  fcr_running: decimal('fcr_running', { precision: 6, scale: 3 }),   // Running FCR at sample date
  adg_g: decimal('adg_g', { precision: 8, scale: 3 }),              // Average daily gain grams
  recorded_by: varchar('recorded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 7. Mortality Event — disease/environmental mortality events
export const aquaMortalityEvent = mysqlTable('aqua_mortality_event', {
  event_id: varchar('event_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),
  event_date: date('event_date', { mode: 'string' }).notNull(),
  qty_dead: int('qty_dead').notNull(),
  avg_weight_g: decimal('avg_weight_g', { precision: 8, scale: 2 }),
  cause: varchar('cause', { length: 200 }),                         // DISEASE / LOW_DO / TEMPERATURE / PREDATOR / UNKNOWN
  remarks: text('remarks'),
  action_taken: text('action_taken'),
  recorded_by: varchar('recorded_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 8. Disease Event — disease diagnosis and treatment protocol
export const aquaDiseaseEvent = mysqlTable('aqua_disease_event', {
  disease_id: varchar('disease_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),
  event_date: date('event_date', { mode: 'string' }).notNull(),
  symptoms: text('symptoms').notNull(),
  diagnosis: varchar('diagnosis', { length: 500 }),
  pathogen: varchar('pathogen', { length: 200 }),                   // Specific virus/bacteria/parasite
  severity: varchar('severity', { length: 20 }).default('MODERATE'), // MILD / MODERATE / SEVERE / CRITICAL
  treatment_protocol: text('treatment_protocol'),
  medicine_used: varchar('medicine_used', { length: 500 }),
  withdrawal_days: int('withdrawal_days'),
  vet_name: varchar('vet_name', { length: 200 }),
  outcome: varchar('outcome', { length: 30 }),                      // RECOVERED / ONGOING / LOSS
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 9. Pond Treatment — chemical/lime pond treatment log
export const aquaPondTreatment = mysqlTable('aqua_pond_treatment', {
  treatment_id: varchar('treatment_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  pond_id: varchar('pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  treatment_date: date('treatment_date', { mode: 'string' }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(),            // DISINFECTION / LIMING / PROB_IOTIC / ALGAECIDE
  chemical_name: varchar('chemical_name', { length: 200 }).notNull(),
  qty_kg: decimal('qty_kg', { precision: 10, scale: 2 }),
  application_method: varchar('application_method', { length: 100 }),
  withdrawal_period_days: int('withdrawal_period_days'),
  applied_by: varchar('applied_by', { length: 200 }),
  cost: decimal('cost', { precision: 10, scale: 4 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 10. Batch Transfer — inter-pond transfer
export const aquaBatchTransfer = mysqlTable('aqua_batch_transfer', {
  transfer_id: varchar('transfer_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).references(() => aquaBatch.batch_id),
  from_pond_id: varchar('from_pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  to_pond_id: varchar('to_pond_id', { length: 36 }).references(() => aquaPond.pond_id),
  transfer_date: date('transfer_date', { mode: 'string' }).notNull(),
  qty_transferred: int('qty_transferred').notNull(),
  avg_weight_g: decimal('avg_weight_g', { precision: 8, scale: 2 }),
  reason: varchar('reason', { length: 200 }),                       // THINNING / GROW_OUT / DISEASE_MANAGEMENT
  recorded_by: varchar('recorded_by', { length: 36 }),
  notes: text('notes'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});


// ─────────────────────────────────────────────────────────────────────────────
// VERTICAL 4: FEED PRODUCTION EXTENSION (10 tables — feed_ext_*)
// ─────────────────────────────────────────────────────────────────────────────

// 1. Formula Version History — tracks changes to BOR formulas
export const feedFormulaVersion = mysqlTable('feed_formula_version', {
  version_id: varchar('version_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  bor_id: varchar('bor_id', { length: 36 }).references(() => borMaster.bor_id, { onDelete: 'cascade' }),
  version_no: int('version_no').notNull(),
  effective_from: date('effective_from', { mode: 'string' }).notNull(),
  effective_to: date('effective_to', { mode: 'string' }),
  change_reason: text('change_reason'),
  approved_by: varchar('approved_by', { length: 36 }),
  approved_at: timestamp('approved_at', { mode: 'string' }),
  status: varchar('status', { length: 20 }).default('DRAFT'),       // DRAFT / APPROVED / SUPERSEDED
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 2. Manufacturing Order — formal MO before production starts
export const feedManufacturingOrder = mysqlTable('feed_manufacturing_order', {
  mo_id: varchar('mo_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  mo_no: varchar('mo_no', { length: 100 }).notNull(),
  bor_id: varchar('bor_id', { length: 36 }).references(() => borMaster.bor_id, { onDelete: 'restrict' }),
  formula_version_id: varchar('formula_version_id', { length: 36 }).references(() => feedFormulaVersion.version_id),
  planned_qty_mt: decimal('planned_qty_mt', { precision: 14, scale: 2 }).notNull(), // Planned qty in MT
  actual_qty_mt: decimal('actual_qty_mt', { precision: 14, scale: 2 }),             // Actual produced
  uom_id: varchar('uom_id', { length: 36 }),
  planned_start_date: date('planned_start_date', { mode: 'string' }),
  planned_end_date: date('planned_end_date', { mode: 'string' }),
  actual_start_date: date('actual_start_date', { mode: 'string' }),
  actual_end_date: date('actual_end_date', { mode: 'string' }),
  target_warehouse_id: varchar('target_warehouse_id', { length: 36 }).references(() => warehouseMaster.warehouse_id),
  priority: varchar('priority', { length: 10 }).default('NORMAL'),  // LOW / NORMAL / HIGH / URGENT
  current_stage: varchar('current_stage', { length: 30 }).default('CREATED'), // CREATED / GRINDING / MIXING / PELLETIZING / PACKING / QUALITY_CHECK / COMPLETED / CLOSED
  mo_status: varchar('mo_status', { length: 20 }).default('OPEN'),  // OPEN / IN_PROGRESS / COMPLETED / CLOSED / CANCELLED
  production_batch_id: varchar('production_batch_id', { length: 36 }), // Link to productionBatch table
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  approved_by: varchar('approved_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 3. Production Stage — tracking each stage of feed manufacturing
export const feedBatchStage = mysqlTable('feed_batch_stage', {
  stage_id: varchar('stage_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  mo_id: varchar('mo_id', { length: 36 }).references(() => feedManufacturingOrder.mo_id, { onDelete: 'cascade' }),
  stage_name: varchar('stage_name', { length: 30 }).notNull(),       // GRINDING / MIXING / PELLETIZING / COOLING / PACKING
  stage_seq: int('stage_seq').notNull(),                             // Sequence 1, 2, 3, 4, 5
  status: varchar('status', { length: 20 }).default('PENDING'),     // PENDING / IN_PROGRESS / COMPLETED / SKIPPED
  started_at: timestamp('started_at', { mode: 'string' }),
  completed_at: timestamp('completed_at', { mode: 'string' }),
  duration_minutes: int('duration_minutes'),
  machine_id: varchar('machine_id', { length: 36 }).references(() => resourceMaster.resource_id),
  operator: varchar('operator', { length: 200 }),
  input_qty_mt: decimal('input_qty_mt', { precision: 12, scale: 2 }),
  output_qty_mt: decimal('output_qty_mt', { precision: 12, scale: 2 }),
  stage_loss_pct: decimal('stage_loss_pct', { precision: 6, scale: 2 }), // Moisture loss / byproduct
  remarks: text('remarks'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 4. QC Inspection — feed batch quality inspection
export const feedQcInspection = mysqlTable('feed_qc_inspection', {
  inspection_id: varchar('inspection_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  mo_id: varchar('mo_id', { length: 36 }).references(() => feedManufacturingOrder.mo_id, { onDelete: 'cascade' }),
  inspection_date: date('inspection_date', { mode: 'string' }).notNull(),
  moisture_pct: decimal('moisture_pct', { precision: 6, scale: 2 }),     // Max 12%
  protein_pct: decimal('protein_pct', { precision: 6, scale: 2 }),       // Min depends on formula
  fat_pct: decimal('fat_pct', { precision: 6, scale: 2 }),
  fiber_pct: decimal('fiber_pct', { precision: 6, scale: 2 }),
  ash_pct: decimal('ash_pct', { precision: 6, scale: 2 }),
  bulk_density_kg_m3: decimal('bulk_density_kg_m3', { precision: 8, scale: 2 }),
  pellet_durability_pct: decimal('pellet_durability_pct', { precision: 6, scale: 2 }), // PDI %
  aflatoxin_ppb: decimal('aflatoxin_ppb', { precision: 8, scale: 4 }),   // Max 10 ppb
  qc_result: varchar('qc_result', { length: 20 }).notNull(),             // PASS / FAIL / CONDITIONAL_PASS
  rejection_reason: text('rejection_reason'),
  disposition: varchar('disposition', { length: 30 }),                   // RELEASE / QUARANTINE / REWORK / DESTROY
  inspector: varchar('inspector', { length: 200 }),
  lab_report_no: varchar('lab_report_no', { length: 100 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 5. Ingredient Price — purchase price history for cost estimation
export const feedIngredientPrice = mysqlTable('feed_ingredient_price', {
  price_id: varchar('price_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  effective_date: date('effective_date', { mode: 'string' }).notNull(),
  price_per_mt: decimal('price_per_mt', { precision: 14, scale: 4 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('INR'),
  source: varchar('source', { length: 100 }),                        // SPOT / CONTRACT / AVERAGE
  supplier_id: varchar('supplier_id', { length: 36 }).references(() => supplierMaster.supplier_id),
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 6. Cost Breakdown — real-time per-MO cost breakdown per kg
export const feedCostBreakdown = mysqlTable('feed_cost_breakdown', {
  breakdown_id: varchar('breakdown_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  mo_id: varchar('mo_id', { length: 36 }).references(() => feedManufacturingOrder.mo_id, { onDelete: 'cascade' }),
  ingredient_cost: decimal('ingredient_cost', { precision: 18, scale: 4 }),
  overhead_cost: decimal('overhead_cost', { precision: 14, scale: 4 }),
  labour_cost: decimal('labour_cost', { precision: 14, scale: 4 }),
  energy_cost: decimal('energy_cost', { precision: 14, scale: 4 }),
  packaging_cost: decimal('packaging_cost', { precision: 14, scale: 4 }),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }),
  produced_qty_mt: decimal('produced_qty_mt', { precision: 12, scale: 2 }),
  cost_per_mt: decimal('cost_per_mt', { precision: 12, scale: 4 }),
  cost_per_kg: decimal('cost_per_kg', { precision: 10, scale: 4 }),
  calculated_at: timestamp('calculated_at', { mode: 'string' }).defaultNow(),
  notes: text('notes'),
});

// 7. Delivery Note — feed dispatch to farm/customer
export const feedDeliveryNote = mysqlTable('feed_delivery_note', {
  delivery_id: varchar('delivery_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  delivery_no: varchar('delivery_no', { length: 100 }).notNull(),
  delivery_date: date('delivery_date', { mode: 'string' }).notNull(),
  mo_id: varchar('mo_id', { length: 36 }).references(() => feedManufacturingOrder.mo_id),
  customer_id: varchar('customer_id', { length: 36 }).references(() => customerMaster.customer_id),
  farm_id: varchar('farm_id', { length: 36 }).references(() => farmMaster.farm_id),
  feed_item_id: varchar('feed_item_id', { length: 36 }).references(() => itemMaster.item_id),
  qty_mt: decimal('qty_mt', { precision: 12, scale: 2 }).notNull(),
  unit_price: decimal('unit_price', { precision: 14, scale: 4 }),
  total_value: decimal('total_value', { precision: 18, scale: 4 }),
  vehicle_no: varchar('vehicle_no', { length: 50 }),
  driver_name: varchar('driver_name', { length: 200 }),
  inventory_gi_id: varchar('inventory_gi_id', { length: 36 }),       // Link to goods_issue
  status: varchar('status', { length: 20 }).default('PENDING'),     // PENDING / DISPATCHED / DELIVERED / RETURNED
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

// 8. Feed Return Note — customer/farm feed returns
export const feedReturnNote = mysqlTable('feed_return_note', {
  return_id: varchar('return_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  delivery_id: varchar('delivery_id', { length: 36 }).references(() => feedDeliveryNote.delivery_id),
  return_date: date('return_date', { mode: 'string' }).notNull(),
  qty_returned_mt: decimal('qty_returned_mt', { precision: 12, scale: 2 }).notNull(),
  reason: varchar('reason', { length: 300 }).notNull(),             // DAMAGED / WRONG_PRODUCT / QUALITY_ISSUE / EXCESS
  condition: varchar('condition', { length: 20 }).default('DAMAGED'), // GOOD / DAMAGED / CONTAMINATED
  disposal: varchar('disposal', { length: 30 }),                    // RESTOCK / QUARANTINE / DESTROY
  inventory_gr_id: varchar('inventory_gr_id', { length: 36 }),      // Link to GR if restocked
  notes: text('notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// 9. Feed KPI Snapshot — batch-level KPI capture
export const feedKpiSnapshot = mysqlTable('feed_kpi_snapshot', {
  snapshot_id: varchar('snapshot_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  period_date: date('period_date', { mode: 'string' }).notNull(),
  total_mos: int('total_mos'),
  completed_mos: int('completed_mos'),
  avg_batch_efficiency_pct: decimal('avg_batch_efficiency_pct', { precision: 6, scale: 2 }),
  avg_qc_pass_rate_pct: decimal('avg_qc_pass_rate_pct', { precision: 6, scale: 2 }),
  total_feed_produced_mt: decimal('total_feed_produced_mt', { precision: 14, scale: 2 }),
  avg_cost_per_mt: decimal('avg_cost_per_mt', { precision: 12, scale: 4 }),
  total_deliveries: int('total_deliveries'),
  total_returns: int('total_returns'),
  return_rate_pct: decimal('return_rate_pct', { precision: 6, scale: 2 }),
  calculated_at: timestamp('calculated_at', { mode: 'string' }).defaultNow(),
});

// 10. Ingredient Inventory — lightweight real-time ingredient stock before formal GR
export const feedIngredientInventory = mysqlTable('feed_ingredient_inventory', {
  inv_id: varchar('inv_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'cascade' }),
  warehouse_id: varchar('warehouse_id', { length: 36 }).references(() => warehouseMaster.warehouse_id),
  qty_on_hand_mt: decimal('qty_on_hand_mt', { precision: 14, scale: 2 }).notNull().default('0.00'),
  reorder_point_mt: decimal('reorder_point_mt', { precision: 12, scale: 2 }),
  last_receipt_date: date('last_receipt_date', { mode: 'string' }),
  last_issue_date: date('last_issue_date', { mode: 'string' }),
  last_price_per_mt: decimal('last_price_per_mt', { precision: 14, scale: 4 }),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

