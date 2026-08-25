"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Plus, X, Loader2, GitMerge, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/ui/alert";
import { api } from "@/services/api-client";

interface BatchLocationsTabProps {
  batch: any;
  onRefreshBatch?: () => Promise<void>;
}

interface SplitRow {
  location_id: string;
  quantity: string;
  stage_id: string;
  remarks: string;
}

const emptyRow = (): SplitRow => ({ location_id: "", quantity: "", stage_id: "", remarks: "" });

export function BatchLocationsTab({ batch, onRefreshBatch }: BatchLocationsTabProps) {
  const [locations, setLocations] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitRows, setSplitRows] = useState<SplitRow[]>([emptyRow()]);
  const [submittingSplit, setSubmittingSplit] = useState(false);
  const [splitError, setSplitError] = useState("");

  const [mergeMode, setMergeMode] = useState(false);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [submittingMerge, setSubmittingMerge] = useState(false);

  const [closingLotId, setClosingLotId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; variant: "success" | "danger" } | null>(null);

  const lots = useMemo(() => batch?.lots || [], [batch?.lots]);
  const activeLots = useMemo(() => lots.filter((l: any) => l.status === "ACTIVE"), [lots]);
  const totalHeadcount = Number(batch?.current_headcount ?? batch?.opening_quantity ?? 0);
  const lottedHeadcount = activeLots.reduce((sum: number, l: any) => sum + Number(l.current_quantity || 0), 0);
  // Unassigned = never split into any lot yet — a lot's opening_quantity permanently
  // leaves this pool the moment it's created, whatever status that lot is in now (a
  // MERGED lot's headcount lives on in its target; a CLOSED lot's headcount is done).
  // Matches batch.service.ts's getBatchHeadcount() exactly, so "Unassigned" here and
  // "Batch total" above always reconcile instead of double-counting or dropping head.
  const everLottedOpening = lots.reduce((sum: number, l: any) => sum + Number(l.opening_quantity || 0), 0);
  const unlottedHeadcount = Math.max(0, Number(batch?.opening_quantity ?? 0) - everLottedOpening);

  useEffect(() => {
    let cancelled = false;
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [locRes, stageRes] = await Promise.all([
          api.get(`/location?companyId=${batch?.company_id || ""}`).catch(() => null),
          api.get(`/stage?lobId=${batch?.lob_id || ""}`).catch(() => null),
        ]);
        if (cancelled) return;
        setLocations(locRes?.data ?? locRes ?? []);
        setStages(stageRes?.data ?? stageRes ?? []);
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    };
    if (batch?.company_id) loadOptions();
    return () => {
      cancelled = true;
    };
  }, [batch?.company_id, batch?.lob_id]);

  const locationName = (id: string) => locations.find((l: any) => l.location_id === id)?.location_name || id?.slice(0, 8) || "—";
  const stageName = (id?: string | null) => (id ? stages.find((s: any) => s.stage_id === id)?.stage_name || id.slice(0, 8) : "—");

  const openSplitModal = () => {
    setSplitRows([emptyRow()]);
    setSplitError("");
    setSplitModalOpen(true);
  };

  const updateRow = (idx: number, patch: Partial<SplitRow>) => {
    setSplitRows((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const submitSplit = async () => {
    const parsed = splitRows
      .filter((r) => r.location_id && r.quantity)
      .map((r) => ({
        location_id: r.location_id,
        quantity: Number(r.quantity),
        stage_id: r.stage_id || undefined,
        remarks: r.remarks || undefined,
      }));
    if (parsed.length === 0) {
      setSplitError("Add at least one location with a headcount.");
      return;
    }
    const requestedTotal = parsed.reduce((sum, r) => sum + r.quantity, 0);
    if (requestedTotal > unlottedHeadcount + 0.001) {
      setSplitError(`Requested total (${requestedTotal}) exceeds unassigned headcount (${unlottedHeadcount}).`);
      return;
    }

    setSubmittingSplit(true);
    setSplitError("");
    try {
      await api.post(`/batch/${batch.batch_id}/lots/split`, { lots: parsed });
      setSplitModalOpen(false);
      setNotification({ text: `Batch split across ${parsed.length} location${parsed.length > 1 ? "s" : ""}.`, variant: "success" });
      await onRefreshBatch?.();
    } catch (err: any) {
      setSplitError(err?.message || "Failed to split batch into location lots.");
    } finally {
      setSubmittingSplit(false);
    }
  };

  const toggleSelectLot = (lotId: string) => {
    setSelectedLotIds((ids) => (ids.includes(lotId) ? ids.filter((id) => id !== lotId) : [...ids, lotId]));
  };

  const submitMerge = async () => {
    if (!mergeTargetId || selectedLotIds.length < 2) return;
    setSubmittingMerge(true);
    try {
      await api.post(`/batch/${batch.batch_id}/lots/merge`, {
        source_lot_ids: selectedLotIds.filter((id) => id !== mergeTargetId),
        target_lot_id: mergeTargetId,
      });
      setNotification({ text: "Location lots merged successfully.", variant: "success" });
      setMergeMode(false);
      setSelectedLotIds([]);
      setMergeTargetId("");
      await onRefreshBatch?.();
    } catch (err: any) {
      setNotification({ text: err?.message || "Failed to merge lots.", variant: "danger" });
    } finally {
      setSubmittingMerge(false);
    }
  };

  const closeLot = async (lotId: string) => {
    setClosingLotId(lotId);
    try {
      await api.post(`/batch/${batch.batch_id}/lots/${lotId}/close`, {});
      setNotification({ text: "Lot closed.", variant: "success" });
      await onRefreshBatch?.();
    } catch (err: any) {
      setNotification({ text: err?.message || "Failed to close lot.", variant: "danger" });
    } finally {
      setClosingLotId(null);
    }
  };

  return (
    <div className="space-y-5">
      {notification && (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <InlineAlert variant={notification.variant}>{notification.text}</InlineAlert>
          </div>
          <button
            onClick={() => setNotification(null)}
            aria-label="Dismiss"
            className="mt-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Location Lots
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">
              One batch, physically split across sheds/pens — headcount and stage tracked per location, costing stays batch-wide.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            {activeLots.length >= 2 && (
              <Button
                variant={mergeMode ? "default" : "outline"}
                className="text-xs h-8 px-3 gap-1.5 font-bold"
                onClick={() => {
                  setMergeMode((m) => !m);
                  setSelectedLotIds([]);
                  setMergeTargetId("");
                }}
              >
                <GitMerge className="w-3.5 h-3.5" /> {mergeMode ? "Cancel Merge" : "Merge Lots"}
              </Button>
            )}
            {unlottedHeadcount > 0 && (
              <Button onClick={openSplitModal} className="bg-[#1A3A5C] text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs">
                <Plus className="w-3.5 h-3.5" /> Split Into Lots
              </Button>
            )}
          </div>
        </div>

        {mergeMode && (
          <div className="p-3.5 border-b border-[var(--border)] bg-indigo-50/60 dark:bg-indigo-950/30 text-xs flex flex-wrap items-center gap-3">
            <span className="text-[var(--text-secondary)]">
              Select 2+ lots, then choose the surviving lot ({selectedLotIds.length} selected):
            </span>
            <select
              className="nf-input text-xs w-auto min-w-[180px]"
              value={mergeTargetId}
              onChange={(e) => setMergeTargetId(e.target.value)}
              disabled={selectedLotIds.length < 2}
            >
              <option value="">Select target lot…</option>
              {selectedLotIds.map((id) => {
                const lot = activeLots.find((l: any) => l.lot_id === id);
                return (
                  <option key={id} value={id}>
                    {lot?.lot_no} — {locationName(lot?.location_id)}
                  </option>
                );
              })}
            </select>
            <Button
              className="h-7 px-3 text-xs font-bold"
              disabled={selectedLotIds.length < 2 || !mergeTargetId || submittingMerge}
              onClick={submitMerge}
            >
              {submittingMerge ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
              Confirm Merge
            </Button>
          </div>
        )}

        {lots.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-xl mx-auto text-[var(--text-muted)]">
              <MapPin className="w-5 h-5 text-indigo-500" />
            </div>
            <h4 className="text-xs font-black text-[var(--text-primary)]">Batch Is In One Location</h4>
            <p className="text-[11px] text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
              This batch's full headcount ({Math.round(totalHeadcount)} head) is tracked as a single unit. Split it into
              location lots if it's physically spread across multiple sheds or pens.
            </p>
            <Button onClick={openSplitModal} variant="outline" className="text-xs h-8 px-3 gap-1.5 font-bold">
              <Plus className="w-3.5 h-3.5" /> Split Into Lots
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[750px]">
              <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                <tr>
                  {mergeMode && <th className="px-3 py-3 w-8"></th>}
                  <th className="px-3.5 py-3">Lot No.</th>
                  <th className="px-3.5 py-3">Location</th>
                  <th className="px-3.5 py-3">Stage</th>
                  <th className="px-3.5 py-3 text-right">Headcount</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3">Days in Stage</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {lots.map((lot: any) => (
                  <tr key={lot.lot_id} className="hover:bg-[var(--surface-raised)]/30 transition">
                    {mergeMode && (
                      <td className="px-3 py-3">
                        {lot.status === "ACTIVE" && (
                          <input
                            type="checkbox"
                            checked={selectedLotIds.includes(lot.lot_id)}
                            onChange={() => toggleSelectLot(lot.lot_id)}
                          />
                        )}
                      </td>
                    )}
                    <td className="px-3.5 py-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">{lot.lot_no}</td>
                    <td className="px-3.5 py-3 text-[var(--text-primary)]">{locationName(lot.location_id)}</td>
                    <td className="px-3.5 py-3 text-[var(--text-secondary)]">{stageName(lot.stage_id)}</td>
                    <td className="px-3.5 py-3 text-right font-mono font-black text-[var(--text-primary)]">
                      {Math.round(Number(lot.current_quantity || 0))} head
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          lot.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : lot.status === "MERGED"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {lot.status}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      {lot.days_in_stage != null ? (
                        <span
                          className={`flex items-center gap-1 font-mono font-semibold ${
                            lot.is_stage_overdue ? "text-amber-600" : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {lot.is_stage_overdue && <AlertTriangle className="w-3 h-3" />}
                          {lot.days_in_stage}d{lot.stage_duration_days != null ? ` / ${lot.stage_duration_days}d` : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-right">
                      {lot.status === "ACTIVE" && !mergeMode && (
                        <button
                          onClick={() => closeLot(lot.lot_id)}
                          disabled={closingLotId === lot.lot_id}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                        >
                          {closingLotId === lot.lot_id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)] font-medium">
          <span>{activeLots.length} active location lot{activeLots.length === 1 ? "" : "s"}</span>
          <span>
            Lotted: <strong className="text-[var(--text-primary)]">{Math.round(lottedHeadcount)}</strong> · Unassigned:{" "}
            <strong className="text-[var(--text-primary)]">{Math.round(unlottedHeadcount)}</strong> · Batch total:{" "}
            <strong className="text-[var(--text-primary)]">{Math.round(totalHeadcount)}</strong>
          </span>
        </div>
      </div>

      <Dialog
        open={splitModalOpen}
        onClose={() => setSplitModalOpen(false)}
        title="Split Batch Into Location Lots"
        description={`Distribute up to ${Math.round(unlottedHeadcount)} unassigned head across one or more locations.`}
        maxWidth="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => setSplitRows((rows) => [...rows, emptyRow()])} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Location
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setSplitModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitSplit} disabled={submittingSplit}>
                {submittingSplit ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                Create Lots
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {splitError && <InlineAlert variant="danger">{splitError}</InlineAlert>}
          {loadingOptions && <p className="text-xs text-[var(--text-muted)]">Loading locations…</p>}

          {splitRows.map((row, idx) => (
            <div key={idx} className="rounded-[var(--radius-md)] border border-[var(--border)] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">Lot {idx + 1}</span>
                {splitRows.length > 1 && (
                  <button onClick={() => setSplitRows((rows) => rows.filter((_, i) => i !== idx))} aria-label="Remove lot">
                    <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="nf-label text-xs">Location *</label>
                  <select
                    className="nf-input text-xs"
                    value={row.location_id}
                    onChange={(e) => updateRow(idx, { location_id: e.target.value })}
                  >
                    <option value="">Select location…</option>
                    {locations.map((loc: any) => (
                      <option key={loc.location_id} value={loc.location_id}>
                        {loc.location_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="nf-label text-xs">Headcount *</label>
                  <input
                    type="number"
                    min={1}
                    className="nf-input text-xs"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, { quantity: e.target.value })}
                    placeholder="e.g. 420"
                  />
                </div>
                <div>
                  <label className="nf-label text-xs">Initial Stage</label>
                  <select
                    className="nf-input text-xs"
                    value={row.stage_id}
                    onChange={(e) => updateRow(idx, { stage_id: e.target.value })}
                  >
                    <option value="">Batch's current stage</option>
                    {stages.map((s: any) => (
                      <option key={s.stage_id} value={s.stage_id}>
                        {s.stage_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="nf-label text-xs">Remarks</label>
                <input
                  type="text"
                  className="nf-input text-xs"
                  value={row.remarks}
                  onChange={(e) => updateRow(idx, { remarks: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
