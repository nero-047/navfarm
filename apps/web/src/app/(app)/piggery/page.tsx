"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredUser, hasPermission, NavUser, getActiveLob } from "@/hooks/useAuth";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import AnimalPanel from "@/components/console/piggery/animal-panel";
import HerdAnalyticsPanel from "@/components/console/piggery/herd-analytics-panel";
import FacilityOccupancyPanel from "@/components/console/piggery/facility-occupancy-panel";
import { BreedingPanel } from "@/components/console/piggery/breeding-panel";
import DairyCowRegisterPanel from "@/components/console/dairy/dairy-cow-register-panel";
import { ShieldAlert } from "lucide-react";

const PIGGERY_SECTIONS = [
  { key: "animals", label: "Animal Register (Ear Tags)" },
  { key: "breeding", label: "Breeding & Insemination" },
  { key: "facility-occupancy", label: "Pen Occupancy & Biosecurity" },
  { key: "herd-analytics", label: "Herd Analytics & Parity" },
];

export default function PiggeryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeLob, setActiveLobState] = useState("PIGGERY");
  const [activeKey, setActiveKey] = useState(searchParams.get("tab") || PIGGERY_SECTIONS[0].key);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setActiveLobState(getActiveLob());

    const tab = searchParams.get("tab");
    if (tab && PIGGERY_SECTIONS.some((s) => s.key === tab)) {
      setActiveKey(tab);
    }
    setReady(true);
  }, [router, searchParams]);

  const mayView = Boolean(
    user && (
      user.userType === "COMPANY_ADMIN" ||
      user.userType === "TENANT_ADMIN" ||
      user.userType === "OPERATIONAL_ADMIN" ||
      hasPermission(user, "PIGGERY", "ANIMAL", "can_view")
    )
  );

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayView || activeLob === "DAIRY") return null;
    return {
      label: "Piggery sections",
      groups: [{ items: PIGGERY_SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: (key) => {
        setActiveKey(key);
        router.replace(`/piggery?tab=${key}`);
      },
    };
  }, [ready, mayView, activeKey, activeLob, router]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!mayView) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title={activeLob === "DAIRY" ? "Dairy Cow Register" : "Swine Register"} sticky={false} />
        <div
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5"
          style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Access restricted</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Contact your company administrator if you need access to this section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render Dairy Register if in Dairy Scope ──
  if (activeLob === "DAIRY") {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7">
        <PageHeader
          title="Dairy Cow & Herd Register"
          description="Individual cattle identification, RFID ear tags, DIM (days in milk), lactation curve, and daily milking yields."
        />
        <DairyCowRegisterPanel />
      </div>
    );
  }

  // ── Render Piggery Suite if in Piggery Scope ──
  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7 space-y-5">
      <PageHeader
        title="Piggery Animal Register & Breeding"
        description="Individual swine tags, parity metrics, farrowing logs, and pen occupancy."
      />

      {activeKey === "animals" && <AnimalPanel />}
      {activeKey === "breeding" && <BreedingPanel />}
      {activeKey === "facility-occupancy" && <FacilityOccupancyPanel />}
      {activeKey === "herd-analytics" && <HerdAnalyticsPanel />}
    </div>
  );
}
