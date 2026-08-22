"use client";

import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import SchedulerPanel from "@/components/console/production/scheduler-panel";

export default function ProductionSchedulerPage() {
  return (
    <ProductionPageShell title="Schedulers">
      {() => <SchedulerPanel />}
    </ProductionPageShell>
  );
}
