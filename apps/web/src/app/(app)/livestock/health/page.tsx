"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import MortalityHealthPanel from "@/components/console/production/mortality-health-panel";

export default function MortalityHealthPage() {
  return (
    <ProductionPageShell titleKey="mortalityHealth">
      {() => <MortalityHealthPanel />}
    </ProductionPageShell>
  );
}
