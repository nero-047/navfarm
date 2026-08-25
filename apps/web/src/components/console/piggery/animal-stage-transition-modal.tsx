"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight, Loader2, AlertTriangle,
} from "lucide-react";

import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";

type Row = Record<string, any>;

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

interface AnimalStageTransitionModalProps {
  open: boolean;
  onClose: () => void;
  animal: Row | null;
  onSuccess: () => void;
  stages: Row[];
  locations: Row[];
  batches: Row[];
}

export default function AnimalStageTransitionModal({
  open,
  onClose,
  animal,
  onSuccess,
  stages,
  locations,
  batches,
}: AnimalStageTransitionModalProps) {
  const [toStageId, setToStageId]       = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [toBatchId, setToBatchId]       = useState("");
  const [transitionDate, setTransitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason]             = useState("");
  const [remarks, setRemarks]           = useState("");

  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");

  // When animal opens, auto-suggest next stage — prefer the server-computed
  // suggested_next_stage_id (from stage_master.next_stage_id, resolved by
  // computeStageOverdue() on the API side) and fall back to the client-side lookup.
  useEffect(() => {
    if (!animal || !open) return;
    setError("");
    setTransitionDate(new Date().toISOString().slice(0, 10));
    setToLocationId(animal.current_location_id || "");
    setToBatchId(animal.current_batch_id || "");
    setReason("");
    setRemarks("");

    const currentStage = stages.find((s) => s.stage_id === animal.current_stage_id);
    if (animal.suggested_next_stage_id) {
      setToStageId(animal.suggested_next_stage_id);
    } else if (currentStage?.next_stage_id) {
      setToStageId(currentStage.next_stage_id);
    } else {
      setToStageId("");
    }
  }, [animal, open, stages]);

  if (!animal) return null;

  const currentStage = stages.find((s) => s.stage_id === animal.current_stage_id);
  const entryDate = animal.entry_date ? new Date(animal.entry_date) : new Date(animal.created_at || Date.now());
  const daysInStage = Math.max(0, Math.floor((new Date(transitionDate).getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)));
  const minDays = currentStage?.min_days_before_move || 0;
  const isPrematureMove = minDays > 0 && daysInStage < minDays;

  // Server-computed overdue state (stage_master.typical_duration_days/auto_move_on_day) —
  // "the stage's configured period has elapsed, prompt a transition."
  const isStageOverdue = Boolean(animal.is_stage_overdue);
  const stageDurationDays = animal.stage_duration_days ?? null;
  const serverDaysInStage = animal.days_in_stage ?? daysInStage;

  const handleSubmit = async () => {
    if (!toStageId) {
      setError("Please select a destination stage.");
      return;
    }
    if (isPrematureMove && !reason.trim()) {
      setError(`Minimum duration is ${minDays} days (currently ${daysInStage} days). Please provide a reason to override.`);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.post(`/animal/${animal.animal_id}/transition-stage`, {
        to_stage_id: toStageId,
        to_location_id: toLocationId || undefined,
        to_batch_id: toBatchId || undefined,
        transition_date: transitionDate,
        reason: reason || undefined,
        remarks: remarks || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to record stage transition.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Stage & Pen Transition — ${animal.animal_code}`}
      description="Advance animal to the next production lifecycle stage, reassign pen/location, and track parity."
      maxWidth="md"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !toStageId}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="mr-1.5 h-3.5 w-3.5" />}
            Confirm Stage Transition
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <InlineAlert variant="danger">{error}</InlineAlert>}

        {/* Current State Info */}
        <div className="rounded-[var(--radius-md)] border p-4 space-y-2" style={S.raised}>
          <div className="flex items-center justify-between text-xs">
            <span style={S.muted}>Animal:</span>
            <span className="font-mono font-bold" style={S.primary}>
              {animal.animal_code} ({animal.animal_type} · {animal.breed_name || "Pig"})
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={S.muted}>Current Stage:</span>
            <span className="font-semibold" style={S.primary}>{animal.stage_name || currentStage?.stage_name || "Quarantine"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={S.muted}>Time in Current Stage:</span>
            <span className="font-mono font-semibold" style={isPrematureMove ? S.warning : S.primary}>
              {daysInStage} days {minDays > 0 ? `(Min required: ${minDays}d)` : ""}
            </span>
          </div>
        </div>

        {/* Stage-Duration Overdue Notice — stage_master.typical_duration_days/auto_move_on_day elapsed */}
        {isStageOverdue && !isPrematureMove && (
          <div className="rounded-[var(--radius-md)] border p-3 flex items-start gap-2 text-xs" style={S.warning}>
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Stage Period Elapsed</p>
              <p className="mt-0.5">
                This animal has been in &apos;{currentStage?.stage_name || animal.stage_name}&apos; for {serverDaysInStage} days
                {stageDurationDays != null ? ` (configured duration: ${stageDurationDays}d)` : ""} — consider advancing it to the
                next stage.
              </p>
            </div>
          </div>
        )}

        {/* Premature Move Notice */}
        {isPrematureMove && (
          <div className="rounded-[var(--radius-md)] border p-3 flex items-start gap-2 text-xs" style={S.warning}>
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Premature Stage Transition Warning</p>
              <p className="mt-0.5">
                Stage &apos;{currentStage?.stage_name}&apos; recommends at least {minDays} days before moving. Provide an override reason below.
              </p>
            </div>
          </div>
        )}

        {/* Transition Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="nf-label text-xs">Destination Stage *</label>
            <select
              className="nf-input text-xs"
              value={toStageId}
              onChange={(e) => setToStageId(e.target.value)}
            >
              <option value="">Select destination stage…</option>
              {stages.map((s) => (
                <option key={s.stage_id} value={s.stage_id}>
                  {s.stage_name} ({s.stage_code}) — {s.stage_category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="nf-label text-xs">Destination Pen / Location</label>
              <select
                className="nf-input text-xs"
                value={toLocationId}
                onChange={(e) => setToLocationId(e.target.value)}
              >
                <option value="">Keep current location</option>
                {locations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name} ({loc.location_type || "PEN"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="nf-label text-xs">Destination Batch (Optional)</label>
              <select
                className="nf-input text-xs"
                value={toBatchId}
                onChange={(e) => setToBatchId(e.target.value)}
              >
                <option value="">None / Keep current</option>
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_no} {b.batch_name ? `— ${b.batch_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="nf-label text-xs">Transition Date *</label>
            <input
              type="date"
              className="nf-input text-xs"
              value={transitionDate}
              onChange={(e) => setTransitionDate(e.target.value)}
            />
          </div>

          <div>
            <label className="nf-label text-xs">
              Reason / Trigger Condition {isPrematureMove ? "(Required for override)" : "(Optional)"}
            </label>
            <input
              type="text"
              className="nf-input text-xs"
              placeholder="e.g. PREGNANCY_CONFIRMED, WEANED, VET_DIRECTIVE"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="nf-label text-xs">Remarks / Notes</label>
            <textarea
              className="nf-input text-xs"
              rows={2}
              placeholder="Additional operational observations…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
