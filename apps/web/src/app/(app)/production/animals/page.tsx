"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import AnimalPanel from "@/components/console/piggery/animal-panel";

export default function ProductionAnimalsPage() {
  return (
    <ProductionPageShell title="Animal Register">
      {() => <AnimalPanel />}
    </ProductionPageShell>
  );
}
