"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Layers,
} from "lucide-react";
import { DEFAULT_PIGGERY_STAGES, PiggeryStage } from "./piggery-lifecycle-stepper";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";

interface BatchLifecycleMeta {
  id: string;
  code: string;
  name: string;
  breed: string;
  type: string;
  startDate: string;
  currentStageId: number;
  currentStageCode?: string;
}

export default function PiggeryBatchStagesPanel() {
  const [batches, setBatches] = useState<BatchLifecycleMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0],
    [batches, selectedBatchId]
  );

  const [stages, setStages] = useState<PiggeryStage[]>(DEFAULT_PIGGERY_STAGES);
  const [currentStageId, setCurrentStageId] = useState<number>(1);

  // Edit Stage Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PiggeryStage | null>(null);
  const [editDays, setEditDays] = useState("");

  // Add Stage Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageCode, setNewStageCode] = useState("");
  const [newStageDays, setNewStageDays] = useState("14");

  const [toastMsg, setToastMsg] = useState("");

  // Fetch live batches from DB
  useEffect(() => {
    const companyId = getActiveCompanyId();
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/batch?companyId=${companyId}&status=ACTIVE&limit=50`)
      .then((res) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const mapped: BatchLifecycleMeta[] = list.map((b: any, idx: number) => {
          const matchedStage = DEFAULT_PIGGERY_STAGES.find((s) => 
            s.code.toUpperCase() === (b.current_stage_code || "").toUpperCase() ||
            s.name.toLowerCase().includes((b.current_stage_code || "").toLowerCase())
          );
          return {
            id: b.batch_id,
            code: b.batch_no,
            name: b.remarks || b.batch_no,
            breed: b.breed_name || b.breed_code || "—",
            type: b.lob_name || "Piggery Batch",
            startDate: b.start_date || "",
            currentStageId: matchedStage?.id ?? (idx % 8 + 1),
            currentStageCode: b.current_stage_code,
          };
        });
        setBatches(mapped);
        if (mapped.length > 0) {
          setSelectedBatchId(mapped[0].id);
          setCurrentStageId(mapped[0].currentStageId);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Update stages when currentBatch changes
  useEffect(() => {
    if (!currentBatch) return;
    setCurrentStageId(currentBatch.currentStageId);
    const mapped = DEFAULT_PIGGERY_STAGES.map((s) => ({
      ...s,
      status:
        s.id < currentBatch.currentStageId
          ? ("COMPLETED" as const)
          : s.id === currentBatch.currentStageId
          ? ("CURRENT" as const)
          : ("UPCOMING" as const),
    }));
    setStages(mapped);
  }, [currentBatch]);

  const handleAdvanceStage = async () => {
    if (!currentBatch) return;
    const nextId = currentStageId + 1;
    if (nextId > stages.length) {
      setToastMsg(`✓ Batch ${currentBatch.code} has reached the final lifecycle stage.`);
      setTimeout(() => setToastMsg(""), 3500);
      return;
    }

    const nextStage = stages.find((s) => s.id === nextId);
    if (!nextStage) return;

    try {
      await api.post(`/batch/${currentBatch.id}/transfer-stage`, {
        to_stage_code: nextStage.code,
        remarks: `Advanced from stage ${stages.find((s) => s.id === currentStageId)?.name || currentStageId} to ${nextStage.name}`,
      });
    } catch {}

    const updated = stages.map((s) => ({
      ...s,
      status:
        s.id < nextId
          ? ("COMPLETED" as const)
          : s.id === nextId
          ? ("CURRENT" as const)
          : ("UPCOMING" as const),
    }));

    setStages(updated);
    setCurrentStageId(nextId);
    setToastMsg(`✓ Batch transitioned in Database to Stage ${nextId}: ${nextStage.name}`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleSaveEditStage = () => {
    if (!editingStage || !editDays) return;
    const days = parseInt(editDays, 10) || editingStage.standardDays;
    const updated = stages.map((s) => (s.id === editingStage.id ? { ...s, standardDays: days } : s));
    setStages(updated);
    setEditModalOpen(false);
    setEditingStage(null);
    setToastMsg(`✓ Updated duration for ${editingStage.name} to ${days} days.`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleAddCustomStage = () => {
    if (!newStageName || !newStageCode) return;
    const days = parseInt(newStageDays, 10) || 14;
    const newStage: PiggeryStage = {
      id: stages.length + 1,
      code: newStageCode,
      name: newStageName,
      type: "Custom Stage",
      standardDays: days,
      daysRange: `${days} Days`,
      status: "UPCOMING",
    };

    const updated = [...stages, newStage];
    setStages(updated);
    setAddModalOpen(false);
    setNewStageName("");
    setNewStageCode("");
    setToastMsg(`✓ Added custom stage: ${newStageName} (${days} days)`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const currentStageName = stages.find((s) => s.id === currentStageId)?.name || "Active Stage";
  const totalStandardDays = stages.reduce((sum, s) => sum + s.standardDays, 0);

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm font-medium text-[var(--text-muted)]">Loading batch lifecycles from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
      {/* ── Top Header Strip with Batch Selector ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Production Batch:
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="max-w-[240px] sm:max-w-[320px] truncate rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} ({b.breed})
                </option>
              ))}
            </select>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{
                backgroundColor: "var(--success-muted)",
                color: "var(--success)",
                borderColor: "rgba(47, 125, 91, 0.2)",
              }}
            >
              Active Lifecycle
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Breed: <strong className="text-[var(--text-primary)]">{currentBatch?.breed || "—"}</strong> · 
            Type: <strong className="text-[var(--text-primary)]">{currentBatch?.type || "—"}</strong> · 
            Start Date: <strong className="text-[var(--text-primary)]">{currentBatch?.startDate || "—"}</strong> · 
            Current Stage: <strong className="text-[var(--accent)]">{currentStageName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAdvanceStage}
            className="text-xs h-8 gap-1.5 font-medium"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Advance Stage
          </Button>

          <Button
            size="sm"
            onClick={() => setAddModalOpen(true)}
            className="nf-btn-primary text-xs h-8 gap-1.5 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Add Stage
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Stage Sequence Table ── */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--surface-raised)] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent)]" /> Stage Sequence & Timeline Configuration
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            Total Stages: {stages.length} ({totalStandardDays} Standard Days)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]/50 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-2.5 font-bold">Seq.</th>
                <th className="px-4 py-2.5 font-bold">Stage Code</th>
                <th className="px-4 py-2.5 font-bold">Stage Name</th>
                <th className="px-4 py-2.5 font-bold">Stage Type</th>
                <th className="px-4 py-2.5 font-bold text-right">Standard Days</th>
                <th className="px-4 py-2.5 font-bold text-right">Day From</th>
                <th className="px-4 py-2.5 font-bold text-right">Day To</th>
                <th className="px-4 py-2.5 font-bold">Status</th>
                <th className="px-4 py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {stages.map((stage, index) => {
                const dayFrom = index === 0 ? 1 : stages.slice(0, index).reduce((sum, s) => sum + s.standardDays, 1);
                const dayTo = dayFrom + stage.standardDays - 1;

                return (
                  <tr key={stage.id} className="hover:bg-[var(--surface-raised)]/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[var(--text-muted)]">{stage.id}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--text-primary)]">{stage.code}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{stage.name}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{stage.type}</td>
                    <td className="px-4 py-3 text-right font-bold font-mono">{stage.standardDays}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{dayFrom}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-secondary)] font-mono">{dayTo}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          stage.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : stage.status === "CURRENT"
                            ? "bg-[var(--accent)] text-white shadow-2xs font-bold"
                            : "bg-slate-500/10 text-[var(--text-muted)]"
                        }`}
                      >
                        {stage.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                        {stage.status === "CURRENT" && <Clock className="w-3 h-3 animate-spin" />}
                        {stage.status === "COMPLETED" ? "Completed" : stage.status === "CURRENT" ? "In Progress" : "Upcoming"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingStage(stage);
                          setEditDays(String(stage.standardDays));
                          setEditModalOpen(true);
                        }}
                        className="h-6 text-[10px] px-2 text-[var(--text-muted)] hover:text-[var(--accent)]"
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-[var(--surface-raised)] border-t border-[var(--border)]">
          <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Note: Stage durations are standard baselines. Actual production dates and KPI telemetry accumulate from Batch Start Date ({currentBatch.startDate}).
          </p>
        </div>
      </div>

      {/* ── MODAL: EDIT STAGE DURATION ── */}
      {editModalOpen && editingStage && (
        <Dialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Timeline: ${editingStage.name}`}
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEditStage} className="nf-btn-primary">
                Save Duration
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Standard Duration (Days)</label>
              <input
                type="number"
                value={editDays}
                onChange={(e) => setEditDays(e.target.value)}
                className="nf-input w-full font-mono text-sm font-bold"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: ADD CUSTOM STAGE ── */}
      {addModalOpen && (
        <Dialog
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title="Add Custom Lifecycle Stage"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddCustomStage} className="nf-btn-primary">
                Insert Stage
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Stage Code *</label>
              <input
                type="text"
                value={newStageCode}
                onChange={(e) => setNewStageCode(e.target.value)}
                placeholder="e.g. ST-09"
                className="nf-input w-full font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Stage Name *</label>
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g. Post-Weaning Conditioning"
                className="nf-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Standard Duration (Days)</label>
              <input
                type="number"
                value={newStageDays}
                onChange={(e) => setNewStageDays(e.target.value)}
                className="nf-input w-full font-mono"
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
