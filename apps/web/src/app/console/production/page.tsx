"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser, hasPermission, NavUser, getActiveLob } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import BatchPanel from "@/components/console/production/batch-panel";
import OperationalBatchDataEntry from "@/components/console/production/operational-batch-data-entry";
import DairyDailyOperationsEntry from "@/components/console/dairy/dairy-daily-operations-entry";
import DairyLifecycleStepper from "@/components/console/dairy/dairy-lifecycle-stepper";
import AnimalPanel from "@/components/console/piggery/animal-panel";
import { BreedingPanel } from "@/components/console/piggery/breeding-panel";
import PiggeryBatchStagesPanel from "@/components/console/piggery/piggery-batch-stages-panel";
import BatchAnimalAssignmentPanel from "@/components/console/piggery/batch-animal-assignment-panel";
import StageWiseConsumptionOutputPanel from "@/components/console/piggery/stage-wise-consumption-output-panel";
import ParameterPanel from "@/components/console/production/parameter-panel";
import SchedulerPanel from "@/components/console/production/scheduler-panel";
import AlertPanel from "@/components/console/production/alert-panel";
import QcParameterPanel from "@/components/console/production/qc-parameter-panel";
import PacksPanel from "@/components/console/production/packs-panel";
import MortalityHealthPanel from "@/components/console/production/mortality-health-panel";
import { ShieldAlert } from "lucide-react";

const SECTIONS = [
  { key: "daily-operational-entry", label: "Batch Data Entry (Operational)" },
  { key: "batches",                 label: "Batch List" },
  { key: "batch-stages",            label: "Batch Stages (Lifecycle)" },
  { key: "batch-animal-assignment", label: "Batch Animal Assignment" },
  { key: "stage-consumption",       label: "Stage-wise Consumption & Output" },
  { key: "daily-entry",             label: "Mortality & Clinical Health Register" },
  { key: "animals",                 label: "Animal Register" },
  { key: "breeding",                label: "Breeding & Litters" },
  { key: "schedulers",              label: "Schedulers" },
  { key: "parameters",              label: "Parameters" },
  { key: "alerts",                  label: "Alerts" },
  { key: "qc-parameters",           label: "QC Parameters" },
  { key: "packs",                   label: "Packs & Traceability" },
];

export default function ProductionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(searchParams.get("tab") || SECTIONS[0].key);
  const [activeLob, setActiveLobState] = useState<string>("PIGGERY");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setActiveLobState(getActiveLob());

    const tabParam = searchParams.get("tab");
    if (tabParam && SECTIONS.some((s) => s.key === tabParam)) {
      setActiveKey(tabParam);
    }
    setReady(true);
  }, [router, searchParams]);

  const mayViewProduction = Boolean(
    user && (
      user.userType === "OPERATIONAL_ADMIN" ||
      user.userType === "COMPANY_ADMIN" ||
      user.userType === "TENANT_ADMIN" ||
      hasPermission(user, "PRODUCTION", "BATCH", "can_view")
    )
  );

  if (!ready || !user) return null;

  if (!mayViewProduction) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Production" sticky={false} />
        <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5" style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}>
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You don&apos;t have access to Production</p>
            <p className="mt-1 text-xs">Contact your company administrator if you need access to this section.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
      <PageHeader
        title={SECTIONS.find((s) => s.key === activeKey)?.label || "Production Operations"}
        description={`${activeLob} Operational Area — Lifecycle tracking, batch feed & health logs, and cost-allocated closing.`}
      />

      {/* Dynamic Sub-Panel Render per LOB */}
      {activeKey === "daily-operational-entry" && (
        activeLob === "DAIRY" ? <DairyDailyOperationsEntry /> : <OperationalBatchDataEntry />
      )}
      {activeKey === "batches" && <BatchPanel />}
      {activeKey === "batch-stages" && (
        activeLob === "DAIRY" ? <DairyLifecycleStepper /> : <PiggeryBatchStagesPanel />
      )}
      {activeKey === "batch-animal-assignment" && <BatchAnimalAssignmentPanel />}
      {activeKey === "stage-consumption" && <StageWiseConsumptionOutputPanel />}
      {activeKey === "daily-entry" && <MortalityHealthPanel />}
      {activeKey === "animals" && <AnimalPanel />}
      {activeKey === "breeding" && <BreedingPanel />}
      {activeKey === "schedulers" && <SchedulerPanel />}
      {activeKey === "parameters" && <ParameterPanel />}
      {activeKey === "alerts" && <AlertPanel />}
      {activeKey === "qc-parameters" && <QcParameterPanel />}
      {activeKey === "packs" && <PacksPanel />}
    </div>
  );
}
