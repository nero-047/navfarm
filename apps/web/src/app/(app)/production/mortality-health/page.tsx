"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import MortalityHealthPanel from "@/components/console/production/mortality-health-panel";

export default function MortalityHealthPage() {
  return (
    <ProductionPageShell title="Mortality & Clinical Health Register">
      {() => <MortalityHealthPanel />}
    </ProductionPageShell>
  );
}
