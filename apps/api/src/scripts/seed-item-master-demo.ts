/**
 * Seeds a handful of realistic items through the real HTTP API, exercising every field the
 * Item Master form now supports: auto-generated item_code (ITEM number series), item_type
 * sourced from item_type_master, Category + free-text Sub Category, Secondary UOM + UOM
 * Conversion Factor, Valuation Method sourced from costing_method_config (STANDARD/FIFO/AVG),
 * Standard Cost, Lot Tracking + Tracking No. Series, Lead Time, Shelf Life, Storage Temp
 * Min/Max, Withdrawal Period (MEDICINE/VACCINE), QR Tracking, Item Image URL, and an Item
 * Attribute value — the same code path a user filling in the Item Master form would hit, not
 * a shortcut around it.
 *
 * Requires the API server running (`pnpm nx serve api`) and the dev tenant already seeded
 * (`pnpm nx run api:db-seed-dev-tenant`). Safe to re-run: skips any item whose name already
 * exists.
 */

const apiBase = process.env.DEV_API_BASE_URL || 'http://localhost:2877/api/v1';
const tenantCode = (process.env.DEV_TENANT_CODE || 'devco').toLowerCase();
// The users seed-dev-tenant.ts actually creates (see its console output) — not the
// DEV_*_ADMIN_EMAIL placeholders, which that script prints but does not use for the insert.
const adminEmail = 'admin@apexagri.local';
const adminPassword = '12345678';

let token = '';

async function api(path: string, options: { method?: string; body?: unknown } = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantCode,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

function findByCode<T extends { [key: string]: any }>(rows: T[], codeField: string, code: string): T | undefined {
  return rows.find((r) => r[codeField] === code);
}

async function waitForApi(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await fetch(`${apiBase}/setup/wizard/nobs`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`API not reachable at ${apiBase} — start it first with 'pnpm nx serve api'.`);
}

async function ensureLotSeries(): Promise<string> {
  const existing = (await api('/number-series?search=LOT')).data as Array<{ series_code: string; series_id: string }>;
  const found = findByCode(existing, 'series_code', 'LOT');
  if (found) return found.series_id;

  console.log("  Creating 'LOT' number series (for lot/serial tracking numbers)...");
  const created = await api('/number-series', {
    method: 'POST',
    body: {
      series_code: 'LOT',
      series_name: 'Lot / Serial Number',
      document_type: 'ITEM_LOT',
      prefix: 'LOT',
      date_format: 'YYYY',
      separator: '-',
      seq_length: 5,
      reset_frequency: 'YEARLY',
    },
  });
  return created.data.series_id;
}

async function run() {
  await waitForApi();

  const loginRes = await api('/auth/login', { method: 'POST', body: { email: adminEmail, password: adminPassword } });
  token = loginRes.access_token;

  const existingItems = (await api('/item?limit=500')).data as Array<{ item_name: string }>;
  const alreadySeeded = (name: string) => existingItems.some((i) => i.item_name === name);

  const categories = (await api('/item-category?limit=200')).data as Array<{ category_code: string; category_id: string }>;
  const catVetMeds = findByCode(categories, 'category_code', 'CAT-VET-MEDS');
  const catSwineFeeds = findByCode(categories, 'category_code', 'CAT-SWINE-FEEDS');
  const catVetVaccines = findByCode(categories, 'category_code', 'CAT-VET-VACCINES');

  const attributes = (await api('/item-attribute?limit=200')).data as Array<{ attribute_code: string; attribute_id: string }>;
  const attrCrudeProtein = findByCode(attributes, 'attribute_code', 'ATTR-CP');

  const lotSeriesId = await ensureLotSeries();

  const items: Array<{ label: string; body: Record<string, unknown> }> = [
    {
      label: 'Amoxicillin 15% LA Injectable (MEDICINE, lot-tracked, STANDARD costing)',
      body: {
        item_name: 'Amoxicillin 15% LA Injectable',
        item_type: 'MEDICINE',
        category_id: catVetMeds?.category_id,
        sub_category: 'Antibiotic',
        uom_primary: 'ML',
        uom_secondary: 'BOX',
        uom_conversion_factor: 100,
        valuation_method: 'STANDARD',
        standard_cost: 4.5,
        is_lot_tracked: true,
        tracking_series_id: lotSeriesId,
        min_stock_level: 50,
        max_stock_level: 500,
        reorder_level: 100,
        lead_time_days: 7,
        shelf_life_days: 730,
        storage_temp_min: 2,
        storage_temp_max: 8,
        withdrawal_days: 21,
        item_image_url: 'https://cdn.navfarm.io/items/amoxicillin-15la.jpg',
      },
    },
    {
      label: 'Starter Crumble Feed 21% Protein (FEED, AVG costing, secondary UOM)',
      body: {
        item_name: 'Starter Crumble Feed 21% Protein',
        item_type: 'FEED',
        category_id: catSwineFeeds?.category_id,
        sub_category: 'Starter',
        uom_primary: 'KG',
        uom_secondary: 'BAG',
        uom_conversion_factor: 25,
        valuation_method: 'AVG',
        min_stock_level: 500,
        max_stock_level: 5000,
        reorder_level: 800,
        lead_time_days: 5,
        shelf_life_days: 90,
        item_image_url: 'https://cdn.navfarm.io/items/starter-crumble.jpg',
        attributes: attrCrudeProtein ? [{ attribute_id: attrCrudeProtein.attribute_id, attribute_value: '21' }] : undefined,
      },
    },
    {
      label: 'PRRS Modified Live Vaccine (VACCINE, lot-tracked, FIFO costing)',
      body: {
        item_name: 'PRRS Modified Live Vaccine',
        item_type: 'VACCINE',
        category_id: catVetVaccines?.category_id,
        uom_primary: 'ML',
        valuation_method: 'FIFO',
        is_lot_tracked: true,
        tracking_series_id: lotSeriesId,
        lead_time_days: 14,
        shelf_life_days: 365,
        storage_temp_min: 2,
        storage_temp_max: 8,
        withdrawal_days: 0,
        item_image_url: 'https://cdn.navfarm.io/items/prrs-vaccine.jpg',
      },
    },
    {
      label: 'Vacuum Pack Bag - Pork Cuts (CONSUMABLE, QR-enabled, STANDARD costing)',
      body: {
        item_name: 'Vacuum Pack Bag - Pork Cuts',
        item_type: 'CONSUMABLE',
        sub_category: 'Packaging',
        uom_primary: 'PCS',
        uom_secondary: 'BOX',
        uom_conversion_factor: 250,
        valuation_method: 'STANDARD',
        standard_cost: 3.2,
        is_qr_enabled: true,
        lead_time_days: 10,
        item_image_url: 'https://cdn.navfarm.io/items/vacuum-bag.jpg',
      },
    },
    {
      label: 'Rendered Animal Fat (BY_PRODUCT, AVG costing)',
      body: {
        item_name: 'Rendered Animal Fat',
        item_type: 'BY_PRODUCT',
        uom_primary: 'KG',
        valuation_method: 'AVG',
        min_stock_level: 100,
        lead_time_days: 3,
      },
    },
  ];

  for (const { label, body } of items) {
    const name = body.item_name as string;
    if (alreadySeeded(name)) {
      console.log(`  skip (already exists): ${name}`);
      continue;
    }
    console.log(`  creating: ${label}`);
    const created = await api('/item', { method: 'POST', body });
    console.log(`    -> ${created.data.item_code}`);
  }

  console.log('');
  console.log('Item Master demo data seeded.');
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
