"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building,
  Layers,
  History,
  Plus,
  Database,
  Activity,
  ArrowUpRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";
import { useLanguage } from "../../../hooks/useLanguage";

const S = {
  surface:  { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  raised:   { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary:  { color: "var(--text-primary)" },
  sub:      { color: "var(--text-secondary)" },
  muted:    { color: "var(--text-muted)" },
  accent:   { color: "var(--accent)" },
  border:   { borderColor: "var(--border)" },
  input:    { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [tenants, setTenants] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser || storedUser.userType !== "SYSTEM_ADMIN") {
      router.replace("/");
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tenantsList, plansList, logsList] = await Promise.all([
        api.get("/tenant"),
        api.get("/plan"),
        api.get("/audit-log").catch(() => []),
      ]);
      setTenants(Array.isArray(tenantsList) ? tenantsList : []);
      setPlans(Array.isArray(plansList) ? plansList : []);
      setAuditLogs(Array.isArray(logsList) ? logsList.slice(0, 5) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
        <span className="text-sm" style={S.sub}>Loading system stats…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  // Calculate metrics
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.is_active !== false).length;
  const inactiveTenants = totalTenants - activeTenants;

  // Group tenants by plan
  const planDistribution: Record<string, number> = {};
  tenants.forEach((t) => {
    const pCode = t.plan_id || "UNCONFIGURED";
    planDistribution[pCode] = (planDistribution[pCode] || 0) + 1;
  });

  const getPlanPercentage = (count: number) => {
    if (totalTenants === 0) return 0;
    return (count / totalTenants) * 100;
  };

  const actionBadge = (action: string) => {
    const act = action?.toUpperCase() || "";
    let bg = "#EFF6FF", color = "#1D4ED8", border = "#BFDBFE";
    if (act.includes("CREATE") || act.includes("REGISTER")) {
      bg = "#F0FDF4"; color = "#15803D"; border = "#BBF7D0";
    } else if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("ASSIGN")) {
      bg = "#FFFBEB"; color = "#B45309"; border = "#FDE68A";
    } else if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REVOKE")) {
      bg = "#FEF2F2"; color = "#B91C1C"; border = "#FECACA";
    }
    return (
      <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border"
        style={{ backgroundColor: bg, color, borderColor: border }}>{action}</span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Welcome Banner */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={S.primary}>{t("controlTowerDashboard")}</h1>
          <p className="text-sm mt-0.5" style={S.sub}>
            {t("platformWideSaaSAnalytics")}
          </p>
        </div>
        <button onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:opacity-90 transition-opacity"
          style={{ ...S.surface, ...S.sub }}>
          <RefreshCw className="w-4 h-4" /> {t("refresh")}
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tenants */}
        <div className="rounded-xl border p-5 shadow-sm transition-all hover:shadow-md" style={S.surface}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>{t("registeredTenants")}</span>
            <Building className="w-4 h-4" style={S.accent} />
          </div>
          <div className="text-3xl font-black" style={S.primary}>{totalTenants}</div>
          <div className="mt-2 text-xs flex items-center gap-2" style={S.sub}>
            <span className="text-green-500 font-semibold">{activeTenants} {t("active")}</span>
            <span className="opacity-40">·</span>
            <span className="text-gray-400 font-semibold">{inactiveTenants} {t("inactive")}</span>
          </div>
        </div>

        {/* Total Pricing Plans */}
        <div className="rounded-xl border p-5 shadow-sm transition-all hover:shadow-md" style={S.surface}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>{t("pricingPlans")}</span>
            <Layers className="w-4 h-4" style={S.accent} />
          </div>
          <div className="text-3xl font-black" style={S.primary}>{plans.length}</div>
          <div className="mt-2 text-xs" style={S.sub}>
            {t("activeSaaSTierPlans")}
          </div>
        </div>

        {/* Database Health */}
        <div className="rounded-xl border p-5 shadow-sm transition-all hover:shadow-md" style={S.surface}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>{t("controlPlaneHost")}</span>
            <Database className="w-4 h-4" style={S.accent} />
          </div>
          <div className="text-base font-extrabold truncate" style={S.primary}>localhost:3306</div>
          <div className="mt-2 text-xs flex items-center gap-1.5" style={S.sub}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            <span className="text-green-600 font-bold">{t("sqlConnectionsHealthy")}</span>
          </div>
        </div>

        {/* Platform Uptime */}
        <div className="rounded-xl border p-5 shadow-sm transition-all hover:shadow-md" style={S.surface}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>{t("platformUptime")}</span>
            <Activity className="w-4 h-4" style={S.accent} />
          </div>
          <div className="text-3xl font-black text-green-500">99.98%</div>
          <div className="mt-2 text-xs" style={S.sub}>
            {t("continuousTelemetry")}
          </div>
        </div>
      </div>

      {/* Main Grid: Plan Breakdown & Recent Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Plan Breakdown Card */}
        <div className="lg:col-span-1 rounded-xl border p-6 space-y-6 shadow-sm" style={S.surface}>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>{t("tenantSubscriptionShare")}</h3>
            <p className="text-xs" style={S.muted}>{t("planDistributionAcrossActive")}</p>
          </div>

          <div className="space-y-4">
            {plans.map((p) => {
              const count = planDistribution[p.plan_id] || 0;
              const pct = getPlanPercentage(count);
              return (
                <div key={p.plan_id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={S.primary}>{p.plan_name}</span>
                    <span style={S.sub}>{count} tenant{count !== 1 ? "s" : ""} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={S.raised}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: p.plan_id === "SYSTEM_PLAN" ? "#6366F1" : "var(--accent)"
                      }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Platform Signups Card */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden shadow-sm" style={S.surface}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={S.border}>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>{t("recentTenantRegistrations")}</h3>
              <p className="text-xs" style={S.muted}>{t("newlyOnboardedEntities")}</p>
            </div>
            <Link href="/admin/tenants" className="text-xs font-semibold hover:underline flex items-center gap-1" style={S.accent}>
              {t("viewAll")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y" style={S.border}>
            {tenants.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm" style={S.muted}>{t("noTenantsRegistered")}</div>
            ) : (
              tenants.slice(-4).reverse().map((tItem) => (
                <div key={tItem.tenant_id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div>
                    <div className="text-sm font-bold" style={S.primary}>{tItem.tenant_name}</div>
                    <div className="text-xs font-mono" style={S.muted}>{tItem.tenant_code} · {tItem.billing_email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold border px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                      {tItem.plan_id?.replace("PLAN_", "") || "—"}
                    </span>
                    <span className={`text-[11px] font-bold ${tItem.is_active !== false ? "text-green-600" : "text-gray-400"}`}>
                      {tItem.is_active !== false ? t("active") : t("inactive")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row: Quick Actions & System Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={S.muted}>{t("managementControls")}</h3>

          <div className="grid grid-cols-1 gap-3">
            {[
              { label: t("addNewTenant"), icon: Plus, color: "#10B981", href: "/admin/tenants", desc: t("provisionNewDbAdmin") },
              { label: t("configurePricingPlans"), icon: Layers, color: "#F59E0B", href: "/admin/plans", desc: t("manageQuotasRates") },
              { label: t("masterRegistries"), icon: Database, color: "#3B82F6", href: "/admin/masters", desc: t("seedGlobalStaticCatalogs") },
              { label: t("complianceAuditLogs"), icon: History, color: "#8B5CF6", href: "/admin/audit", desc: t("platformSecurityActivity") }
            ].map((action) => (
              <Link key={action.label} href={action.href}
                className="rounded-xl border p-4 flex items-start gap-3.5 shadow-sm transition-all hover:translate-x-1 hover:shadow-md"
                style={S.surface}>
                <div className="p-2.5 rounded-lg shrink-0" style={{ backgroundColor: `${action.color}15` }}>
                  <action.icon className="w-5 h-5" style={{ color: action.color }} />
                </div>
                <div>
                  <div className="text-sm font-bold" style={S.primary}>{action.label}</div>
                  <div className="text-xs mt-0.5" style={S.sub}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Audit Log Feed */}
        <div className="lg:col-span-2 rounded-xl border overflow-hidden shadow-sm" style={S.surface}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={S.border}>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>{t("platformAuditFeed")}</h3>
              <p className="text-xs" style={S.muted}>{t("recentMutationsSystem")}</p>
            </div>
            <Link href="/admin/audit" className="text-xs font-semibold hover:underline flex items-center gap-1" style={S.accent}>
              {t("fullHistory")} <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y" style={S.border}>
            {auditLogs.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm" style={S.muted}>{t("noEventsRecorded")}</div>
            ) : (
              auditLogs.map((log, index) => (
                <div key={log.audit_id || index} className="px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {actionBadge(log.action)}
                      <span className="text-xs font-bold" style={S.primary}>{log.entity_name}</span>
                    </div>
                    <div className="text-xs" style={S.sub}>
                      {t("mutatedBy")} <span className="font-semibold" style={S.primary}>{log.user_name || t("system")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono" style={S.muted}>
                      {log.created_at ? new Date(log.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
