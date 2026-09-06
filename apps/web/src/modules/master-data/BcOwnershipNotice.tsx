import type { MasterDataConfig } from "./types";

/**
 * Several catalogs are, per BBP-1, sourced from Microsoft Business Central.
 * That integration is not built, so rather than lock the screens against a
 * system nothing currently talks to, they stay locally editable and this notice
 * carries the blueprint's position — so the intended ownership is on record and
 * nobody mistakes these rows for synchronized BC data. Rishi's call, 2026-09-06.
 *
 * Each master supplies its own citation through `bcNote`; a single hardcoded
 * sentence about Items and the COA would be wrong on every other screen.
 */
export function BcOwnershipNotice({ config }: { config: MasterDataConfig }) {
  return <p role="note" className="text-sm text-(--text-secondary)">
    <strong>Per BBP: sourced from Business Central.</strong>{" "}
    {config.bcNote}
    {" "}BC integration is not connected yet, so records can still be created and edited
    here in the meantime. Existing rows are local demo data, not synchronized BC records.
    {" "}“From BC” marks the intended source of a field.
  </p>;
}
