/**
 * BBP-1 §1.5 (Item Master) and §1.6 (Chart of Accounts) place both catalogs in
 * Microsoft Business Central: "Items ... are CREATED IN D365BC only. NAVFarm
 * cannot create items independently" and "NAVFarm does NOT maintain its own
 * Chart of Accounts".
 *
 * That integration is not built. Rather than lock the screen against a system
 * nothing currently talks to, the catalogs stay locally editable and this notice
 * carries the blueprint's position, so the intended ownership is on record and
 * nobody mistakes these rows for synchronized BC data. Rishi's call, 2026-09-06.
 */
export function BcOwnershipNotice() {
  return <p role="note" className="text-sm text-(--text-secondary)">
    <strong>Per BBP: owned in Business Central.</strong> BBP-1 §1.5 and §1.6 place this
    catalog in Microsoft Business Central, where these records are to be created once the
    integration is connected.
    {" "}BC integration is not connected yet, so records can still be created and edited
    here in the meantime. Existing rows are local demo data, not synchronized BC records.
    {" "}“From BC” marks the intended source of a field.
  </p>;
}
