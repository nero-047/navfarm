import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as mysql from 'mysql2/promise';
import * as master from '../core/database/master-schema';
import * as tenant from '../core/database/schema';

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000000';
const SYSTEM_COMPANY_ID = '00000000-0000-0000-0000-000000000000';
const ENGLISH_ID = '10000000-1000-1000-1000-100000000001';
const INR_ID = '20000000-2000-2000-2000-200000000001';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const masterDatabase = process.env.DATABASE_NAME || 'navfarm_master';
const systemDatabase = process.env.SYSTEM_TENANT_DATABASE || 'tenant_system';
const adminEmail = process.env.SYSTEM_ADMIN_EMAIL || 'admin@navfarm.local';
const adminPassword = process.env.SYSTEM_ADMIN_PASSWORD;

function assertDatabaseName(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error(`Unsafe database name: ${value}`);
  }
  return value;
}

async function bootstrap() {
  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('SYSTEM_ADMIN_PASSWORD must contain at least 12 characters.');
  }

  assertDatabaseName(masterDatabase);
  assertDatabaseName(systemDatabase);

  const server = await mysql.createConnection({ host, port, user, password });
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${masterDatabase}\``);
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${systemDatabase}\``);
  await server.end();

  const masterPool = mysql.createPool({
    host,
    port,
    user,
    password,
    database: masterDatabase,
  });
  const tenantPool = mysql.createPool({
    host,
    port,
    user,
    password,
    database: systemDatabase,
  });
  const masterDb = drizzle(masterPool, { schema: master, mode: 'default' });
  const tenantDb = drizzle(tenantPool, { schema: tenant, mode: 'default' });

  try {
    await migrate(masterDb, {
      migrationsFolder: resolve(process.cwd(), 'src/drizzle/master'),
    });
    await migrate(tenantDb, {
      migrationsFolder: resolve(process.cwd(), 'src/drizzle/tenant'),
    });

    const plans: Array<typeof master.planMaster.$inferInsert> = [
      {
        plan_id: 'PLAN_BASIC',
        plan_name: 'Basic',
        price: '0.00',
        billing_cycle: 'MONTHLY',
        max_companies: 1,
        max_users: 5,
        storage_limit_gb: '5.00',
        feature_flags: { onboarding: true, operations: false },
      },
      {
        plan_id: 'PLAN_PRO',
        plan_name: 'Professional',
        price: '0.00',
        billing_cycle: 'MONTHLY',
        max_companies: 5,
        max_users: 75,
        storage_limit_gb: '50.00',
        feature_flags: { onboarding: true, operations: true },
      },
      {
        plan_id: 'PLAN_ENTERPRISE',
        plan_name: 'Enterprise',
        price: '0.00',
        billing_cycle: 'ANNUAL',
        max_companies: 100,
        max_users: 1000,
        storage_limit_gb: '500.00',
        feature_flags: { onboarding: true, operations: true, enterprise: true },
      },
    ];
    for (const plan of plans) {
      await masterDb
        .insert(master.planMaster)
        .values(plan)
        .onDuplicateKeyUpdate({ set: { ...plan } });
    }

    const languages: Array<typeof master.languageMaster.$inferInsert> = [
      {
        lang_id: ENGLISH_ID,
        lang_code: 'en',
        lang_name_english: 'English',
        lang_name_native: 'English',
        script: 'Latin',
        is_system_default: true,
        translation_coverage_pct: '100.00',
        flag_emoji: '🇬🇧',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000002',
        lang_code: 'hi',
        lang_name_english: 'Hindi',
        lang_name_native: 'हिन्दी',
        script: 'Devanagari',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000003',
        lang_code: 'mr',
        lang_name_english: 'Marathi',
        lang_name_native: 'मराठी',
        script: 'Devanagari',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000004',
        lang_code: 'ta',
        lang_name_english: 'Tamil',
        lang_name_native: 'தமிழ்',
        script: 'Tamil',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000005',
        lang_code: 'te',
        lang_name_english: 'Telugu',
        lang_name_native: 'తెలుగు',
        script: 'Telugu',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000006',
        lang_code: 'pa',
        lang_name_english: 'Punjabi',
        lang_name_native: 'ਪੰਜਾਬੀ',
        script: 'Gurmukhi',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000007',
        lang_code: 'gu',
        lang_name_english: 'Gujarati',
        lang_name_native: 'ગુજરાતી',
        script: 'Gujarati',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000008',
        lang_code: 'bn',
        lang_name_english: 'Bengali',
        lang_name_native: 'বাংলা',
        script: 'Bengali',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇮🇳',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000009',
        lang_code: 'ar',
        lang_name_english: 'Arabic',
        lang_name_native: 'العربية',
        script: 'Arabic',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇦🇪',
        is_rtl: true,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000010',
        lang_code: 'fr',
        lang_name_english: 'French',
        lang_name_native: 'Français',
        script: 'Latin',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇫🇷',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000011',
        lang_code: 'es',
        lang_name_english: 'Spanish',
        lang_name_native: 'Español',
        script: 'Latin',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇪🇸',
        is_rtl: false,
        is_active: true,
      },
      {
        lang_id: '10000000-1000-1000-1000-100000000012',
        lang_code: 'zh',
        lang_name_english: 'Chinese Simplified',
        lang_name_native: '简体中文',
        script: 'Chinese',
        translation_coverage_pct: '100.00',
        flag_emoji: '🇨🇳',
        is_rtl: false,
        is_active: true,
      },
    ];
    for (const language of languages) {
      await masterDb
        .insert(master.languageMaster)
        .values(language)
        .onDuplicateKeyUpdate({ set: { ...language } });
      await tenantDb
        .insert(tenant.languageMaster)
        .values(language)
        .onDuplicateKeyUpdate({ set: { ...language } });
    }

    const currencies: Array<typeof master.currencyMaster.$inferInsert> = [
      {
        currency_id: INR_ID,
        iso_code: 'INR',
        currency_name: 'Indian Rupee',
        symbol: '₹',
        is_system_default: true,
      },
      {
        currency_id: '20000000-2000-2000-2000-200000000002',
        iso_code: 'USD',
        currency_name: 'US Dollar',
        symbol: '$',
      },
    ];
    for (const currency of currencies) {
      await masterDb
        .insert(master.currencyMaster)
        .values(currency)
        .onDuplicateKeyUpdate({ set: { ...currency } });
      await tenantDb
        .insert(tenant.currencyMaster)
        .values(currency)
        .onDuplicateKeyUpdate({ set: { ...currency } });
    }

    // Decision record: Steps 1–9 are mandatory per the PDF narrative and per code.
    // The Final_Docs workbook marks steps 11 (CHART_OF_ACCOUNTS) and 12 (NOB_LOB_CONFIG)
    // as also mandatory, but these require GL and LOB configuration that may not be
    // available at initial launch. We preserve 1–9 as the hard gate. Steps 11–12 are
    // seeded as optional (is_mandatory=false) and enforced by company policy.
    const setupSteps = [
      ['COMPANY_PROFILE',    'Company profile',           'GENERAL',        5],
      ['ADDRESS',            'Address & farm location',   'GENERAL',        3],
      ['KEY_CONTACTS',       'Primary contacts',          'GENERAL',        3],
      ['DEFAULT_LANGUAGE',   'Language',                  'LOCALIZATION',   2],
      ['BASE_CURRENCY',      'Base currency',             'LOCALIZATION',   2],
      ['TIMEZONE',           'Timezone & region',         'LOCALIZATION',   2],
      ['FISCAL_YEAR',        'Fiscal & accounting',       'FINANCE',        5],
      ['ENABLE_MODULES',     'Enable modules',            'CONFIGURATION',  5],
      ['ADMIN_USER',         'Administrator account',     'SECURITY',       3],
      ['TEAM_MEMBERS',       'Users & roles',             'SECURITY',       5],
      ['CHART_OF_ACCOUNTS',  'Chart of accounts',         'FINANCE',       10],
      ['NOB_LOB_CONFIG',     'NOB & LOB configuration',   'CONFIGURATION', 10],
      ['MASTER_DATA_LOAD',   'Master data',               'CONFIGURATION', 15],
      ['NOTIFICATION_SETTINGS', 'Notifications',          'CONFIGURATION',  3],
      ['SETUP_COMPLETE',     'Setup complete',            'CONFIGURATION',  1],
    ] as const;
    for (const [index, [code, name, category, minutes]] of setupSteps.entries()) {
      const order = index + 1;
      const step = {
        step_id: `30000000-3000-3000-3000-${String(order).padStart(12, '0')}`,
        step_code: code,
        step_name: name,
        step_order: order,
        is_mandatory: order <= 9,   // Steps 1–9 are the mandatory foundation
        step_category: category,
        estimated_minutes: minutes,
        is_active: true,
      };
      const updateSet = {
        step_name: name,
        step_order: order,
        is_mandatory: order <= 9,
        step_category: category,
        estimated_minutes: minutes,
        is_active: true,
      };
      await masterDb
        .insert(master.setupStepMaster)
        .values(step)
        .onDuplicateKeyUpdate({ set: updateSet });
      await tenantDb
        .insert(tenant.setupStepMaster)
        .values(step)
        .onDuplicateKeyUpdate({ set: updateSet });
    }

    const nobs = [
      ['POULTRY', 'Poultry', 'STANDARD'],
      ['LIVESTOCK', 'Livestock', 'BIO_ASSET'],
      ['AGRI', 'Agriculture', 'STANDARD'],
      ['AQUA', 'Aquaculture', 'BIO_ASSET'],
      ['INSECT', 'Insect Farming', 'STANDARD'],
      ['PRODUCTION', 'Feed & Processing', 'STANDARD'],
    ] as const;
    const nobIds = new Map<string, string>();
    for (const [index, [code, name, costing]] of nobs.entries()) {
      const nob = {
        nob_id: `50000000-5000-5000-5000-${String(index + 1).padStart(12, '0')}`,
        nob_code: code,
        nob_name: name,
        default_costing_method: costing,
        sort_order: index + 1,
        is_system: true,
        is_active: true,
      };
      await masterDb
        .insert(master.nobMaster)
        .values(nob)
        .onDuplicateKeyUpdate({
          set: {
            nob_name: name,
            default_costing_method: costing,
            sort_order: index + 1,
            is_system: true,
            is_active: true,
          },
        });
      const [persistedNob] = await masterDb
        .select({ nobId: master.nobMaster.nob_id })
        .from(master.nobMaster)
        .where(eq(master.nobMaster.nob_code, code))
        .limit(1);
      nobIds.set(code, persistedNob.nobId);
      await tenantDb
        .insert(tenant.nobMaster)
        .values({ ...nob, nob_id: persistedNob.nobId })
        .onDuplicateKeyUpdate({
          set: {
            nob_name: name,
            default_costing_method: costing,
            sort_order: index + 1,
            is_system: true,
            is_active: true,
          },
        });
    }

    const lobs = [
      // ── POULTRY ─────────────────────────────────────────────────────────────
      ['POULTRY', 'PLT_REARING', 'Poultry Rearing & Breeding', 'STANDARD', 'NO', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: false, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['BROODING', 'GROWING', 'REARING'], enabled_modules: ['POULTRY', 'INVENTORY', 'COSTING']
      }],
      ['POULTRY', 'PLT_LAYING', 'Poultry Laying', 'STANDARD', 'NO', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['BROODING', 'GROWING', 'LAYING'], enabled_modules: ['POULTRY', 'INVENTORY', 'COSTING', 'QUALITY']
      }],
      ['POULTRY', 'PLT_HATCHING', 'Poultry Hatchery', 'STANDARD', 'NO', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['EGG_SETTING', 'INCUBATION', 'HATCHING'], enabled_modules: ['POULTRY', 'INVENTORY', 'COSTING', 'QUALITY']
      }],
      ['POULTRY', 'PLT_CB', 'Commercial Broiler', 'STANDARD', 'NO', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: false, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['BROODING', 'GROWING', 'FINISHING'], enabled_modules: ['POULTRY', 'INVENTORY', 'COSTING']
      }],
      ['POULTRY', 'PLT_SLAUGHTER', 'Poultry Slaughter', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'ITEM',
        scheduler_required: true, resource_required: true,
        stages: ['RECEIVING', 'SLAUGHTER', 'CUTTING', 'PACKAGING'], enabled_modules: ['POULTRY', 'INVENTORY', 'COSTING', 'QUALITY']
      }],

      // ── LIVESTOCK ────────────────────────────────────────────────────────────
      ['LIVESTOCK', 'LVS_BREEDING', 'Livestock Breeding', 'BIO_ASSET', 'YES', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'SERIAL',
        scheduler_required: true, resource_required: true,
        stages: ['CALF', 'HEIFER', 'BREEDING'], enabled_modules: ['LIVESTOCK', 'INVENTORY', 'COSTING']
      }],
      ['LIVESTOCK', 'LVS_MILKING', 'Dairy / Milking', 'BIO_ASSET', 'YES', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'SERIAL',
        scheduler_required: true, resource_required: true,
        stages: ['CALF', 'HEIFER', 'LACTATING', 'DRY'], enabled_modules: ['LIVESTOCK', 'INVENTORY', 'COSTING', 'QUALITY']
      }],
      ['LIVESTOCK', 'LVS_PIGGERY', 'Piggery', 'BIO_ASSET', 'YES', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['FARROWING', 'NURSERY', 'GROW_FINISH'], enabled_modules: ['LIVESTOCK', 'INVENTORY', 'COSTING']
      }],
      ['LIVESTOCK', 'LVS_GOAT_SHEEP', 'Goat & Sheep', 'BIO_ASSET', 'YES', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['KIDDING', 'WEANING', 'FATTENING'], enabled_modules: ['LIVESTOCK', 'INVENTORY', 'COSTING']
      }],
      ['LIVESTOCK', 'LVS_SLAUGHTER', 'Livestock Slaughter', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'ITEM',
        scheduler_required: true, resource_required: true,
        stages: ['LAIRAGE', 'SLAUGHTER', 'CARCASS_SPLIT', 'PACKAGING'], enabled_modules: ['LIVESTOCK', 'INVENTORY', 'COSTING', 'QUALITY']
      }],

      // ── AGRICULTURE ──────────────────────────────────────────────────────────
      ['AGRI', 'AGRI_FRUIT', 'Fruit Farming', 'BIO_ASSET', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['PLANTING', 'FLOWERING', 'FRUIT_SET', 'HARVEST'], enabled_modules: ['AGRI', 'INVENTORY', 'COSTING', 'QUALITY']
      }],
      ['AGRI', 'AGRI_CROP', 'Crop Farming', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'ACTUAL', 'FIFO'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['LAND_PREP', 'SOWING', 'IRRIGATION', 'HARVEST'], enabled_modules: ['AGRI', 'INVENTORY', 'COSTING']
      }],
      ['AGRI', 'AGRI_FLOWER', 'Flower Farming', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'ACTUAL', 'FIFO'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['PLANTING', 'VEGETATIVE', 'BLOOMING', 'HARVEST'], enabled_modules: ['AGRI', 'INVENTORY', 'COSTING']
      }],
      ['AGRI', 'AGRI_SEEDS', 'Seed Processing', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'ACTUAL', 'FIFO'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['CLEANING', 'DRYING', 'TREATING', 'PACKAGING'], enabled_modules: ['AGRI', 'INVENTORY', 'COSTING', 'QUALITY']
      }],

      // ── AQUACULTURE ──────────────────────────────────────────────────────────
      ['AQUA', 'AQA_FISH', 'Fish Farming', 'BIO_ASSET', 'YES', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['BIO_ASSET', 'STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['HATCHERY', 'NURSERY', 'GROW_OUT'], enabled_modules: ['AQUA', 'INVENTORY', 'COSTING']
      }],
      ['AQUA', 'AQA_SLAUGHTER', 'Aquaculture Slaughter', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'ITEM',
        scheduler_required: true, resource_required: true,
        stages: ['HARVEST', 'GUTTING', 'FILLETING', 'FREEZING'], enabled_modules: ['AQUA', 'INVENTORY', 'COSTING', 'QUALITY']
      }],

      // ── INSECT FARMING ───────────────────────────────────────────────────────
      ['INSECT', 'INS_BEE', 'Bee Keeping', 'STANDARD', 'YES', 'NO', 'NO', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['HIVE_SETUP', 'COLONY_BUILD', 'HONEY_HARVEST'], enabled_modules: ['INSECT', 'INVENTORY', 'COSTING']
      }],
      ['INSECT', 'INS_BSF', 'Black Soldier Fly', 'STANDARD', 'YES', 'NO', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: false, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['EGG', 'LARVAE', 'PUPAE', 'HARVEST'], enabled_modules: ['INSECT', 'INVENTORY', 'COSTING']
      }],

      // ── FEED & PROCESSING ────────────────────────────────────────────────────
      ['PRODUCTION', 'FEED_PROD', 'Feed Production', 'STANDARD', 'YES', 'YES', 'YES', 'YES', 'YES', {
        costing_methods: ['STANDARD', 'FIFO', 'ACTUAL'],
        batch_support: true, qc_required: true, qr_required: true, traceability_level: 'BATCH',
        scheduler_required: true, resource_required: true,
        stages: ['RAW_RECEIPT', 'GRINDING', 'MIXING', 'PELLETING', 'PACKAGING'], enabled_modules: ['FEED', 'INVENTORY', 'COSTING', 'QUALITY']
      }],
    ] as const;

    for (const [index, [nobCode, code, name, costing, qc, qr, traceability, batchCopy, schedulerCopy, config]] of lobs.entries()) {
      const lob = {
        lob_id: `60000000-6000-6000-6000-${String(index + 1).padStart(12, '0')}`,
        nob_id: nobIds.get(nobCode)!,
        lob_code: code,
        lob_name: name,
        costing_method_allowed: costing,
        qc_required: qc,
        qr_required: qr,
        traceability_required: traceability,
        batch_copy_allowed: batchCopy,
        scheduler_copy_allowed: schedulerCopy,
        sort_order: index + 1,
        is_system: true,
        is_active: true,
        extension_config: config,
      };
      const updateSet = {
        nob_id: lob.nob_id,
        lob_name: name,
        costing_method_allowed: costing,
        qc_required: qc,
        qr_required: qr,
        traceability_required: traceability,
        batch_copy_allowed: batchCopy,
        scheduler_copy_allowed: schedulerCopy,
        sort_order: index + 1,
        is_system: true,
        is_active: true,
        extension_config: config,
      };
      await masterDb
        .insert(master.lobMaster)
        .values(lob)
        .onDuplicateKeyUpdate({ set: updateSet });
      await tenantDb
        .insert(tenant.lobMaster)
        .values(lob)
        .onDuplicateKeyUpdate({ set: updateSet });
    }

    const today = new Date().toISOString().slice(0, 10);
    await masterDb
      .insert(master.tenantMaster)
      .values({
        tenant_id: SYSTEM_TENANT_ID,
        tenant_code: 'system',
        tenant_name: 'NAVFarm Platform Administration',
        tenant_type: 'PLATFORM',
        plan_id: 'PLAN_ENTERPRISE',
        plan_start_date: today,
        billing_cycle: 'ANNUAL',
        billing_email: adminEmail,
        max_companies: 100,
        max_users: 1000,
        api_rate_limit: 5000,
        db_host: host,
        db_port: port,
        db_name: systemDatabase,
        db_user: user,
        db_password: password,
      })
      .onDuplicateKeyUpdate({
        set: {
          billing_email: adminEmail,
          db_host: host,
          db_port: port,
          db_name: systemDatabase,
          db_user: user,
          db_password: password,
          is_active: true,
        },
      });
    await masterDb
      .insert(master.tenantSubscription)
      .values({
        tenant_id: SYSTEM_TENANT_ID,
        plan_code: 'PLAN_ENTERPRISE',
        feature_flags: { platformAdministration: true },
        storage_limit_gb: '500.00',
        support_tier: 'PREMIUM',
        sla_uptime_pct: '99.90',
      })
      .onDuplicateKeyUpdate({
        set: { plan_code: 'PLAN_ENTERPRISE', is_active: true },
      });

    await tenantDb
      .insert(tenant.companyMaster)
      .values({
        company_id: SYSTEM_COMPANY_ID,
        tenant_id: SYSTEM_TENANT_ID,
        company_code: 'PLATFORM',
        company_name: 'NAVFarm Platform Administration',
        company_type: 'Platform',
        industry_type: 'Administration',
        base_currency_id: INR_ID,
        default_language_id: ENGLISH_ID,
        default_timezone_id: 'Asia/Kolkata',
        country_id: 'IND',
        onboarding_status: 'COMPLETED',
      })
      .onDuplicateKeyUpdate({
        set: { company_name: 'NAVFarm Platform Administration', is_active: true },
      });
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await tenantDb
      .insert(tenant.userMaster)
      .values({
        user_id: process.env.SYSTEM_ADMIN_ID || randomUUID(),
        company_id: SYSTEM_COMPANY_ID,
        tenant_id: SYSTEM_TENANT_ID,
        full_name: process.env.SYSTEM_ADMIN_NAME || 'NAVFarm System Administrator',
        email: adminEmail.toLowerCase(),
        password_hash: passwordHash,
        user_type: 'SYSTEM_ADMIN',
        timezone_pref_id: 'Asia/Kolkata',
      })
      .onDuplicateKeyUpdate({
        set: { password_hash: passwordHash, user_type: 'SYSTEM_ADMIN', is_active: true },
      });

    console.log(`Bootstrapped ${masterDatabase} and ${systemDatabase}.`);
    console.log(`System administrator: ${adminEmail}`);
  } finally {
    await masterPool.end();
    await tenantPool.end();
  }
}

void bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
