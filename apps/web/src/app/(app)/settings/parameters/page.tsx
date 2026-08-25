"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import ParameterPanel from "@/components/console/production/parameter-panel";

export default function ProductionParametersPage() {
  return (
    <ProductionPageShell titleKey="navParameters">
      {() => <ParameterPanel />}
    </ProductionPageShell>
  );
}
