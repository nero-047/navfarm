"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, hasPermission, NavUser, getActiveLob } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShieldAlert } from "lucide-react";

/**
 * Shared by every /production/* route (this used to be one mega-page
 * switching content via ?tab=, each tab is now its own route — this holds
 * the boilerplate that was duplicated across all of them: auth/permission
 * gate, active LOB, and the page shell chrome).
 */
export function useProductionPageState() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeLob, setActiveLobState] = useState("PIGGERY");

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setActiveLobState(getActiveLob());
    setReady(true);
  }, [router]);

  const mayView = Boolean(
    user && (
      user.userType === "OPERATIONAL_ADMIN" ||
      user.userType === "COMPANY_ADMIN" ||
      user.userType === "TENANT_ADMIN" ||
      hasPermission(user, "PRODUCTION", "BATCH", "can_view")
    )
  );

  return { user, ready, activeLob, mayView };
}

export function ProductionPageShell({
  title,
  children,
}: {
  title: string;
  children: (activeLob: string) => React.ReactNode;
}) {
  const { ready, activeLob, mayView } = useProductionPageState();

  if (!ready) return null;

  if (!mayView) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title={title} sticky={false} />
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
        title={title}
        description={`${activeLob} Operational Area — Lifecycle tracking, batch feed & health logs, and cost-allocated closing.`}
      />
      {children(activeLob)}
    </div>
  );
}
