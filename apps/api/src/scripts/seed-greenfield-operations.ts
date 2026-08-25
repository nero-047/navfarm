/**
 * Fills the operational + financial modules for the Greenfield tenant that the
 * structural provisioning script leaves empty: roles & permissions, warehouses,
 * suppliers, GL chart of accounts, journal entries, goods receipts, goods
 * issues, stock transfers, stock adjustments, the FIFO inventory ledger, and
 * QC parameters. Run after provision-greenfield-tenant.ts.
 */
import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';
import * as tenant from '../core/database/schema';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const DB = 'tenant_greenfield';

const uid = () => randomUUID();
const dAgo = (n: number) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };
const m4 = (n: number) => n.toFixed(4);

const ROLES = [
  { code: 'FARM_MANAGER', name: 'Farm Manager', desc: 'Full operational control of an assigned area.' },
  { code: 'FARM_OPERATOR', name: 'Farm Operator', desc: 'Records daily feed, health and mortality entries.' },
  { code: 'STORE_KEEPER', name: 'Store Keeper', desc: 'Receives stock, issues to production, runs counts.' },
  { code: 'VETERINARIAN', name: 'Veterinarian', desc: 'Clinical treatment, vaccination and withdrawal control.' },
  { code: 'ACCOUNTANT', name: 'Accountant', desc: 'Journals, costing and statutory reporting.' },
];
const ROLE_MODULES: Record<string, string[]> = {
  // A farm manager runs the whole operational area, so they need every module
  // the operational workspace links to — otherwise RolesGuard 403s the page.
  FARM_MANAGER: ['PRODUCTION', 'PIGGERY', 'INVENTORY', 'FINANCE', 'MASTER_DATA', 'AUDIT', 'NOTIFICATION', 'COMPANY'],
  FARM_OPERATOR: ['PRODUCTION', 'PIGGERY', 'MASTER_DATA'],
  STORE_KEEPER: ['INVENTORY', 'MASTER_DATA'],
  VETERINARIAN: ['PIGGERY', 'PRODUCTION', 'MASTER_DATA'],
  ACCOUNTANT: ['FINANCE', 'INVENTORY', 'AUDIT', 'MASTER_DATA'],
};

const GL = [
  { code: '1010', name: 'Raw Material Inventory', type: 'ASSET' },
  { code: '1020', name: 'Finished Goods Inventory', type: 'ASSET' },
  { code: '1060', name: 'Biological Assets — Mature', type: 'ASSET' },
  { code: '1070', name: 'Biological Assets — Immature', type: 'ASSET' },
  { code: '1080', name: 'Work In Progress (Batch WIP)', type: 'ASSET' },
  { code: '2010', name: 'Accounts Payable', type: 'LIABILITY' },
  { code: '3010', name: 'Share Capital', type: 'EQUITY' },
  { code: '4010', name: 'Livestock Sales Revenue', type: 'INCOME' },
  { code: '4020', name: 'Fair Value Gain / Loss', type: 'INCOME' },
  { code: '5010', name: 'Mortality Loss', type: 'EXPENSE' },
  { code: '5020', name: 'Feed Consumption Expense', type: 'EXPENSE' },
  { code: '5030', name: 'Veterinary & Medicine Expense', type: 'EXPENSE' },
  { code: '5080', name: 'Bio-Asset Consumption Expense', type: 'EXPENSE' },
];

const QC = [
  { code: 'QC-MOISTURE', name: 'Feed Moisture Content', type: 'NUMERIC', uom: '%', min: '0', max: '13' },
  { code: 'QC-PROTEIN', name: 'Crude Protein', type: 'NUMERIC', uom: '%', min: '14', max: '22' },
  { code: 'QC-AFLATOXIN', name: 'Aflatoxin Screen', type: 'NUMERIC', uom: 'PPB', min: '0', max: '20' },
  { code: 'QC-CARCASS-GRADE', name: 'Carcass Grade', type: 'TEXT', uom: null, min: null, max: null },
  { code: 'QC-BACKFAT', name: 'Backfat Thickness', type: 'NUMERIC', uom: 'MM', min: '8', max: '18' },
];

async function run() {
  const pool = mysql.createPool({ host, port, user, password, database: DB });
  const db = drizzle(pool, { schema: tenant, mode: 'default' });

  const companies = (await db.select().from(tenant.companyMaster)).filter((c) => c.company_code !== 'GF-HQ');
  const tenantId = companies[0].tenant_id;
  const users = await db.select().from(tenant.userMaster);
  const items = await db.select().from(tenant.itemMaster);
  const lobs = await db.select().from(tenant.lobMaster);
  const pigLob = lobs.find((l) => l.lob_code === 'LVS_PIGGERY')!;
  const farms = await db.select().from(tenant.farmMaster);
  const batches = await db.select().from(tenant.batchHeader);

  // The system item seed only carries a generic 'Pig Feed'; a piggery demo needs
  // the real ration/medicine SKUs the daily-entry and inventory screens refer to.
  const pigNob = (await db.select().from(tenant.nobMaster)).find((n) => n.nob_code === 'LIVESTOCK')!;
  const EXTRA_ITEMS = [
    { code: 'FEED-GEST-SOW', name: 'Dry Sow Gestation Mash (14% CP)', type: 'RAW_MATERIAL', uom: 'KG' },
    { code: 'FEED-LACT-SOW', name: 'Lactating Sow Ration (18% CP)', type: 'RAW_MATERIAL', uom: 'KG' },
    { code: 'FEED-CREEP-PRE', name: 'Creep Feed Pre-Starter (22% CP)', type: 'RAW_MATERIAL', uom: 'KG' },
    { code: 'FEED-GROW-WEAN', name: 'Weaner Grower Mash (18% CP)', type: 'RAW_MATERIAL', uom: 'KG' },
    { code: 'MED-IVERMECTIN', name: 'Ivermectin 1% Swine Dewormer 100ml', type: 'CONSUMABLE', uom: 'ML' },
    { code: 'MED-FMD-VACCINE', name: 'FMD Vaccine (Swine) 50-dose vial', type: 'CONSUMABLE', uom: 'ML' },
    { code: 'MED-IRON-DEXTRAN', name: 'Iron Dextran 200mg Piglet Injection', type: 'CONSUMABLE', uom: 'ML' },
  ];
  for (const e of EXTRA_ITEMS) {
    if (items.some((i) => i.item_code === e.code)) continue;
    const id = uid();
    await db.insert(tenant.itemMaster).values({
      item_id: id, tenant_id: tenantId, company_id: null, nob_id: pigNob.nob_id, lob_id: pigLob.lob_id,
      item_code: e.code, item_name: e.name, item_type: e.type, uom_primary: e.uom,
    });
    items.push({ ...(items[0] as any), item_id: id, item_code: e.code, item_name: e.name, uom_primary: e.uom });
  }
  const pick = (code: string) => items.find((i) => i.item_code === code)!;
  const feed = pick('FEED-GEST-SOW');
  const creep = pick('FEED-CREEP-PRE');
  const med = pick('MED-IVERMECTIN');

  // ── QC parameters (tenant-wide, piggery LOB) ────────────────────────────
  for (const q of QC) {
    await db.insert(tenant.qcParameterMaster).values({
      param_id: uid(), tenant_id: tenantId, company_id: null, lob_id: pigLob.lob_id,
      param_code: q.code, param_name: q.name, param_type: q.type, uom: q.uom,
      min_value: q.min, max_value: q.max, is_mandatory: true, is_active: true,
    });
  }
  console.log(`✓ ${QC.length} QC parameters`);

  let totalDocs = 0;
  for (const co of companies) {
    const admin = users.find((u) => u.company_id === co.company_id && u.user_type === 'COMPANY_ADMIN')!;
    const ops = users.find((u) => u.company_id === co.company_id && u.user_type === 'OPERATIONAL_ADMIN')!;
    const farm = farms.find((f) => f.company_id === co.company_id)!;
    const coBatches = batches.filter((b) => b.company_id === co.company_id);

    // Roles + permissions
    const roleIdByCode = new Map<string, string>();
    for (const r of ROLES) {
      const roleId = uid();
      roleIdByCode.set(r.code, roleId);
      await db.insert(tenant.roleMaster).values({
        role_id: roleId, company_id: co.company_id,
        role_code: r.code, role_name: r.name, role_description: r.desc,
        is_system_role: false, is_active: true,
      });
      for (const mod of ROLE_MODULES[r.code]) {
        await db.insert(tenant.rolePermissions).values({
          perm_id: uid(), role_id: roleId, module_code: mod, resource: 'ALL',
          can_view: true, can_create: r.code !== 'FARM_OPERATOR', can_edit: r.code !== 'FARM_OPERATOR',
          can_delete: r.code === 'FARM_MANAGER', can_approve: r.code === 'FARM_MANAGER' || r.code === 'ACCOUNTANT',
        });
      }
    }

    // RolesGuard resolves permissions through user_role_assignment; without a
    // row here an OPERATIONAL_ADMIN is 403'd on every module (COMPANY_ADMIN and
    // TENANT_ADMIN short-circuit the guard, which is why only ops users broke).
    await db.insert(tenant.userRoleAssignment).values({
      assign_id: uid(), user_id: ops.user_id, role_id: roleIdByCode.get('FARM_MANAGER')!,
      assigned_by: admin.user_id, is_active: true,
    });

    // Warehouses
    const whMain = uid(), whFeed = uid();
    await db.insert(tenant.warehouseMaster).values([
      { warehouse_id: whMain, tenant_id: tenantId, company_id: co.company_id, farm_id: farm.farm_id,
        warehouse_code: `${co.company_code}-WH-MAIN`, warehouse_name: 'Central Store', warehouse_type: 'MAIN', is_active: true },
      { warehouse_id: whFeed, tenant_id: tenantId, company_id: co.company_id, farm_id: farm.farm_id,
        warehouse_code: `${co.company_code}-WH-FEED`, warehouse_name: 'Feed Silo Store', warehouse_type: 'FEED', is_active: true },
    ]);

    // Suppliers
    const supA = uid(), supB = uid();
    await db.insert(tenant.supplierMaster).values([
      { supplier_id: supA, tenant_id: tenantId, company_id: co.company_id, supplier_code: `${co.company_code}-SUP-01`,
        supplier_name: 'Nutriblend Feeds Pvt Ltd', vendor_type: 'FEED', email: 'sales@nutriblend.example',
        phone: '+91 98200 11223', is_active: true },
      { supplier_id: supB, tenant_id: tenantId, company_id: co.company_id, supplier_code: `${co.company_code}-SUP-02`,
        supplier_name: 'VetCare Animal Health', vendor_type: 'MEDICINE', email: 'orders@vetcare.example',
        phone: '+91 99400 55667', is_active: true },
    ]);

    // GL chart of accounts
    const glIds = new Map<string, string>();
    for (const a of GL) {
      const id = uid(); glIds.set(a.code, id);
      await db.insert(tenant.glAccountMaster).values({
        gl_account_id: id, tenant_id: tenantId, company_id: co.company_id,
        account_code: a.code, account_name: a.name, account_type: a.type,
        is_active: true,
      });
    }

    // Goods receipts (+ lines + FIFO ledger)
    const grns = [
      { no: `GRN-${co.company_code}-0001`, item: feed, qty: 4000, rate: 28, sup: supA, wh: whFeed, days: 21 },
      { no: `GRN-${co.company_code}-0002`, item: creep, qty: 1200, rate: 46, sup: supA, wh: whFeed, days: 14 },
      { no: `GRN-${co.company_code}-0003`, item: med, qty: 60, rate: 250, sup: supB, wh: whMain, days: 9 },
    ];
    for (const g of grns) {
      const rid = uid();
      await db.insert(tenant.goodsReceipt).values({
        receipt_id: rid, tenant_id: tenantId, company_id: co.company_id, receipt_no: g.no,
        posting_date: dAgo(g.days), warehouse_id: g.wh, supplier_id: g.sup,
        external_reference_no: `INV-${g.no.slice(-4)}`, status: 'POSTED',
        remarks: 'Vendor delivery accepted after QC screen.',
        created_by: admin.user_id,
      });
      await db.insert(tenant.goodsReceiptLine).values({
        line_id: uid(), receipt_id: rid, line_no: 1, item_id: g.item.item_id,
        quantity: m4(g.qty), uom: g.item.uom_primary, rate: m4(g.rate), amount: m4(g.qty * g.rate),
      });
      await db.insert(tenant.inventoryLedger).values({
        ledger_id: uid(), tenant_id: tenantId, company_id: co.company_id, item_id: g.item.item_id,
        item_code: g.item.item_code, item_description: g.item.item_name,
        document_type: 'GRN', document_no: g.no, posting_date: dAgo(g.days),
        entry_type: 'IN', transaction_type: 'PURCHASE', quantity: m4(g.qty), uom: g.item.uom_primary,
        rate: m4(g.rate), amount: m4(g.qty * g.rate), warehouse_id: g.wh,
        remaining_quantity: m4(g.qty * 0.55), created_by: admin.user_id,
      });
      totalDocs++;
    }

    // Goods issue to production (feeds the batches)
    if (coBatches.length) {
      const iid = uid();
      const issueNo = `GI-${co.company_code}-0001`;
      await db.insert(tenant.goodsIssue).values({
        issue_id: iid, tenant_id: tenantId, company_id: co.company_id, issue_no: issueNo,
        posting_date: dAgo(6), warehouse_id: whFeed,
        status: 'POSTED', remarks: `Weekly ration draw for ${coBatches[0].batch_no}.`,
        created_by: ops.user_id,
      });
      await db.insert(tenant.goodsIssueLine).values({
        line_id: uid(), issue_id: iid, line_no: 1, item_id: feed.item_id,
        quantity: m4(900), uom: feed.uom_primary, remarks: 'Gestation ration',
      });
      await db.insert(tenant.inventoryLedger).values({
        ledger_id: uid(), tenant_id: tenantId, company_id: co.company_id, item_id: feed.item_id,
        item_code: feed.item_code, item_description: feed.item_name,
        document_type: 'GOODS_ISSUE', document_no: issueNo, posting_date: dAgo(6),
        entry_type: 'OUT', transaction_type: 'CONSUMPTION', quantity: m4(-900), uom: feed.uom_primary,
        rate: m4(28), amount: m4(-900 * 28), warehouse_id: whFeed,
        remaining_quantity: '0.0000', created_by: ops.user_id,
      });
      totalDocs++;
    }

    // Stock transfer between the two stores
    const tid = uid();
    const trNo = `TRF-${co.company_code}-0001`;
    await db.insert(tenant.stockTransfer).values({
      transfer_id: tid, tenant_id: tenantId, company_id: co.company_id, transfer_no: trNo,
      posting_date: dAgo(4), from_warehouse_id: whFeed, to_warehouse_id: whMain,
      status: 'POSTED', remarks: 'Re-positioning creep feed ahead of farrowing.', created_by: ops.user_id,
    });
    await db.insert(tenant.stockTransferLine).values({
      line_id: uid(), transfer_id: tid, line_no: 1, item_id: creep.item_id,
      quantity: m4(300), uom: creep.uom_primary, remarks: 'Creep feed re-positioning',
    });
    totalDocs++;

    // Stock adjustment from a physical count
    const aid = uid();
    const adjNo = `ADJ-${co.company_code}-0001`;
    await db.insert(tenant.stockAdjustment).values({
      adjustment_id: aid, tenant_id: tenantId, company_id: co.company_id, adjustment_no: adjNo,
      posting_date: dAgo(2), warehouse_id: whFeed,
      status: 'POSTED', reason: 'PHYSICAL_COUNT',
      remarks: 'Monthly silo count — moisture shrinkage.', created_by: ops.user_id,
    });
    await db.insert(tenant.stockAdjustmentLine).values({
      line_id: uid(), adjustment_id: aid, line_no: 1, item_id: feed.item_id,
      quantity: m4(-18), uom: feed.uom_primary, rate: m4(28),
      remarks: 'Shrinkage on physical count',
    });
    totalDocs++;

    // Journal entries — a purchase accrual and a feed-consumption posting
    const jrn = [
      { no: `JE-${co.company_code}-0001`, date: dAgo(21), src: 'INVENTORY', memo: 'Feed purchase accrual (GRN-0001)',
        lines: [{ gl: '1010', dr: 112000, cr: 0 }, { gl: '2010', dr: 0, cr: 112000 }] },
      { no: `JE-${co.company_code}-0002`, date: dAgo(6), src: 'PRODUCTION', memo: 'Feed issued to batch WIP',
        lines: [{ gl: '1080', dr: 25200, cr: 0 }, { gl: '1010', dr: 0, cr: 25200 }] },
      { no: `JE-${co.company_code}-0003`, date: dAgo(3), src: 'PRODUCTION', memo: 'Mortality write-off',
        lines: [{ gl: '5010', dr: 26000, cr: 0 }, { gl: '1060', dr: 0, cr: 26000 }] },
    ];
    for (const j of jrn) {
      const jid = uid();
      const total = j.lines.reduce((s, l) => s + l.dr, 0);
      await db.insert(tenant.journalHeader).values({
        journal_id: jid, tenant_id: tenantId, company_id: co.company_id, journal_no: j.no,
        posting_date: j.date, source: j.src, status: 'POSTED', description: j.memo,
        total_debit: m4(total), total_credit: m4(total), created_by: admin.user_id,
      });
      let ln = 1;
      for (const l of j.lines) {
        await db.insert(tenant.journalLine).values({
          line_id: uid(), journal_id: jid, line_no: ln++, gl_account_id: glIds.get(l.gl)!,
          debit_amount: m4(l.dr), credit_amount: m4(l.cr), description: j.memo,
        });
      }
      totalDocs++;
    }
    console.log(`✓ ${co.company_name}: roles, 2 warehouses, 2 suppliers, ${GL.length} GL accounts, inventory + journals`);
  }

  // ── Packs & traceability (QR-coded finished packs) ──────────────────────
  const finished = items.find((i) => i.item_code === 'PRD-FINISHED-FEED') || items.find((i) => i.item_code.includes('PIGLET')) || items[0];
  let packs = 0;
  for (const co of companies) {
    const admin = users.find((u) => u.company_id === co.company_id && u.user_type === 'COMPANY_ADMIN')!;
    const coBatches = batches.filter((b) => b.company_id === co.company_id);
    for (const [bi, b] of coBatches.entries()) {
      for (let i = 1; i <= 3; i++) {
        const packNo = `${co.company_code}-PACK-${String(bi * 3 + i).padStart(4, '0')}`;
        const grade = ['A', 'A', 'B'][i - 1];
        await db.insert(tenant.qrCodeMaster).values({
          qr_id: uid(), tenant_id: tenantId, company_id: co.company_id, batch_id: b.batch_id,
          item_id: finished.item_id, lot_no: `LOT-${b.batch_no.slice(-4)}-${i}`,
          pack_no: packNo, production_date: dAgo(5 + i), expiry_date: dAgo(-180 + i),
          net_weight: m4(78 + i * 1.5), gross_weight: m4(80 + i * 1.5), pack_uom: 'KG',
          grade, breed: 'Yorkshire / Landrace',
          origin_batch_chain: `${co.company_code} → ${b.batch_no} → ${packNo}`,
          qr_data: JSON.stringify({ pack: packNo, batch: b.batch_no, company: co.company_code, grade }),
          generated_by: admin.user_id, is_voided: i === 3 && bi === 0,
        });
        packs++;
      }
    }
  }
  console.log(`✓ ${packs} traceability packs`);

  console.log(`✓ ${totalDocs} operational/financial documents created`);
  await pool.end();
}

run().then(() => process.exit(0)).catch((e) => { console.error('❌ FAILED:', e); process.exit(1); });
