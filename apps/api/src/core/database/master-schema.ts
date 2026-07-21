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
  foreignKey
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const planMaster = mysqlTable('plan_master', {
  plan_id: varchar('plan_id', { length: 30 }).primaryKey(),
  plan_name: varchar('plan_name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  billing_cycle: varchar('billing_cycle', { length: 20 }).default('MONTHLY').notNull(),
  max_companies: int('max_companies').default(1).notNull(),
  max_users: int('max_users').default(5).notNull(),
  storage_limit_gb: decimal('storage_limit_gb', { precision: 8, scale: 2 }).default('5.00').notNull(),
  feature_flags: json('feature_flags').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
});

export const tenantMaster = mysqlTable('tenant_master', {
  tenant_id: varchar('tenant_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_code: varchar('tenant_code', { length: 20 }).notNull().unique(),
  tenant_name: varchar('tenant_name', { length: 200 }).notNull(),
  tenant_type: varchar('tenant_type', { length: 20 }),
  plan_id: varchar('plan_id', { length: 30 }).references(() => planMaster.plan_id, { onDelete: 'restrict' }),
  plan_start_date: date('plan_start_date', { mode: 'string' }).notNull(),
  plan_end_date: date('plan_end_date', { mode: 'string' }),
  billing_cycle: varchar('billing_cycle', { length: 20 }),
  billing_email: varchar('billing_email', { length: 200 }).notNull(),
  billing_currency_id: varchar('billing_currency_id', { length: 36 }),
  max_companies: int('max_companies').default(1).notNull(),
  max_users: int('max_users').default(5).notNull(),
  max_batches_per_month: int('max_batches_per_month'),
  api_rate_limit: int('api_rate_limit').default(1000).notNull(),
  is_trial: boolean('is_trial').default(false).notNull(),
  trial_end_date: date('trial_end_date', { mode: 'string' }),
  allowed_nob_ids: json('allowed_nob_ids').$type<string[]>(),
  allowed_lob_ids: json('allowed_lob_ids').$type<string[]>(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  
  // Connection Details for Separate DB per Tenant
  db_host: varchar('db_host', { length: 100 }).default('localhost').notNull(),
  db_port: int('db_port').default(3306).notNull(),
  db_name: varchar('db_name', { length: 100 }).notNull(),
  db_user: varchar('db_user', { length: 100 }).default('root').notNull(),
  db_password: varchar('db_password', { length: 200 }).default('').notNull(),
});

export const tenantSubscription = mysqlTable('tenant_subscription', {
  sub_id: varchar('sub_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull().unique().references(() => tenantMaster.tenant_id, { onDelete: 'cascade' }),
  plan_code: varchar('plan_code', { length: 30 }).notNull().references(() => planMaster.plan_id, { onDelete: 'restrict' }),
  feature_flags: json('feature_flags'),
  storage_limit_gb: decimal('storage_limit_gb', { precision: 8, scale: 2 }).default('5.00').notNull(),
  support_tier: varchar('support_tier', { length: 20 }).default('STANDARD').notNull(),
  sla_uptime_pct: decimal('sla_uptime_pct', { precision: 5, scale: 2 }).default('99.50').notNull(),
  renewal_auto: boolean('renewal_auto').default(true).notNull(),
  payment_method: varchar('payment_method', { length: 30 }),
  is_active: boolean('is_active').default(true).notNull()
});

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

export const auditLog = mysqlTable('audit_log', {
  audit_id: varchar('audit_id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenant_id: varchar('tenant_id', { length: 36 }).notNull().references(() => tenantMaster.tenant_id, { onDelete: 'cascade' }),
  company_id: varchar('company_id', { length: 36 }),
  user_id: varchar('user_id', { length: 36 }),
  action: varchar('action', { length: 50 }).notNull(),
  entity_name: varchar('entity_name', { length: 100 }).notNull(),
  entity_id: varchar('entity_id', { length: 36 }).notNull(),
  old_values: json('old_values'),
  new_values: json('new_values'),
  ip_address: varchar('ip_address', { length: 50 }),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { mode: 'string' }).defaultNow().notNull()
});

export const planMasterRelations = relations(planMaster, ({ many }) => ({
  tenants: many(tenantMaster),
  subscriptions: many(tenantSubscription)
}));

export const tenantMasterRelations = relations(tenantMaster, ({ one, many }) => ({
  subscription: one(tenantSubscription, {
    fields: [tenantMaster.tenant_id],
    references: [tenantSubscription.tenant_id]
  }),
  plan: one(planMaster, {
    fields: [tenantMaster.plan_id],
    references: [planMaster.plan_id]
  }),
  auditLogs: many(auditLog)
}));

export const tenantSubscriptionRelations = relations(tenantSubscription, ({ one }) => ({
  tenant: one(tenantMaster, {
    fields: [tenantSubscription.tenant_id],
    references: [tenantMaster.tenant_id]
  }),
  plan: one(planMaster, {
    fields: [tenantSubscription.plan_code],
    references: [planMaster.plan_id]
  })
}));

export const lobMasterRelations = relations(lobMaster, ({ one }) => ({
  nob: one(nobMaster, {
    fields: [lobMaster.nob_id],
    references: [nobMaster.nob_id]
  })
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  tenant: one(tenantMaster, {
    fields: [auditLog.tenant_id],
    references: [tenantMaster.tenant_id]
  })
}));
