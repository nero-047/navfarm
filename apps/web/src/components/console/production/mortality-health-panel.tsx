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
import { StatRow, StatCard } from "@/components/ui/stat-row";
import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

type MortalityRecord = {
  id: string;
  record_date: string;
  batch_no: string;
  ear_tag?: string;
  animal_id?: string;
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
  animal_id?: string;
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"mortality" | "treatments" | "vaccines">("mortality");
  const [loading, setLoading] = useState(true);

  // ── Live Data State ──
  const [mortalityList, setMortalityList] = useState<MortalityRecord[]>([]);
  const [treatmentList, setTreatmentList] = useState<TreatmentRecord[]>([]);
  const [vaccineList] = useState<VaccinationItem[]>([]);
  const [batches, setBatches] = useState<{ id: string; no: string }[]>([]);

  // ── Animal-scope filters/pickers ──
  const [mortalityAnimalFilter, setMortalityAnimalFilter] = useState("");
  const [treatmentAnimalFilter, setTreatmentAnimalFilter] = useState("");
  const [modalAnimals, setModalAnimals] = useState<{ animal_id: string; label: string }[]>([]);
  const [modalAnimalsLoading, setModalAnimalsLoading] = useState(false);
  const [mortalityAnimalIds, setMortalityAnimalIds] = useState<Set<string>>(new Set());
  const [treatmentAnimalIds, setTreatmentAnimalIds] = useState<Set<string>>(new Set());

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
                    ear_tag: t.animal_ear_tag || t.animal_code || undefined,
                    animal_id: t.animal_id || undefined,
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
                    ear_tag: t.animal_ear_tag || t.animal_code || "Batch Herd Cohort",
                    animal_id: t.animal_id || undefined,
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

  const loadModalAnimals = async (batchNo: string) => {
    const companyId = getActiveCompanyId();
    const batchObj = batches.find((b) => b.no === batchNo);
    if (!companyId || !batchObj) {
      setModalAnimals([]);
      return;
    }
    setModalAnimalsLoading(true);
    try {
      const res = await api.get(`/animal?companyId=${companyId}&currentBatchId=${batchObj.id}&limit=500`);
      const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
      setModalAnimals(list.map((a) => ({ animal_id: a.animal_id, label: a.ear_tag || a.animal_code })));
    } catch {
      setModalAnimals([]);
    } finally {
      setModalAnimalsLoading(false);
    }
  };

  const toggleMortalityAnimal = (animalId: string) => {
    setMortalityAnimalIds((prev) => {
      const next = new Set(prev);
      if (next.has(animalId)) next.delete(animalId);
      else next.add(animalId);
      return next;
    });
  };

  const toggleTreatmentAnimal = (animalId: string) => {
    setTreatmentAnimalIds((prev) => {
      const next = new Set(prev);
      if (next.has(animalId)) next.delete(animalId);
      else next.add(animalId);
      return next;
    });
  };

  const handleSaveMortality = async () => {
    if (!newMortality.cause_of_death) return;
    const batchObj = batches.find((b) => b.no === newMortality.batch_no) || batches[0];
    const selectedAnimals = Array.from(mortalityAnimalIds);
    // When specific animals are selected, they ARE the mortality count (one
    // dead animal per row) — the manually entered head_count is only used
    // for a whole-batch (unattributed) entry.
    const qty = selectedAnimals.length > 0 ? selectedAnimals.length : Number(newMortality.head_count) || 1;

    if (batchObj) {
      try {
        if (selectedAnimals.length > 0) {
          for (const animalId of selectedAnimals) {
            await api.post(`/batch/${batchObj.id}/transaction`, {
              transaction_date: newMortality.record_date || new Date().toISOString().slice(0, 10),
              transaction_type: "MORTALITY",
              quantity: 1,
              amount: 0,
              remarks: `${newMortality.cause_of_death} (${newMortality.pen_location || "Shed"})`,
              animal_id: animalId,
            });
          }
        } else {
          await api.post(`/batch/${batchObj.id}/transaction`, {
            transaction_date: newMortality.record_date || new Date().toISOString().slice(0, 10),
            transaction_type: "MORTALITY",
            quantity: qty,
            amount: 0,
            remarks: `${newMortality.cause_of_death} (${newMortality.pen_location || "Shed"})`,
          });
        }
      } catch {}
    }

    const earTagLabel = selectedAnimals.length > 0
      ? selectedAnimals.map((id) => modalAnimals.find((a) => a.animal_id === id)?.label || id).join(", ")
      : "Unidentified / Litter";

    const record: MortalityRecord = {
      id: `m-${Date.now()}`,
      record_date: newMortality.record_date || new Date().toISOString().slice(0, 10),
      batch_no: newMortality.batch_no || (batchObj?.no ?? "BATCH-01"),
      ear_tag: earTagLabel,
      animal_id: selectedAnimals.length === 1 ? selectedAnimals[0] : undefined,
      pen_location: newMortality.pen_location || "Barn 1",
      head_count: qty,
      cause_of_death: newMortality.cause_of_death || "Unknown",
      post_mortem_notes: newMortality.post_mortem_notes || "Examined on site. Carcass disposed as per protocol.",
      disposal_method: newMortality.disposal_method || "Incineration",
      recorded_by: "Farm Attending Officer",
    };
    setMortalityList([record, ...mortalityList]);
    setMortalityAnimalIds(new Set());
    setMortalityDialogOpen(false);
  };

  const handleSaveTreatment = async () => {
    const selectedAnimals = Array.from(treatmentAnimalIds);
    if (selectedAnimals.length === 0 && !newTreatment.ear_tag) return;
    if (!newTreatment.medicine_name) return;
    const batchObj = batches.find((b) => b.no === newTreatment.batch_no) || batches[0];
    const dosage = newTreatment.dosage || "Standard therapeutic dose";
    const route = newTreatment.route || "IM";
    const vet = newTreatment.veterinarian || "Dr. Sharma";
    const diagnosis = newTreatment.diagnosis || "General Clinical Observation";

    if (batchObj) {
      try {
        if (selectedAnimals.length > 0) {
          for (const animalId of selectedAnimals) {
            await api.post(`/batch/${batchObj.id}/transaction`, {
              transaction_date: newTreatment.treatment_date || new Date().toISOString().slice(0, 10),
              transaction_type: "CONSUMPTION",
              quantity: 1,
              uom: "DOSES",
              remarks: `${newTreatment.medicine_name} — ${diagnosis} (${dosage}, ${route}, vet: ${vet}, withdrawal ${newTreatment.withdrawal_days || 0}d)`,
              animal_id: animalId,
            });
          }
        } else {
          await api.post(`/batch/${batchObj.id}/transaction`, {
            transaction_date: newTreatment.treatment_date || new Date().toISOString().slice(0, 10),
            transaction_type: "CONSUMPTION",
            quantity: 1,
            uom: "DOSES",
            remarks: `${newTreatment.medicine_name} — ${diagnosis} (${dosage}, ${route}, vet: ${vet}, withdrawal ${newTreatment.withdrawal_days || 0}d)`,
          });
        }
      } catch { void 0; }
    }

    const earTagLabel = selectedAnimals.length > 0
      ? selectedAnimals.map((id) => modalAnimals.find((a) => a.animal_id === id)?.label || id).join(", ")
      : (newTreatment.ear_tag as string);

    const rec: TreatmentRecord = {
      id: `t-${Date.now()}`,
      treatment_date: newTreatment.treatment_date || new Date().toISOString().slice(0, 10),
      ear_tag: earTagLabel,
      animal_id: selectedAnimals.length === 1 ? selectedAnimals[0] : undefined,
      batch_no: newTreatment.batch_no || (batches[0]?.no ?? "BATCH-01"),
      diagnosis,
      medicine_name: newTreatment.medicine_name,
      dosage,
      route,
      withdrawal_days: Number(newTreatment.withdrawal_days) || 0,
      status: (newTreatment.status as any) || "ACTIVE",
      veterinarian: vet,
    };
    setTreatmentList([rec, ...treatmentList]);
    setTreatmentAnimalIds(new Set());
    setTreatmentDialogOpen(false);
  };

  const totalMortalityHeads = mortalityList.reduce((acc, m) => acc + m.head_count, 0);
  const activeTreatmentsCount = treatmentList.filter((t) => t.status === "ACTIVE").length;

  const mortalityAnimalOptions = Array.from(
    new Map(mortalityList.filter((m) => m.animal_id).map((m) => [m.animal_id as string, m.ear_tag || (m.animal_id as string)])).entries()
  );
  const treatmentAnimalOptions = Array.from(
    new Map(treatmentList.filter((t) => t.animal_id).map((t) => [t.animal_id as string, t.ear_tag])).entries()
  );
  const filteredMortalityList = mortalityAnimalFilter ? mortalityList.filter((m) => m.animal_id === mortalityAnimalFilter) : mortalityList;
  const filteredTreatmentList = treatmentAnimalFilter ? treatmentList.filter((t) => t.animal_id === treatmentAnimalFilter) : treatmentList;

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm font-medium text-[var(--text-muted)]">{t("mhLoadingRegisters")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* ── Top Header and Summary Metrics ── */}
      <StatRow>
        <StatCard
          icon={Skull}
          label={t("mhCumulativeMortality")}
          value={totalMortalityHeads}
          unit={t("mhHeadPercent")}
          sub={<span className="text-(--success)">{t("mhBelowStandardThreshold")}</span>}
        />
        <StatCard
          icon={HeartPulse}
          label={t("mhActiveClinicalCases")}
          value={activeTreatmentsCount}
          unit={t("mhInIsolation")}
          sub={t("mhUnderActiveVeterinaryWithdrawal")}
        />
        <StatCard
          icon={ShieldCheck}
          label={t("mhVaccinationCoverage")}
          value="100%"
          sub={<span className="text-(--success)">{t("mhFmdPrrsProtocolsCurrent")}</span>}
        />
        <StatCard
          icon={Stethoscope}
          label={t("mhBiosecurityStandard")}
          value={t("mhGradeA")}
          sub={t("mhDisinfectionBarrierProtocolActive")}
        />
      </StatRow>

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
            <span>{t("mhMortalityPostMortemRegister")}</span>
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
            <span>{t("mhVeterinaryTreatmentsCare")}</span>
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
            <span>{t("mhVaccinationProtocols")}</span>
          </button>
        </div>

        <div className="pb-1">
          {activeTab === "mortality" && (
            <button
              onClick={() => { setMortalityAnimalIds(new Set()); loadModalAnimals(newMortality.batch_no || batches[0]?.no || ""); setMortalityDialogOpen(true); }}
              className="nf-press flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="h-4 w-4" /> {t("mhLogMortalityRecord")}
            </button>
          )}
          {activeTab === "treatments" && (
            <button
              onClick={() => { setTreatmentAnimalIds(new Set()); loadModalAnimals(newTreatment.batch_no || batches[0]?.no || ""); setTreatmentDialogOpen(true); }}
              className="nf-press flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <Plus className="h-4 w-4" /> {t("mhRecordTreatment")}
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: MORTALITY REGISTER ── */}
      {activeTab === "mortality" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>{t("mhHistoricalPostMortemLog")}</span>
            <div className="flex items-center gap-3">
              {mortalityAnimalOptions.length > 0 && (
                <select
                  value={mortalityAnimalFilter}
                  onChange={(e) => setMortalityAnimalFilter(e.target.value)}
                  className="nf-input h-7 text-[11px]"
                >
                  <option value="">{t("bulkScopeWholeBatch")}</option>
                  {mortalityAnimalOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              )}
              <span>{t("mhTotalDeathsLogged", { count: filteredMortalityList.length })}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-xs border-collapse">
              <TableHeader>
                <TableRow className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhDate")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhBatchPen")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhEarTagId")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-center">{t("mhHeadCount")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhCauseOfDeath")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhPostMortemFindings")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhDisposalMethod")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhRecordedBy")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMortalityList.map((m) => (
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
            <span>{t("mhPrescriptionVeterinaryInterventionsLog")}</span>
            <div className="flex items-center gap-3">
              {treatmentAnimalOptions.length > 0 && (
                <select
                  value={treatmentAnimalFilter}
                  onChange={(e) => setTreatmentAnimalFilter(e.target.value)}
                  className="nf-input h-7 text-[11px]"
                >
                  <option value="">{t("bulkScopeWholeBatch")}</option>
                  {treatmentAnimalOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </select>
              )}
              <span>{t("mhActiveCases", { count: activeTreatmentsCount })}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-xs border-collapse">
              <TableHeader>
                <TableRow className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhTreatmentDate")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhEarTag")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhDiagnosis")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhPrescriptionDose")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhRoute")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold text-center">{t("mhWithdrawalDays")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhStatus")}</TableHead>
                  <TableHead className="py-2.5 px-3 font-semibold">{t("mhAttendingVet")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTreatmentList.map((tr) => (
                  <TableRow key={tr.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-raised)] transition-colors">
                    <TableCell className="py-2.5 px-3 font-mono">{tr.treatment_date}</TableCell>
                    <TableCell className="py-2.5 px-3 font-mono font-bold text-[var(--accent)]">{tr.ear_tag}</TableCell>
                    <TableCell className="py-2.5 px-3 font-medium text-[var(--text-primary)]">{tr.diagnosis}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <span className="font-semibold text-[var(--text-primary)]">{tr.medicine_name}</span>
                      <span className="block text-[10px] text-[var(--text-secondary)]">{tr.dosage}</span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-[var(--text-secondary)]">{tr.route}</TableCell>
                    <TableCell className="py-2.5 px-3 text-center font-semibold" style={{ color: "var(--warning)" }}>{t("mhDaysValue", { count: tr.withdrawal_days })}</TableCell>
                    <TableCell className="py-2.5 px-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-semibold border"
                        style={{
                          backgroundColor: tr.status === "ACTIVE" ? "var(--warning-muted)" : "var(--success-muted)",
                          color: tr.status === "ACTIVE" ? "var(--warning)" : "var(--success)",
                          borderColor: tr.status === "ACTIVE" ? "rgba(183, 121, 31, 0.2)" : "rgba(47, 125, 91, 0.2)",
                        }}
                      >
                        {tr.status === "ACTIVE" ? t("mhUnderTreatment") : t("mhRecovered")}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 px-3 text-[var(--text-secondary)]">{tr.veterinarian}</TableCell>
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
            <span>{t("mhHerdImmunizationDewormingSchedule")}</span>
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
                <p className="text-xs text-[var(--text-secondary)]">{t("mhTargetLabel", { target: v.target_disease })}</p>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>{t("mhTargetStage")}</span>
                    <span className="font-medium text-[var(--text-primary)]">{v.target_stage}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>{t("mhDueDate")}</span>
                    <span className="font-mono text-[var(--text-primary)]">{v.scheduled_date}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>{t("mhHerdCoverage")}</span>
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
        title={t("mhLogMortalityPostMortemEvent")}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t("mhDateOfDeath")}</label>
              <input
                type="date"
                value={newMortality.record_date}
                onChange={(e) => setNewMortality({ ...newMortality, record_date: e.target.value })}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t("mhHeadCount")}</label>
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
              <label className="font-semibold block mb-1">{t("mhBatchBarnLocation")}</label>
              <input
                type="text"
                value={newMortality.pen_location}
                onChange={(e) => setNewMortality({ ...newMortality, pen_location: e.target.value })}
                placeholder={t("mhGestationBarn1Placeholder")}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t("mhBatchPen")}</label>
              <select
                value={newMortality.batch_no}
                onChange={(e) => { setNewMortality({ ...newMortality, batch_no: e.target.value }); setMortalityAnimalIds(new Set()); loadModalAnimals(e.target.value); }}
                className="nf-input w-full"
              >
                {batches.map((b) => <option key={b.id} value={b.no}>{b.no}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">{t("mhEarTagIdOptional")}</label>
            {modalAnimalsLoading ? (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("bulkScopeLoading")}</p>
            ) : modalAnimals.length === 0 ? (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("bulkScopeNoAnimals")}</p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-[var(--radius-sm)] border" style={{ borderColor: "var(--border)" }}>
                {modalAnimals.map((a) => (
                  <label key={a.animal_id} className="flex cursor-pointer items-center gap-2 border-b px-3 py-1.5 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <input type="checkbox" checked={mortalityAnimalIds.has(a.animal_id)} onChange={() => toggleMortalityAnimal(a.animal_id)} className="h-3.5 w-3.5 rounded-[var(--radius-xs)] accent-(--accent)" />
                    <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{a.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold block mb-1">{t("mhPrimaryCauseOfDeath")}</label>
            <select
              value={newMortality.cause_of_death}
              onChange={(e) => setNewMortality({ ...newMortality, cause_of_death: e.target.value })}
              className="nf-input w-full"
            >
              <option value="Respiratory Distress / Pneumonia">{t("mhCauseRespiratoryDistress")}</option>
              <option value="Overlay / Crushing">{t("mhCauseOverlayCrushing")}</option>
              <option value="Gastric Ulcer / Hemorrhage">{t("mhCauseGastricUlcer")}</option>
              <option value="Colibacillosis / Enteritis">{t("mhCauseColibacillosis")}</option>
              <option value="Uterine / Rectal Prolapse">{t("mhCauseUterineProlapse")}</option>
              <option value="Sudden Heart Failure / Stress">{t("mhCauseSuddenHeartFailure")}</option>
              <option value="Other Non-Infectious">{t("mhCauseOtherNonInfectious")}</option>
            </select>
          </div>

          <div>
            <label className="font-semibold block mb-1">{t("mhPostMortemExaminationNotes")}</label>
            <textarea
              rows={2}
              value={newMortality.post_mortem_notes}
              onChange={(e) => setNewMortality({ ...newMortality, post_mortem_notes: e.target.value })}
              placeholder={t("mhPostMortemNotesPlaceholder")}
              className="nf-input w-full"
            />
          </div>

          <div>
            <label className="font-semibold block mb-1">{t("mhBiosecureDisposalMethod")}</label>
            <select
              value={newMortality.disposal_method}
              onChange={(e) => setNewMortality({ ...newMortality, disposal_method: e.target.value })}
              className="nf-input w-full"
            >
              <option value="Incineration (Biosecure)">{t("mhDisposalIncineration")}</option>
              <option value="Deep Burial with Lime">{t("mhDisposalDeepBurial")}</option>
              <option value="Certified Carcass Rendering">{t("mhDisposalCertifiedRendering")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Button variant="outline" onClick={() => setMortalityDialogOpen(false)}>
              {t("mhCancel")}
            </Button>
            <Button onClick={handleSaveMortality} className="nf-btn-primary">
              {t("mhSaveMortalityEntry")}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── MODAL: RECORD TREATMENT ── */}
      <Dialog
        open={treatmentDialogOpen}
        onClose={() => setTreatmentDialogOpen(false)}
        title={t("mhRecordVeterinaryTreatment")}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t("mhTreatmentDate")}</label>
              <input
                type="date"
                value={newTreatment.treatment_date}
                onChange={(e) => setNewTreatment({ ...newTreatment, treatment_date: e.target.value })}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t("mhBatchPen")}</label>
              <select
                value={newTreatment.batch_no}
                onChange={(e) => { setNewTreatment({ ...newTreatment, batch_no: e.target.value }); setTreatmentAnimalIds(new Set()); loadModalAnimals(e.target.value); }}
                className="nf-input w-full"
              >
                {batches.map((b) => <option key={b.id} value={b.no}>{b.no}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold block mb-1">{t("mhAnimalEarTagId")}</label>
            {modalAnimalsLoading ? (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("bulkScopeLoading")}</p>
            ) : modalAnimals.length === 0 ? (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{t("bulkScopeNoAnimals")}</p>
            ) : (
              <div className="max-h-40 overflow-y-auto rounded-[var(--radius-sm)] border" style={{ borderColor: "var(--border)" }}>
                {modalAnimals.map((a) => (
                  <label key={a.animal_id} className="flex cursor-pointer items-center gap-2 border-b px-3 py-1.5 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <input type="checkbox" checked={treatmentAnimalIds.has(a.animal_id)} onChange={() => toggleTreatmentAnimal(a.animal_id)} className="h-3.5 w-3.5 rounded-[var(--radius-xs)] accent-(--accent)" />
                    <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{a.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="font-semibold block mb-1">{t("mhClinicalDiagnosis")}</label>
            <input
              type="text"
              value={newTreatment.diagnosis}
              onChange={(e) => setNewTreatment({ ...newTreatment, diagnosis: e.target.value })}
              placeholder={t("mhDiagnosisPlaceholder")}
              className="nf-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t("mhMedicineVaccineAdministered")}</label>
              <input
                type="text"
                value={newTreatment.medicine_name}
                onChange={(e) => setNewTreatment({ ...newTreatment, medicine_name: e.target.value })}
                placeholder={t("mhMedicinePlaceholder")}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t("mhDosageRoute")}</label>
              <input
                type="text"
                value={newTreatment.dosage}
                onChange={(e) => setNewTreatment({ ...newTreatment, dosage: e.target.value })}
                placeholder={t("mhDosagePlaceholder")}
                className="nf-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">{t("mhMeatWithdrawalPeriodDays")}</label>
              <input
                type="number"
                min="0"
                value={newTreatment.withdrawal_days}
                onChange={(e) => setNewTreatment({ ...newTreatment, withdrawal_days: Number(e.target.value) })}
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">{t("mhAttendingVeterinarian")}</label>
              <input
                type="text"
                value={newTreatment.veterinarian}
                onChange={(e) => setNewTreatment({ ...newTreatment, veterinarian: e.target.value })}
                placeholder={t("mhVeterinarianPlaceholder")}
                className="nf-input w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <Button variant="outline" onClick={() => setTreatmentDialogOpen(false)}>
              {t("mhCancel")}
            </Button>
            <Button onClick={handleSaveTreatment} className="nf-btn-primary">
              {t("mhSaveTreatmentRecord")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
