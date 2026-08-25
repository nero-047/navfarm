"use client";

import React, { useState, useMemo } from "react";
import { Download, AlertTriangle, AlertCircle, CheckCircle2, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";

interface BatchMortalityTabProps {
  batch: any;
  onRefreshBatch?: () => Promise<void>;
}

export function BatchMortalityTab({ batch, onRefreshBatch }: BatchMortalityTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Form state
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formCount, setFormCount] = useState<string>("1");
  const [formReason, setFormReason] = useState<string>("Weak / Poor body condition");
  const [formRemarks, setFormRemarks] = useState<string>("");

  const openingQty = Math.round(Number(batch?.opening_quantity || 30));
  const txs = useMemo(() => batch?.transactions || [], [batch?.transactions]);

  const mortTxs = useMemo(() => {
    return txs.filter((t: any) => t.transaction_type === "MORTALITY");
  }, [txs]);

  const totalDeaths = useMemo(() => {
    return mortTxs.reduce((sum: number, t: any) => sum + Math.abs(Number(t.quantity || 0)), 0);
  }, [mortTxs]);

  const currentQty = Math.max(0, openingQty - totalDeaths);
  const mortalityPct = openingQty > 0 ? ((totalDeaths / openingQty) * 100).toFixed(2) : "0.00";
  const startDate = batch?.start_date ? new Date(batch.start_date) : new Date();

  // Dynamic Mortality by Reason map
  const reasonBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of mortTxs) {
      let reason = "Weakness / Poor condition";
      if (t.remarks) {
        const parts = t.remarks.split(" - ");
        reason = parts[0]?.replace(/^Reason:\s*/i, "").trim() || reason;
      }
      const count = Math.abs(Number(t.quantity || 1));
      map.set(reason, (map.get(reason) || 0) + count);
    }
    return map;
  }, [mortTxs]);

  const mortalityLogs = useMemo(() => {
    return mortTxs.map((t: any) => {
      const d = (t.transaction_date || t.created_at || "").slice(0, 10);
      const entryDate = new Date(d);
      const dayNum = Math.max(1, Math.floor((entryDate.getTime() - startDate.getTime()) / 86400000) + 1);
      let reason = "Weakness / Poor condition";
      let remarks = t.remarks || "Recorded in daily operations";

      if (t.remarks) {
        const parts = t.remarks.split(" - ");
        reason = parts[0]?.replace(/^Reason:\s*/i, "").trim() || reason;
        if (parts.length > 1) remarks = parts.slice(1).join(" - ");
      }

      return {
        date: d,
        day: `Day ${dayNum}`,
        reason,
        count: Math.abs(Number(t.quantity || 1)),
        remarks,
        recorded_by: "Farm Attendant",
      };
    });
  }, [mortTxs, startDate]);

  const stageName = batch?.current_stage_code
    ? batch.current_stage_code.replace(/_/g, " ")
    : batch?.stage_name || batch?.stage || "ACTIVE";

  // Handle Log Mortality Event Submit
  const handleRecordSubmit = async () => {
    const count = parseInt(formCount, 10);
    if (isNaN(count) || count <= 0) {
      setFormError("Please enter a valid head count.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const remarks = `Reason: ${formReason}${formRemarks ? ` - ${formRemarks}` : ""}`;
      await api.post(`/batch/${batch.batch_id}/transaction`, {
        transaction_date: formDate,
        transaction_type: "MORTALITY",
        quantity: count,
        uom: "HEAD",
        remarks,
      });

      setNotification(`✓ Logged ${count} mortality events for ${formDate}!`);
      setModalOpen(false);
      if (onRefreshBatch) await onRefreshBatch();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setFormError(err?.message || "Failed to log mortality event.");
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExport = () => {
    const headers = "Date,Day,Reason,Count,Remarks,Recorded By\n";
    const rows = mortalityLogs
      .map((r: any) => `"${r.date}","${r.day}","${r.reason}",${r.count},"${r.remarks}","${r.recorded_by}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Batch_Mortality_${batch.batch_no}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 p-3.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 shadow-md">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Mortality View ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Mortality & Cull Audit Log — {stageName}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Permanent herd relief records audited against biological inventory
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport} className="text-xs h-8 px-3 gap-1.5 font-bold">
                  <Download className="w-3.5 h-3.5" /> Export Log
                </Button>
                <Button
                  onClick={() => { setFormError(""); setModalOpen(true); }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Mortality
                </Button>
              </div>
            </div>

            {/* Top KPI Cards Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/10">
              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Total Deaths
                </div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {totalDeaths} <span className="text-xs font-semibold">head</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Recorded to date</div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Mortality Rate
                </div>
                <div className="text-2xl font-black text-[var(--text-primary)] font-mono">
                  {mortalityPct}%
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
                  Target threshold &lt; 3.0%
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                <div className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  Current Herd Size
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {currentQty} <span className="text-xs font-semibold">head</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">From {openingQty} opening</div>
              </div>
            </div>

            {/* Table */}
            {mortalityLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
                <p className="font-bold text-[var(--text-primary)]">Zero Mortality Logged</p>
                <p>Excellent herd health! No deaths or cull reliefs recorded for this batch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-3.5 py-3">Lifecycle Day</th>
                      <th className="px-3.5 py-3">Primary Cause / Reason</th>
                      <th className="px-3.5 py-3 text-right">Headcount</th>
                      <th className="px-4 py-3">Clinical & Autopsy Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {mortalityLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[var(--surface-raised)]/30 transition">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                          {log.date}
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[var(--text-secondary)]">{log.day}</td>
                        <td className="px-3.5 py-3 font-bold text-rose-600 dark:text-rose-400">
                          {log.reason}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-black text-rose-600">
                          {log.count} head
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{log.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
              <span>Showing {mortalityLogs.length} logged incidents</span>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Summary ── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Cause Breakdown
              </h3>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              {reasonBreakdown.size === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">No mortality events recorded</div>
              ) : (
                Array.from(reasonBreakdown.entries()).map(([reason, count]) => {
                  const pct = totalDeaths > 0 ? ((count / totalDeaths) * 100).toFixed(0) : "0";
                  return (
                    <div key={reason} className="p-3.5 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-[var(--text-primary)]">{reason}</span>
                        <span className="font-mono text-rose-600">{count} head ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--surface-raised)] overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-950 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Mortality Alert Protocol</span>
            </div>
            <p className="text-rose-800 dark:text-rose-300 text-[11px] leading-relaxed">
              If daily mortality exceeds 2.5% in a single day, an automatic KPI threshold alert is sent to the supervising veterinarian.
            </p>
          </div>
        </div>
      </div>

      {/* ── Log Mortality Event Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Log Mortality Event</h3>
                <p className="text-xs text-[var(--text-secondary)]">Record herd mortality relief for {batch.batch_no}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="rounded-lg border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Head Count *</label>
                  <input
                    type="number"
                    min="1"
                    value={formCount}
                    onChange={(e) => setFormCount(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Primary Cause / Reason *</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                >
                  <option value="Weak / Poor body condition">Weakness / Poor Condition</option>
                  <option value="Crushed / Overlay">Crushed / Splay Leg</option>
                  <option value="Respiratory / Cough">Respiratory / Pneumonia</option>
                  <option value="Gastrointestinal / Scours">Scours / Gastrointestinal</option>
                  <option value="Cull / Market Ineligible">Cull / Ineligible for Market</option>
                  <option value="Cardiac / Sudden Death">Cardiac / Sudden Death</option>
                  <option value="Unknown Cause">Unknown Cause</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Autopsy / Post-Mortem Notes</label>
                <textarea
                  rows={3}
                  placeholder="Attending vet post-mortem remarks..."
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full p-2.5 text-xs text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl resize-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                onClick={handleRecordSubmit}
                disabled={submitting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 font-black gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Record Mortality
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
