"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser, NavUser } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { MASTER_DATA_CONFIGS, MASTER_DATA_GROUPS, getConfig } from "@/modules/master-data/configs";
import MasterDataTable from "@/modules/master-data/MasterDataTable";
import { ShieldAlert } from "lucide-react";

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
};

export default function MasterDataPage() {
  const router = useRouter();
  const { t, tLabel } = useLanguage();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeKey, setActiveKey] = useState(MASTER_DATA_CONFIGS[0].key);

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    setReady(true);
  }, [router]);

  if (!ready || !user) return null;

  if (user.userType !== "COMPANY_ADMIN" && user.userType !== "SYSTEM_ADMIN" && user.userType !== "TENANT_ADMIN") {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <div
          className="flex items-center gap-3 rounded-[var(--radius-md)] border p-5"
          style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)", color: "var(--warning)" }}
        >
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("masterDataAccessDeniedTitle")}</p>
            <p className="mt-1 text-xs" style={S.sub}>{t("masterDataAccessDeniedDesc", { type: user.userType.replace(/_/g, " ").toLowerCase() })}</p>
          </div>
        </div>
      </div>
    );
  }

  const activeConfig = getConfig(activeKey) || MASTER_DATA_CONFIGS[0];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-7">
      <div className="mb-5">
        <h1 className="nf-text-section" style={S.primary}>{t("masterData")}</h1>
        <p className="mt-0.5 text-sm" style={S.sub}>{t("masterDataPageDescription")}</p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <aside className="shrink-0 lg:w-64">
          <nav className="lg:border-r lg:pr-2" style={{ borderColor: "var(--border)" }}>
            {MASTER_DATA_GROUPS.map((group) => (
              <div key={group} className="mb-1 last:mb-0">
                <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest" style={S.muted}>{tLabel(group)}</p>
                <ul className="flex flex-col gap-0.5">
                  {MASTER_DATA_CONFIGS.filter((c) => c.group === group).map((c) => {
                    const isActive = c.key === activeKey;
                    return (
                      <li key={c.key}>
                        <button
                          onClick={() => setActiveKey(c.key)}
                          className="nf-press w-full rounded-[var(--radius-sm)] px-3 py-2 text-left text-[13px] font-medium transition-colors"
                          style={isActive
                            ? { backgroundColor: "var(--accent-muted)", color: "var(--accent)" }
                            : { color: "var(--text-secondary)" }}
                        >
                          {tLabel(c.label)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <MasterDataTable key={activeConfig.key} config={activeConfig} />
        </main>
      </div>
    </div>
  );
}
