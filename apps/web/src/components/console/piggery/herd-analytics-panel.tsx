"use client";

import { useEffect, useState } from "react";
import {
  Loader2, BarChart3, TrendingUp, Users, HeartPulse,
  Activity, ShieldCheck,
} from "lucide-react";
import { api } from "@/services/api-client";
import { InlineAlert } from "@/components/ui/alert";
import { getActiveCompanyId } from "@/hooks/useAuth";

type Row = Record<string, any>;

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised:  { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub:     { color: "var(--text-secondary)" },
  muted:   { color: "var(--text-muted)" },
  accent:  { color: "var(--accent)" },
  danger:  { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" },
  warning: { color: "var(--warning)", borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)" },
  success: { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" },
};

function formatCurrency(val?: number | string | null) {
  if (val == null) return "₹0.00";
  const num = Number(val);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function HerdAnalyticsPanel() {
  const companyId = getActiveCompanyId();

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [data, setData]         = useState<Row | null>(null);

  const loadAnalytics = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/financial-reports/herd-analytics?companyId=${companyId}`);
      setData(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load Piggery Herd Analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxParityCount = data
    ? Math.max(...Object.values(data.parityDistribution as Record<string, number>), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="rounded-[var(--radius-lg)] border p-4" style={S.surface}>
        <h3 className="text-base font-semibold" style={S.primary}>Piggery Herd Analytics & Demographics</h3>
        <p className="text-xs" style={S.muted}>Real-time census, parity distribution curve, and biological asset valuation</p>
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}

      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" style={S.accent} />
          <p className="mt-3 text-sm" style={S.sub}>Analyzing herd demographics and productivity metrics…</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* ── KPI Summary Cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Active Herd Size</p>
                <Users className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono" style={S.primary}>
                {data.totalHeadcount.toLocaleString("en-IN")} <span className="text-xs font-normal" style={S.muted}>head</span>
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>
                {data.genderBreakdown.Female} Females · {data.genderBreakdown.Male} Males
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Asset Valuation</p>
                <TrendingUp className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono" style={S.primary}>
                {formatCurrency(data.totalBookValue)}
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>
                Avg {formatCurrency(data.totalHeadcount > 0 ? data.totalBookValue / data.totalHeadcount : 0)} / head
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Live Births</p>
                <HeartPulse className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono" style={S.primary}>
                {data.productivity.totalPigletsBornLive.toLocaleString("en-IN")} <span className="text-xs font-normal" style={S.muted}>piglets</span>
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>
                {data.productivity.totalPigletsWeaned.toLocaleString("en-IN")} successfully weaned
              </p>
            </div>

            <div className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Weaning Rate</p>
                <Activity className="h-4 w-4" style={{ color: "var(--accent)" }} />
              </div>
              <p className="mt-2 text-2xl font-bold font-mono" style={S.primary}>
                {data.productivity.weaningRate}%
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>
                {data.productivity.weaningRate >= 85 ? "Optimal weaning efficiency" : "Monitoring recommended"}
              </p>
            </div>
          </div>

          {/* ── Parity Profile Curve & Breeding Distribution ── */}
          <div className="rounded-[var(--radius-lg)] border p-5 shadow-sm" style={S.surface}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold" style={S.primary}>Sow Herd Parity Profile Curve</h4>
                <p className="text-xs" style={S.muted}>Headcount distribution of breeding females across gestation cycles</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium" style={S.accent}>
                <BarChart3 className="h-3.5 w-3.5" /> Target: Balanced Parity 1–4 Peak
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {Object.entries(data.parityDistribution as Record<string, number>).map(([label, count]) => {
                const pct = (count / maxParityCount) * 100;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span style={S.primary}>{label}</span>
                      <span style={S.sub}>{count} head</span>
                    </div>
                    <div className="h-4 w-full rounded-full overflow-hidden" style={S.raised}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                          backgroundColor: "var(--accent)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Demographics Breakdown (Stage & Breed) ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By Stage */}
            <div className="rounded-[var(--radius-lg)] border p-5 shadow-sm" style={S.surface}>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-4 w-4" style={S.accent} />
                <h4 className="text-sm font-semibold" style={S.primary}>Distribution by Production Stage</h4>
              </div>
              <div className="space-y-2 text-sm">
                {data.stageBreakdown.map((s: Row) => (
                  <div key={s.stage_name} className="flex items-center justify-between py-2 border-b">
                    <span style={S.sub}>{s.stage_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={S.primary}>{s.count} head</span>
                      <span className="text-xs" style={S.muted}>
                        {((s.count / (data.totalHeadcount || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {data.stageBreakdown.length === 0 && (
                  <p className="text-xs" style={S.muted}>No animals in active stages.</p>
                )}
              </div>
            </div>

            {/* By Breed */}
            <div className="rounded-[var(--radius-lg)] border p-5 shadow-sm" style={S.surface}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4" style={S.accent} />
                <h4 className="text-sm font-semibold" style={S.primary}>Distribution by Genetic Breed</h4>
              </div>
              <div className="space-y-2 text-sm">
                {data.breedBreakdown.map((b: Row) => (
                  <div key={b.breed_name} className="flex items-center justify-between py-2 border-b">
                    <span style={S.sub}>{b.breed_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold" style={S.primary}>{b.count} head</span>
                      <span className="text-xs" style={S.muted}>
                        {((b.count / (data.totalHeadcount || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
                {data.breedBreakdown.length === 0 && (
                  <p className="text-xs" style={S.muted}>No breed registrations found.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Disposals & Realized Gain/Loss Summary ── */}
          <div className="rounded-[var(--radius-lg)] border p-5 shadow-sm" style={S.surface}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold" style={S.primary}>Herd Disposals & Realized Exit Gain / Loss</h4>
                <p className="text-xs" style={S.muted}>Historical animal exits (Sold, Slaughtered, Culled, Mortalities)</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-semibold" style={S.muted}>Net Gain / Loss on Disposal</p>
                <p className="text-base font-bold" style={Number(data.disposals.totalGainLoss) >= 0 ? S.success : S.danger}>
                  {formatCurrency(data.disposals.totalGainLoss)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
              {Object.entries(data.disposals.disposalBreakdown as Record<string, number>).map(([type, count]) => (
                <div key={type} className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>{type}</p>
                  <p className="mt-1 text-xl font-bold" style={S.primary}>{count} <span className="text-xs font-normal" style={S.muted}>head</span></p>
                </div>
              ))}
              {Object.keys(data.disposals.disposalBreakdown).length === 0 && (
                <div className="col-span-4 py-4 text-center">
                  <p className="text-xs" style={S.muted}>No disposal events recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
