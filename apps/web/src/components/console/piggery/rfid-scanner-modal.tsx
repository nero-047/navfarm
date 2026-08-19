"use client";

import { useState, useRef, useEffect } from "react";
import {
  Scan, Search, Loader2, CheckCircle2, Pill, HeartPulse,
  RefreshCw, ShieldAlert,
} from "lucide-react";

import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
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

interface RfidScannerModalProps {
  open: boolean;
  onClose: () => void;
  onAnimalUpdated?: () => void;
  medItems: Row[];
}

export default function RfidScannerModal({
  open,
  onClose,
  onAnimalUpdated,
  medItems,
}: RfidScannerModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [tagInput, setTagInput]     = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [animal, setAnimal]         = useState<Row | null>(null);

  // Quick Action form states
  const [actionTab, setActionTab]   = useState<"none" | "dose" | "status">("none");
  const [savingAction, setSavingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  // Dose form
  const [doseItemId, setDoseItemId] = useState("");
  const [doseQty, setDoseQty]       = useState("");
  const [doseUom, setDoseUom]       = useState("ML");
  const [doseNotes, setDoseNotes]   = useState("");

  // Status form
  const [newStatus, setNewStatus]   = useState("ACTIVE");

  // Auto-focus input when opened or when re-arming scan
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, actionTab]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const tag = tagInput.trim();
    if (!tag) return;

    setLoading(true);
    setError("");
    setActionSuccess("");
    setActionTab("none");
    try {
      const res = await api.get(`/animal/lookup/tag?tag=${encodeURIComponent(tag)}`);
      const matched = unwrap<Row>(res);
      setAnimal(matched);
      setNewStatus(matched.status || "ACTIVE");
    } catch (err: any) {
      setAnimal(null);
      setError(err?.message || `No animal found for tag '${tag}'.`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDose = async () => {
    if (!animal || !doseItemId) return;
    setSavingAction(true);
    setError("");
    try {
      await api.post(`/animal/${animal.animal_id}/medications`, {
        item_id: doseItemId,
        administered_date: new Date().toISOString().slice(0, 10),
        dose_qty: doseQty ? Number(doseQty) : undefined,
        uom: doseUom || undefined,
        notes: doseNotes || "Quick dose via RFID Scanner",
      });
      setActionSuccess(`Dose logged successfully for ${animal.animal_code}.`);
      setActionTab("none");
      setDoseItemId("");
      setDoseQty("");
      setDoseNotes("");
      if (onAnimalUpdated) onAnimalUpdated();
      // Re-query animal to refresh withdrawal warnings
      handleSearch();
    } catch (err: any) {
      setError(err?.message || "Failed to log medication dose.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleQuickStatus = async () => {
    if (!animal) return;
    setSavingAction(true);
    setError("");
    try {
      await api.put(`/animal/${animal.animal_id}`, {
        status: newStatus,
      });
      setActionSuccess(`Status updated to ${newStatus} for ${animal.animal_code}.`);
      setActionTab("none");
      if (onAnimalUpdated) onAnimalUpdated();
      handleSearch();
    } catch (err: any) {
      setError(err?.message || "Failed to update animal status.");
    } finally {
      setSavingAction(false);
    }
  };

  const handleNextScan = () => {
    setTagInput("");
    setAnimal(null);
    setError("");
    setActionSuccess("");
    setActionTab("none");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="RFID & Ear-Tag Fast Scanner"
      description="Scan with an RFID wand or barcode reader (auto-Enter) to instantly inspect and update animals."
      maxWidth="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleNextScan}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Next Scan (Clear)
          </Button>
          <Button variant="ghost" onClick={onClose}>Done / Close</Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ── Scanner Search Bar ── */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Scan className="absolute left-3 top-2.5 h-5 w-5" style={S.accent} />
            <input
              ref={inputRef}
              type="text"
              className="nf-input pl-10 text-base font-mono tracking-wider font-semibold"
              placeholder="Scan RFID wand or enter Visual Ear Tag / Code…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !tagInput.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {error && <InlineAlert variant="danger">{error}</InlineAlert>}
        {actionSuccess && <InlineAlert variant="success">{actionSuccess}</InlineAlert>}

        {/* ── Animal Resolved Profile ── */}
        {animal && (
          <div className="space-y-4 animate-in fade-in-50 duration-200">
            {/* Top Identity Card */}
            <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold font-mono" style={S.primary}>
                      {animal.animal_code}
                    </span>
                    <span
                      className="rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase"
                      style={animal.is_active ? S.success : S.muted}
                    >
                      {animal.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs" style={S.sub}>
                    {animal.animal_type} · {animal.gender === "F" ? "Female" : "Male"} · {animal.breed_name || "Unknown Breed"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>Net Book Value (NBV)</p>
                  <p className="text-lg font-bold font-mono" style={S.primary}>
                    ₹{animal.book_value ? Number(animal.book_value).toLocaleString("en-IN") : animal.acquisition_cost ? Number(animal.acquisition_cost).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
              </div>

              {/* Tag & Stage Details */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 pt-3 border-t">
                <div>
                  <span className="block text-[10px] uppercase font-semibold" style={S.muted}>RFID Tag</span>
                  <span className="font-mono font-medium" style={S.primary}>{animal.rfid_tag || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold" style={S.muted}>Ear Tag</span>
                  <span className="font-mono font-medium" style={S.primary}>{animal.ear_tag || "—"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold" style={S.muted}>Current Stage</span>
                  <span className="font-medium" style={S.primary}>{animal.stage_name || "Quarantine"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-semibold" style={S.muted}>Parity Count</span>
                  <span className="font-medium" style={S.primary}>{animal.parity_count || 0} litters</span>
                </div>
              </div>
            </div>

            {/* Withdrawal Safety Alert Banner */}
            {animal.hasActiveWithdrawal && (
              <div className="rounded-[var(--radius-md)] border p-3.5" style={S.danger}>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">Active Medication Withdrawal Warning</p>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {animal.activeWithdrawals.map((w: Row, i: number) => (
                        <li key={i}>
                          • <span className="font-semibold">{w.item_name}</span>: {w.daysRemaining} day(s) remaining (last given {w.lastDose})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 1-Click Quick Actions Toolbar */}
            <div className="rounded-[var(--radius-lg)] border p-4" style={S.surface}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={S.muted}>
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={actionTab === "dose" ? "default" : "outline"}
                  onClick={() => setActionTab(actionTab === "dose" ? "none" : "dose")}
                >
                  <Pill className="mr-1.5 h-3.5 w-3.5" /> Log Dose
                </Button>
                <Button
                  size="sm"
                  variant={actionTab === "status" ? "default" : "outline"}
                  onClick={() => setActionTab(actionTab === "status" ? "none" : "status")}
                >
                  <HeartPulse className="mr-1.5 h-3.5 w-3.5" /> Change Health Status
                </Button>
              </div>

              {/* ── Quick Dose Form ── */}
              {actionTab === "dose" && (
                <div className="mt-4 rounded-[var(--radius-md)] border p-4 space-y-3" style={S.raised}>
                  <h4 className="text-xs font-semibold" style={S.primary}>Record Medication / Vaccine Dose</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <label className="nf-label text-xs">Medicine / Vaccine</label>
                      <select
                        className="nf-input text-xs"
                        value={doseItemId}
                        onChange={(e) => setDoseItemId(e.target.value)}
                      >
                        <option value="">Select medicine…</option>
                        {medItems.map((m) => (
                          <option key={m.item_id} value={m.item_id}>
                            {m.item_name} ({m.item_type}) {m.withdrawal_days ? `— ${m.withdrawal_days}d withdrawal` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="nf-label text-xs">Dose Qty</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.01"
                          className="nf-input text-xs"
                          placeholder="e.g. 5"
                          value={doseQty}
                          onChange={(e) => setDoseQty(e.target.value)}
                        />
                        <select
                          className="nf-input text-xs w-20"
                          value={doseUom}
                          onChange={(e) => setDoseUom(e.target.value)}
                        >
                          <option value="ML">ML</option>
                          <option value="DOSE">DOSE</option>
                          <option value="MG">MG</option>
                          <option value="GM">GM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setActionTab("none")}>Cancel</Button>
                    <Button size="sm" onClick={handleQuickDose} disabled={savingAction || !doseItemId}>
                      {savingAction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      Save Dose
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Quick Health Status Form ── */}
              {actionTab === "status" && (
                <div className="mt-4 rounded-[var(--radius-md)] border p-4 space-y-3" style={S.raised}>
                  <h4 className="text-xs font-semibold" style={S.primary}>Update Health / Reproductive Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {["ACTIVE", "SICK", "QUARANTINE", "PREGNANT", "LACTATING", "DRY"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewStatus(st)}
                        className="rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-all"
                        style={newStatus === st ? S.accent : S.surface}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setActionTab("none")}>Cancel</Button>
                    <Button size="sm" onClick={handleQuickStatus} disabled={savingAction}>
                      {savingAction ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                      Save Status
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
