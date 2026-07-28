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

