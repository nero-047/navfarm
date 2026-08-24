"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Edit3,
  CheckCircle2,
  Clock,
  Wheat,
  HeartPulse,
  Activity,
  Zap,
  Users,
  ArrowRightLeft,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";

interface BatchStageSchedulersTabProps {
  batch: any;
  onRefreshBatch: () => Promise<void>;
  onTransferStage?: () => void;
}

export function BatchStageSchedulersTab({
  batch,
  onRefreshBatch,
  onTransferStage,
}: BatchStageSchedulersTabProps) {
  const [schedulers, setSchedulers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSchedulerId, setSelectedSchedulerId] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("feed");

  // Load all stage schedulers for this batch
  const loadStageSchedulers = async () => {
    if (!batch?.batch_id) return;
    setLoading(true);
    try {
      const res = await api.get(`/batch/${batch.batch_id}/schedulers`);
      const data = res?.data ?? res ?? [];
      setSchedulers(data);

      // Auto-select current active stage scheduler if not already selected
      if (!selectedSchedulerId && data.length > 0) {
        const active = data.find((s: any) => s.is_current_stage) || data[0];
        setSelectedSchedulerId(active.scheduler_id);
      }
    } catch (err) {
      console.error("Failed to load stage schedulers:", err);
      setSchedulers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStageSchedulers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.batch_id, batch?.scheduler_id, batch?.current_stage_code]);

  // Handle auto-generation of stage schedulers
  const handleGenerateSchedulers = async () => {
    if (!batch?.batch_id) return;
    setGenerating(true);
    try {
      await api.post(`/batch/${batch.batch_id}/generate-stage-schedulers`, {});
      await onRefreshBatch();
      await loadStageSchedulers();
    } catch (err: any) {
      console.error("Failed to generate stage schedulers:", err);
    } finally {
      setGenerating(false);
    }
  };

  // Selected stage scheduler
  const selectedScheduler = useMemo(() => {
    if (!selectedSchedulerId) return schedulers[0] || null;
    return schedulers.find((s) => s.scheduler_id === selectedSchedulerId) || schedulers[0] || null;
  }, [schedulers, selectedSchedulerId]);

  // Open Edit Modal
  const openEditModal = (scheduler: any) => {
    setEditFormData({
      scheduler_id: scheduler.scheduler_id,
      stage_name: scheduler.stage_name,
      stage_code: scheduler.stage_code,
      duration_value: scheduler.duration_value,
      animal_count: scheduler.animal_count,
      notes: scheduler.description || "",
      lines: (scheduler.lines || []).map((l: any) => ({
        spl_id: l.spl_id,
        parameter_id: l.parameter_id,
        parameter_name: l.parameter_name,
        line_type: l.line_type,
        standard_qty: l.standard_qty ?? l.expected_qty_override ?? 0,
        expected_qty_override: l.expected_qty_override ?? l.standard_qty ?? 0,
        uom_override: l.uom || "KG",
        kpi_target_value: l.kpi_target_value ?? 0,
        kpi_min_pct: l.kpi_min_pct ?? 10,
        kpi_max_pct: l.kpi_max_pct ?? 10,
        critical_threshold_pct: l.critical_threshold_pct ?? 25,
        notes: l.notes || "",
        custom_days: (l.custom_days || []).map((cd: any) => ({
          day_number: cd.day_number,
          day_label: cd.day_label || "",
        })),
      })),
    });
    setIsEditModalOpen(true);
  };

  // Save Edit Modal
  const handleSaveEdit = async () => {
    if (!editFormData || !batch?.batch_id) return;
    setSavingEdit(true);
    try {
      await api.put(`/batch/${batch.batch_id}/schedulers/${editFormData.scheduler_id}/lines`, {
        duration_value: Number(editFormData.duration_value),
        animal_count: Number(editFormData.animal_count),
        notes: editFormData.notes,
        lines: editFormData.lines,
      });

      setIsEditModalOpen(false);
      await onRefreshBatch();
      await loadStageSchedulers();
    } catch (err) {
      console.error("Failed to update stage scheduler lines:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "PRODUCTIVE":
        return "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
      case "OUTPUT":
        return "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800";
      case "DISPOSAL":
        return "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800";
      case "PRE_PRODUCTIVE":
      default:
        return "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Overview Banner & Actions ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Stage Schedulers Hub
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {schedulers.length} Lifecycle Stage Schedulers
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              One batch owns dedicated stage schedulers for all biological milestones with tailored feeding, veterinary, and KPI lines.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              onClick={handleGenerateSchedulers}
              disabled={generating || loading}
              className="text-xs h-8 px-3 gap-1.5 border-[var(--border)] hover:bg-[var(--surface-raised)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating…" : "Regenerate Stage Schedulers"}
            </Button>

            {onTransferStage && batch.status === "ACTIVE" && (
              <Button
                onClick={onTransferStage}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 px-3.5 gap-1.5 shadow-xs"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Stage
              </Button>
            )}
          </div>
        </div>

        {/* ── Visual Stage Pipeline Stepper ── */}
        <div className="mt-5 pt-4 border-t border-[var(--border)]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Batch Lifecycle Progression & Schedulers
          </div>

          {loading && schedulers.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-xs text-[var(--text-muted)] gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Loading stage schedulers…
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {schedulers.map((stg, idx) => {
                const isSelected = selectedSchedulerId === stg.scheduler_id;
                const isCurrent = stg.is_current_stage;
                const isCompleted = stg.scheduler_status === "COMPLETED";

                return (
                  <button
                    key={stg.scheduler_id}
                    type="button"
                    onClick={() => setSelectedSchedulerId(stg.scheduler_id)}
                    className={`relative p-3.5 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "border-blue-600 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/20"
                        : "border-[var(--border)] bg-[var(--surface-raised)]/60 hover:bg-[var(--surface-raised)] hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-[var(--text-primary)] line-clamp-1">
                          {stg.stage_name}
                        </span>
                      </div>

                      {isCurrent ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Done
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-2 pt-2 border-t border-[var(--border)]/60">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 opacity-70" />
                        {stg.duration_value} days
                      </span>
                      <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]/50">
                        {stg.total_parameters_count || (stg.lines || []).length} params
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Selected Stage Parameters Inspector ── */}
      {selectedScheduler && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-5">
          {/* Header of the Selected Stage */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg shrink-0 border border-blue-200 dark:border-blue-800">
                📋
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    {selectedScheduler.stage_name}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(
                      selectedScheduler.stage_category
                    )}`}
                  >
                    {selectedScheduler.stage_category}
                  </span>
                  {selectedScheduler.is_current_stage && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                      Active Stage
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Code: <strong className="font-mono">{selectedScheduler.stage_code}</strong> &nbsp;·&nbsp;
                  Duration: <strong>{selectedScheduler.duration_value} days</strong> &nbsp;·&nbsp;
                  Animals: <strong>{selectedScheduler.animal_count} head</strong> &nbsp;·&nbsp;
                  Trigger: <span className="font-mono text-[10px] uppercase">{selectedScheduler.transition_trigger}</span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => openEditModal(selectedScheduler)}
              className="text-xs h-8 px-3.5 gap-1.5 border-[var(--border)] hover:bg-[var(--surface-raised)]"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              Edit Stage Parameters
            </Button>
          </div>

          {/* ── Sub-Category Tabs (Feed, Health, KPIs, Overheads, Labour, Transfers) ── */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[var(--border)] no-scrollbar">
            {[
              { id: "feed", label: "Feed & Nutrition", icon: Wheat, count: selectedScheduler.categorized?.feed?.length || 0 },
              { id: "health", label: "Health & Vaccines", icon: HeartPulse, count: selectedScheduler.categorized?.health?.length || 0 },
              { id: "kpis", label: "Descriptive KPIs", icon: Activity, count: selectedScheduler.categorized?.kpis?.length || 0 },
              { id: "overheads", label: "Overhead & Utilities", icon: Zap, count: selectedScheduler.categorized?.overheads?.length || 0 },
              { id: "resources", label: "Labour & Resources", icon: Users, count: selectedScheduler.categorized?.resources?.length || 0 },
              { id: "transfers", label: "Outputs & Transfers", icon: ArrowRightLeft, count: selectedScheduler.categorized?.transfers?.length || 0 },
            ].map((tab) => {
              const active = activeCategoryTab === tab.id;
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategoryTab(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    active
                      ? "bg-[#1A3A5C] text-white shadow-xs"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                      active ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-800 text-[var(--text-secondary)]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Table Content per Category Tab ── */}

          {/* 1. Feed & Nutrition */}
          {activeCategoryTab === "feed" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Standard nutritional allocation for <strong>{selectedScheduler.animal_count} head</strong></span>
                <span className="font-semibold">Feeding Occurrence: Daily</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2.5">Parameter / Feed Name</th>
                      <th className="px-3 py-2.5">Occurrence</th>
                      <th className="px-3 py-2.5">Standard Qty (Batch)</th>
                      <th className="px-3 py-2.5">UOM</th>
                      <th className="px-3 py-2.5">Lot Required</th>
                      <th className="px-3 py-2.5">Variance Tolerance</th>
                      <th className="px-3 py-2.5">Notes & Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(selectedScheduler.categorized?.feed || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                          No feed parameters configured for this stage.
                        </td>
                      </tr>
                    ) : (
                      (selectedScheduler.categorized?.feed || []).map((line: any) => (
                        <tr key={line.spl_id} className="hover:bg-[var(--surface-raised)]/50">
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                            {line.parameter_name}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                              {line.occurrence}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {line.standard_qty ?? line.expected_qty_override ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">{line.uom}</td>
                          <td className="px-3 py-2.5">
                            {line.lot_required ? (
                              <span className="text-[10px] font-bold text-emerald-600">✓ FIFO Lot</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">
                            ±{line.kpi_max_pct ?? 10}%
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-xs truncate">
                            {line.notes || "Standard daily ration"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Health & Vaccines */}
          {activeCategoryTab === "health" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Vaccination schedule & clinical intervention calendar</span>
                <span className="font-semibold text-blue-600">Custom Days Protocol</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2.5">Protocol / Medication</th>
                      <th className="px-3 py-2.5">Scheduled Day(s)</th>
                      <th className="px-3 py-2.5">Dose Qty</th>
                      <th className="px-3 py-2.5">UOM</th>
                      <th className="px-3 py-2.5">Withdrawal Period</th>
                      <th className="px-3 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(selectedScheduler.categorized?.health || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                          No veterinary protocols scheduled for this stage.
                        </td>
                      </tr>
                    ) : (
                      (selectedScheduler.categorized?.health || []).map((line: any) => (
                        <tr key={line.spl_id} className="hover:bg-[var(--surface-raised)]/50">
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                            {line.parameter_name}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1 flex-wrap">
                              {line.custom_days && line.custom_days.length > 0 ? (
                                line.custom_days.map((cd: any) => (
                                  <span
                                    key={cd.custom_day_id || cd.day_number}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                  >
                                    Day {cd.day_number} ({cd.day_label || "Protocol"})
                                  </span>
                                ))
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  Day {line.start_day || 1}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold">{line.standard_qty ?? line.expected_qty_override ?? "1"}</td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">{line.uom}</td>
                          <td className="px-3 py-2.5">
                            {line.withdrawal_days ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                {line.withdrawal_days} days
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">0 days</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-xs truncate">
                            {line.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Descriptive KPIs */}
          {activeCategoryTab === "kpis" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Descriptive thresholds, checkpoints, body weight & mortality KPIs</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2.5">Metric / Checkpoint</th>
                      <th className="px-3 py-2.5">Frequency</th>
                      <th className="px-3 py-2.5">Standard Target</th>
                      <th className="px-3 py-2.5">UOM</th>
                      <th className="px-3 py-2.5">Critical Threshold</th>
                      <th className="px-3 py-2.5">Mandatory</th>
                      <th className="px-3 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(selectedScheduler.categorized?.kpis || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                          No descriptive KPI parameters configured.
                        </td>
                      </tr>
                    ) : (
                      (selectedScheduler.categorized?.kpis || []).map((line: any) => (
                        <tr key={line.spl_id} className="hover:bg-[var(--surface-raised)]/50">
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                            {line.parameter_name}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {line.occurrence}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                            {line.kpi_target_value ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">{line.uom}</td>
                          <td className="px-3 py-2.5 font-mono text-rose-600 dark:text-rose-400">
                            {line.critical_threshold_pct ? `±${line.critical_threshold_pct}%` : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            {line.is_mandatory ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">YES</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-xs truncate">
                            {line.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Overhead & Utilities */}
          {activeCategoryTab === "overheads" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Facility utilities, ventilation, disinfection and overhead cost allocations</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2.5">Overhead Line</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Occurrence</th>
                      <th className="px-3 py-2.5">Estimated Cost</th>
                      <th className="px-3 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(selectedScheduler.categorized?.overheads || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                          No overhead lines configured.
                        </td>
                      </tr>
                    ) : (
                      (selectedScheduler.categorized?.overheads || []).map((line: any) => (
                        <tr key={line.spl_id} className="hover:bg-[var(--surface-raised)]/50">
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                            {line.parameter_name}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[10px] font-bold text-amber-600">
                            {line.overhead_category || "UTILITIES"}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)]">{line.occurrence}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-[var(--text-primary)]">
                            ${line.estimated_cost ?? 0}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-xs truncate">
                            {line.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. Labour & Resources */}
          {activeCategoryTab === "resources" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Stockman labour, veterinary inspection and attendant care hours</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2.5">Resource Activity</th>
                      <th className="px-3 py-2.5">Occurrence</th>
                      <th className="px-3 py-2.5">Standard Hours</th>
                      <th className="px-3 py-2.5">UOM</th>
                      <th className="px-3 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(selectedScheduler.categorized?.resources || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                          No resource lines configured.
                        </td>
                      </tr>
                    ) : (
                      (selectedScheduler.categorized?.resources || []).map((line: any) => (
                        <tr key={line.spl_id} className="hover:bg-[var(--surface-raised)]/50">
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                            {line.parameter_name}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)]">{line.occurrence}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {line.standard_qty ?? line.expected_qty_override ?? "2.0"}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">{line.uom}</td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-xs truncate">
                            {line.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. Outputs & Transfers */}
          {activeCategoryTab === "transfers" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Output forecasts and automated downstream batch transfer triggers</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)] border-b border-[var(--border)] text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                    <tr>
                      <th className="px-3 py-2.5">Transfer / Output Rule</th>
                      <th className="px-3 py-2.5">Trigger Day</th>
                      <th className="px-3 py-2.5">Auto Triggers Stage</th>
                      <th className="px-3 py-2.5">Capture Weight</th>
                      <th className="px-3 py-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {(selectedScheduler.categorized?.transfers || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-xs text-[var(--text-muted)]">
                          No stage transfer or output rules for this stage.
                        </td>
                      </tr>
                    ) : (
                      (selectedScheduler.categorized?.transfers || []).map((line: any) => (
                        <tr key={line.spl_id} className="hover:bg-[var(--surface-raised)]/50">
                          <td className="px-3 py-2.5 font-semibold text-[var(--text-primary)]">
                            {line.parameter_name}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-bold">Day {line.start_day || 28}</td>
                          <td className="px-3 py-2.5">
                            {line.auto_triggers_stage ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                ✓ Auto Next Stage
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Manual</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-[10px]">
                            {line.capture_transfer_weight ? "✓ Yes (kg)" : "No"}
                          </td>
                          <td className="px-3 py-2.5 text-[var(--text-secondary)] max-w-xs truncate">
                            {line.notes || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Edit Stage Parameters Modal ── */}
      {isEditModalOpen && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Edit Parameters — {editFormData.stage_name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Customize duration, feeding rates, tolerances, and custom vaccination days for this stage scheduler.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--surface-raised)] flex items-center justify-center text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Stage Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={editFormData.duration_value}
                    onChange={(e) => setEditFormData({ ...editFormData, duration_value: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                    Animal Count (Head)
                  </label>
                  <input
                    type="number"
                    value={editFormData.animal_count}
                    onChange={(e) => setEditFormData({ ...editFormData, animal_count: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1">
                  Stage Protocol Notes
                </label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Operational instructions for stockmen during this stage..."
                  className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs resize-none"
                />
              </div>

              <div className="pt-2 border-t border-[var(--border)]">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                  Parameter Lines ({editFormData.lines?.length || 0})
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {editFormData.lines.map((line: any, idx: number) => (
                    <div
                      key={line.spl_id || idx}
                      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)]/50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text-primary)]">
                          {line.parameter_name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--surface)] border text-[var(--text-secondary)]">
                          {line.line_type}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-[var(--text-secondary)]">Standard Qty</label>
                          <input
                            type="number"
                            step="any"
                            value={line.expected_qty_override}
                            onChange={(e) => {
                              const updated = [...editFormData.lines];
                              updated[idx].expected_qty_override = e.target.value;
                              setEditFormData({ ...editFormData, lines: updated });
                            }}
                            className="w-full h-7 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-[var(--text-secondary)]">Tolerance (±%)</label>
                          <input
                            type="number"
                            value={line.kpi_max_pct}
                            onChange={(e) => {
                              const updated = [...editFormData.lines];
                              updated[idx].kpi_max_pct = e.target.value;
                              setEditFormData({ ...editFormData, lines: updated });
                            }}
                            className="w-full h-7 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-[var(--text-secondary)]">Critical Threshold (%)</label>
                          <input
                            type="number"
                            value={line.critical_threshold_pct}
                            onChange={(e) => {
                              const updated = [...editFormData.lines];
                              updated[idx].critical_threshold_pct = e.target.value;
                              setEditFormData({ ...editFormData, lines: updated });
                            }}
                            className="w-full h-7 px-2 rounded border border-[var(--border)] bg-[var(--surface)] text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Custom Days Editor for vaccines/scans */}
                      {line.custom_days && line.custom_days.length > 0 && (
                        <div className="pt-2 border-t border-[var(--border)]/50">
                          <span className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-1">
                            Scheduled Intervention Days:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {line.custom_days.map((cd: any, cidx: number) => (
                              <div
                                key={cidx}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-medium"
                              >
                                <span>Day</span>
                                <input
                                  type="number"
                                  value={cd.day_number}
                                  onChange={(e) => {
                                    const updated = [...editFormData.lines];
                                    updated[idx].custom_days[cidx].day_number = Number(e.target.value);
                                    setEditFormData({ ...editFormData, lines: updated });
                                  }}
                                  className="w-10 h-4 text-center font-bold bg-white rounded border border-amber-400 text-[10px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...editFormData.lines];
                                    updated[idx].custom_days = updated[idx].custom_days.filter((_: any, i: number) => i !== cidx);
                                    setEditFormData({ ...editFormData, lines: updated });
                                  }}
                                  className="text-amber-800 hover:text-rose-600 ml-0.5"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...editFormData.lines];
                                updated[idx].custom_days.push({ day_number: 1, day_label: "Protocol" });
                                setEditFormData({ ...editFormData, lines: updated });
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold border border-dashed border-slate-400 text-slate-600 hover:bg-slate-200"
                            >
                              + Day
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-4 gap-1.5 shadow-xs"
              >
                {savingEdit ? "Saving…" : "Save Parameters"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
