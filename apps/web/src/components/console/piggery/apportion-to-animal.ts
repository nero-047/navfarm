/**
 * The transactions that make up one animal's record within a batch.
 *
 * Most entry is recorded against the whole batch — a day's ration is one row of
 * 44 kg for twenty sows, with no animal_id. Filtering a per-animal view on
 * `t.animal_id === selectedAnimalId` therefore returned nothing at all for an
 * animal that had plainly been fed, because only explicitly-attributed rows
 * survived. An animal's record is its own rows *plus* its share of the batch's.
 *
 * The split matches what the write side does: CreateBatchTransactionDto
 * documents that a row scoped to N animals divides its quantity evenly across
 * them, so reading a whole-batch row back as quantity / headCount is the same
 * arithmetic in reverse.
 */

export interface ApportionedRow {
  [key: string]: unknown;
  animal_id?: string | null;
  quantity?: string | number | null;
  amount?: string | number | null;
  /** True when this row is the animal's share of a whole-batch entry. */
  is_shared?: boolean;
}

const share = (value: string | number | null | undefined, headCount: number) => {
  if (value === null || value === undefined || value === '') return value;
  const n = Number(value);
  if (!Number.isFinite(n) || headCount <= 0) return value;
  return n / headCount;
};

export function apportionToAnimal<T extends ApportionedRow>(
  transactions: T[],
  animalId: string,
  headCount: number,
): Array<T & { is_shared: boolean }> {
  if (!animalId) return [];

  return transactions.reduce<Array<T & { is_shared: boolean }>>((rows, tx) => {
    if (tx.animal_id === animalId) {
      rows.push({ ...tx, is_shared: false });
      return rows;
    }
    // Rows belonging to a different animal are genuinely not this one's.
    if (tx.animal_id) return rows;

    // A whole-batch row: this animal carries an even share of it. With an
    // unknown head count, showing the batch figure beats showing nothing.
    rows.push({
      ...tx,
      quantity: share(tx.quantity, headCount) as T['quantity'],
      amount: share(tx.amount, headCount) as T['amount'],
      is_shared: true,
    });
    return rows;
  }, []);
}
