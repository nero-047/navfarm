"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import BatchPanel from "@/components/console/production/batch-panel";
import BulkDailyEntryPanel from "@/components/console/production/bulk-daily-entry-panel";
import AnimalPanel from "@/components/console/piggery/animal-panel";
import { BreedingPanel } from "@/components/console/piggery/breeding-panel";
import ParameterPanel from "@/components/console/production/parameter-panel";
import SchedulerPanel from "@/components/console/production/scheduler-panel";
import AlertPanel from "@/components/console/production/alert-panel";
import QcParameterPanel from "@/components/console/production/qc-parameter-panel";
import PacksPanel from "@/components/console/production/packs-panel";
import { ShieldAlert } from "lucide-react";

const SECTIONS = [
  { key: "batches", label: "Batches" },
  { key: "daily-entry", label: "Daily Data Entry" },
  { key: "animals", label: "Animal Register" },
  { key: "breeding", label: "Breeding & Litters" },
  { key: "schedulers", label: "Schedulers" },
  { key: "parameters", label: "Parameters" },
  { key: "alerts", label: "Alerts" },
  { key: "qc-parameters", label: "QC Parameters" },
  { key: "packs", label: "Packs" },
];


export default function ProductionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(SECTIONS[0].key);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  // Same permission the render path checks below — the module index is not
  // offered to someone who cannot open the module.
  const mayViewProduction = Boolean(user && hasPermission(user, "PRODUCTION", "BATCH", "can_view"));

  // Flat set: one ungrouped group, so below the desktop breakpoint this
  // renders as a tab strip rather than a selector.
  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayViewProduction) return null;
    return {
      label: t("moduleSections", { module: "Production" }),
      groups: [{ items: SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: setActiveKey,
    };
  }, [ready, mayViewProduction, activeKey, t]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!hasPermission(user, "PRODUCTION", "BATCH", "can_view")) {
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
        title="Production"
        description="Batch lifecycle — inputs, daily transactions and cost-allocated closing."
      />

      {/* Section switching moved to the shell's contextual navigation; the
          panels themselves are untouched. */}
      {activeKey === "batches" && <BatchPanel />}
      {activeKey === "daily-entry" && <BulkDailyEntryPanel />}
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
