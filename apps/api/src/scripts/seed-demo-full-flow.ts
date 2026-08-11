/**
 * Drives every major module of the app through its real HTTP API for both
 * companies in the demo tenant (seed-demo-tenant.ts) — Inventory (goods
 * receipt, stock adjustment, stock transfer), Production/Costing (a full
 * STANDARD batch lifecycle for the poultry company, a full BIO_ASSET/IAS41
 * lifecycle for the livestock company), Finance (the GL postings all of the
 * above generate), Quality Control + Traceability (QC parameters, a QC
 * inspection, a QR-coded pack), Scheduler/KPI monitoring, and People &
 * Access (a custom RBAC role, a second team member).
 *
 * This is a permanent demo — unlike the throwaway verification tenants used
 * during development, nothing here is ever torn down. Safe to re-run: each
 * section checks for its own already-created data and skips if present.
 *
 * Requires the API server running (`pnpm nx serve api`) and the demo tenant
 * already provisioned (`pnpm nx run api:db-seed-demo-tenant`).
 */

const apiBase = process.env.DEV_API_BASE_URL || 'http://localhost:2877/api/v1';
const tenantCode = (process.env.DEMO_TENANT_CODE || 'demo').toLowerCase();

interface CompanyFlowSpec {
  label: string;
  companyCode: string;
  adminEmail: string;
  adminPassword: string;
  nobCode: string;
  lobCode: string;
  costingMethod: 'STANDARD' | 'BIO_ASSET';
  breedCode: string;
  inputItemCode: string;
  consumptionItemCode: string;
  outputItemCode: string;
  openingQty: number;
  disposalType?: 'HARVEST' | 'SOLD';
}

const FLOWS: CompanyFlowSpec[] = [
  {
    label: 'Sunrise Poultry Farms',
    companyCode: 'SUNRISE',
    adminEmail: process.env.DEMO_SUNRISE_ADMIN_EMAIL || `admin@sunrisepoultry.${tenantCode}.local`,
    adminPassword: process.env.DEMO_SUNRISE_ADMIN_PASSWORD || 'Sunrise@Demo2026!',
    nobCode: 'POULTRY',
    lobCode: 'PLT_CB',
    costingMethod: 'STANDARD',
    breedCode: 'COBB-500-CB',
    inputItemCode: 'PLT-DOC',
    consumptionItemCode: 'PLT-BROILER-FEED',
    outputItemCode: 'PLT-LIVE-BROILER',
    openingQty: 500,
  },
  {
    label: 'Green Valley Livestock',
    companyCode: 'GREENVALLEY',
    adminEmail: process.env.DEMO_GREENVALLEY_ADMIN_EMAIL || `admin@greenvalley.${tenantCode}.local`,
    adminPassword: process.env.DEMO_GREENVALLEY_ADMIN_PASSWORD || 'GreenValley@Demo2026!',
    nobCode: 'LIVESTOCK',
    lobCode: 'LVS_PIGGERY',
    costingMethod: 'BIO_ASSET',
    breedCode: 'YORKSHIRE',
    inputItemCode: 'LVS-PIGLET',
    consumptionItemCode: 'LVS-PIG-FEED',
    outputItemCode: 'LVS-DRESSED-PORK',
    openingQty: 50,
    disposalType: 'HARVEST',
  },
];

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
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

function rows(res: any): any[] {
  return res?.data ?? res ?? [];
}

function findByCode<T extends Record<string, any>>(list: T[], field: string, code: string): T {
  const row = list.find((r) => r[field] === code);
  if (!row) throw new Error(`Could not find ${field}='${code}' among ${list.length} rows.`);
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

async function login(email: string, password: string) {
  const res = await api('/auth/login', { method: 'POST', body: { email, password } });
  token = res.access_token;
  return res;
}

async function runCompanyFlow(spec: CompanyFlowSpec) {
  console.log('');
  console.log(`=== ${spec.label} (${spec.companyCode}) ===`);
  const loginRes = await login(spec.adminEmail, spec.adminPassword);
  const companyId = loginRes.user.companyId;

  const nobs = await api('/setup/wizard/nobs');
  const nob = findByCode(nobs, 'nob_code', spec.nobCode);
  const lobs = await api(`/setup/wizard/lobs/${nob.nob_id}`);
  const lob = findByCode(lobs, 'lob_code', spec.lobCode);

  const warehouses = rows(await api(`/warehouse?companyId=${companyId}`));
  const mainWarehouse = findByCode(warehouses, 'warehouse_code', 'WH-MAIN');
  const secondaryWarehouse = findByCode(warehouses, 'warehouse_code', 'WH-SECONDARY');

  // input_lines' item may belong to a sibling LOB within the same NOB (e.g.
  // PLT-DOC is PLT_REARING's item, placed into a PLT_CB batch) — search the
  // whole NOB, not just this LOB, to find it.
  const nobItems = rows(await api(`/item?companyId=${companyId}&nobId=${nob.nob_id}&limit=500`));
  const inputItem = findByCode(nobItems, 'item_code', spec.inputItemCode);
  const consumptionItem = findByCode(nobItems, 'item_code', spec.consumptionItemCode);
  const outputItem = findByCode(nobItems, 'item_code', spec.outputItemCode);

  const breeds = rows(await api(`/breed?companyId=${companyId}&nobId=${nob.nob_id}&lobId=${lob.lob_id}`));
  const breed = findByCode(breeds, 'breed_code', spec.breedCode);

  let batchId: string;
  let batchNo: string;
  let outputLineId: string | null = null;
  let outputQty: number;

  const existingBatches = rows(await api(`/batch?companyId=${companyId}&limit=1`));
  if (existingBatches.length > 0) {
    console.log('  Batch already exists for this company — reusing it for the remaining steps.');
    batchId = existingBatches[0].batch_id;
    batchNo = existingBatches[0].batch_no;
    let fullBatch = await api(`/batch/${batchId}`);

    // A prior run may have stopped mid-lifecycle (e.g. matured/amortized but
    // not yet disposed) — finish it rather than leaving a half-built demo.
    if (fullBatch.data?.status === 'ACTIVE' && fullBatch.data?.costing_method === 'BIO_ASSET') {
      const bioState = fullBatch.data?.bio_asset_state;
      if (bioState?.stage === 'PREMATURE') {
        await api(`/batch/${batchId}/mature`, { method: 'POST', body: { residual_value_per_unit: 500, productive_life_months: 4 } });
      }
      const survivors = Number((await api(`/batch/${batchId}`)).data?.bio_asset_state?.current_quantity || 0);
      if (survivors > 0) {
        console.log(`  Completing disposal for the ${survivors} remaining head...`);
        await api(`/batch/${batchId}/dispose`, {
          method: 'POST',
          body: {
            disposal_type: spec.disposalType,
            quantity: survivors,
            posting_date: '2026-07-15',
            output_item_id: outputItem.item_id,
            output_uom: 'KG',
            output_quantity: survivors * 65,
            warehouse_id: mainWarehouse.warehouse_id,
          },
        });
      }
      fullBatch = await api(`/batch/${batchId}`);
    }

    const line = fullBatch.data?.output_lines?.[0];
    outputLineId = line?.line_id || null;
    outputQty = Number(line?.quantity || 100);
  } else {
    // --- Inventory: enable QR traceability on the output item ---
    console.log('  Enabling QR traceability on the output item...');
    await api(`/item/${outputItem.item_id}`, { method: 'PUT', body: { is_qr_enabled: true } });

    // --- Inventory: Goods Receipt ---
    console.log('  Posting goods receipt...');
    const receipt = await api('/goods-receipt', {
      method: 'POST',
      body: {
        company_id: companyId,
        warehouse_id: mainWarehouse.warehouse_id,
        posting_date: '2026-06-01',
        lines: [
          { item_id: inputItem.item_id, quantity: spec.openingQty, uom: 'PCS', rate: spec.costingMethod === 'BIO_ASSET' ? 3500 : 45 },
          { item_id: consumptionItem.item_id, quantity: 3000, uom: 'KG', rate: spec.costingMethod === 'BIO_ASSET' ? 28 : 22 },
        ],
      },
    });
    await api(`/goods-receipt/${receipt.data.receipt_id}/post`, { method: 'POST' });

    // --- Inventory: Stock Adjustment (positive variance, physical count correction) ---
    console.log('  Posting a stock adjustment (physical count correction)...');
    const adjustment = await api('/stock-adjustment', {
      method: 'POST',
      body: {
        company_id: companyId,
        warehouse_id: mainWarehouse.warehouse_id,
        posting_date: '2026-06-05',
        reason: 'Physical count variance — demo data',
        lines: [{ item_id: consumptionItem.item_id, quantity: 20, uom: 'KG', rate: spec.costingMethod === 'BIO_ASSET' ? 28 : 22 }],
      },
    });
    await api(`/stock-adjustment/${adjustment.data.adjustment_id}/post`, { method: 'POST' });

    // --- Inventory: Stock Transfer between the two warehouses ---
    console.log('  Transferring stock between warehouses...');
    const transfer = await api('/stock-transfer', {
      method: 'POST',
      body: {
        company_id: companyId,
        from_warehouse_id: mainWarehouse.warehouse_id,
        to_warehouse_id: secondaryWarehouse.warehouse_id,
        posting_date: '2026-06-06',
        lines: [{ item_id: consumptionItem.item_id, quantity: 200, uom: 'KG' }],
      },
    });
    await api(`/stock-transfer/${transfer.data.transfer_id}/post`, { method: 'POST' });

    // --- Costing: full batch lifecycle ---
    console.log(`  Running a ${spec.costingMethod} batch through its full lifecycle...`);
    const batch = await api('/batch', {
      method: 'POST',
      body: {
        company_id: companyId,
        lob_id: lob.lob_id,
        costing_method: spec.costingMethod,
        breed_id: breed.breed_id,
        start_date: '2026-06-02',
        opening_quantity: spec.openingQty,
        uom: 'PCS',
        input_lines: [{ item_id: inputItem.item_id, quantity: spec.openingQty, uom: 'PCS', rate: spec.costingMethod === 'BIO_ASSET' ? 3500 : 45 }],
      },
    });
    batchId = batch.data.batch_id;
    batchNo = batch.data.batch_no;
    await api(`/batch/${batchId}/activate`, { method: 'POST' });
    await api(`/batch/${batchId}/transaction`, {
      method: 'POST',
      body: { transaction_date: '2026-06-15', transaction_type: 'CONSUMPTION', item_id: consumptionItem.item_id, quantity: 1200, uom: 'KG' },
    });
    if (spec.costingMethod === 'STANDARD') {
      await api(`/batch/${batchId}/transaction`, {
        method: 'POST',
        body: { transaction_date: '2026-06-20', transaction_type: 'OVERHEAD', quantity: 1, rate: 8000, remarks: 'Shed overhead — demo data' },
      });
    }
    const mortalityQty = Math.round(spec.openingQty * 0.03);
    const survivors = spec.openingQty - mortalityQty;
    await api(`/batch/${batchId}/transaction`, {
      method: 'POST',
      body: { transaction_date: '2026-06-25', transaction_type: 'MORTALITY', quantity: mortalityQty },
    });

    if (spec.costingMethod === 'STANDARD') {
      outputQty = survivors * 2;
      const closed = await api(`/batch/${batchId}/close`, {
        method: 'POST',
        body: {
          actual_end_date: '2026-07-15',
          closing_quantity: survivors,
          output_lines: [{ item_id: outputItem.item_id, cost_split_pct: 100, quantity: outputQty, uom: 'KG', warehouse_id: mainWarehouse.warehouse_id }],
        },
      });
      outputLineId = closed.data.output_lines?.[0]?.line_id || null;
    } else {
      await api(`/batch/${batchId}/mature`, { method: 'POST', body: { residual_value_per_unit: 500, productive_life_months: 4 } });
      await api(`/batch/${batchId}/amortize`, { method: 'POST', body: { posting_date: '2026-07-05' } });
      outputQty = survivors * 65;
      const disposed = await api(`/batch/${batchId}/dispose`, {
        method: 'POST',
        body: {
          disposal_type: spec.disposalType,
          quantity: survivors,
          posting_date: '2026-07-15',
          output_item_id: outputItem.item_id,
          output_uom: 'KG',
          output_quantity: outputQty,
          warehouse_id: mainWarehouse.warehouse_id,
        },
      });
      const finalBatch = await api(`/batch/${batchId}`);
      outputLineId = finalBatch.data?.output_lines?.[0]?.line_id || disposed.data?.output_line_id || null;
    }
  }

  // --- QC: parameter (idempotent by code) + inspection (idempotent by batch) ---
  console.log('  Recording a QC inspection on the batch output...');
  const qcParamCode = `QC-${spec.lobCode}-WEIGHT`;
  let qcParamId: string;
  const createdParam = await api('/qc-parameter', {
    method: 'POST',
    body: {
      company_id: companyId,
      lob_id: lob.lob_id,
      param_code: qcParamCode,
      param_name: 'Average Unit Weight',
      param_type: 'NUMERIC',
      uom: 'KG',
      min_value: spec.costingMethod === 'BIO_ASSET' ? 55 : 1.5,
      max_value: spec.costingMethod === 'BIO_ASSET' ? 90 : 2.6,
    },
  }).catch((err: Error) => (err.message.includes('409') ? null : Promise.reject(err)));
  if (createdParam) {
    qcParamId = createdParam.data.param_id;
  } else {
    const existingParams = rows(await api(`/qc-parameter?companyId=${companyId}&lobId=${lob.lob_id}`));
    qcParamId = findByCode(existingParams, 'param_code', qcParamCode).param_id;
  }

  const existingQc = rows(await api(`/qc?companyId=${companyId}&sourceBatchId=${batchId}`));
  let qcId: string | undefined = existingQc[0]?.qc_id;
  if (!qcId) {
    const qc = await api('/qc', {
      method: 'POST',
      body: {
        company_id: companyId,
        source_batch_id: batchId,
        output_line_id: outputLineId || undefined,
        qc_date: '2026-07-16',
        total_qty_received: outputQty,
        pass_qty: outputQty,
        fail_qty: 0,
        disposition: 'ACCEPT',
        results: [{ param_id: qcParamId, actual_value: spec.costingMethod === 'BIO_ASSET' ? '68' : '2.0' }],
      },
    });
    qcId = qc.data?.qc_id;
  }

  // --- Traceability: QR pack (idempotent by batch) ---
  console.log('  Generating a QR-coded pack linked to the QC result...');
  const existingPacks = rows(await api(`/qr-code?companyId=${companyId}`)).filter((p: any) => p.batch_id === batchId);
  if (existingPacks.length === 0) {
    await api('/qr-code', {
      method: 'POST',
      body: {
        company_id: companyId,
        batch_id: batchId,
        output_line_id: outputLineId || undefined,
        qc_id: qcId,
        item_id: outputItem.item_id,
        production_date: '2026-07-16',
        net_weight: Math.min(outputQty, 25),
        pack_uom: 'KG',
        warehouse_id: mainWarehouse.warehouse_id,
      },
    });
  }

  // --- Scheduler: KPI monitoring plan (idempotent by code) ---
  console.log('  Creating a Scheduler with KPI parameter lines...');
  const parameters = rows(await api(`/parameter?nobId=${nob.nob_id}&lobId=${lob.lob_id}`));
  if (parameters.length > 0) {
    await api('/scheduler', {
      method: 'POST',
      body: {
        company_id: companyId,
        nob_id: nob.nob_id,
        lob_id: lob.lob_id,
        scheduler_code: `SCH-${spec.lobCode}-DEMO`,
        scheduler_name: `${spec.label} Standard Cycle`,
        duration_value: spec.costingMethod === 'BIO_ASSET' ? 120 : 42,
        duration_unit: 'DAY',
        breed_id: breed.breed_id,
        parameter_lines: parameters.slice(0, 3).map((p, i) => ({
          parameter_id: p.parameter_id,
          period_no: i + 1,
          period_from: i * 14 + 1,
          period_to: i * 14 + 14,
          period_label: `Period ${i + 1}`,
        })),
      },
    }).catch((err: Error) => (err.message.includes('409') ? null : Promise.reject(err)));
  }

  // --- People & Access: custom role (idempotent — createRole itself 409s) + a second team member ---
  console.log('  Creating a custom RBAC role and a second team member...');
  const roleCode = `${spec.companyCode}_SUPERVISOR`;
  const createdRole = await api('/role/create', {
    method: 'POST',
    body: { companyId, roleCode, roleName: `${spec.label} Supervisor`, description: 'Batch and inventory operations, read-only finance' },
  }).catch((err: Error) => (err.message.includes('409') ? null : Promise.reject(err)));
  let roleId: string;
  if (createdRole) {
    roleId = createdRole.role_id;
    await api(`/role/permissions/${roleId}`, {
      method: 'POST',
      body: {
        permissions: [
          { module_code: 'PRODUCTION', resource: 'BATCH', can_view: true, can_create: true, can_edit: true },
          { module_code: 'INVENTORY', resource: 'GOODS_RECEIPT', can_view: true, can_create: true },
          { module_code: 'FINANCE', resource: 'JOURNAL', can_view: true },
        ],
      },
    });
  } else {
    const existingRoles = rows(await api(`/role/company/${companyId}`));
    roleId = findByCode(existingRoles, 'role_code', roleCode).role_id;
  }

  const staffEmail = `staff@${spec.companyCode.toLowerCase()}.${tenantCode}.local`;
  const staff = await api('/auth/register-admin', {
    method: 'POST',
    body: {
      email: staffEmail,
      password_hash: 'Staff@Demo2026!',
      full_name: `${spec.label} Supervisor`,
      user_type: 'STANDARD_USER',
      company_id: companyId,
      tenant_id: loginRes.user.tenantId,
      timezone_pref_id: 'Asia/Kolkata',
    },
  }).catch((err: Error) => (err.message.includes('409') ? null : Promise.reject(err)));
  if (staff) {
    await api('/role/assign', { method: 'POST', body: { userId: staff.user_id, roleId } });
  }

  console.log(`  Done. Batch ${batchNo}, QC ${qcId ? 'recorded' : 'skipped'}, staff login: ${staffEmail} / Staff@Demo2026!`);
}

async function run() {
  await waitForApi();
  for (const spec of FLOWS) {
    await runCompanyFlow(spec);
  }
  console.log('');
  console.log('Demo full-flow seed complete. Data is permanent — nothing here gets cleaned up.');
  console.log(`Console: http://localhost:3001/login?tenant=${tenantCode}`);
}

void run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
