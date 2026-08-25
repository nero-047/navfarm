"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import BatchAnimalAssignmentPanel from "@/components/console/piggery/batch-animal-assignment-panel";

export default function BatchAnimalAssignmentPage() {
  return (
    <ProductionPageShell title="Batch Animal Assignment">
      {() => <BatchAnimalAssignmentPanel />}
    </ProductionPageShell>
  );
}
