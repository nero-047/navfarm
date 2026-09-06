import type { MasterDataConfig } from "./types";

/**
 * Several catalogs are, per the client's own documents, sourced from Microsoft
 * Business Central. That integration is not built, so rather than lock the
 * screens against a system nothing currently talks to, they stay locally
 * editable and this notice states both halves: where the records are meant to
 * come from, and where they are actually coming from today. Rishi's call,
 * 2026-09-06.
 *
 * Each master supplies its own citation through `bcNote` — one hardcoded
 * sentence about Items and the COA would be wrong on every other screen.
 */
export function BcOwnershipNotice({ config }: { config: MasterDataConfig }) {
  return <p role="note" className="text-sm text-(--text-secondary)">
    <strong>To come from Business Central — held locally for now.</strong>{" "}
    {config.bcNote}
    {" "}The BC integration is not connected yet, so these records are created and
    read from the NAVFarm database in the meantime. They are local records, not
    synchronized BC data.
    {" "}“From BC” marks the intended source of a field.
  </p>;
}
