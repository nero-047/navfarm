import { randomUUID } from 'node:crypto';
import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import * as schema from '../core/database/schema';

const host = process.env.DATABASE_HOST || 'localhost';
const port = Number(process.env.DATABASE_PORT || 3306);
const user = process.env.DATABASE_USERNAME || 'root';
const password = process.env.DATABASE_PASSWORD || '';
const dbName = 'piggery_tenant_devco';

export async function seedPorkerBatchPastDays() {
  console.log(`\n======================================================`);
  console.log(`Seeding All Past Days Data Entries for PIG-BAT-2026-0006 into ${dbName}...`);
  console.log(`======================================================\n`);

  const pool = mysql.createPool({ host, port, user, password, database: dbName });
  const db = drizzle(pool, { schema, mode: 'default' });

  try {
    // 1. Fetch Batch
    const [batch] = await db
      .select()
      .from(schema.batchHeader)
      .where(eq(schema.batchHeader.batch_no, 'PIG-BAT-2026-0006'))
      .limit(1);

    if (!batch) {
      throw new Error('Batch PIG-BAT-2026-0006 not found.');
    }

    const tenantId = batch.tenant_id;
    const companyId = batch.company_id;
    const batchId = batch.batch_id;

    const [userRow] = await db.select().from(schema.userMaster).where(eq(schema.userMaster.user_type, 'COMPANY_ADMIN')).limit(1);
    const userId = userRow?.user_id || '00000000-0000-0000-0000-000000000000';

    // 2. Fetch Items
    const items = await db.select().from(schema.itemMaster).where(eq(schema.itemMaster.company_id, companyId));
    const itemMap = new Map(items.map((i) => [i.item_code, i]));

    const feedPreStarter = itemMap.get('FEED-CREEP-PRE') || items.find(i => i.item_name.includes('Creep') || i.item_name.includes('Starter')) || items[0];
    const feedGrower = itemMap.get('FEED-WEAN-GROW') || items.find(i => i.item_name.includes('Grower') || i.item_name.includes('Mash')) || items[0];
    const medIron = itemMap.get('MED-IRON-DEX') || items.find(i => i.item_name.includes('Iron')) || items[0];
    const vacPcv2 = itemMap.get('VAC-PCV2-SWINE') || items.find(i => i.item_name.includes('PCV') || i.item_name.includes('Vaccine')) || items[0];

    // 3. Clear existing alerts & transactions for fresh historical generation
    await db.delete(schema.notificationAlertLog).where(eq(schema.notificationAlertLog.batch_id, batchId));
    await db.delete(schema.batchTransaction).where(eq(schema.batchTransaction.batch_id, batchId));
    console.log('Cleared previous alerts & transactions for clean historical baseline.');

    // 4. Generate 28 Days of Historical Operational Entries
    const startDate = new Date(batch.start_date);
    const now = new Date();
    const diffDays = Math.max(1, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.min(28, diffDays + 1);

    console.log(`Generating comprehensive daily entries from Day 1 (${batch.start_date}) to Day ${totalDays}...`);

    let currentHeadCount = 120;
    let currentWeight = 7.20; // 7.2 kg weaner piglet
    let cumulativeCost = 0;

    for (let day = 1; day <= totalDays; day++) {
      const entryDateObj = new Date(startDate.getTime() + (day - 1) * 86400000);
      const dateStr = entryDateObj.toISOString().slice(0, 10);

      // Handle minor realistic mortality
      let dayMortality = 0;
      let mortReason = '';
      if (day === 4) {
        dayMortality = 1;
        mortReason = 'Weakness / Splay leg in small run piglet';
        currentHeadCount -= 1;
      } else if (day === 16) {
        dayMortality = 1;
        mortReason = 'Accidental trauma / Pen barrier collision';
        currentHeadCount -= 1;
      }

      // 1. Daily Feed Consumption
      // Nursery Pre-Starter (Day 1 - 14): 0.40 kg -> 0.65 kg per head
      // Nursery Starter Mash (Day 15 - 28): 0.68 kg -> 0.95 kg per head
      let feedItem = feedPreStarter;
      let feedRatePerHead = 0.40 + (day / 14) * 0.25; // 0.40 -> 0.65 kg
      let feedUnitCost = 18.50; // Rs 18.50 / kg
      let feedLot = 'LOT-202608-01';

      if (day >= 15) {
        feedItem = feedGrower;
        feedRatePerHead = 0.68 + ((day - 14) / 14) * 0.27; // 0.68 -> 0.95 kg
        feedUnitCost = 16.50; // Rs 16.50 / kg
        feedLot = 'LOT-202608-02';
      }

      const feedTotalQty = Number((feedRatePerHead * currentHeadCount).toFixed(2));
      const feedTotalAmount = Number((feedTotalQty * feedUnitCost).toFixed(2));
      cumulativeCost += feedTotalAmount;

      await db.insert(schema.batchTransaction).values({
        transaction_id: randomUUID(),
        batch_id: batchId,
        transaction_date: dateStr,
        transaction_type: 'CONSUMPTION',
        item_id: feedItem.item_id,
        quantity: feedTotalQty.toString(),
        uom: 'KG',
        rate: feedUnitCost.toString(),
        amount: (-feedTotalAmount).toString(),
        remarks: `Daily Nursery Ration: ${feedItem.item_name} (${feedRatePerHead.toFixed(2)} kg/head × ${currentHeadCount} pigs | Lot: ${feedLot})`,
        created_by: userId,
      });

      // 2. Specific Scheduled Medications
      if (day === 3) {
        // Day 3 Iron Injection
        const ironDoses = currentHeadCount * 2.0; // 2 mL / pig
        const ironCost = Number((ironDoses * 2.50).toFixed(2));
        cumulativeCost += ironCost;

        await db.insert(schema.batchTransaction).values({
          transaction_id: randomUUID(),
          batch_id: batchId,
          transaction_date: dateStr,
          transaction_type: 'CONSUMPTION',
          item_id: medIron.item_id,
          quantity: ironDoses.toString(),
          uom: 'ML',
          rate: '2.500000',
          amount: (-ironCost).toString(),
          remarks: 'Lot: MEDLOT-202608-01 - Day 3 Iron Dextran 200mg Anemia Prevention Protocol (2.0 mL/head)',
          created_by: userId,
        });
      }

      if (day === 14) {
        // Day 14 Secondary Iron Booster
        const ironDoses = currentHeadCount * 2.0;
        const ironCost = Number((ironDoses * 2.50).toFixed(2));
        cumulativeCost += ironCost;

        await db.insert(schema.batchTransaction).values({
          transaction_id: randomUUID(),
          batch_id: batchId,
          transaction_date: dateStr,
          transaction_type: 'CONSUMPTION',
          item_id: medIron.item_id,
          quantity: ironDoses.toString(),
          uom: 'ML',
          rate: '2.500000',
          amount: (-ironCost).toString(),
          remarks: 'Lot: MEDLOT-202608-02 - Day 14 Iron Dextran Booster Administration',
          created_by: userId,
        });
      }

      if (day === 21) {
        // Day 21 PCV2 Vaccine Protocol
        const pcvDoses = currentHeadCount;
        const pcvCost = Number((pcvDoses * 45.00).toFixed(2));
        cumulativeCost += pcvCost;

        await db.insert(schema.batchTransaction).values({
          transaction_id: randomUUID(),
          batch_id: batchId,
          transaction_date: dateStr,
          transaction_type: 'CONSUMPTION',
          item_id: vacPcv2.item_id,
          quantity: pcvDoses.toString(),
          uom: 'DOSES',
          rate: '45.000000',
          amount: (-pcvCost).toString(),
          remarks: 'Lot: VACLOT-202608-PCV - Day 21 Porcine Circovirus Type 2 (PCV2) Single Dose Vaccination Protocol Completed',
          created_by: userId,
        });
      }

      // 3. Daily Mortality Entry (if any on this day)
      if (dayMortality > 0) {
        await db.insert(schema.batchTransaction).values({
          transaction_id: randomUUID(),
          batch_id: batchId,
          transaction_date: dateStr,
          transaction_type: 'MORTALITY',
          quantity: dayMortality.toString(),
          uom: 'HEAD',
          remarks: `Mortality: ${mortReason} (Surviving herd: ${currentHeadCount} head)`,
          created_by: userId,
        });
      }

      // 4. Daily Weighing & Growth Observation
      const dailyAdg = 0.38 + (day / 28) * 0.12; // 380 g/d -> 500 g/d
      currentWeight += dailyAdg;

      await db.insert(schema.batchTransaction).values({
        transaction_id: randomUUID(),
        batch_id: batchId,
        transaction_date: dateStr,
        transaction_type: 'OBSERVATION',
        quantity: Number(currentWeight.toFixed(2)).toString(),
        uom: 'KG',
        amount: '0.0000',
        remarks: `Avg Body Weight: ${currentWeight.toFixed(2)} kg | Daily Gain: ${(dailyAdg * 1000).toFixed(0)} g/d | BCS: 3.25 | Active Headcount: ${currentHeadCount}`,
        created_by: userId,
      });

      // 5. Daily Barn Overheads (Heating lamps + Power + Stockman labor)
      const overheadCost = 185.00; // Rs 185 / day
      cumulativeCost += overheadCost;

      await db.insert(schema.batchTransaction).values({
        transaction_id: randomUUID(),
        batch_id: batchId,
        transaction_date: dateStr,
        transaction_type: 'OVERHEAD',
        quantity: '1.0000',
        uom: 'UNITS',
        rate: overheadCost.toString(),
        amount: (-overheadCost).toString(),
        remarks: `Daily Barn Power, Infrared Heat Lamps & Sanitation Attendance (Day ${day})`,
        created_by: userId,
      });
    }

    // 5. Update Batch Header Summary
    const unitCost = currentHeadCount > 0 ? cumulativeCost / currentHeadCount : 0;
    await db
      .update(schema.batchHeader)
      .set({
        closing_quantity: currentHeadCount.toString(),
        total_cost: cumulativeCost.toFixed(2),
        unit_cost: unitCost.toFixed(2),
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      })
      .where(eq(schema.batchHeader.batch_id, batchId));

    console.log(`\n✅ Successfully generated ${totalDays} days of complete daily operational entries for PIG-BAT-2026-0006!`);
    console.log(`   - Surviving Herd: ${currentHeadCount} head (from 120 initial)`);
    console.log(`   - Current Weight: ${currentWeight.toFixed(2)} kg (up from 7.2 kg on Day 1)`);
    console.log(`   - Cumulative Production Cost: ₹${cumulativeCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`   - Cost per Head: ₹${unitCost.toFixed(2)} / head`);

  } catch (err) {
    console.error('❌ Error seeding porker batch past days:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

seedPorkerBatchPastDays()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
