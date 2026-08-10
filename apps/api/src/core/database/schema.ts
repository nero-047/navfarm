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
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
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
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
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
  // Exactly one of farm_id / shed_id / warehouse_id should be set — this location's
  // direct parent. Enforced at the service layer, not the DB (MySQL has no clean way
  // to express "exactly one of three nullable columns" as a constraint).
  farm_id: varchar('farm_id', { length: 36 }),
  shed_id: varchar('shed_id', { length: 36 }),
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
  }).onDelete('restrict'),
  farmFk: foreignKey({
    columns: [table.farm_id],
    foreignColumns: [farmMaster.farm_id],
    name: 'loc_master_farm_id_fk'
  }).onDelete('restrict'),
  shedFk: foreignKey({
    columns: [table.shed_id],
    foreignColumns: [shedMaster.shed_id],
    name: 'loc_master_shed_id_fk'
  }).onDelete('restrict'),
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
  nob_id: varchar('nob_id', { length: 36 }), // NOB scope (null = available across all NOBs)
  lob_id: varchar('lob_id', { length: 36 }), // LOB scope (null = not LOB-restricted)
  resource_sub_type: varchar('resource_sub_type', { length: 50 }), // PERMANENT/CONTRACT/DAILY (labor); OWNED/LEASED/RENTED (equipment)
  employee_id: varchar('employee_id', { length: 50 }), // HR employee ID (manpower resources only)
  designation: varchar('designation', { length: 100 }), // Job title (manpower resources only)
  capacity: decimal('capacity', { precision: 18, scale: 4 }),
  capacity_uom: varchar('capacity_uom', { length: 20 }),
  unit: varchar('unit', { length: 20 }),
  cost_rate: decimal('cost_rate', { precision: 18, scale: 4 }),
  asset_code: varchar('asset_code', { length: 50 }),
  asset_make: varchar('asset_make', { length: 100 }),
  asset_model: varchar('asset_model', { length: 100 }),
  asset_serial_no: varchar('asset_serial_no', { length: 100 }),
  purchase_date: date('purchase_date', { mode: 'string' }),
  warranty_expiry_date: date('warranty_expiry_date', { mode: 'string' }),
  maintenance_frequency_days: int('maintenance_frequency_days'),
  last_maintenance_date: date('last_maintenance_date', { mode: 'string' }),
  next_maintenance_date: date('next_maintenance_date', { mode: 'string' }),
  maintenance_cost_per_service: decimal('maintenance_cost_per_service', { precision: 18, scale: 4 }),
  maintenance_vendor: varchar('maintenance_vendor', { length: 200 }),
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
  }).onDelete('restrict'),
  nobFk: foreignKey({
    columns: [table.nob_id],
    foreignColumns: [nobMaster.nob_id],
    name: 'res_master_nob_id_fk'
  }).onDelete('restrict'),
  lobFk: foreignKey({
    columns: [table.lob_id],
    foreignColumns: [lobMaster.lob_id],
    name: 'res_master_lob_id_fk'
  }).onDelete('restrict'),
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

// ==========================================
// 10. FINANCE ENGINE (Phase 4)
// ==========================================

export const journalHeader = mysqlTable('journal_header', {
  journal_id: varchar('journal_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  journal_no: varchar('journal_no', { length: 50 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  source: varchar('source', { length: 10 }).notNull(), // MANUAL, SYSTEM
  source_document_type: varchar('source_document_type', { length: 30 }),
  source_document_no: varchar('source_document_no', { length: 50 }),
  source_ledger_id: varchar('source_ledger_id', { length: 36 }).references(() => inventoryLedger.ledger_id, { onDelete: 'restrict' }),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  total_debit: decimal('total_debit', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  total_credit: decimal('total_credit', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  posted_at: timestamp('posted_at', { mode: 'string' }),
  posted_by: varchar('posted_by', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  // Defense in depth alongside the row-locked generator in journal.service.ts —
  // a duplicate journal_no under concurrent inserts fails loudly instead of
  // silently corrupting the document sequence.
  uniqueIndex('uq_journal_header_tenant_company_no').on(table.tenant_id, table.company_id, table.journal_no),
]);

export const journalLine = mysqlTable('journal_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  journal_id: varchar('journal_id', { length: 36 }).notNull().references(() => journalHeader.journal_id, { onDelete: 'cascade' }),
  line_no: int('line_no').notNull(),
  gl_account_id: varchar('gl_account_id', { length: 36 }).notNull().references(() => glAccountMaster.gl_account_id, { onDelete: 'restrict' }),
  cost_center_id: varchar('cost_center_id', { length: 36 }).references(() => costCenterMaster.cost_center_id, { onDelete: 'restrict' }),
  debit_amount: decimal('debit_amount', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  credit_amount: decimal('credit_amount', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  description: varchar('description', { length: 500 }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
});

export const journalHeaderRelations = relations(journalHeader, ({ one, many }) => ({
  company: one(companyMaster, { fields: [journalHeader.company_id], references: [companyMaster.company_id] }),
  sourceLedger: one(inventoryLedger, { fields: [journalHeader.source_ledger_id], references: [inventoryLedger.ledger_id] }),
  lines: many(journalLine),
}));

export const journalLineRelations = relations(journalLine, ({ one }) => ({
  journal: one(journalHeader, { fields: [journalLine.journal_id], references: [journalHeader.journal_id] }),
  glAccount: one(glAccountMaster, { fields: [journalLine.gl_account_id], references: [glAccountMaster.gl_account_id] }),
  costCenter: one(costCenterMaster, { fields: [journalLine.cost_center_id], references: [costCenterMaster.cost_center_id] }),
}));

// ==========================================
// 11. PRODUCTION ENGINE (Phase 5) — STANDARD/FIFO batches only.
// Bio-asset (IAS41) batch accounting is a separate, deferred model.
// ==========================================

export const batchHeader = mysqlTable('batch_header', {
  batch_id: varchar('batch_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  batch_no: varchar('batch_no', { length: 50 }).notNull(),
  lob_id: varchar('lob_id', { length: 36 }).notNull().references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  costing_method: varchar('costing_method', { length: 20 }).notNull(), // STANDARD, FIFO
  breed_id: varchar('breed_id', { length: 36 }).references(() => breedMaster.breed_id, { onDelete: 'restrict' }),
  scheduler_id: varchar('scheduler_id', { length: 36 }).references(() => schedulerMaster.scheduler_id, { onDelete: 'restrict' }),
  shed_id: varchar('shed_id', { length: 36 }),
  location_id: varchar('location_id', { length: 36 }),
  start_date: date('start_date', { mode: 'string' }).notNull(),
  expected_end_date: date('expected_end_date', { mode: 'string' }),
  actual_end_date: date('actual_end_date', { mode: 'string' }),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, ACTIVE, CLOSED, CANCELLED
  opening_quantity: decimal('opening_quantity', { precision: 18, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  closing_quantity: decimal('closing_quantity', { precision: 18, scale: 4 }),
  total_cost: decimal('total_cost', { precision: 18, scale: 4 }),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 6 }),
  remarks: text('remarks'),
  closed_at: timestamp('closed_at', { mode: 'string' }),
  closed_by: varchar('closed_by', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => ({
  shedFk: foreignKey({
    columns: [table.shed_id],
    foreignColumns: [shedMaster.shed_id],
    name: 'batch_header_shed_id_fk'
  }).onDelete('restrict'),
  locationFk: foreignKey({
    columns: [table.location_id],
    foreignColumns: [locationMaster.location_id],
    name: 'batch_header_location_id_fk'
  }).onDelete('restrict'),
  // Defense in depth alongside the row-locked generator in batch.service.ts —
  // a duplicate batch_no under concurrent inserts fails loudly instead of
  // silently corrupting the document sequence.
  uqBatchNo: uniqueIndex('uq_batch_header_tenant_company_no').on(table.tenant_id, table.company_id, table.batch_no),
}));

export const batchInputLine = mysqlTable('batch_input_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  line_no: int('line_no').notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  // Traceability: set when this input is another batch's output (e.g. Hatching
  // sourced from Laying + Breeding batches), rather than a plain inventory item.
  source_batch_id: varchar('source_batch_id', { length: 36 }),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  rate: decimal('rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
}, (table) => ({
  batchFk: foreignKey({
    columns: [table.batch_id],
    foreignColumns: [batchHeader.batch_id],
    name: 'batch_input_line_batch_id_fk'
  }).onDelete('cascade'),
  sourceBatchFk: foreignKey({
    columns: [table.source_batch_id],
    foreignColumns: [batchHeader.batch_id],
    name: 'batch_input_line_source_fk'
  }).onDelete('restrict'),
}));

export const batchTransaction = mysqlTable('batch_transaction', {
  transaction_id: varchar('transaction_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => batchHeader.batch_id, { onDelete: 'cascade' }),
  transaction_date: date('transaction_date', { mode: 'string' }).notNull(),
  transaction_type: varchar('transaction_type', { length: 20 }).notNull(), // CONSUMPTION, MORTALITY, OUTPUT, OVERHEAD, OBSERVATION
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  resource_id: varchar('resource_id', { length: 36 }).references(() => resourceMaster.resource_id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 18, scale: 4 }),
  uom: varchar('uom', { length: 20 }),
  rate: decimal('rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  remarks: varchar('remarks', { length: 500 }),
  ledger_id: varchar('ledger_id', { length: 36 }).references(() => inventoryLedger.ledger_id, { onDelete: 'restrict' }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const batchOutputLine = mysqlTable('batch_output_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => batchHeader.batch_id, { onDelete: 'cascade' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  output_type: varchar('output_type', { length: 20 }).default('MAIN').notNull(), // MAIN, BY_PRODUCT
  cost_split_pct: decimal('cost_split_pct', { precision: 6, scale: 2 }).notNull(),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  computed_cost: decimal('computed_cost', { precision: 18, scale: 4 }),
  unit_cost: decimal('unit_cost', { precision: 18, scale: 6 }),
  warehouse_id: varchar('warehouse_id', { length: 36 }).references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
});

export const batchHeaderRelations = relations(batchHeader, ({ one, many }) => ({
  company: one(companyMaster, { fields: [batchHeader.company_id], references: [companyMaster.company_id] }),
  lob: one(lobMaster, { fields: [batchHeader.lob_id], references: [lobMaster.lob_id] }),
  breed: one(breedMaster, { fields: [batchHeader.breed_id], references: [breedMaster.breed_id] }),
  inputLines: many(batchInputLine),
  transactions: many(batchTransaction),
  outputLines: many(batchOutputLine),
}));

export const batchInputLineRelations = relations(batchInputLine, ({ one }) => ({
  batch: one(batchHeader, { fields: [batchInputLine.batch_id], references: [batchHeader.batch_id], relationName: 'batch_inputs' }),
  item: one(itemMaster, { fields: [batchInputLine.item_id], references: [itemMaster.item_id] }),
  sourceBatch: one(batchHeader, { fields: [batchInputLine.source_batch_id], references: [batchHeader.batch_id], relationName: 'batch_as_source' }),
}));

export const batchTransactionRelations = relations(batchTransaction, ({ one }) => ({
  batch: one(batchHeader, { fields: [batchTransaction.batch_id], references: [batchHeader.batch_id] }),
  item: one(itemMaster, { fields: [batchTransaction.item_id], references: [itemMaster.item_id] }),
  resource: one(resourceMaster, { fields: [batchTransaction.resource_id], references: [resourceMaster.resource_id] }),
  ledgerEntry: one(inventoryLedger, { fields: [batchTransaction.ledger_id], references: [inventoryLedger.ledger_id] }),
}));

export const batchOutputLineRelations = relations(batchOutputLine, ({ one }) => ({
  batch: one(batchHeader, { fields: [batchOutputLine.batch_id], references: [batchHeader.batch_id] }),
  item: one(itemMaster, { fields: [batchOutputLine.item_id], references: [itemMaster.item_id] }),
  warehouse: one(warehouseMaster, { fields: [batchOutputLine.warehouse_id], references: [warehouseMaster.warehouse_id] }),
}));

// 11a. COSTING / VARIANCE ENGINE (Phase 7) — STANDARD batches only.
// Lightweight per-batch standards (no separate Parameter/Scheduler system).

export const batchStandard = mysqlTable('batch_standard', {
  standard_id: varchar('standard_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().unique().references(() => batchHeader.batch_id, { onDelete: 'cascade' }),
  std_output_quantity: decimal('std_output_quantity', { precision: 18, scale: 4 }),
  std_output_cost_per_unit: decimal('std_output_cost_per_unit', { precision: 18, scale: 6 }),
  std_overhead_rate_per_unit: decimal('std_overhead_rate_per_unit', { precision: 18, scale: 6 }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const batchStandardConsumptionLine = mysqlTable('batch_standard_consumption_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull(),
  std_qty_per_unit_per_day: decimal('std_qty_per_unit_per_day', { precision: 18, scale: 8 }).notNull(),
  std_rate: decimal('std_rate', { precision: 18, scale: 6 }),
}, (table) => ({
  batchFk: foreignKey({
    columns: [table.batch_id],
    foreignColumns: [batchHeader.batch_id],
    name: 'bscl_batch_id_fk'
  }).onDelete('cascade'),
  itemFk: foreignKey({
    columns: [table.item_id],
    foreignColumns: [itemMaster.item_id],
    name: 'bscl_item_id_fk'
  }).onDelete('restrict'),
}));

export const batchCostVariance = mysqlTable('batch_cost_variance', {
  variance_id: varchar('variance_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => batchHeader.batch_id, { onDelete: 'cascade' }),
  variance_type: varchar('variance_type', { length: 20 }).notNull(), // PRICE, USAGE, OUTPUT, OVERHEAD
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  std_value: decimal('std_value', { precision: 18, scale: 6 }).notNull(),
  actual_value: decimal('actual_value', { precision: 18, scale: 6 }).notNull(),
  variance_amount: decimal('variance_amount', { precision: 18, scale: 4 }).notNull(), // positive = unfavorable
  is_favorable: boolean('is_favorable').notNull(),
  dr_gl_account_id: varchar('dr_gl_account_id', { length: 36 }),
  cr_gl_account_id: varchar('cr_gl_account_id', { length: 36 }),
  journal_id: varchar('journal_id', { length: 36 }).references(() => journalHeader.journal_id, { onDelete: 'restrict' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  drGlFk: foreignKey({
    columns: [table.dr_gl_account_id],
    foreignColumns: [glAccountMaster.gl_account_id],
    name: 'bcv_dr_gl_fk'
  }).onDelete('restrict'),
  crGlFk: foreignKey({
    columns: [table.cr_gl_account_id],
    foreignColumns: [glAccountMaster.gl_account_id],
    name: 'bcv_cr_gl_fk'
  }).onDelete('restrict'),
}));

export const batchStandardRelations = relations(batchStandard, ({ one, many }) => ({
  batch: one(batchHeader, { fields: [batchStandard.batch_id], references: [batchHeader.batch_id] }),
  consumptionLines: many(batchStandardConsumptionLine),
}));

export const batchStandardConsumptionLineRelations = relations(batchStandardConsumptionLine, ({ one }) => ({
  batch: one(batchHeader, { fields: [batchStandardConsumptionLine.batch_id], references: [batchHeader.batch_id] }),
  item: one(itemMaster, { fields: [batchStandardConsumptionLine.item_id], references: [itemMaster.item_id] }),
}));

export const batchCostVarianceRelations = relations(batchCostVariance, ({ one }) => ({
  batch: one(batchHeader, { fields: [batchCostVariance.batch_id], references: [batchHeader.batch_id] }),
  item: one(itemMaster, { fields: [batchCostVariance.item_id], references: [itemMaster.item_id] }),
  journal: one(journalHeader, { fields: [batchCostVariance.journal_id], references: [journalHeader.journal_id] }),
}));

// ==========================================
// 11b. PARAMETER / SCHEDULER / KPI ENGINE (Phase 6)
// Additive KPI-monitoring layer — hooks into batch_transaction inserts.
// Does not touch Phase 7's variance engine (batch_standard stays separate).
// ==========================================

export const parameterMaster = mysqlTable('parameter_master', {
  parameter_id: varchar('parameter_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }), // null = tenant-wide template
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  parameter_code: varchar('parameter_code', { length: 50 }).notNull(),
  parameter_name: varchar('parameter_name', { length: 200 }).notNull(),
  parameter_type: varchar('parameter_type', { length: 20 }).notNull(), // CONSUMPTION, MORTALITY, OUTPUT, OVERHEAD, OBSERVATION
  item_id: varchar('item_id', { length: 36 }).references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  resource_id: varchar('resource_id', { length: 36 }).references(() => resourceMaster.resource_id, { onDelete: 'restrict' }),
  default_uom: varchar('default_uom', { length: 20 }),
  qty_method: varchar('qty_method', { length: 20 }).notNull(), // PER_UNIT, PER_BATCH, MANUAL_AT_ENTRY
  default_qty_per_unit: decimal('default_qty_per_unit', { precision: 18, scale: 8 }),
  default_qty_per_batch: decimal('default_qty_per_batch', { precision: 18, scale: 4 }),
  description: text('description'),
  is_mandatory: boolean('is_mandatory').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const schedulerMaster = mysqlTable('scheduler_master', {
  scheduler_id: varchar('scheduler_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }),
  nob_id: varchar('nob_id', { length: 36 }).notNull().references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).notNull().references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  scheduler_code: varchar('scheduler_code', { length: 50 }).notNull(),
  scheduler_name: varchar('scheduler_name', { length: 200 }).notNull(),
  duration_value: int('duration_value').notNull(),
  duration_unit: varchar('duration_unit', { length: 10 }).notNull(), // DAY, WEEK, MONTH
  breed_id: varchar('breed_id', { length: 36 }).references(() => breedMaster.breed_id, { onDelete: 'restrict' }),
  is_locked: boolean('is_locked').default(false).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const schedulerParameterLine = mysqlTable('scheduler_parameter_line', {
  spl_id: varchar('spl_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  scheduler_id: varchar('scheduler_id', { length: 36 }).notNull(),
  parameter_id: varchar('parameter_id', { length: 36 }).notNull(),
  period_no: int('period_no').notNull(),
  period_from: int('period_from').notNull(),
  period_to: int('period_to').notNull(),
  period_label: varchar('period_label', { length: 50 }),
  expected_qty_override: decimal('expected_qty_override', { precision: 18, scale: 8 }),
  uom_override: varchar('uom_override', { length: 20 }),
  kpi_enabled: boolean('kpi_enabled').default(true).notNull(),
  kpi_mode: varchar('kpi_mode', { length: 10 }), // PCT, VALUE
  kpi_min_pct: decimal('kpi_min_pct', { precision: 6, scale: 2 }),
  kpi_max_pct: decimal('kpi_max_pct', { precision: 6, scale: 2 }),
  kpi_min_value: decimal('kpi_min_value', { precision: 18, scale: 4 }),
  kpi_max_value: decimal('kpi_max_value', { precision: 18, scale: 4 }),
  kpi_target_value: decimal('kpi_target_value', { precision: 18, scale: 4 }),
  critical_threshold_pct: decimal('critical_threshold_pct', { precision: 6, scale: 2 }),
  notify_in_app: boolean('notify_in_app').default(true).notNull(),
  notify_push: boolean('notify_push').default(false).notNull(),
  notify_email: boolean('notify_email').default(false).notNull(),
  sort_order: int('sort_order'),
  notes: text('notes'),
}, (table) => ({
  schedulerFk: foreignKey({
    columns: [table.scheduler_id],
    foreignColumns: [schedulerMaster.scheduler_id],
    name: 'spl_scheduler_id_fk'
  }).onDelete('cascade'),
  parameterFk: foreignKey({
    columns: [table.parameter_id],
    foreignColumns: [parameterMaster.parameter_id],
    name: 'spl_parameter_id_fk'
  }).onDelete('restrict'),
}));

export const notificationAlertLog = mysqlTable('notification_alert_log', {
  alert_id: varchar('alert_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  batch_id: varchar('batch_id', { length: 36 }).references(() => batchHeader.batch_id, { onDelete: 'cascade' }),
  spl_id: varchar('spl_id', { length: 36 }),
  transaction_id: varchar('transaction_id', { length: 36 }),
  alert_type: varchar('alert_type', { length: 40 }).default('KPI_DEVIATION').notNull(),
  severity: varchar('severity', { length: 10 }).notNull(), // WARNING, CRITICAL
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  parameter_name: varchar('parameter_name', { length: 200 }),
  kpi_mode: varchar('kpi_mode', { length: 10 }),
  expected_value: decimal('expected_value', { precision: 18, scale: 4 }),
  actual_value: decimal('actual_value', { precision: 18, scale: 4 }),
  deviation_amount: decimal('deviation_amount', { precision: 18, scale: 4 }),
  deviation_pct: decimal('deviation_pct', { precision: 8, scale: 2 }),
  kpi_min: decimal('kpi_min', { precision: 18, scale: 4 }),
  kpi_max: decimal('kpi_max', { precision: 18, scale: 4 }),
  is_read: boolean('is_read').default(false).notNull(),
  read_by: varchar('read_by', { length: 36 }),
  read_at: timestamp('read_at', { mode: 'string' }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  splFk: foreignKey({
    columns: [table.spl_id],
    foreignColumns: [schedulerParameterLine.spl_id],
    name: 'nal_spl_id_fk'
  }).onDelete('restrict'),
  transactionFk: foreignKey({
    columns: [table.transaction_id],
    foreignColumns: [batchTransaction.transaction_id],
    name: 'nal_transaction_id_fk'
  }).onDelete('restrict'),
}));

export const parameterMasterRelations = relations(parameterMaster, ({ one }) => ({
  item: one(itemMaster, { fields: [parameterMaster.item_id], references: [itemMaster.item_id] }),
  resource: one(resourceMaster, { fields: [parameterMaster.resource_id], references: [resourceMaster.resource_id] }),
}));

export const schedulerMasterRelations = relations(schedulerMaster, ({ one, many }) => ({
  breed: one(breedMaster, { fields: [schedulerMaster.breed_id], references: [breedMaster.breed_id] }),
  parameterLines: many(schedulerParameterLine),
}));

export const schedulerParameterLineRelations = relations(schedulerParameterLine, ({ one }) => ({
  scheduler: one(schedulerMaster, { fields: [schedulerParameterLine.scheduler_id], references: [schedulerMaster.scheduler_id] }),
  parameter: one(parameterMaster, { fields: [schedulerParameterLine.parameter_id], references: [parameterMaster.parameter_id] }),
}));

export const notificationAlertLogRelations = relations(notificationAlertLog, ({ one }) => ({
  batch: one(batchHeader, { fields: [notificationAlertLog.batch_id], references: [batchHeader.batch_id] }),
  schedulerParameterLine: one(schedulerParameterLine, { fields: [notificationAlertLog.spl_id], references: [schedulerParameterLine.spl_id] }),
  transaction: one(batchTransaction, { fields: [notificationAlertLog.transaction_id], references: [batchTransaction.transaction_id] }),
}));

// ==========================================
// 11c. QC / QR TRACEABILITY ENGINE
// Additive — reads batch_header/batch_input_line/batch_output_line for
// traceability, never writes to them. QC and QR generation are independent
// (a QR can exist with or without a linked QC record).
// ==========================================

export const qcParameterMaster = mysqlTable('qc_parameter_master', {
  param_id: varchar('param_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }), // null = tenant-wide template
  lob_id: varchar('lob_id', { length: 36 }).notNull().references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  param_code: varchar('param_code', { length: 50 }).notNull(),
  param_name: varchar('param_name', { length: 100 }).notNull(),
  param_type: varchar('param_type', { length: 20 }).notNull(), // NUMERIC, BOOLEAN, GRADE
  uom: varchar('uom', { length: 20 }),
  min_value: decimal('min_value', { precision: 18, scale: 4 }),
  max_value: decimal('max_value', { precision: 18, scale: 4 }),
  pass_criteria: text('pass_criteria'),
  fail_criteria: text('fail_criteria'),
  grade_scale: json('grade_scale'), // GRADE type: { "A": "2.0-2.5kg", "B": "1.8-2.0kg" }
  is_mandatory: boolean('is_mandatory').default(true).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const qcBatchDetail = mysqlTable('qc_batch_detail', {
  qc_id: varchar('qc_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  source_batch_id: varchar('source_batch_id', { length: 36 }).notNull().references(() => batchHeader.batch_id, { onDelete: 'restrict' }),
  output_line_id: varchar('output_line_id', { length: 36 }).references(() => batchOutputLine.line_id, { onDelete: 'restrict' }),
  qc_date: date('qc_date', { mode: 'string' }).notNull(),
  inspector_id: varchar('inspector_id', { length: 36 }).references(() => userMaster.user_id, { onDelete: 'restrict' }),
  total_qty_received: decimal('total_qty_received', { precision: 18, scale: 4 }).notNull(),
  pass_qty: decimal('pass_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  fail_qty: decimal('fail_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  hold_qty: decimal('hold_qty', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  grade_a_qty: decimal('grade_a_qty', { precision: 18, scale: 4 }),
  grade_b_qty: decimal('grade_b_qty', { precision: 18, scale: 4 }),
  grade_c_qty: decimal('grade_c_qty', { precision: 18, scale: 4 }),
  overall_result: varchar('overall_result', { length: 20 }).notNull(), // PASS, FAIL, CONDITIONAL
  disposition: varchar('disposition', { length: 30 }).notNull(), // ACCEPT, REJECT, REWORK, QUARANTINE, CONDITIONAL_ACCEPT
  qc_notes: text('qc_notes'),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const qcParamResult = mysqlTable('qc_param_result', {
  result_id: varchar('result_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  qc_id: varchar('qc_id', { length: 36 }).notNull().references(() => qcBatchDetail.qc_id, { onDelete: 'cascade' }),
  param_id: varchar('param_id', { length: 36 }).notNull().references(() => qcParameterMaster.param_id, { onDelete: 'restrict' }),
  actual_value: varchar('actual_value', { length: 200 }).notNull(),
  result_status: varchar('result_status', { length: 10 }).notNull(), // PASS, FAIL
  grade_assigned: varchar('grade_assigned', { length: 10 }),
  notes: text('notes'),
});

export const qrCodeMaster = mysqlTable('qr_code_master', {
  qr_id: varchar('qr_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull(),
  batch_id: varchar('batch_id', { length: 36 }).notNull().references(() => batchHeader.batch_id, { onDelete: 'restrict' }),
  output_line_id: varchar('output_line_id', { length: 36 }).references(() => batchOutputLine.line_id, { onDelete: 'restrict' }),
  qc_id: varchar('qc_id', { length: 36 }).references(() => qcBatchDetail.qc_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  lot_no: varchar('lot_no', { length: 100 }),
  pack_no: varchar('pack_no', { length: 50 }).notNull(),
  production_date: date('production_date', { mode: 'string' }).notNull(),
  expiry_date: date('expiry_date', { mode: 'string' }),
  net_weight: decimal('net_weight', { precision: 10, scale: 4 }).notNull(),
  gross_weight: decimal('gross_weight', { precision: 10, scale: 4 }),
  pack_uom: varchar('pack_uom', { length: 20 }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  grade: varchar('grade', { length: 10 }),
  origin_batch_chain: json('origin_batch_chain'),
  breed: varchar('breed', { length: 100 }),
  qr_data: json('qr_data').notNull(),
  generated_at: timestamp('generated_at', { mode: 'string' }).defaultNow().notNull(),
  generated_by: varchar('generated_by', { length: 36 }),
  is_voided: boolean('is_voided').default(false).notNull(),
});

export const qcParameterMasterRelations = relations(qcParameterMaster, ({ one }) => ({
  lob: one(lobMaster, { fields: [qcParameterMaster.lob_id], references: [lobMaster.lob_id] }),
}));

export const qcBatchDetailRelations = relations(qcBatchDetail, ({ one, many }) => ({
  sourceBatch: one(batchHeader, { fields: [qcBatchDetail.source_batch_id], references: [batchHeader.batch_id] }),
  outputLine: one(batchOutputLine, { fields: [qcBatchDetail.output_line_id], references: [batchOutputLine.line_id] }),
  inspector: one(userMaster, { fields: [qcBatchDetail.inspector_id], references: [userMaster.user_id] }),
  paramResults: many(qcParamResult),
}));

export const qcParamResultRelations = relations(qcParamResult, ({ one }) => ({
  qcBatch: one(qcBatchDetail, { fields: [qcParamResult.qc_id], references: [qcBatchDetail.qc_id] }),
  parameter: one(qcParameterMaster, { fields: [qcParamResult.param_id], references: [qcParameterMaster.param_id] }),
}));

export const qrCodeMasterRelations = relations(qrCodeMaster, ({ one }) => ({
  batch: one(batchHeader, { fields: [qrCodeMaster.batch_id], references: [batchHeader.batch_id] }),
  outputLine: one(batchOutputLine, { fields: [qrCodeMaster.output_line_id], references: [batchOutputLine.line_id] }),
  qcBatch: one(qcBatchDetail, { fields: [qrCodeMaster.qc_id], references: [qcBatchDetail.qc_id] }),
  item: one(itemMaster, { fields: [qrCodeMaster.item_id], references: [itemMaster.item_id] }),
  warehouse: one(warehouseMaster, { fields: [qrCodeMaster.warehouse_id], references: [warehouseMaster.warehouse_id] }),
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
// 9. INVENTORY ENGINE (Phase 3)
// ==========================================

// Append-only movement log. Rows are never updated or soft-deleted — corrections
// are made via new offsetting entries, matching standard ERP ledger practice.
export const inventoryLedger = mysqlTable('inventory_ledger', {
  ledger_id: varchar('ledger_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  item_code: varchar('item_code', { length: 50 }).notNull(), // denormalized snapshot at posting time
  item_description: varchar('item_description', { length: 200 }).notNull(),
  document_type: varchar('document_type', { length: 30 }).notNull(), // GOODS_RECEIPT, GOODS_ISSUE, TRANSFER, ADJUSTMENT
  document_no: varchar('document_no', { length: 50 }).notNull(),
  document_line_id: varchar('document_line_id', { length: 36 }),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  external_reference_no: varchar('external_reference_no', { length: 50 }),
  entry_type: varchar('entry_type', { length: 20 }).notNull(), // POSITIVE, NEGATIVE, TRANSFER, OVERHEAD, DESCRIPTIVE
  transaction_type: varchar('transaction_type', { length: 30 }).notNull(), // PURCHASE, CONSUMPTION, OUTPUT, TRANSFER_SHIPMENT, TRANSFER_RECEIPT, SALES, VARIANCE_POSITIVE, VARIANCE_NEGATIVE
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(), // signed
  remaining_quantity: decimal('remaining_quantity', { precision: 18, scale: 4 }), // meaningful on POSITIVE entries only
  uom: varchar('uom', { length: 20 }).notNull(),
  uom_conversion_factor: decimal('uom_conversion_factor', { precision: 18, scale: 6 }),
  alternate_quantity: decimal('alternate_quantity', { precision: 18, scale: 4 }),
  rate: decimal('rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  lot_no: varchar('lot_no', { length: 50 }),
  serial_no: varchar('serial_no', { length: 100 }),
  expiry_date: date('expiry_date', { mode: 'string' }),
  batch_no: varchar('batch_no', { length: 50 }), // denormalized from batch_header.batch_no (Phase 5) for query convenience
  location_id: varchar('location_id', { length: 36 }).references(() => locationMaster.location_id, { onDelete: 'restrict' }),
  warehouse_id: varchar('warehouse_id', { length: 36 }).references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  category_id: varchar('category_id', { length: 36 }).references(() => itemCategoryMaster.category_id, { onDelete: 'restrict' }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

// FIFO matching: which inbound (receipt) ledger rows an outbound (consumption)
// ledger row drew its quantity/cost from.
export const inventoryApplication = mysqlTable('inventory_application', {
  application_id: varchar('application_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  inbound_ledger_id: varchar('inbound_ledger_id', { length: 36 }).notNull(),
  outbound_ledger_id: varchar('outbound_ledger_id', { length: 36 }).notNull(),
  applied_qty: decimal('applied_qty', { precision: 18, scale: 4 }).notNull(),
  applied_cost_amount: decimal('applied_cost_amount', { precision: 18, scale: 4 }).notNull(),
  application_date: date('application_date', { mode: 'string' }).notNull(),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
}, (table) => ({
  inboundLedgerFk: foreignKey({
    columns: [table.inbound_ledger_id],
    foreignColumns: [inventoryLedger.ledger_id],
    name: 'inv_app_inbound_ledger_fk'
  }).onDelete('restrict'),
  outboundLedgerFk: foreignKey({
    columns: [table.outbound_ledger_id],
    foreignColumns: [inventoryLedger.ledger_id],
    name: 'inv_app_outbound_ledger_fk'
  }).onDelete('restrict'),
}));

// Living/biological asset value-change log (mortality, growth, fair-value
// adjustments, transformation). Auto-written by BIO_ASSET batch lifecycle
// events (activate/consume/mature/amortize/fair-value/dispose — Bio-Asset
// IAS41 batch accounting); batch_id links each row back to its batch_header.
export const bioAssetLedger = mysqlTable('bio_asset_ledger', {
  entry_id: varchar('entry_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  bio_asset_item_id: varchar('bio_asset_item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  entry_type: varchar('entry_type', { length: 30 }).notNull(), // ACQUISITION, CONSUMPTION, WRITEOFF, OVERHEAD, OVERHEAD_COST, GROWTH_ADJMT, MORTALITY, DEAD_PLANT, AMORTIZATION, FAIR_VALUE_ADJMT, TRANSFORMATION
  document_no: varchar('document_no', { length: 50 }),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  asset_tracking_type: varchar('asset_tracking_type', { length: 10 }), // SERIAL, LOT
  lot_no: varchar('lot_no', { length: 50 }),
  asset_rfid_no: varchar('asset_rfid_no', { length: 100 }),
  batch_no: varchar('batch_no', { length: 50 }),
  batch_id: varchar('batch_id', { length: 36 }).references(() => batchHeader.batch_id, { onDelete: 'restrict' }),
  stage: varchar('stage', { length: 50 }),
  status: varchar('status', { length: 20 }).default('ACTIVE').notNull(),
  quantity: decimal('quantity', { precision: 18, scale: 4 }),
  cost_amount: decimal('cost_amount', { precision: 18, scale: 4 }),
  cost_amount_each_unit: decimal('cost_amount_each_unit', { precision: 18, scale: 4 }),
  costing_method: varchar('costing_method', { length: 30 }), // COST_ACCUMULATION, AMORTIZED_COST, FAIR_VALUE
  nob_id: varchar('nob_id', { length: 36 }).references(() => nobMaster.nob_id, { onDelete: 'restrict' }),
  lob_id: varchar('lob_id', { length: 36 }).references(() => lobMaster.lob_id, { onDelete: 'restrict' }),
  created_by: varchar('created_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const batchBioAssetState = mysqlTable('batch_bio_asset_state', {
  state_id: varchar('state_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  batch_id: varchar('batch_id', { length: 36 }).notNull().unique().references(() => batchHeader.batch_id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 20 }).default('PREMATURE').notNull(), // PREMATURE, MATURE
  current_quantity: decimal('current_quantity', { precision: 18, scale: 4 }).notNull(),
  nca_book_value: decimal('nca_book_value', { precision: 18, scale: 4 }).default('0.0000').notNull(),
  residual_value_per_unit: decimal('residual_value_per_unit', { precision: 18, scale: 6 }),
  productive_life_months: int('productive_life_months'),
  monthly_amortization_rate: decimal('monthly_amortization_rate', { precision: 18, scale: 6 }),
  matured_at: date('matured_at', { mode: 'string' }),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
});

export const batchBioAssetStateRelations = relations(batchBioAssetState, ({ one }) => ({
  batch: one(batchHeader, { fields: [batchBioAssetState.batch_id], references: [batchHeader.batch_id] }),
}));

export const goodsReceipt = mysqlTable('goods_receipt', {
  receipt_id: varchar('receipt_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  receipt_no: varchar('receipt_no', { length: 50 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull().references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  supplier_id: varchar('supplier_id', { length: 36 }).references(() => supplierMaster.supplier_id, { onDelete: 'restrict' }),
  external_reference_no: varchar('external_reference_no', { length: 50 }),
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(), // DRAFT, POSTED, CANCELLED
  posted_at: timestamp('posted_at', { mode: 'string' }),
  posted_by: varchar('posted_by', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
});

export const goodsReceiptLine = mysqlTable('goods_receipt_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  receipt_id: varchar('receipt_id', { length: 36 }).notNull().references(() => goodsReceipt.receipt_id, { onDelete: 'cascade' }),
  line_no: int('line_no').notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  rate: decimal('rate', { precision: 18, scale: 6 }),
  amount: decimal('amount', { precision: 18, scale: 4 }),
  lot_no: varchar('lot_no', { length: 50 }),
  serial_no: varchar('serial_no', { length: 100 }),
  expiry_date: date('expiry_date', { mode: 'string' }),
  remarks: varchar('remarks', { length: 500 }),
});

export const inventoryLedgerRelations = relations(inventoryLedger, ({ one, many }) => ({
  item: one(itemMaster, { fields: [inventoryLedger.item_id], references: [itemMaster.item_id] }),
  location: one(locationMaster, { fields: [inventoryLedger.location_id], references: [locationMaster.location_id] }),
  warehouse: one(warehouseMaster, { fields: [inventoryLedger.warehouse_id], references: [warehouseMaster.warehouse_id] }),
  inboundApplications: many(inventoryApplication, { relationName: 'inbound_ledger' }),
  outboundApplications: many(inventoryApplication, { relationName: 'outbound_ledger' }),
}));

export const inventoryApplicationRelations = relations(inventoryApplication, ({ one }) => ({
  item: one(itemMaster, { fields: [inventoryApplication.item_id], references: [itemMaster.item_id] }),
  inboundLedger: one(inventoryLedger, {
    fields: [inventoryApplication.inbound_ledger_id],
    references: [inventoryLedger.ledger_id],
    relationName: 'inbound_ledger',
  }),
  outboundLedger: one(inventoryLedger, {
    fields: [inventoryApplication.outbound_ledger_id],
    references: [inventoryLedger.ledger_id],
    relationName: 'outbound_ledger',
  }),
}));

export const bioAssetLedgerRelations = relations(bioAssetLedger, ({ one }) => ({
  item: one(itemMaster, { fields: [bioAssetLedger.bio_asset_item_id], references: [itemMaster.item_id] }),
  batch: one(batchHeader, { fields: [bioAssetLedger.batch_id], references: [batchHeader.batch_id] }),
}));

export const goodsReceiptRelations = relations(goodsReceipt, ({ one, many }) => ({
  company: one(companyMaster, { fields: [goodsReceipt.company_id], references: [companyMaster.company_id] }),
  warehouse: one(warehouseMaster, { fields: [goodsReceipt.warehouse_id], references: [warehouseMaster.warehouse_id] }),
  supplier: one(supplierMaster, { fields: [goodsReceipt.supplier_id], references: [supplierMaster.supplier_id] }),
  lines: many(goodsReceiptLine),
}));

export const goodsReceiptLineRelations = relations(goodsReceiptLine, ({ one }) => ({
  receipt: one(goodsReceipt, { fields: [goodsReceiptLine.receipt_id], references: [goodsReceipt.receipt_id] }),
  item: one(itemMaster, { fields: [goodsReceiptLine.item_id], references: [itemMaster.item_id] }),
}));

export const goodsIssue = mysqlTable('goods_issue', {
  issue_id: varchar('issue_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  issue_no: varchar('issue_no', { length: 50 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull().references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  cost_center_id: varchar('cost_center_id', { length: 36 }).references(() => costCenterMaster.cost_center_id, { onDelete: 'restrict' }),
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(),
  posted_at: timestamp('posted_at', { mode: 'string' }),
  posted_by: varchar('posted_by', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  // Defense in depth alongside the row-locked generator in goods-issue.service.ts —
  // a duplicate issue_no under concurrent inserts fails loudly instead of
  // silently corrupting the document sequence.
  uniqueIndex('uq_goods_issue_tenant_company_no').on(table.tenant_id, table.company_id, table.issue_no),
]);

export const goodsIssueLine = mysqlTable('goods_issue_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  issue_id: varchar('issue_id', { length: 36 }).notNull().references(() => goodsIssue.issue_id, { onDelete: 'cascade' }),
  line_no: int('line_no').notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  remarks: varchar('remarks', { length: 500 }),
});

export const stockTransfer = mysqlTable('stock_transfer', {
  transfer_id: varchar('transfer_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  transfer_no: varchar('transfer_no', { length: 50 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  from_warehouse_id: varchar('from_warehouse_id', { length: 36 }).notNull(),
  to_warehouse_id: varchar('to_warehouse_id', { length: 36 }).notNull(),
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(),
  posted_at: timestamp('posted_at', { mode: 'string' }),
  posted_by: varchar('posted_by', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => ({
  fromWarehouseFk: foreignKey({
    columns: [table.from_warehouse_id],
    foreignColumns: [warehouseMaster.warehouse_id],
    name: 'stock_transfer_from_warehouse_fk'
  }).onDelete('restrict'),
  toWarehouseFk: foreignKey({
    columns: [table.to_warehouse_id],
    foreignColumns: [warehouseMaster.warehouse_id],
    name: 'stock_transfer_to_warehouse_fk'
  }).onDelete('restrict'),
  // Defense in depth alongside the row-locked generator in stock-transfer.service.ts —
  // a duplicate transfer_no under concurrent inserts fails loudly instead of
  // silently corrupting the document sequence.
  uqTransferNo: uniqueIndex('uq_stock_transfer_tenant_company_no').on(table.tenant_id, table.company_id, table.transfer_no),
}));

export const stockTransferLine = mysqlTable('stock_transfer_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  transfer_id: varchar('transfer_id', { length: 36 }).notNull().references(() => stockTransfer.transfer_id, { onDelete: 'cascade' }),
  line_no: int('line_no').notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(),
  uom: varchar('uom', { length: 20 }).notNull(),
  remarks: varchar('remarks', { length: 500 }),
});

export const stockAdjustment = mysqlTable('stock_adjustment', {
  adjustment_id: varchar('adjustment_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull(),
  company_id: varchar('company_id', { length: 36 }).notNull().references(() => companyMaster.company_id, { onDelete: 'restrict' }),
  adjustment_no: varchar('adjustment_no', { length: 50 }).notNull(),
  posting_date: date('posting_date', { mode: 'string' }).notNull(),
  warehouse_id: varchar('warehouse_id', { length: 36 }).notNull().references(() => warehouseMaster.warehouse_id, { onDelete: 'restrict' }),
  reason: varchar('reason', { length: 200 }),
  remarks: text('remarks'),
  status: varchar('status', { length: 20 }).default('DRAFT').notNull(),
  posted_at: timestamp('posted_at', { mode: 'string' }),
  posted_by: varchar('posted_by', { length: 36 }),
  created_by: varchar('created_by', { length: 36 }),
  updated_by: varchar('updated_by', { length: 36 }),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  deleted_at: timestamp('deleted_at', { mode: 'string' }),
}, (table) => [
  // Defense in depth alongside the row-locked generator in stock-adjustment.service.ts —
  // a duplicate adjustment_no under concurrent inserts fails loudly instead of
  // silently corrupting the document sequence.
  uniqueIndex('uq_stock_adjustment_tenant_company_no').on(table.tenant_id, table.company_id, table.adjustment_no),
]);

export const stockAdjustmentLine = mysqlTable('stock_adjustment_line', {
  line_id: varchar('line_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  adjustment_id: varchar('adjustment_id', { length: 36 }).notNull(),
  line_no: int('line_no').notNull(),
  item_id: varchar('item_id', { length: 36 }).notNull().references(() => itemMaster.item_id, { onDelete: 'restrict' }),
  quantity: decimal('quantity', { precision: 18, scale: 4 }).notNull(), // signed: positive = found stock, negative = missing/damaged
  uom: varchar('uom', { length: 20 }).notNull(),
  rate: decimal('rate', { precision: 18, scale: 6 }), // required only when quantity is positive (validated at DTO level)
  remarks: varchar('remarks', { length: 500 }),
}, (table) => ({
  adjustmentFk: foreignKey({
    columns: [table.adjustment_id],
    foreignColumns: [stockAdjustment.adjustment_id],
    name: 'stock_adj_line_adjustment_id_fk'
  }).onDelete('cascade'),
}));

export const goodsIssueRelations = relations(goodsIssue, ({ one, many }) => ({
  company: one(companyMaster, { fields: [goodsIssue.company_id], references: [companyMaster.company_id] }),
  warehouse: one(warehouseMaster, { fields: [goodsIssue.warehouse_id], references: [warehouseMaster.warehouse_id] }),
  costCenter: one(costCenterMaster, { fields: [goodsIssue.cost_center_id], references: [costCenterMaster.cost_center_id] }),
  lines: many(goodsIssueLine),
}));

export const goodsIssueLineRelations = relations(goodsIssueLine, ({ one }) => ({
  issue: one(goodsIssue, { fields: [goodsIssueLine.issue_id], references: [goodsIssue.issue_id] }),
  item: one(itemMaster, { fields: [goodsIssueLine.item_id], references: [itemMaster.item_id] }),
}));

export const stockTransferRelations = relations(stockTransfer, ({ one, many }) => ({
  company: one(companyMaster, { fields: [stockTransfer.company_id], references: [companyMaster.company_id] }),
  fromWarehouse: one(warehouseMaster, { fields: [stockTransfer.from_warehouse_id], references: [warehouseMaster.warehouse_id], relationName: 'transfer_from_warehouse' }),
  toWarehouse: one(warehouseMaster, { fields: [stockTransfer.to_warehouse_id], references: [warehouseMaster.warehouse_id], relationName: 'transfer_to_warehouse' }),
  lines: many(stockTransferLine),
}));

export const stockTransferLineRelations = relations(stockTransferLine, ({ one }) => ({
  transfer: one(stockTransfer, { fields: [stockTransferLine.transfer_id], references: [stockTransfer.transfer_id] }),
  item: one(itemMaster, { fields: [stockTransferLine.item_id], references: [itemMaster.item_id] }),
}));

export const stockAdjustmentRelations = relations(stockAdjustment, ({ one, many }) => ({
  company: one(companyMaster, { fields: [stockAdjustment.company_id], references: [companyMaster.company_id] }),
  warehouse: one(warehouseMaster, { fields: [stockAdjustment.warehouse_id], references: [warehouseMaster.warehouse_id] }),
  lines: many(stockAdjustmentLine),
}));

export const stockAdjustmentLineRelations = relations(stockAdjustmentLine, ({ one }) => ({
  adjustment: one(stockAdjustment, { fields: [stockAdjustmentLine.adjustment_id], references: [stockAdjustment.adjustment_id] }),
  item: one(itemMaster, { fields: [stockAdjustmentLine.item_id], references: [itemMaster.item_id] }),
}));
