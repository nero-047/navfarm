/**
 * Exercises the real inventory/costing/finance engines against the dev
 * tenant created by seed-dev-tenant.ts, so a fresh clone of this repo has a
 * live, correctly-computed demo instead of empty master data: a posted
 * goods receipt, a fully closed STANDARD-costing batch (consumption,
 * overhead, mortality, output valuation), and a full BIO_ASSET (IAS 41)
 * lifecycle (acquisition through maturity, amortization, and sale) — all
 * driven through the real HTTP API, so it's the exact same code path a user
 * clicking through the UI would hit, not a shortcut around it.
 *
 * Requires the API server to already be running (`pnpm nx serve api`) and
 * the dev tenant to already exist (`pnpm nx run api:db-seed-dev-tenant`).
 * Safe to re-run: skips entirely if the company already has any batch.
 */

const apiBase = process.env.DEV_API_BASE_URL || 'http://localhost:2877/api/v1';
const tenantCode = (process.env.DEV_TENANT_CODE || 'devco').toLowerCase();
const companyAdminEmail = (process.env.DEV_COMPANY_ADMIN_EMAIL || `admin@${tenantCode}.local`).toLowerCase();
const companyAdminPassword = process.env.DEV_COMPANY_ADMIN_PASSWORD || 'DevAdmin@12345';
const COMPANY_ID = '00000000-0000-0000-0000-000000000000';

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

function findByCode<T extends { [key: string]: any }>(rows: T[], codeField: string, code: string): T {
  const row = rows.find((r) => r[codeField] === code);
  if (!row) throw new Error(`Could not find ${codeField}='${code}' among ${rows.length} rows.`);
  return row;
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

async function run() {
  await waitForApi();

  const loginRes = await api('/auth/login', { method: 'POST', body: { email: companyAdminEmail, password: companyAdminPassword } });
  token = loginRes.access_token;

  const existingBatches = await api(`/batch?companyId=${COMPANY_ID}&limit=1`);
  const batchRows = existingBatches.data ?? existingBatches;
  if (Array.isArray(batchRows) && batchRows.length > 0) {
    console.log('Demo data already present (a batch already exists) — skipping.');
    return;
  }

  const nobs = await api('/setup/wizard/nobs');
  const nobPoultry = findByCode(nobs, 'nob_code', 'POULTRY');
  const nobLivestock = findByCode(nobs, 'nob_code', 'LIVESTOCK');
  const lobsPoultry = await api(`/setup/wizard/lobs/${nobPoultry.nob_id}`);
  const lobsLivestock = await api(`/setup/wizard/lobs/${nobLivestock.nob_id}`);
  const lobCb = findByCode(lobsPoultry, 'lob_code', 'PLT_CB');
  const lobRearing = findByCode(lobsPoultry, 'lob_code', 'PLT_REARING');
  const lobPiggery = findByCode(lobsLivestock, 'lob_code', 'LVS_PIGGERY');

  const warehouses = await api(`/warehouse?companyId=${COMPANY_ID}`);
  const warehouseRows = warehouses.data ?? warehouses;
  const warehouse = warehouseRows[0];

  const poultryItems = (await api(`/item?companyId=${COMPANY_ID}&nobId=${nobPoultry.nob_id}&limit=500`)).data;
  const livestockItems = (await api(`/item?companyId=${COMPANY_ID}&nobId=${nobLivestock.nob_id}&limit=500`)).data;
  const doc = findByCode(poultryItems, 'item_code', 'PLT-DOC');
  const broilerFeed = findByCode(poultryItems, 'item_code', 'PLT-BROILER-FEED');
  const liveBroiler = findByCode(poultryItems, 'item_code', 'PLT-LIVE-BROILER');
  const piglet = findByCode(livestockItems, 'item_code', 'LVS-PIGLET');
  const pigFeed = findByCode(livestockItems, 'item_code', 'LVS-PIG-FEED');

  const breedsCb = (await api(`/breed?companyId=${COMPANY_ID}&nobId=${nobPoultry.nob_id}&lobId=${lobCb.lob_id}`)).data;
  const breedCb = findByCode(breedsCb, 'breed_code', 'COBB-500-CB');
  const breedsPiggery = (await api(`/breed?companyId=${COMPANY_ID}&nobId=${nobLivestock.nob_id}&lobId=${lobPiggery.lob_id}`)).data;
  const breedPig = findByCode(breedsPiggery, 'breed_code', 'YORKSHIRE');

  console.log('Posting goods receipt (Inventory engine)...');
  const receipt = await api('/goods-receipt', {
    method: 'POST',
    body: {
      company_id: COMPANY_ID,
      warehouse_id: warehouse.warehouse_id,
      posting_date: '2026-07-01',
      lines: [
        { item_id: doc.item_id, quantity: 500, uom: 'PCS', rate: 45 },
        { item_id: broilerFeed.item_id, quantity: 2000, uom: 'KG', rate: 22 },
        { item_id: piglet.item_id, quantity: 50, uom: 'PCS', rate: 3500 },
        { item_id: pigFeed.item_id, quantity: 1500, uom: 'KG', rate: 28 },
      ],
    },
  });
  await api(`/goods-receipt/${receipt.data.receipt_id}/post`, { method: 'POST' });

  console.log('Running a STANDARD-costing broiler batch through its full lifecycle (Costing + Finance)...');
  const stdBatch = await api('/batch', {
    method: 'POST',
    body: {
      company_id: COMPANY_ID,
      lob_id: lobCb.lob_id,
      costing_method: 'STANDARD',
      breed_id: breedCb.breed_id,
      start_date: '2026-07-02',
      opening_quantity: 500,
      uom: 'PCS',
      input_lines: [{ item_id: doc.item_id, quantity: 500, uom: 'PCS', rate: 45 }],
    },
  });
  const stdBatchId = stdBatch.data.batch_id;
  await api(`/batch/${stdBatchId}/activate`, { method: 'POST' });
  await api(`/batch/${stdBatchId}/transaction`, {
    method: 'POST',
    body: { transaction_date: '2026-07-15', transaction_type: 'CONSUMPTION', item_id: broilerFeed.item_id, quantity: 1200, uom: 'KG' },
  });
  await api(`/batch/${stdBatchId}/transaction`, {
    method: 'POST',
    body: { transaction_date: '2026-07-20', transaction_type: 'OVERHEAD', quantity: 1, rate: 8000, remarks: 'Shed overhead — demo data' },
  });
  await api(`/batch/${stdBatchId}/transaction`, {
    method: 'POST',
    body: { transaction_date: '2026-07-25', transaction_type: 'MORTALITY', quantity: 15 },
  });
  await api(`/batch/${stdBatchId}/close`, {
    method: 'POST',
    body: {
      actual_end_date: '2026-08-01',
      closing_quantity: 485,
      output_lines: [{ item_id: liveBroiler.item_id, cost_split_pct: 100, quantity: 970, uom: 'KG', warehouse_id: warehouse.warehouse_id }],
    },
  });

  console.log('Running a BIO_ASSET (IAS 41) piggery batch through acquisition, maturity, amortization, and sale (Costing + Finance)...');
  const bioBatch = await api('/batch', {
    method: 'POST',
    body: {
      company_id: COMPANY_ID,
      lob_id: lobPiggery.lob_id,
      costing_method: 'BIO_ASSET',
      breed_id: breedPig.breed_id,
      start_date: '2026-06-01',
      opening_quantity: 50,
      uom: 'PCS',
      input_lines: [{ item_id: piglet.item_id, quantity: 50, uom: 'PCS', rate: 3500 }],
    },
  });
  const bioBatchId = bioBatch.data.batch_id;
  await api(`/batch/${bioBatchId}/activate`, { method: 'POST' });
  await api(`/batch/${bioBatchId}/transaction`, {
    method: 'POST',
    body: { transaction_date: '2026-06-20', transaction_type: 'CONSUMPTION', item_id: pigFeed.item_id, quantity: 800, uom: 'KG' },
  });
  await api(`/batch/${bioBatchId}/transaction`, {
    method: 'POST',
    body: { transaction_date: '2026-07-05', transaction_type: 'MORTALITY', quantity: 2 },
  });
  await api(`/batch/${bioBatchId}/mature`, {
    method: 'POST',
    body: { residual_value_per_unit: 500, productive_life_months: 4 },
  });
  await api(`/batch/${bioBatchId}/amortize`, { method: 'POST', body: { posting_date: '2026-08-05' } });
  await api(`/batch/${bioBatchId}/dispose`, {
    method: 'POST',
    body: { disposal_type: 'SOLD', quantity: 48, posting_date: '2026-08-10', sale_proceeds: 288000 },
  });

  console.log('');
  console.log('Demo data seeded: 1 posted goods receipt, 1 closed STANDARD batch, 1 sold BIO_ASSET batch.');
  console.log('Check Finance > Journal / Trial Balance / P&L and Inventory > Ledger in the console to see the postings.');
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
