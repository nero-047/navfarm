"use client";

import { Layers } from "lucide-react";
import { ProductionPageShell } from "@/components/console/production/production-page-shell";
import PiggeryBatchStagesPanel from "@/components/console/piggery/piggery-batch-stages-panel";
import { EmptyState } from "@/components/ui/states";
import { useLanguage } from "@/hooks/useLanguage";

function DairyStagesNotAvailable() {
  const { t } = useLanguage();
  return (
    <EmptyState
      icon={Layers}
      title={t("bsDairyStagesNotAvailableTitle")}
      description={t("bsDairyStagesNotAvailableDesc")}
    />
  );
}

export default function BatchStagesPage() {
  return (
    <ProductionPageShell titleKey="batchStages">
      {(activeLob) => (activeLob === "DAIRY" ? <DairyStagesNotAvailable /> : <PiggeryBatchStagesPanel />)}
    </ProductionPageShell>
  );
}
