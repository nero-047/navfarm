"use client";

import { useLivestockPageState, LivestockPageShell } from "@/components/console/livestock/livestock-page-shell";
import AnimalPanel from "@/components/console/piggery/animal-panel";
import DairyCowRegisterPanel from "@/components/console/dairy/dairy-cow-register-panel";
import { useLanguage } from "@/hooks/useLanguage";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConsolePage } from "@/components/ui/console-page";
import { resolveLobFamily } from "@/lib/lob";
import { ShieldAlert } from "lucide-react";

/**
 * The animal register — the entry point of the Livestock family.
 *
 * This used to be two routes: `/livestock`, which existed only to redirect to
 * `/livestock` (except for Dairy, which it rendered inline). The
 * redirect hop is gone; the register is simply what `/livestock` is.
 */
export default function LivestockRegisterPage() {
  const { t } = useLanguage();
  const { ready, activeLob, mayView } = useLivestockPageState();

  if (!ready) return null;

  if (!mayView) {
    return (
      <ConsolePage size="narrow">
        <PageHeader title={t("navLivestockRegister")} sticky={false} />
        <div
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border p-5"
          style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("pigAccessRestrictedTitle")}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{t("accessDeniedContactAdmin")}</p>
          </div>
        </div>
      </ConsolePage>
    );
  }

  // Dairy has one flat register rather than the tabbed sections the other
  // livestock LOBs use, so it renders without the section shell.
  if (resolveLobFamily(activeLob) === "DAIRY") {
    return (
      <ConsolePage>
        <PageHeader title={t("dairyCowHerdRegisterTitle")} description={t("dairyCowHerdRegisterDesc")} />
        <DairyCowRegisterPanel />
      </ConsolePage>
    );
  }

  return (
    <LivestockPageShell activeKey="register">
      <AnimalPanel />
    </LivestockPageShell>
  );
}
