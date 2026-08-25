"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import BatchPanel from "@/components/console/production/batch-panel";

export default function BatchListPage() {
  return (
    <ProductionPageShell titleKey="batchList">
      {() => <BatchPanel />}
    </ProductionPageShell>
  );
}
