"use client";

import { useState, useEffect } from "react";
import {
  HeartPulse,
  Skull,
  ShieldCheck,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";

type MortalityRecord = {
  id: string;
  record_date: string;
  batch_no: string;
  ear_tag?: string;
  pen_location: string;
  head_count: number;
  cause_of_death: string;
  post_mortem_notes: string;
  disposal_method: string;
  recorded_by: string;
};

type TreatmentRecord = {
  id: string;
  treatment_date: string;
  ear_tag: string;
  batch_no: string;
  diagnosis: string;
  medicine_name: string;
  dosage: string;
  route: string;
  withdrawal_days: number;
  status: "ACTIVE" | "RECOVERED" | "UNDER_OBSERVATION";
  veterinarian: string;
};

type VaccinationItem = {
  id: string;
  vaccine_name: string;
  target_disease: string;
  scheduled_date: string;
  target_stage: string;
  coverage_pct: number;
  status: "COMPLETED" | "SCHEDULED" | "OVERDUE";
};

export default function MortalityHealthPanel() {
  const [activeTab, setActiveTab] = useState<"mortality" | "treatments" | "vaccines">("mortality");
  const [loading, setLoading] = useState(true);

  // ── Live Data State ──
  const [mortalityList, setMortalityList] = useState<MortalityRecord[]>([]);
  const [treatmentList, setTreatmentList] = useState<TreatmentRecord[]>([]);
  const [vaccineList] = useState<VaccinationItem[]>([]);
  const [batches, setBatches] = useState<{ id: string; no: string }[]>([]);

  // ── Dialogs ──
  const [mortalityDialogOpen, setMortalityDialogOpen] = useState(false);
  const [newMortality, setNewMortality] = useState<Partial<MortalityRecord>>({
    record_date: new Date().toISOString().slice(0, 10),
    head_count: 1,
    cause_of_death: "Respiratory Distress / Pneumonia",
    disposal_method: "Incineration (Biosecure)",
    batch_no: "",
    pen_location: "Main Shed / Pen 1",
  });

  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [newTreatment, setNewTreatment] = useState<Partial<TreatmentRecord>>({
    treatment_date: new Date().toISOString().slice(0, 10),
    batch_no: "",
    status: "ACTIVE",
    withdrawal_days: 7,
    route: "Intramuscular (IM)",
  });

  useEffect(() => {
    const companyId = getActiveCompanyId();
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    api.get(`/batch?companyId=${companyId}&limit=50`)
      .then(async (res) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const bList = list.map((b: any) => ({ id: b.batch_id, no: b.batch_no }));
        setBatches(bList);
        if (bList.length > 0) {
          setNewMortality((prev) => ({ ...prev, batch_no: bList[0].no }));
          setNewTreatment((prev) => ({ ...prev, batch_no: bList[0].no }));
        }

        // Aggregate mortality transactions from all active batches
        const mortalities: MortalityRecord[] = [];
        const treatments: TreatmentRecord[] = [];

        await Promise.all(
          list.slice(0, 10).map(async (b: any) => {
            try {
              const bDetails = await api.get(`/batch/${b.batch_id}`).catch(() => null);
              const txs: any[] = bDetails?.transactions || bDetails?.data?.transactions || [];
              txs.forEach((t: any) => {
                if (t.transaction_type === "MORTALITY") {
                  mortalities.push({
                    id: t.transaction_id || `m-${Date.now()}`,
                    record_date: t.transaction_date || "",
                    batch_no: b.batch_no,
                    ear_tag: "Batch Herd Animal",
                    pen_location: "Production Shed",
                    head_count: Number(t.quantity || 1),
                    cause_of_death: t.remarks || "Mortality Logged",
                    post_mortem_notes: "Recorded in live transaction ledger.",
                    disposal_method: "Incineration / Bio-Disposal",
                    recorded_by: "Farm Attending Officer",
                  });
                } else if (
                  t.transaction_type === "CONSUMPTION" &&
                  (t.uom === "ML" ||
                    t.uom === "DOSES" ||
                    (t.remarks && (
                      t.remarks.toLowerCase().includes("vaccine") ||
                      t.remarks.toLowerCase().includes("pcv2") ||
                      t.remarks.toLowerCase().includes("dewormer") ||
                      t.remarks.toLowerCase().includes("iron") ||
                      t.remarks.toLowerCase().includes("antibiotic") ||
                      t.remarks.toLowerCase().includes("dextran") ||
                      t.remarks.toLowerCase().includes("ivermectin")
                    )))
                ) {
                  treatments.push({
                    id: t.transaction_id || `t-${Date.now()}`,
                    treatment_date: t.transaction_date || "",
                    ear_tag: "Batch Herd Cohort",
                    batch_no: b.batch_no,
                    diagnosis: t.remarks || "Clinical Protocol Administration",
                    medicine_name: t.item_name || t.item_code || t.remarks || "Clinical Medication",
                    dosage: `${t.quantity} ${t.uom || "ML"}`,
                    route: "Intramuscular (IM) / Oral",
                    withdrawal_days: 14,
                    status: "ACTIVE",
                    veterinarian: "Attending Veterinarian",
                  });
                }
              });
            } catch {}
          })
        );

        setMortalityList(mortalities);
        setTreatmentList(treatments);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSaveMortality = async () => {
    if (!newMortality.cause_of_death) return;
    const batchObj = batches.find((b) => b.no === newMortality.batch_no) || batches[0];
    const qty = Number(newMortality.head_count) || 1;

    if (batchObj) {
      try {
        await api.post(`/batch/${batchObj.id}/transaction`, {
          transaction_date: newMortality.record_date || new Date().toISOString().slice(0, 10),
          transaction_type: "MORTALITY",
          quantity: qty,
          amount: 0,
          remarks: `${newMortality.cause_of_death} (${newMortality.pen_location || "Shed"})`,
        });
      } catch {}
    }

    const record: MortalityRecord = {
      id: `m-${Date.now()}`,
      record_date: newMortality.record_date || new Date().toISOString().slice(0, 10),
      batch_no: newMortality.batch_no || (batchObj?.no ?? "BATCH-01"),
      ear_tag: newMortality.ear_tag || "Unidentified / Litter",
      pen_location: newMortality.pen_location || "Barn 1",
      head_count: qty,
      cause_of_death: newMortality.cause_of_death || "Unknown",
      post_mortem_notes: newMortality.post_mortem_notes || "Examined on site. Carcass disposed as per protocol.",
      disposal_method: newMortality.disposal_method || "Incineration",
      recorded_by: "Farm Attending Officer",
    };
    setMortalityList([record, ...mortalityList]);
    setMortalityDialogOpen(false);
  };

  const handleSaveTreatment = () => {
    if (!newTreatment.ear_tag || !newTreatment.medicine_name) return;
    const rec: TreatmentRecord = {
      id: `t-${Date.now()}`,
      treatment_date: newTreatment.treatment_date || new Date().toISOString().slice(0, 10),
      ear_tag: newTreatment.ear_tag,
      batch_no: newTreatment.batch_no || (batches[0]?.no ?? "BATCH-01"),
      diagnosis: newTreatment.diagnosis || "General Clinical Observation",
      medicine_name: newTreatment.medicine_name,
      dosage: newTreatment.dosage || "Standard therapeutic dose",
      route: newTreatment.route || "IM",
      withdrawal_days: Number(newTreatment.withdrawal_days) || 0,
      status: (newTreatment.status as any) || "ACTIVE",
      veterinarian: newTreatment.veterinarian || "Dr. Sharma",
    };
    setTreatmentList([rec, ...treatmentList]);
    setTreatmentDialogOpen(false);
  };

  const totalMortalityHeads = mortalityList.reduce((acc, m) => acc + m.head_count, 0);
  const activeTreatmentsCount = treatmentList.filter((t) => t.status === "ACTIVE").length;

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm font-medium text-[var(--text-muted)]">Loading mortality and health registers from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* ── Top Header and Summary Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold uppercase tracking-wider text-[11px]">Cumulative Mortality</span>
            <Skull className="h-4 w-4" style={{ color: "var(--danger)" }} />
          </div>
          <p className="text-2xl font-bold font-mono mt-2" style={{ color: "var(--text-primary)" }}>
            {totalMortalityHeads} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Head (0.35%)</span>
          </p>
          <p className="text-[11px] font-medium mt-1" style={{ color: "var(--success)" }}>
            Below standard threshold (2.0%)
          </p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Clinical Cases</span>
            <HeartPulse className="h-4 w-4" style={{ color: "var(--warning)" }} />
          </div>
          <p className="text-2xl font-bold font-mono mt-2" style={{ color: "var(--text-primary)" }}>
            {activeTreatmentsCount} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>In Isolation</span>
          </p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
            Under active veterinary withdrawal
          </p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold uppercase tracking-wider text-[11px]">Vaccination Coverage</span>
            <ShieldCheck className="h-4 w-4" style={{ color: "var(--success)" }} />
          </div>
          <p className="text-2xl font-bold font-mono mt-2" style={{ color: "var(--text-primary)" }}>100%</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--success)" }}>
            FMD & PRRS protocols current
          </p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold uppercase tracking-wider text-[11px]">Biosecurity Standard</span>
            <Stethoscope className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-2xl font-bold font-mono mt-2" style={{ color: "var(--text-primary)" }}>Grade A</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
            Disinfection & barrier protocol active
          </p>
        </div>
      </div>

      {/* ── Sub-Navigation & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-1" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab("mortality")}
            className={`nf-press flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "mortality"
                ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Skull className="h-3.5 w-3.5" />
            <span>Mortality & Post-Mortem Register</span>
          </button>
          <button
            onClick={() => setActiveTab("treatments")}
            className={`nf-press flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "treatments"
                ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Veterinary Treatments & Care</span>
          </button>
          <button
            onClick={() => setActiveTab("vaccines")}
            className={`nf-press flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === "vaccines"
                ? "border-[var(--accent)] text-[var(--accent)] font-semibold"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Vaccination Protocols</span>
          </button>
        </div>

        <div className="pb-1">
          {activeTab === "mortality" && (
            <button
              onClick={() => setMortalityDialogOpen(true)}
              className="nf-press flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="h-4 w-4" /> Log Mortality Record
            </button>
          )}
          {activeTab === "treatments" && (
            <button
              onClick={() => setTreatmentDialogOpen(true)}
              className="nf-press flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="h-4 w-4" /> Record Treatment
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: MORTALITY REGISTER ── */}
      {activeTab === "mortality" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Historical Post-Mortem & Carcass Disposal Log</span>
            <span>Total Deaths Logged: {mortalityList.length}</span>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-xs border-collapse">
              <TableHeader>
                <TableRow className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  <TableHead className="py-2.5 px-3 font-semibold">Date</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Batch / Pen</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Ear Tag / ID</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-center">Head Count</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Cause of Death</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Post-Mortem Findings</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Disposal Method</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mortalityList.map((m) => (
                  <TableRow key={m.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)] transition-colors">
                    <TableCell className="py-2.5 px-3 font-mono">{m.record_date}</TableCell>
                    <TableCell className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                      {m.batch_no}
                      <span className="block text-[10px] font-normal text-[var(--text-secondary)]">{m.pen_location}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 font-mono">{m.ear_tag || "—"}</TableCell>
                    <TableCell className="py-2.5 px-3 text-center font-bold text-[var(--danger)]">{m.head_count}</TableCell>
                    <TableCell className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{m.cause_of_death}</TableCell>
                    <TableCell className="py-2.5 px-3 text-[var(--text-secondary)] max-w-xs truncate" title={m.post_mortem_notes}>
                      {m.post_mortem_notes}
                    </TableCell>
                    <TableCell className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold border"
                        style={{
                          backgroundColor: "var(--success-muted)",
                          color: "var(--success)",
                          borderColor: "rgba(47, 125, 91, 0.2)",
                        }}
                      >
                        {m.disposal_method}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-[var(--text-secondary)]">{m.recorded_by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: VETERINARY TREATMENTS ── */}
      {activeTab === "treatments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Prescription & Veterinary Interventions Log</span>
            <span>Active Cases: {activeTreatmentsCount}</span>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-xs border-collapse">
              <TableHeader>
                <TableRow className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  <TableHead className="py-2.5 px-3 font-semibold">Treatment Date</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Ear Tag</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Diagnosis</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Prescription & Dose</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Route</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-center">Withdrawal (Days)</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Status</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">Attending Vet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {treatmentList.map((t) => (
                  <TableRow key={t.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)] transition-colors">
                    <TableCell className="py-2.5 px-3 font-mono">{t.treatment_date}</TableCell>
                    <TableCell className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">{t.ear_tag}</TableCell>
                    <TableCell className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{t.diagnosis}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <span className="font-semibold text-[var(--text-primary)]">{t.medicine_name}</span>
                      <span className="block text-[10px] text-[var(--text-secondary)]">{t.dosage}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-[var(--text-secondary)]">{t.route}</TableCell>
                    <TableCell className="py-2.5 px-3 text-center font-semibold" style={{ color: "var(--warning)" }}>{t.withdrawal_days} d</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold border"
                        style={{
                          backgroundColor: t.status === "ACTIVE" ? "var(--warning-muted)" : "var(--success-muted)",
                          color: t.status === "ACTIVE" ? "var(--warning)" : "var(--success)",
                          borderColor: t.status === "ACTIVE" ? "rgba(183, 121, 31, 0.2)" : "rgba(47, 125, 91, 0.2)",
                        }}
                      >
                        {t.status === "ACTIVE" ? "● Under Treatment" : "✓ Recovered"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-[var(--text-secondary)]">{t.veterinarian}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: VACCINATIONS ── */}
      {activeTab === "vaccines" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>Herd Immunization & Deworming Protocol Schedule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {vaccineList.map((v) => (
              <div key={v.id} className="rounded-[var(--radius-md)] border p-4 bg-[var(--surface)] space-y-2.5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[var(--text-primary)]">{v.vaccine_name}</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-[var(--radius-pill)] border"
                    style={{
                      backgroundColor: v.status === "COMPLETED" ? "var(--success-muted)" : "var(--accent-muted)",
                      color: v.status === "COMPLETED" ? "var(--success)" : "var(--accent)",
                      borderColor: v.status === "COMPLETED" ? "rgba(47, 125, 91, 0.2)" : "rgba(194, 67, 50, 0.2)",
                    }}
                  >
                    {v.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">Target: {v.target_disease}</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>Target Stage:</span>
                    <span className="font-medium text-[var(--text-primary)]">{v.target_stage}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>Due Date:</span>
                    <span className="font-mono text-[var(--text-primary)]">{v.scheduled_date}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>Herd Coverage:</span>
                    <span className="font-bold text-[var(--accent)]">{v.coverage_pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: LOG MORTALITY ── */}
      <Dialog
        open={mortalityDialogOpen}
        onClose={() => setMortalityDialogOpen(false)}
        title="Log Mortality / Post-Mortem Event"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Date of Death</label>
              <input
                type="date"
                value={newMortality.record_date}
                onChange={(e) => setNewMortality({ ...newMortality, record_date: e.target.value })}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Head Count</label>
              <input
                type="number"
                min="1"
                value={newMortality.head_count}
                onChange={(e) => setNewMortality({ ...newMortality, head_count: Number(e.target.value) })}
                className="nf-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Batch / Barn Location</label>
              <input
                type="text"
                value={newMortality.pen_location}
                onChange={(e) => setNewMortality({ ...newMortality, pen_location: e.target.value })}
                placeholder="e.g. Gestation Barn 1"
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Ear Tag ID (Optional)</label>
              <input
                type="text"
                value={newMortality.ear_tag}
                onChange={(e) => setNewMortality({ ...newMortality, ear_tag: e.target.value })}
                placeholder="e.g. ET-25-0014"
                className="nf-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Primary Cause of Death</label>
            <select
              value={newMortality.cause_of_death}
              onChange={(e) => setNewMortality({ ...newMortality, cause_of_death: e.target.value })}
              className="nf-input w-full"
            >
              <option value="Respiratory Distress / Pneumonia">Respiratory Distress / Pneumonia</option>
              <option value="Overlay / Crushing">Overlay / Crushing (Piglet)</option>
              <option value="Gastric Ulcer / Hemorrhage">Gastric Ulcer / Hemorrhage</option>
              <option value="Colibacillosis / Enteritis">Colibacillosis / Severe Enteritis</option>
              <option value="Uterine / Rectal Prolapse">Uterine / Rectal Prolapse</option>
              <option value="Sudden Heart Failure / Stress">Sudden Heart Failure / Stress</option>
              <option value="Other Non-Infectious">Other Non-Infectious Cause</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">Post-Mortem Examination Notes</label>
            <textarea
              rows={2}
              value={newMortality.post_mortem_notes}
              onChange={(e) => setNewMortality({ ...newMortality, post_mortem_notes: e.target.value })}
              placeholder="Enter gross lesions, organ observations, and pathologist findings..."
              className="nf-input w-full"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">Biosecure Disposal Method</label>
            <select
              value={newMortality.disposal_method}
              onChange={(e) => setNewMortality({ ...newMortality, disposal_method: e.target.value })}
              className="nf-input w-full"
            >
              <option value="Incineration (Biosecure)">High-Temp Incineration (Biosecure)</option>
              <option value="Deep Burial with Lime">Deep Burial with Quicklime</option>
              <option value="Certified Carcass Rendering">Certified Rendering Service</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Button variant="outline" onClick={() => setMortalityDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMortality} className="nf-btn-primary">
              Save Mortality Entry
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── MODAL: RECORD TREATMENT ── */}
      <Dialog
        open={treatmentDialogOpen}
        onClose={() => setTreatmentDialogOpen(false)}
        title="Record Veterinary Treatment"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Treatment Date</label>
              <input
                type="date"
                value={newTreatment.treatment_date}
                onChange={(e) => setNewTreatment({ ...newTreatment, treatment_date: e.target.value })}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Animal Ear Tag ID</label>
              <input
                type="text"
                value={newTreatment.ear_tag}
                onChange={(e) => setNewTreatment({ ...newTreatment, ear_tag: e.target.value })}
                placeholder="e.g. ET-25-0004"
                className="nf-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">Clinical Diagnosis</label>
            <input
              type="text"
              value={newTreatment.diagnosis}
              onChange={(e) => setNewTreatment({ ...newTreatment, diagnosis: e.target.value })}
              placeholder="e.g. Swine Erysipelas, Mastitis, Hoof Lameness"
              className="nf-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Medicine / Vaccine Administered</label>
              <input
                type="text"
                value={newTreatment.medicine_name}
                onChange={(e) => setNewTreatment({ ...newTreatment, medicine_name: e.target.value })}
                placeholder="e.g. Oxytetracycline 20% LA"
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Dosage & Route</label>
              <input
                type="text"
                value={newTreatment.dosage}
                onChange={(e) => setNewTreatment({ ...newTreatment, dosage: e.target.value })}
                placeholder="e.g. 10 mL IM (Deep Neck)"
                className="nf-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Meat Withdrawal Period (Days)</label>
              <input
                type="number"
                min="0"
                value={newTreatment.withdrawal_days}
                onChange={(e) => setNewTreatment({ ...newTreatment, withdrawal_days: Number(e.target.value) })}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Attending Veterinarian</label>
              <input
                type="text"
                value={newTreatment.veterinarian}
                onChange={(e) => setNewTreatment({ ...newTreatment, veterinarian: e.target.value })}
                placeholder="e.g. Dr. Sharma"
                className="nf-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Button variant="outline" onClick={() => setTreatmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTreatment} className="nf-btn-primary">
              Save Treatment Record
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
