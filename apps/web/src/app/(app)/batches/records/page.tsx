"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import StageWiseConsumptionOutputPanel from "@/components/console/piggery/stage-wise-consumption-output-panel";

export default function FeedManagementPage() {
  return (
    <ProductionPageShell title="Stage-wise Consumption & Output">
      {() => <StageWiseConsumptionOutputPanel />}
    </ProductionPageShell>
  );
}
