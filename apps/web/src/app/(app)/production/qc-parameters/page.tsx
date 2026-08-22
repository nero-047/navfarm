"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import QcParameterPanel from "@/components/console/production/qc-parameter-panel";

export default function ProductionQcParametersPage() {
  return (
    <ProductionPageShell title="QC Parameters">
      {() => <QcParameterPanel />}
    </ProductionPageShell>
  );
}
