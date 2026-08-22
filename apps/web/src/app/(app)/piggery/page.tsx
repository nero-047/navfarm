"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePiggeryPageState } from "@/components/console/piggery/piggery-page-shell";
import { useLanguage } from "@/hooks/useLanguage";
import { PageHeader } from "@/components/ui/PageHeader";
import DairyCowRegisterPanel from "@/components/console/dairy/dairy-cow-register-panel";
import { ShieldAlert } from "lucide-react";

// Dairy has one flat register view, not tabbed sections, so it renders
// inline here instead of redirecting into the Piggery sub-routes below.
export default function PiggeryIndexPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { ready, activeLob, mayView } = usePiggeryPageState();

  useEffect(() => {
    if (ready && mayView && activeLob !== "DAIRY") {
      router.replace("/piggery/animals");
    }
  }, [ready, mayView, activeLob, router]);

  if (!ready) return null;

  if (!mayView) {
    return (
      <div className="mx-auto max-w-2xl px-4 pb-8 sm:px-6 lg:px-7">
        <PageHeader title={activeLob === "DAIRY" ? t("dairyCowRegister") : t("pigSwineRegister")} sticky={false} />
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
      </div>
    );
  }

  if (activeLob !== "DAIRY") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-7">
      <PageHeader title={t("dairyCowHerdRegisterTitle")} description={t("dairyCowHerdRegisterDesc")} />
      <DairyCowRegisterPanel />
    </div>
  );
}
