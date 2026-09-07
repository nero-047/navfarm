/**
 * Seeds the production records the BBP's backward traceability chain is built
 * from. Default is read-only; --verify inserts and rolls back; --apply commits.
 * Never touches a table that already holds rows.
 *
 * Why these tables and no others: BBP-1 says "The traceability chain uses
 * existing production records - no separate traceability module required", so
 * the chain is a query over semen_batch → breeding_record → farrowing_record,
 * not a schema of its own. The two links past the transfer order — DOA at
 * Colcom and the Kill Sheet — are deliberately absent: no table models them,
 * and BBP-1 gives the Kill Sheet a process ("attaches file to TO, enters
 * carcass weights per line, Invoice = Delivered Qty × Avg Carcass Weight ×
 * Price/KG") but no field spec, so inventing columns now would be guesswork.
 *
 * Biology follows BBP-1 §1.7: gestation 116 days, lactation 28 days. Litter
 * figures are ordinary commercial numbers for the lines in the breed master;
 * they are demonstration data, not client figures, and nothing here should be
 * read as Triple C's actual performance.
 */
import mysql, { RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

const GESTATION_DAYS = 116;
const LACTATION_DAYS = 28;
const PREG_CHECK_DAY = 28;

const addDays = (iso: string, days: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/** Deterministic so repeated --verify runs produce an identical plan. */
function spread(index: number, from: number, to: number) {
  return from + ((index * 7) % (to - from + 1));
}

async function run() {
  const apply = process.argv.includes('--apply');
  const verify = process.argv.includes('--verify');
  if (process.argv.slice(2).some((a) => !['--apply', '--verify'].includes(a)) || (apply && verify)) {
    throw new Error('Use no flags (read-only), --verify, or --apply.');
  }

  const db = await mysql.createConnection({ host: '127.0.0.1', user: 'root', database: 'tenant_devco' });
  try {
    const [[lock]] = await db.query<RowDataPacket[]>("SELECT GET_LOCK('navfarm-demo-breeding-chain', 5) acquired");
    if (Number(lock.acquired) !== 1) throw new Error('Another breeding-chain seed run is active.');
    await db.beginTransaction();

    for (const table of ['semen_batch', 'breeding_record', 'farrowing_record']) {
      const [[row]] = await db.query<RowDataPacket[]>(`SELECT COUNT(*) n FROM \`${table}\``);
      if (Number(row.n) > 0) {
        throw new Error(`${table} already holds ${row.n} rows — this script only seeds empty tables.`);
      }
    }

    const [animals] = await db.query<RowDataPacket[]>(
      `SELECT animal_id, animal_code, animal_type, gender, tenant_id, company_id, operational_area_id
         FROM animal_register WHERE is_active = 1 ORDER BY animal_code`,
    );
    const boars = animals.filter((a) => a.animal_type === 'BOAR');
    const females = animals.filter((a) => a.animal_type === 'SOW' || a.animal_type === 'GILT');
    if (!boars.length || !females.length) throw new Error('Need at least one boar and one female.');

    const { tenant_id: tenantId, company_id: companyId } = animals[0];
    const today = new Date().toISOString().slice(0, 10);

    const semen: any[] = [];
    const breedings: any[] = [];
    const farrowings: any[] = [];

    // One collection per boar, dated before the earliest mating that uses it.
    boars.forEach((boar, i) => {
      semen.push({
        semen_batch_id: randomUUID(),
        tenant_id: tenantId,
        company_id: companyId,
        boar_animal_id: boar.animal_id,
        collection_date: addDays(today, -(150 + i * 3)),
        doses_collected: 24 + i * 6,
        boar_code: boar.animal_code,
      });
    });

    females.forEach((female, i) => {
      const isSow = female.animal_type === 'SOW';
      // Sows are further through the cycle than gilts: their matings are old
      // enough to have farrowed, the gilts' are not.
      //
      // The sow window is wide on purpose. At 125-145 days every litter landed
      // inside the last month, so with lactation at 28 days none had weaned yet
      // and all eight farrowings read LACTATING — a herd that looks synchronised
      // in a way a real one never is. 130-210 puts litters across the weaning
      // boundary, so the demo shows weaned, lactating and still-pregnant at once.
      const daysAgo = isSow ? spread(i, 130, 210) : spread(i, 20, 60);
      const matingDate = addDays(today, -daysAgo);
      const expected = addDays(matingDate, GESTATION_DAYS);
      const parity = isSow ? 1 + (i % 4) : 1;
      const boar = boars[i % boars.length];
      const lot = semen[i % semen.length];

      const breedingId = randomUUID();
      breedings.push({
        breeding_id: breedingId,
        tenant_id: tenantId,
        company_id: companyId,
        sow_animal_id: female.animal_id,
        mating_type: 'AI',
        boar_animal_id: boar.animal_id,
        semen_lot_id: lot.semen_batch_id,
        semen_dose_qty: 1.5, // BBP: 1.5 doses per service
        mating_date: matingDate,
        expected_farrowing_date: expected,
        preg_check_date: addDays(matingDate, PREG_CHECK_DAY),
        preg_check_method: 'ULTRASOUND',
        pregnancy_confirmed: 1,
        conception_result: 'CONFIRMED',
        parity_number: parity,
        sow_code: female.animal_code,
      });

      // Only matings whose gestation has already elapsed produce a farrowing.
      if (expected <= today) {
        const bornTotal = 12 + (i % 4);
        const stillborn = i % 2;
        const bornLive = bornTotal - stillborn;
        const weaningDate = addDays(expected, LACTATION_DAYS);
        farrowings.push({
          farrow_id: randomUUID(),
          tenant_id: tenantId,
          company_id: companyId,
          sow_animal_id: female.animal_id,
          breeding_id: breedingId,
          farrowing_date: expected,
          piglets_born_total: bornTotal,
          piglets_born_live: bornLive,
          piglets_stillborn: stillborn,
          piglets_mummified: 0,
          avg_birth_weight_kg: 1.4,
          total_litter_weight_kg: Number((bornLive * 1.4).toFixed(2)),
          farrowing_status: weaningDate <= today ? 'WEANED' : 'LACTATING',
          weaning_date: weaningDate <= today ? weaningDate : null,
          // NOT NULL with default 0: a litter still on the sow has weaned none
          // yet, which is 0, not "unknown".
          piglets_weaned: weaningDate <= today ? bornLive - (i % 2) : 0,
          avg_weaning_weight_kg: weaningDate <= today ? 7.2 : null,
          parity_number: parity,
          sow_code: female.animal_code,
        });
      }
    });

    if (apply || verify) {
      for (const s of semen) {
        await db.query(
          'INSERT INTO semen_batch (semen_batch_id,tenant_id,company_id,boar_animal_id,collection_date,doses_collected) VALUES (?,?,?,?,?,?)',
          [s.semen_batch_id, s.tenant_id, s.company_id, s.boar_animal_id, s.collection_date, s.doses_collected],
        );
      }
      for (const b of breedings) {
        await db.query(
          `INSERT INTO breeding_record (breeding_id,tenant_id,company_id,sow_animal_id,mating_type,boar_animal_id,
             semen_lot_id,semen_dose_qty,mating_date,expected_farrowing_date,preg_check_date,preg_check_method,
             pregnancy_confirmed,conception_result,parity_number)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [b.breeding_id, b.tenant_id, b.company_id, b.sow_animal_id, b.mating_type, b.boar_animal_id,
           b.semen_lot_id, b.semen_dose_qty, b.mating_date, b.expected_farrowing_date, b.preg_check_date,
           b.preg_check_method, b.pregnancy_confirmed, b.conception_result, b.parity_number],
        );
      }
      for (const f of farrowings) {
        await db.query(
          `INSERT INTO farrowing_record (farrow_id,tenant_id,company_id,sow_animal_id,breeding_id,farrowing_date,
             piglets_born_total,piglets_born_live,piglets_stillborn,piglets_mummified,avg_birth_weight_kg,
             total_litter_weight_kg,farrowing_status,weaning_date,piglets_weaned,avg_weaning_weight_kg,parity_number)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [f.farrow_id, f.tenant_id, f.company_id, f.sow_animal_id, f.breeding_id, f.farrowing_date,
           f.piglets_born_total, f.piglets_born_live, f.piglets_stillborn, f.piglets_mummified,
           f.avg_birth_weight_kg, f.total_litter_weight_kg, f.farrowing_status, f.weaning_date,
           f.piglets_weaned, f.avg_weaning_weight_kg, f.parity_number],
        );
      }
    }

    const plan = {
      database: 'tenant_devco',
      mode: apply ? 'APPLY' : verify ? 'VERIFY' : 'READ-ONLY',
      semenLots: semen.map((s) => ({ boar: s.boar_code, collected: s.collection_date, doses: s.doses_collected })),
      matings: breedings.map((b) => ({ sow: b.sow_code, mated: b.mating_date, dueOrFarrowed: b.expected_farrowing_date, parity: b.parity_number })),
      farrowings: farrowings.map((f) => ({ sow: f.sow_code, on: f.farrowing_date, bornLive: f.piglets_born_live, status: f.farrowing_status, weaned: f.piglets_weaned })),
      totals: { semen: semen.length, matings: breedings.length, farrowings: farrowings.length },
    };
    console.log(JSON.stringify(plan, null, 2));

    if (apply) {
      await db.commit();
      console.log('Committed.');
    } else {
      await db.rollback();
      console.log(verify ? 'Verified and rolled back. No changes committed.' : 'Read-only. No changes attempted.');
    }
  } finally {
    await db.query("SELECT RELEASE_LOCK('navfarm-demo-breeding-chain')");
    await db.end();
  }
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
