"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import { BreedingPanel } from "@/components/console/piggery/breeding-panel";

export default function ProductionBreedingPage() {
  return (
    <ProductionPageShell title="Breeding & Litters">
      {() => <BreedingPanel />}
    </ProductionPageShell>
  );
}
