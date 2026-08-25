"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import PacksPanel from "@/components/console/production/packs-panel";

export default function ProductionPacksPage() {
  return (
    <ProductionPageShell titleKey="navPacks">
      {() => <PacksPanel />}
    </ProductionPageShell>
  );
}
