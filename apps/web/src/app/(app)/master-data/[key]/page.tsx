"use client";

import { useParams } from "next/navigation";
import { MasterDataPageShell } from "@/components/console/master-data/master-data-page-shell";

// One route for all ~23 master-data entities (farms, warehouses, items,
// breeds, GL accounts, ...) since they're all config-driven through the
// same MasterDataTable — a real route per entity without 23 near-duplicate
// page.tsx files.
export default function MasterDataEntityPage() {
  const params = useParams<{ key: string }>();
  return <MasterDataPageShell activeKey={params.key} />;
}
