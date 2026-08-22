"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import PiggeryBatchStagesPanel from "@/components/console/piggery/piggery-batch-stages-panel";
import DairyLifecycleStepper from "@/components/console/dairy/dairy-lifecycle-stepper";

export default function BatchStagesPage() {
  return (
    <ProductionPageShell title="Batch Stages (Lifecycle)">
      {(activeLob) => (activeLob === "DAIRY" ? <DairyLifecycleStepper /> : <PiggeryBatchStagesPanel />)}
    </ProductionPageShell>
  );
}
