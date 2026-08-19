"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser } from "@/hooks/useAuth";
import { useContextNav, type ContextNavModel } from "@/components/shell/ContextNav";
import { PageHeader } from "@/components/ui/PageHeader";
import AnimalPanel from "@/components/console/piggery/animal-panel";
import HerdAnalyticsPanel from "@/components/console/piggery/herd-analytics-panel";
import FacilityOccupancyPanel from "@/components/console/piggery/facility-occupancy-panel";
import { BreedingPanel } from "@/components/console/piggery/breeding-panel";
import { ShieldAlert } from "lucide-react";

const SECTIONS = [
  { key: "animals", label: "Animal Register" },
  { key: "breeding", label: "Breeding & Reproduction" },
  { key: "facility-occupancy", label: "Pen Occupancy & Biosecurity" },
  { key: "herd-analytics", label: "Herd Analytics & Parity Profile" },
];

export default function PiggeryPage() {
  const router = useRouter();
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

  const mayView = Boolean(user && hasPermission(user, "PIGGERY", "ANIMAL", "can_view"));

  const contextNav = useMemo<ContextNavModel | null>(() => {
    if (!ready || !mayView) return null;
    return {
      label: "Piggery sections",
      groups: [{ items: SECTIONS.map((s) => ({ key: s.key, label: s.label })) }],
      activeKey,
      onSelect: setActiveKey,
    };
  }, [ready, mayView, activeKey]);

  useContextNav(contextNav);

  if (!ready || !user) return null;

  if (!mayView) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title="Piggery" sticky={false} />
        <div
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5"
          style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You don&apos;t have access to Piggery</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Contact your company administrator if you need access to this section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
      <PageHeader
        title="Piggery"
        description="Individual animal register, pen live occupancy, parity demographics, and medication logs."
      />
      {activeKey === "animals" && <AnimalPanel />}
      {activeKey === "breeding" && <BreedingPanel />}
      {activeKey === "facility-occupancy" && <FacilityOccupancyPanel />}
      {activeKey === "herd-analytics" && <HerdAnalyticsPanel />}
    </div>
  );
}


