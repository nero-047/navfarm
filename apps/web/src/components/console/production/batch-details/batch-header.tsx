"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Save, ArrowRightLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchHeaderProps {
  batch: any;
  currentDate: string;
  onDateChange: (date: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave?: () => void;
  saving?: boolean;
  onTransferStage?: () => void;
  onMatureBio?: () => void;
  onAmortizeBio?: () => void;
  onFairValueBio?: () => void;
  onDisposeBio?: () => void;
  onCloseBatch?: () => void;
  onActivateBatch?: () => void;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "stage-schedulers", label: "Stage schedulers" },
  { id: "data-entry", label: "Data entry" },
  { id: "locations", label: "Locations" },
  { id: "animal-assignment", label: "Animal assignment" },
  { id: "consumption", label: "Consumption" },
  { id: "mortality", label: "Mortality" },
  { id: "transfer", label: "Transfer" },
  { id: "output", label: "Output" },
  { id: "documents", label: "Documents" },
  { id: "curves", label: "Performance curves" },
  { id: "alerts", label: "KPI alerts" },
];

export function BatchHeader({
  batch,
  currentDate,
  onDateChange,
  activeTab,
  onTabChange,
  onSave,
  saving,
  onTransferStage,
  onMatureBio,
  onAmortizeBio,
  onFairValueBio,
  onDisposeBio,
  onCloseBatch,
  onActivateBatch,
}: BatchHeaderProps) {
  // Helper to step dates forward/backward
  const stepDate = (delta: number) => {
    const d = new Date(currentDate || new Date());
    d.setDate(d.getDate() + delta);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "Today";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatShortDate = (d: Date) => {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const currentStageCode = (batch.current_stage_code || batch.stage_code || "").toUpperCase();
  const startDate = batch.start_date ? new Date(batch.start_date) : null;
  const endDate = batch.expected_end_date ? new Date(batch.expected_end_date) : null;
  const curr = new Date(currentDate || new Date().toISOString().slice(0, 10));

  const stageDurationDays = (value?: number | string | null, unit?: string | null) => {
    const v = Number(value) || 0;
    switch ((unit || "DAY").toUpperCase()) {
      case "WEEK":
        return v * 7;
      case "MONTH":
        return v * 30;
      default:
        return v;
    }
  };

  // Real lifecycle stages this batch actually has scheduled — generated per-batch
  // from stage_master/breed_lifecycle_stages for its own LOB and breed, sorted into
  // true lifecycle order (batch.service.ts findOne() joins in stage_sequence for
  // exactly this). Replaces a previous hardcoded 4/8-stage guess keyed only off
  // costing method, which had no connection to the batch's real stage plan and
  // could show a stage the batch was never actually in.
  const lifecycleStages = useMemo(() => {
    const schedulers = (batch.stage_schedulers || []) as any[];
    return schedulers.map((s: any) => ({
      code: (s.stage_code || "").toUpperCase(),
      name: s.stage_name || s.stage_code || "Stage",
      durationDays: stageDurationDays(s.duration_value, s.duration_unit),
      effectiveFrom: s.effective_from ? new Date(s.effective_from) : null,
      effectiveTo: s.effective_to ? new Date(s.effective_to) : null,
    }));
  }, [batch.stage_schedulers]);

  const totalDays = useMemo(() => {
    if (lifecycleStages.length > 0) {
      return lifecycleStages.reduce((sum, s) => sum + (s.durationDays || 0), 0) || 1;
    }
    if (startDate && endDate) {
      return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
    }
    return 150;
  }, [lifecycleStages, startDate, endDate]);

  const dayOfBatch = startDate ? Math.max(1, Math.floor((curr.getTime() - startDate.getTime()) / 86400000) + 1) : 1;
  const weekOfBatch = Math.ceil(dayOfBatch / 7);
  const totalWeeks = Math.ceil(totalDays / 7);
  const daysRemaining = Math.max(0, totalDays - dayOfBatch);
  const progressPct = Math.min(100, Math.max(1, Math.round((dayOfBatch / totalDays) * 100)));

  // Date range shown per pill: prefer the scheduler's own effective_from/to (real,
  // backend-computed from this batch's actual start date); fall back to a cumulative
  // day-range estimate only for a scheduler that hasn't been assigned real dates yet.
  const stagesWithDates = useMemo(() => {
    const sDate = startDate || new Date();
    let cursor = 0;
    return lifecycleStages.map((stg) => {
      const from = stg.effectiveFrom || new Date(sDate.getTime() + cursor * 86400000);
      const to = stg.effectiveTo || new Date(sDate.getTime() + (cursor + Math.max(0, stg.durationDays - 1)) * 86400000);
      cursor += stg.durationDays || 0;
      return { code: stg.code, name: stg.name, dates: `${formatShortDate(from)} to ${formatShortDate(to)}` };
    });
  }, [lifecycleStages, startDate]);

  // Find active stage index — matches on the batch's real current_stage_code first
  // (now reliable, since these are the batch's own generated stage codes), falling
  // back to a loose name match only if that somehow doesn't resolve.
  const activeIdx = useMemo(() => {
    const idxByCode = stagesWithDates.findIndex((s) => s.code === currentStageCode);
    if (idxByCode >= 0) return idxByCode;
    const stageName = (batch.stage_name || batch.current_stage_code || "").toLowerCase();
    if (!stageName) return 0;
    const idxByName = stagesWithDates.findIndex(
      (s) => stageName.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(stageName)
    );
    return idxByName >= 0 ? idxByName : 0;
  }, [stagesWithDates, currentStageCode, batch.stage_name, batch.current_stage_code]);

  return (
    <div className="rounded-[var(--radius-lg)] border bg-[var(--surface)] shadow-sm overflow-hidden mb-5">
      {/* ── Top Context Header ── */}
      <div className="p-4 sm:p-5 border-b border-[var(--border)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-2xl shrink-0">
              🐖
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                  {batch.batch_no || "Batch Details"}
                </h2>
                {batch.batch_name && batch.batch_name !== batch.batch_no && (
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)] font-medium">
                    {batch.batch_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {batch.breed_name || "Large White (LW)"} &nbsp;·&nbsp; Sow Batch &nbsp;·&nbsp;{" "}
                {batch.farm_name || "Main Farm"} › {batch.shed_name || "Shed 1"} &nbsp;·&nbsp;{" "}
                <strong className="text-[var(--text-primary)]">{batch.current_quantity ?? batch.opening_quantity ?? 0} {batch.uom || "sows"}</strong> &nbsp;·&nbsp;{" "}
                <span className="font-mono">{batch.costing_method || "STANDARD"}</span> costing
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200">
                  {batch.stage_name || batch.stage || "Active Stage"}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                  style={
                    batch.status === "ACTIVE"
                      ? { backgroundColor: "var(--success-muted)", color: "var(--success)", borderColor: "var(--success)" }
                      : { backgroundColor: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border)" }
                  }
                >
                  {batch.status || "DRAFT"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[var(--surface-raised)] text-[var(--text-secondary)] font-medium">
                  Day {dayOfBatch} of {totalDays} · Week {weekOfBatch}
                </span>
                {batch.start_date && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-[var(--surface-raised)] text-[var(--text-secondary)] font-medium">
                    Start {batch.start_date} {batch.expected_end_date ? `· End ${batch.expected_end_date}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar & Date Stepper */}
          <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
            {/* Date Navigator */}
            <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 shadow-xs">
              <button
                type="button"
                onClick={() => stepDate(-1)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface)] transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-[var(--text-primary)] min-w-[90px] text-center">
                {formatDateDisplay(currentDate)}
              </span>
              <button
                type="button"
                onClick={() => stepDate(1)}
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface)] transition"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Save Action for Data Entry */}
            {onSave && activeTab === "data-entry" && batch.status === "ACTIVE" && (
              <Button
                onClick={onSave}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 h-8 gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save entry"}
              </Button>
            )}

            {/* Transfer Stage button */}
            {onTransferStage && batch.status === "ACTIVE" && (
              <Button
                variant="outline"
                onClick={onTransferStage}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Stage
              </Button>
            )}

            {/* Activate draft button */}
            {onActivateBatch && batch.status === "DRAFT" && (
              <Button
                onClick={onActivateBatch}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3.5 gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Activate Batch
              </Button>
            )}

            {/* Close batch button */}
            {onCloseBatch && batch.status === "ACTIVE" && (
              <Button
                variant="outline"
                onClick={onCloseBatch}
                className="text-xs h-8 px-3 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                Close Batch
              </Button>
            )}
          </div>
        </div>

        {/* ── Stage Progress Bar & Lifecycle Pills ── */}
        <div className="mt-4 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[var(--text-secondary)] font-medium">Stage progress</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {progressPct}% complete · Week {weekOfBatch} of {totalWeeks} · {daysRemaining} days remaining
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {stagesWithDates.length === 0 && (
              <span className="text-[11px] text-[var(--text-muted)]">
                No stage schedulers generated yet for this batch.
              </span>
            )}
            {stagesWithDates.map((stg, i) => {
              const isDone = i < activeIdx;
              const isCur = i === activeIdx;
              return (
                <div
                  key={stg.name}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition flex items-center gap-1.5 ${
                    isCur
                      ? "bg-[#1A3A5C] text-white shadow-xs"
                      : isDone
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200"
                      : "bg-[var(--surface-raised)] text-[var(--text-muted)]"
                  }`}
                >
                  {isDone && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
                  {isCur && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  <span>{stg.name}</span>
                  {isCur && <span className="text-[10px] opacity-75">· {stg.dates}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation Strip ── */}
      <div className="flex items-center gap-1 px-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition -mb-[1px] ${
                active
                  ? "border-[#1A3A5C] dark:border-blue-400 text-[#1A3A5C] dark:text-blue-300 font-bold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
