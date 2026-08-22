"use client";

import { useEffect, useState } from "react";
import {
  Loader2, AlertTriangle, CheckCircle2,
  Layers, Calendar,
  Scale, Utensils, Skull,
} from "lucide-react";

import { api } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";

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

interface BatchPerformanceCurvesPanelProps {
  batchId: string;
  onSchedulerGenerated?: () => void;
}

export default function BatchPerformanceCurvesPanel({
  batchId,
  onSchedulerGenerated,
}: BatchPerformanceCurvesPanelProps) {
  const [loading, setLoading]       = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState("");
  const [data, setData]             = useState<Row | null>(null);

  const loadCurves = async () => {
    if (!batchId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/batch/${batchId}/performance-curves`);
      setData(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load batch performance curves.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateScheduler = async () => {
    setGenerating(true);
    setError("");
    try {
      await api.post(`/batch/${batchId}/generate-scheduler`, {});
      await loadCurves();
      onSchedulerGenerated?.();
    } catch (err: any) {
      setError(err?.message || "Failed to auto-generate scheduler from breed standards.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadCurves();
  }, [batchId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" style={S.accent} />
        <p className="mt-3 text-sm" style={S.sub}>Loading performance curves & breed standards…</p>
      </div>
    );
  }

  const batch = data?.batch || {};
  const summary = data?.summary || {};
  const curves: Row[] = data?.curves || [];

  return (
    <div className="space-y-6">
      {error && <InlineAlert variant="danger">{error}</InlineAlert>}

      {/* ── Top Header / Actions Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-4" style={S.surface}>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold" style={S.primary}>
              Breed Performance Curves & Live Execution
            </h4>
            {batch.has_scheduler ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={S.success}>
                <CheckCircle2 className="h-3 w-3" /> Scheduler: {batch.scheduler_code}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={S.warning}>
                <AlertTriangle className="h-3 w-3" /> No Active Scheduler
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={S.muted}>
            Comparing daily feed intake, target growth, and mortality against {batch.breed_name || "standard breed"} lifecycle curves.
          </p>
        </div>

        {!batch.has_scheduler && (
          <Button size="sm" onClick={handleGenerateScheduler} disabled={generating}>
            {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Layers className="mr-1.5 h-3.5 w-3.5" />}
            Generate Scheduler from Breed Standard
          </Button>
        )}
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Feed Summary */}
        <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Total Feed Intake</p>
            <Utensils className="h-4 w-4" style={S.accent} />
          </div>
          <p className="mt-2 text-2xl font-bold" style={S.primary}>
            {summary.totalActFeedKg?.toLocaleString("en-IN") || 0}{" "}
            <span className="text-xs font-normal" style={S.muted}>/ {summary.totalStdFeedKg?.toLocaleString("en-IN") || 0} kg std</span>
          </p>
          <p className="mt-1 text-xs" style={summary.feedDeviationPct > 10 ? S.warning : S.sub}>
            {summary.feedDeviationPct > 0 ? `+${summary.feedDeviationPct}%` : `${summary.feedDeviationPct}%`} variance vs target
          </p>
        </div>

        {/* Live FCR */}
        <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Feed Conversion (FCR)</p>
            <Scale className="h-4 w-4" style={S.accent} />
          </div>
          <p className="mt-2 text-2xl font-bold" style={S.primary}>
            {summary.liveFcr != null ? summary.liveFcr : "—"}{" "}
            <span className="text-xs font-normal" style={S.muted}>kg feed / kg gain</span>
          </p>
          <p className="mt-1 text-xs" style={S.sub}>
            Last weight: {summary.lastRecordedWeightKg || 1.5} kg
          </p>
        </div>

        {/* Mortality */}
        <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Cumulative Mortality</p>
            <Skull className="h-4 w-4" style={summary.totalMortality > 0 ? S.danger : S.accent} />
          </div>
          <p className="mt-2 text-2xl font-bold" style={S.primary}>
            {summary.totalMortality || 0}{" "}
            <span className="text-xs font-normal" style={S.muted}>pigs ({summary.mortalityRatePct || 0}%)</span>
          </p>
          <p className="mt-1 text-xs" style={S.sub}>
            Current headcount: {batch.current_quantity || 0}
          </p>
        </div>

        {/* Batch Age */}
        <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Batch Timeline</p>
            <Calendar className="h-4 w-4" style={S.accent} />
          </div>
          <p className="mt-2 text-2xl font-bold" style={S.primary}>
            Day {batch.batch_age_days || 1}
          </p>
          <p className="mt-1 text-xs" style={S.sub}>
            Stage: {batch.current_stage_code || "Quarantine / Grower"}
          </p>
        </div>
      </div>

      {/* ── Daily Timeline & Execution Grid ── */}
      <div className="rounded-[var(--radius-lg)] border overflow-hidden" style={S.surface}>
        <div className="border-b p-4" style={S.surface}>
          <h5 className="text-sm font-semibold" style={S.primary}>Day-by-Day Execution vs Standard Curve</h5>
          <p className="text-xs" style={S.muted}>Comparing daily feed intake & body weight against breed standards</p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 border-b text-left uppercase font-semibold" style={S.raised}>
              <tr>
                <th className="px-3 py-2.5">Day</th>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Daily Feed Target</th>
                <th className="px-3 py-2.5">Actual Daily Feed</th>
                <th className="px-3 py-2.5">Feed Progress</th>
                <th className="px-3 py-2.5">Target Weight</th>
                <th className="px-3 py-2.5">Actual Weight</th>
                <th className="px-3 py-2.5">Mortality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--row-border)]">
              {curves.map((c) => {
                const targetFeed = c.stdTotalDailyFeed || 0;
                const actFeed = c.actTotalDailyFeed;
                const pct = targetFeed > 0 && actFeed != null ? Math.round((actFeed / targetFeed) * 100) : null;
                const isOver = pct != null && pct > 115;
                const isUnder = pct != null && pct < 85;

                return (
                  <tr key={c.day} className={`hover:bg-[var(--row-hover)] transition-colors ${c.day === batch.batch_age_days ? "font-semibold bg-[var(--surface-raised)]" : ""}`}>
                    <td className="px-3 py-2 font-mono">
                      Day {c.day}
                      {c.day === batch.batch_age_days && (
                        <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase border" style={S.accent}>
                          Today
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono" style={S.muted}>{c.date}</td>
                    <td className="px-3 py-2 font-mono">
                      {targetFeed > 0 ? `${targetFeed} kg` : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {actFeed != null ? (
                        <span style={isOver || isUnder ? S.warning : S.primary}>
                          {actFeed} kg
                        </span>
                      ) : (
                        <span style={S.muted}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 min-w-[120px]">
                      {pct != null ? (
                        <div className="space-y-1">
                          <div className="h-1.5 w-full rounded-full overflow-hidden" style={S.raised}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: isOver || isUnder ? "var(--warning)" : "var(--accent)",
                              }}
                            />
                          </div>
                          <span className="text-[10px]" style={S.muted}>{pct}% of target</span>
                        </div>
                      ) : (
                        <span style={S.muted}>Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono" style={S.muted}>
                      {c.stdTargetWeight ? `${c.stdTargetWeight} kg` : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold" style={S.primary}>
                      {c.actWeight ? `${c.actWeight} kg` : "—"}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {c.actDailyMort != null ? (
                        <span style={c.actDailyMort > 0 ? S.danger : S.muted}>
                          {c.actDailyMort} head
                        </span>
                      ) : (
                        <span style={S.muted}>0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
