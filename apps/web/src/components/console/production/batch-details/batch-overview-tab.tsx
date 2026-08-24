"use client";

import React, { useMemo } from "react";
import {
  Wheat,
  HeartPulse,
  Activity,
  AlertTriangle,
  TrendingUp,
  Zap,
} from "lucide-react";

interface BatchOverviewTabProps {
  batch: any;
  onTabChange?: (tab: string) => void;
}

export function BatchOverviewTab({ batch, onTabChange }: BatchOverviewTabProps) {
  const openingQty = Math.round(Number(batch?.opening_quantity || 30));
  const txs = useMemo(() => batch?.transactions || [], [batch?.transactions]);

  // 1. Mortality calculations from live transactions
  const mortTxs = useMemo(() => txs.filter((t: any) => t.transaction_type === "MORTALITY"), [txs]);
  const mortalityQty = useMemo(() => {
    return mortTxs.reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);
  }, [mortTxs]);

  const currentQty = Math.max(0, openingQty - mortalityQty);
  const mortalityPct = openingQty > 0 ? ((mortalityQty / openingQty) * 100).toFixed(2) : "0.00";

  // 2. Cost calculations from live transactions (handling negative debit/credit ledger amounts properly)
  const feedTxs = useMemo(() => {
    return txs.filter((t: any) => t.transaction_type === "CONSUMPTION" && (!t.uom || t.uom === "KG"));
  }, [txs]);

  const totalFeedQty = useMemo(() => {
    return feedTxs.reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);
  }, [feedTxs]);

  const feedCost = useMemo(() => {
    return feedTxs.reduce((sum: number, t: any) => {
      const qty = Math.abs(Number(t.quantity || 0));
      const rate = Number(t.rate) || 28.0;
      const amt = t.amount !== undefined && t.amount !== null ? Math.abs(Number(t.amount)) : qty * rate;
      return sum + amt;
    }, 0);
  }, [feedTxs]);

  const medTxs = useMemo(() => {
    return txs.filter((t: any) => t.transaction_type === "CONSUMPTION" && (t.uom === "ML" || t.uom === "DOSES"));
  }, [txs]);

  const totalMedQty = useMemo(() => {
    return medTxs.reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);
  }, [medTxs]);

  const medCost = useMemo(() => {
    return medTxs.reduce((sum: number, t: any) => {
      const qty = Math.abs(Number(t.quantity || 0));
      const rate = Number(t.rate) || 25.0;
      const amt = t.amount !== undefined && t.amount !== null ? Math.abs(Number(t.amount)) : qty * rate;
      return sum + amt;
    }, 0);
  }, [medTxs]);

  const overheadTxs = useMemo(() => {
    return txs.filter((t: any) => t.transaction_type === "OVERHEAD");
  }, [txs]);

  const overheadCost = useMemo(() => {
    return overheadTxs.reduce((sum: number, t: any) => {
      const qty = Math.abs(Number(t.quantity || 1));
      const rate = Number(t.rate) || 50.0;
      const amt = t.amount !== undefined && t.amount !== null ? Math.abs(Number(t.amount)) : qty * rate;
      return sum + amt;
    }, 0);
  }, [overheadTxs]);

  const totalCost = feedCost + medCost + overheadCost;
  const costPerHead = currentQty > 0 ? (totalCost / currentQty).toFixed(2) : "0.00";

  // 3. Group transactions by date for activity timeline
  const txByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of txs) {
      const d = (t.transaction_date || t.created_at || "").slice(0, 10);
      if (!d) continue;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    }
    return map;
  }, [txs]);

  const sortedDates = useMemo(() => {
    return Array.from(txByDate.keys()).sort().reverse();
  }, [txByDate]);

  const startDate = batch?.start_date ? new Date(batch.start_date) : new Date();

  const recentActivities = useMemo(() => {
    if (sortedDates.length === 0) {
      return [];
    }

    return sortedDates.slice(0, 10).map((d) => {
      const dayTxs = txByDate.get(d) || [];
      const feed = dayTxs
        .filter((t: any) => t.transaction_type === "CONSUMPTION" && (!t.uom || t.uom === "KG"))
        .reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);

      const med = dayTxs
        .filter((t: any) => t.transaction_type === "CONSUMPTION" && (t.uom === "ML" || t.uom === "DOSES"))
        .reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);

      const mort = dayTxs
        .filter((t: any) => t.transaction_type === "MORTALITY")
        .reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);

      const wtTx = dayTxs.find((t: any) => t.transaction_type === "OBSERVATION" && t.uom === "KG");
      const weight = wtTx ? `${Number(wtTx.quantity).toFixed(1)} kg` : "—";

      const dayOverhead = dayTxs
        .filter((t: any) => t.transaction_type === "OVERHEAD")
        .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || (Number(t.quantity || 1) * (Number(t.rate) || 50)))), 0);

      const entryDate = new Date(d);
      const dayNum = Math.max(1, Math.floor((entryDate.getTime() - startDate.getTime()) / 86400000) + 1);

      return {
        date: d,
        day: `Day ${dayNum}`,
        feed: feed > 0 ? `${feed.toFixed(1)} KG` : "—",
        med: med > 0 ? `${med.toFixed(0)} Doses` : "—",
        overhead: dayOverhead > 0 ? `₹${dayOverhead.toFixed(0)}` : "—",
        mort,
        weight,
        status: "Posted",
      };
    });
  }, [sortedDates, txByDate, startDate]);

  // Dynamic stage name and description
  const stageName = batch?.current_stage_code
    ? batch.current_stage_code.replace(/_/g, " ")
    : batch?.stage_name || batch?.stage || "ACTIVE";

  const isBioAsset = batch?.costing_method === "BIO_ASSET";
  const bioState = batch?.bio_asset_state;

  return (
    <div className="space-y-6">
      {/* ── Top Key Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Headcount */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Current Headcount
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs">
              🐷
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
              {currentQty}
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              / {openingQty} opening
            </span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {((currentQty / (openingQty || 1)) * 100).toFixed(1)}% herd retention
          </div>
        </div>

        {/* Card 2: Total Feed Consumed */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Feed Consumed
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
              <Wheat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalFeedQty.toLocaleString("en-IN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">KG</span>
          </div>
          <div className="mt-1 text-[11px] font-mono font-bold text-[var(--text-secondary)]">
            ₹{feedCost.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} total feed cost
          </div>
        </div>

        {/* Card 3: Mortality Rate */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Mortality Rate
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${mortalityQty > 0 ? "text-rose-600 dark:text-rose-400" : "text-[var(--text-primary)]"}`}>
              {mortalityPct}%
            </span>
            <span className="text-xs font-bold text-[var(--text-muted)]">
              ({mortalityQty} head lost)
            </span>
          </div>
          <div className={`mt-1 text-[11px] font-bold ${Number(mortalityPct) <= 2.0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {Number(mortalityPct) <= 2.0 ? "✓ Below standard threshold (2.0%)" : "⚠ Exceeds standard threshold"}
          </div>
        </div>

        {/* Card 4: Accumulated Cost */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
              {isBioAsset ? "Bio-Asset Carrying Cost" : "Accumulated Batch Cost"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono">
              ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="mt-1 text-[11px] font-bold font-mono text-[var(--text-secondary)]">
            ₹{costPerHead} per head
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Cost Breakdown & Recent Operations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cost Breakdown Grid */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Live Cost Allocation — {stageName}
                </h3>
              </div>
              <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">
                Total ₹{totalCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Feed Cost</span>
                  <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-lg font-black font-mono text-[var(--text-primary)]">
                  ₹{feedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-medium">
                  {totalFeedQty.toFixed(1)} KG ({totalCost > 0 ? ((feedCost / totalCost) * 100).toFixed(1) : 0}%)
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Medication & Vaccine</span>
                  <HeartPulse className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <div className="text-lg font-black font-mono text-[var(--text-primary)]">
                  ₹{medCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-medium">
                  {totalMedQty.toFixed(0)} Doses ({totalCost > 0 ? ((medCost / totalCost) * 100).toFixed(1) : 0}%)
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-[var(--text-secondary)]">Barn Overheads</span>
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="text-lg font-black font-mono text-[var(--text-primary)]">
                  ₹{overheadCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-medium">
                  Power & Labour ({totalCost > 0 ? ((overheadCost / totalCost) * 100).toFixed(1) : 0}%)
                </div>
              </div>
            </div>
          </div>

          {/* Recent Operational Logs Table */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                    Recent Daily Operational Logs
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {sortedDates.length} operational day entries recorded for this batch
                  </p>
                </div>
              </div>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No daily operations recorded yet. Go to the <strong>Data entry</strong> tab to record today&apos;s feed, health, and weights.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-3 py-3">Timeline</th>
                      <th className="px-3.5 py-3 text-right">Feed Consumed</th>
                      <th className="px-3.5 py-3 text-right">Medication</th>
                      <th className="px-3 py-3 text-center">Mortality</th>
                      <th className="px-3.5 py-3 text-right">Overhead</th>
                      <th className="px-3.5 py-3 text-right">Avg Weight</th>
                      <th className="px-3.5 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {recentActivities.map((act, i) => (
                      <tr key={i} className="hover:bg-[var(--surface-raised)]/30 transition">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                          {act.date}
                        </td>
                        <td className="px-3 py-3 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                          {act.day}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {act.feed}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {act.med}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold whitespace-nowrap">
                          {act.mort > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                              −{act.mort}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">0</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-[var(--text-secondary)] whitespace-nowrap">
                          {act.overhead}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {act.weight}
                        </td>
                        <td className="px-3.5 py-3 text-right whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Stage KPI Summary & Bio-Asset Valuation */}
        <div className="space-y-6">
          {/* Quick Action Shortcuts */}
          {onTabChange && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)] pb-2 border-b border-[var(--border)]">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTabChange("data-entry")}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)] text-left transition flex flex-col justify-between"
                >
                  <span className="text-base mb-1">✏️</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Data Entry</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Record Day Log</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("stage-schedulers")}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)] text-left transition flex flex-col justify-between"
                >
                  <span className="text-base mb-1">📋</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Schedulers</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Stage Roadmap</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("animal-assignment")}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)] text-left transition flex flex-col justify-between"
                >
                  <span className="text-base mb-1">🐷</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Animals</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Ear Tags & RFID</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("consumption")}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)] text-left transition flex flex-col justify-between"
                >
                  <span className="text-base mb-1">🌾</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Consumption</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Feed & Meds</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("mortality")}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)] text-left transition flex flex-col justify-between"
                >
                  <span className="text-base mb-1">⚰️</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Mortality</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Autopsy & Culls</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("transfer")}
                  className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)]/30 hover:bg-[var(--surface-raised)] text-left transition flex flex-col justify-between"
                >
                  <span className="text-base mb-1">🔄</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">Transfer</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Move Stage</span>
                </button>
              </div>
            </div>
          )}

          {/* Stage KPI Summary Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Stage KPI Summary
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 uppercase">
                {stageName}
              </span>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-secondary)] font-medium">Days Logged</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{sortedDates.length} Days</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-secondary)] font-medium">Total Feed Consumed</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{totalFeedQty.toFixed(1)} KG</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-secondary)] font-medium">Avg Daily Feed / Head</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">
                  {sortedDates.length > 0 && currentQty > 0
                    ? (totalFeedQty / (currentQty * sortedDates.length)).toFixed(2)
                    : "0.00"}{" "}
                  KG/day
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-secondary)] font-medium">Medical Treatments</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{totalMedQty.toFixed(0)} doses</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-secondary)] font-medium">Mortality Rate</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{mortalityPct}%</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-secondary)] font-medium">Active Headcount</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{currentQty} head</span>
              </div>
            </div>
          </div>

          {/* IAS 41 Bio-Asset Card (if breeding/sow cohort) */}
          {isBioAsset && (
            <div className="rounded-2xl border border-blue-900/60 bg-gradient-to-br from-[#0c1f38] to-[#122b4d] text-white p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧬</span>
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-200">
                    IAS 41 Bio-Asset Model
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {bioState?.stage || "PREMATURE"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-300">Net Carrying Value (NBV):</span>
                  <span className="font-black font-mono text-emerald-400 text-sm">
                    ₹{Number(bioState?.nca_book_value || totalCost || 1293750).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">Capitalized Cost / Head:</span>
                  <span className="font-mono text-blue-100 font-bold">
                    ₹{currentQty > 0 ? (Number(bioState?.nca_book_value || totalCost) / currentQty).toFixed(2) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-300">Amortization Method:</span>
                  <span className="text-blue-100 font-bold">Cost Accumulation (SLM)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
