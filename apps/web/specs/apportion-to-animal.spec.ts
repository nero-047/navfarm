import { apportionToAnimal } from '../src/components/console/piggery/apportion-to-animal';

const BATCH_FEED = { transaction_id: 't1', animal_id: null, transaction_type: 'CONSUMPTION', quantity: '44.0000', amount: '1232.0000', remarks: 'Mid gestation ration' };
const OWN_FEED = { transaction_id: 't2', animal_id: 'a-1', transaction_type: 'CONSUMPTION', quantity: '2.2000', amount: '61.6000', remarks: 'Individual top-up' };
const OTHER_FEED = { transaction_id: 't3', animal_id: 'a-9', transaction_type: 'CONSUMPTION', quantity: '2.2000', amount: '61.6000', remarks: 'Another animal' };

describe('apportionToAnimal', () => {
  it('includes the animal share of a whole-batch row', () => {
    // A 20-head batch consumed 44 kg; this animal's share is 2.2 kg. Excluding
    // batch rows entirely made an animal's records read empty even though it
    // plainly ate as part of the batch.
    const rows = apportionToAnimal([BATCH_FEED], 'a-1', 20);

    expect(rows).toHaveLength(1);
    expect(Number(rows[0].quantity)).toBeCloseTo(2.2);
    expect(Number(rows[0].amount)).toBeCloseTo(61.6);
  });

  it('keeps a row already attributed to the animal at full value', () => {
    const rows = apportionToAnimal([OWN_FEED], 'a-1', 20);

    expect(Number(rows[0].quantity)).toBeCloseTo(2.2);
    expect(rows[0].is_shared).toBe(false);
  });

  it('excludes rows attributed to a different animal', () => {
    expect(apportionToAnimal([OTHER_FEED], 'a-1', 20)).toEqual([]);
  });

  it('marks apportioned rows so the UI can distinguish them', () => {
    const rows = apportionToAnimal([BATCH_FEED], 'a-1', 20);
    expect(rows[0].is_shared).toBe(true);
  });

  it('returns whole-batch rows unchanged when the head count is unknown', () => {
    // Better to show the batch figure than to divide by zero and show nothing.
    const rows = apportionToAnimal([BATCH_FEED], 'a-1', 0);
    expect(Number(rows[0].quantity)).toBeCloseTo(44);
  });

  it('combines own rows and shared rows', () => {
    const rows = apportionToAnimal([BATCH_FEED, OWN_FEED, OTHER_FEED], 'a-1', 20);
    expect(rows).toHaveLength(2);
  });
});
