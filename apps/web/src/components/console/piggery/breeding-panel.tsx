"use client";

import { useEffect, useState } from "react";
import {
  Heart,
  Baby,
  FlaskConical,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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
  input:   { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text-primary)" },
};

export function BreedingPanel() {
  const [subTab, setSubTab] = useState<"mating" | "farrowing" | "semen">("mating");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data
  const [matings, setMatings] = useState<Row[]>([]);
  const [farrowings, setFarrowings] = useState<Row[]>([]);
  const [semenBatches, setSemenBatches] = useState<Row[]>([]);
  const [animals, setAnimals] = useState<Row[]>([]);

  // Modals
  const [showMatingModal, setShowMatingModal] = useState(false);
  const [showFarrowModal, setShowFarrowModal] = useState(false);
  const [showWeanModal, setShowWeanModal] = useState(false);
  const [showSemenModal, setShowSemenModal] = useState(false);
  const [showPregCheckModal, setShowPregCheckModal] = useState(false);
  const [selectedMating, setSelectedMating] = useState<Row | null>(null);
  const [selectedFarrow, setSelectedFarrow] = useState<Row | null>(null);

  // Forms
  const [matingForm, setMatingForm] = useState({
    sow_animal_id: "",
    mating_type: "AI",
    boar_animal_id: "",
    semen_lot_id: "",
    semen_dose_qty: "1.00",
    mating_date: new Date().toISOString().slice(0, 10),
    second_mating_date: "",
    notes: "",
  });

  const [pregCheckForm, setPregCheckForm] = useState({
    pregnancy_confirmed: true,
    preg_check_method: "ULTRASOUND",
    preg_check_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const [farrowForm, setFarrowForm] = useState({
    sow_animal_id: "",
    breeding_id: "",
    farrowing_date: new Date().toISOString().slice(0, 10),
    piglets_born_live: "12",
    piglets_stillborn: "1",
    piglets_mummified: "0",
    avg_birth_weight_kg: "1.45",
    total_litter_weight_kg: "",
    farrowing_status: "NORMAL",
    foster_received: "0",
    fostered_out: "0",
    notes: "",
  });

  const [weanForm, setWeanForm] = useState({
    weaning_date: new Date().toISOString().slice(0, 10),
    piglets_weaned: "11",
    avg_weaning_weight_kg: "7.50",
    cost_per_piglet: "",
    notes: "",
  });

  const [semenForm, setSemenForm] = useState({
    boar_animal_id: "",
    collection_date: new Date().toISOString().slice(0, 10),
    doses_collected: "40",
    amortisation_period: "150",
    feed_cost_period: "200",
    drug_cost_period: "50",
    overhead_cost_period: "100",
    doses_used_internal: "30",
    doses_sold: "10",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, fRes, sRes, aRes] = await Promise.all([
        api.get("/piggery/breeding/mating").catch(() => []),
        api.get("/piggery/breeding/farrowing").catch(() => []),
        api.get("/piggery/breeding/semen-collection").catch(() => []),
        api.get("/animal").catch(() => []),
      ]);
      setMatings(unwrap<Row[]>(mRes) || []);
      setFarrowings(unwrap<Row[]>(fRes) || []);
      setSemenBatches(unwrap<Row[]>(sRes) || []);
      setAnimals(unwrap<Row[]>(aRes) || []);
    } catch (e: any) {
      setError(e.message || "Failed to load breeding data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sows = animals.filter(
    (a) => a.animal_type === "SOW" || a.animal_type === "GILT" || a.gender === "F"
  );
  const boars = animals.filter(
    (a) => a.animal_type === "BOAR" || a.gender === "M"
  );

  // Handlers
  const handleCreateMating = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/piggery/breeding/mating", {
        ...matingForm,
        semen_dose_qty: Number(matingForm.semen_dose_qty) || 1,
      });
      setSuccess("Mating event successfully recorded!");
      setShowMatingModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to record mating event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePregCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMating) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        `/piggery/breeding/mating/${selectedMating.breeding_id}/pregnancy-check`,
        pregCheckForm
      );
      setSuccess("Pregnancy check updated!");
      setShowPregCheckModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update pregnancy check.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateFarrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/piggery/breeding/farrowing", {
        ...farrowForm,
        piglets_born_live: Number(farrowForm.piglets_born_live) || 0,
        piglets_stillborn: Number(farrowForm.piglets_stillborn) || 0,
        piglets_mummified: Number(farrowForm.piglets_mummified) || 0,
        avg_birth_weight_kg: Number(farrowForm.avg_birth_weight_kg) || 1.4,
        total_litter_weight_kg: farrowForm.total_litter_weight_kg
          ? Number(farrowForm.total_litter_weight_kg)
          : undefined,
        foster_received: Number(farrowForm.foster_received) || 0,
        fostered_out: Number(farrowForm.fostered_out) || 0,
      });
      setSuccess("Farrowing event recorded and piglets born live tracked!");
      setShowFarrowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to record farrowing.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWeaning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarrow) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.post(
        `/piggery/breeding/farrowing/${selectedFarrow.farrow_id}/wean`,
        {
          ...weanForm,
          piglets_weaned: Number(weanForm.piglets_weaned) || 0,
          avg_weaning_weight_kg: Number(weanForm.avg_weaning_weight_kg) || 7,
          cost_per_piglet: weanForm.cost_per_piglet
            ? Number(weanForm.cost_per_piglet)
            : undefined,
        }
      );
      setSuccess("Litter weaning recorded successfully!");
      setShowWeanModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to record weaning.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSemen = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/piggery/breeding/semen-collection", {
        ...semenForm,
        doses_collected: Number(semenForm.doses_collected) || 1,
        amortisation_period: Number(semenForm.amortisation_period) || 0,
        feed_cost_period: Number(semenForm.feed_cost_period) || 0,
        drug_cost_period: Number(semenForm.drug_cost_period) || 0,
        overhead_cost_period: Number(semenForm.overhead_cost_period) || 0,
        doses_used_internal: Number(semenForm.doses_used_internal) || 0,
        doses_sold: Number(semenForm.doses_sold) || 0,
      });
      setSuccess("Semen collection logged and unit cost per dose computed!");
      setShowSemenModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to record semen collection.");
    } finally {
      setSubmitting(false);
    }
  };

  // KPIs
  const activeInseminations = matings.filter(
    (m) => m.pregnancy_confirmed !== false && m.days_until_farrowing >= 0
  ).length;
  const totalLitters = farrowings.length;
  const totalBornLive = farrowings.reduce(
    (sum, f) => sum + (Number(f.piglets_born_live) || 0),
    0
  );
  const totalWeaned = farrowings.reduce(
    (sum, f) => sum + (Number(f.piglets_weaned) || 0),
    0
  );
  const avgSurvivalRate =
    totalBornLive > 0 && totalWeaned > 0
      ? ((totalWeaned / totalBornLive) * 100).toFixed(1)
      : "--";
  const totalDoses = semenBatches.reduce(
    (sum, s) => sum + (Number(s.doses_collected) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={S.primary}>
            <Heart className="w-5 h-5" style={S.accent} />
            Breeding, Farrowing & Semen AI Station
          </h2>
          <p className="text-sm mt-0.5" style={S.sub}>
            Track swine gestation (114 days), ultrasound pregnancy checks (28 days), litter outputs, and boar semen unit costs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (subTab === "mating") setShowMatingModal(true);
              else if (subTab === "farrowing") setShowFarrowModal(true);
              else setShowSemenModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {subTab === "mating" ? "Record Mating / AI" : subTab === "farrowing" ? "Record Farrowing" : "Log Semen Collection"}
          </Button>
        </div>
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}
      {success && <InlineAlert variant="success">{success}</InlineAlert>}

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-[var(--radius-lg)] border p-4 flex flex-col justify-between shadow-sm min-w-0" style={S.raised}>
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={S.muted}>
            <Heart className="w-4 h-4 shrink-0" style={S.accent} />
            <span className="truncate">Active Gestations</span>
          </div>
          <div className="text-2xl font-bold" style={S.primary}>{activeInseminations}</div>
          <div className="text-[11px] mt-1 truncate" style={S.muted}>Sows due to farrow</div>
        </div>

        <div className="rounded-[var(--radius-lg)] border p-4 flex flex-col justify-between shadow-sm min-w-0" style={S.raised}>
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={S.muted}>
            <Baby className="w-4 h-4 shrink-0" style={S.accent} />
            <span className="truncate">Total Litters</span>
          </div>
          <div className="text-2xl font-bold" style={S.primary}>{totalLitters}</div>
          <div className="text-[11px] mt-1 truncate" style={S.muted}>Farrowing batches</div>
        </div>

        <div className="rounded-[var(--radius-lg)] border p-4 flex flex-col justify-between shadow-sm min-w-0" style={S.raised}>
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={S.muted}>
            <Sparkles className="w-4 h-4 shrink-0" style={S.success} />
            <span className="truncate">Piglets Born Live</span>
          </div>
          <div className="text-2xl font-bold" style={S.success}>{totalBornLive}</div>
          <div className="text-[11px] mt-1 truncate" style={S.muted}>Lifetime live births</div>
        </div>

        <div className="rounded-[var(--radius-lg)] border p-4 flex flex-col justify-between shadow-sm min-w-0" style={S.raised}>
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={S.muted}>
            <CheckCircle2 className="w-4 h-4 shrink-0" style={S.accent} />
            <span className="truncate">Weaning Survival</span>
          </div>
          <div className="text-2xl font-bold" style={S.accent}>{avgSurvivalRate}%</div>
          <div className="text-[11px] mt-1 truncate" style={S.muted}>{totalWeaned} weaned piglets</div>
        </div>

        <div className="rounded-[var(--radius-lg)] border p-4 flex flex-col justify-between shadow-sm min-w-0" style={S.raised}>
          <div className="text-xs font-semibold flex items-center gap-1.5 mb-1.5" style={S.muted}>
            <FlaskConical className="w-4 h-4 shrink-0" style={S.accent} />
            <span className="truncate">Semen Doses</span>
          </div>
          <div className="text-2xl font-bold" style={S.primary}>{totalDoses}</div>
          <div className="text-[11px] mt-1 truncate" style={S.muted}>Collected from boars</div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex border-b gap-6" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setSubTab("mating")}
          className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
          style={{
            borderColor: subTab === "mating" ? "var(--accent)" : "transparent",
            color: subTab === "mating" ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <Heart className="w-4 h-4" />
          Mating & Insemination ({matings.length})
        </button>

        <button
          onClick={() => setSubTab("farrowing")}
          className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
          style={{
            borderColor: subTab === "farrowing" ? "var(--accent)" : "transparent",
            color: subTab === "farrowing" ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <Baby className="w-4 h-4" />
          Farrowing & Litters ({farrowings.length})
        </button>

        <button
          onClick={() => setSubTab("semen")}
          className="pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
          style={{
            borderColor: subTab === "semen" ? "var(--accent)" : "transparent",
            color: subTab === "semen" ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <FlaskConical className="w-4 h-4" />
          Boar Semen AI Station ({semenBatches.length})
        </button>
      </div>

      {/* ── Tab Content ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={S.accent} />
          <p className="text-sm" style={S.sub}>Loading reproduction records...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: MATING & GESTATION */}
          {subTab === "mating" && (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border shadow-sm" style={S.surface}>
              <table className="w-full text-left text-xs border-collapse">
                <TableHeader>
                  <tr className="border-b" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                    <TableHead className="h-11 px-4 min-w-[170px]">Sow</TableHead>
                    <TableHead className="h-11 px-4 w-32">Type</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Mating Date</TableHead>
                    <TableHead className="h-11 px-4 w-44 whitespace-nowrap">Preg Check (28d)</TableHead>
                    <TableHead className="h-11 px-4 w-44 whitespace-nowrap">Expected Farrowing (114d)</TableHead>
                    <TableHead className="h-11 px-4 w-48 whitespace-nowrap">Status / Countdown</TableHead>
                    <TableHead className="h-11 px-4 text-right w-36 whitespace-nowrap">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {matings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center" style={S.muted}>
                        No mating records found. Click &quot;Record Mating / AI&quot; to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    matings.map((m) => (
                      <TableRow key={m.breeding_id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <TableCell className="px-4 py-3.5 align-middle">
                          <div className="font-semibold text-xs" style={S.primary}>{m.sow_code}</div>
                          <div className="text-[11px] mt-0.5" style={S.sub}>Tag: {m.sow_tag || "—"} · Parity {m.parity_number}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle">
                          <span
                            className="inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                            style={{
                              backgroundColor: "var(--surface-raised)",
                              borderColor: "var(--border)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {m.mating_type}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-mono text-xs" style={S.sub}>
                          <div>{m.mating_date}</div>
                          {m.second_mating_date && (
                            <div className="text-[11px]" style={S.muted}>2nd: {m.second_mating_date}</div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {m.pregnancy_confirmed === true ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border" style={{ color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" }}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                            </span>
                          ) : m.pregnancy_confirmed === false ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border" style={{ color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" }}>
                              <XCircle className="w-3.5 h-3.5" /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border" style={{ color: "var(--warning)", borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)" }}>
                              <Clock className="w-3.5 h-3.5" /> Due: {m.preg_check_date}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-mono text-xs font-medium" style={S.primary}>
                          {m.expected_farrowing_date}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {m.days_until_farrowing < 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                              Past Due / Completed
                            </span>
                          ) : m.days_until_farrowing <= 7 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-bold animate-pulse" style={S.warning}>
                              Due in {m.days_until_farrowing} days
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border font-medium" style={S.success}>
                              Due in {m.days_until_farrowing} days
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => {
                              setSelectedMating(m);
                              setShowPregCheckModal(true);
                            }}
                          >
                            Update Check
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          )}

          {/* TAB 2: FARROWING & LITTERS */}
          {subTab === "farrowing" && (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border shadow-sm" style={S.surface}>
              <table className="w-full text-left text-xs border-collapse">
                <TableHeader>
                  <tr className="border-b" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                    <TableHead className="h-11 px-4 min-w-[170px]">Sow</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Farrow Date</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Live / Total</TableHead>
                    <TableHead className="h-11 px-4 w-44 whitespace-nowrap">Stillborn / Mummies</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Litter Weight</TableHead>
                    <TableHead className="h-11 px-4 w-44 whitespace-nowrap">Weaned / Survival</TableHead>
                    <TableHead className="h-11 px-4 text-right w-36 whitespace-nowrap">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {farrowings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center" style={S.muted}>
                        No farrowing records found. Click &quot;Record Farrowing&quot; to log a litter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    farrowings.map((f) => (
                      <TableRow key={f.farrow_id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <TableCell className="px-4 py-3.5 align-middle">
                          <div className="font-semibold text-xs" style={S.primary}>{f.sow_code}</div>
                          <div className="text-[11px] mt-0.5" style={S.sub}>Tag: {f.sow_tag || "—"} · Parity {f.parity_number}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-mono text-xs" style={S.sub}>
                          {f.farrowing_date}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <span className="font-bold text-sm" style={S.success}>{f.piglets_born_live}</span>
                          <span className="text-xs" style={S.muted}> / {f.piglets_born_total}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap text-xs">
                          <span style={S.danger}>{f.piglets_stillborn} still</span>
                          <span className="mx-1" style={S.muted}>•</span>
                          <span style={S.sub}>{f.piglets_mummified} mum</span>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap text-xs font-mono" style={S.sub}>
                          <div className="font-medium" style={S.primary}>{f.total_litter_weight_kg ? `${f.total_litter_weight_kg} kg` : "—"}</div>
                          {f.avg_birth_weight_kg && (
                            <div className="text-[11px]" style={S.muted}>avg {f.avg_birth_weight_kg} kg</div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap">
                          {f.piglets_weaned > 0 ? (
                            <div>
                              <span className="font-bold text-xs" style={S.accent}>{f.piglets_weaned} weaned</span>
                              {f.weaning_survival_rate_pct && (
                                <span className="text-[11px] block" style={S.muted}>{f.weaning_survival_rate_pct}% survival</span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border" style={S.warning}>
                              Lactating (Due {f.weaning_date})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => {
                              setSelectedFarrow(f);
                              setShowWeanModal(true);
                            }}
                          >
                            Record Weaning
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          )}

          {/* TAB 3: BOAR SEMEN AI STATION */}
          {subTab === "semen" && (
            <div className="overflow-x-auto rounded-[var(--radius-lg)] border shadow-sm" style={S.surface}>
              <table className="w-full text-left text-xs border-collapse">
                <TableHeader>
                  <tr className="border-b" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                    <TableHead className="h-11 px-4 min-w-[170px]">Boar</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Collection Date</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Doses Collected</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Running Cost</TableHead>
                    <TableHead className="h-11 px-4 w-36 whitespace-nowrap">Unit Cost / Dose</TableHead>
                    <TableHead className="h-11 px-4 w-44 whitespace-nowrap">Internal / Sold</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {semenBatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center" style={S.muted}>
                        No semen collection logs found. Click &quot;Log Semen Collection&quot; to begin.
                      </TableCell>
                    </TableRow>
                  ) : (
                    semenBatches.map((s) => (
                      <TableRow key={s.semen_batch_id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <TableCell className="px-4 py-3.5 align-middle">
                          <div className="font-semibold text-xs" style={S.primary}>{s.boar_code}</div>
                          <div className="text-[11px] mt-0.5" style={S.sub}>Tag: {s.boar_tag || "—"}</div>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-mono text-xs" style={S.sub}>
                          {s.collection_date}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-bold text-xs" style={S.accent}>
                          {s.doses_collected} doses
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-mono text-xs" style={S.sub}>
                          ₹{Number(s.running_cost_period || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap font-mono text-xs font-bold" style={S.success}>
                          ₹{Number(s.unit_cost_per_dose || 0).toFixed(2)} / dose
                        </TableCell>
                        <TableCell className="px-4 py-3.5 align-middle whitespace-nowrap text-xs" style={S.sub}>
                          <span className="font-medium" style={S.primary}>{s.doses_used_internal || 0} internal</span>
                          <span className="mx-1" style={S.muted}>•</span>
                          <span className="font-medium" style={S.primary}>{s.doses_sold || 0} sold</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD MATING */}
      {/* ========================================================================= */}
      {showMatingModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-[var(--radius-xl)] border max-w-lg w-full p-6 space-y-4 shadow-2xl" style={S.surface}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={S.primary}>
              <Heart className="w-5 h-5" style={S.accent} /> Record Mating / AI Insemination
            </h3>
            <form onSubmit={handleCreateMating} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Sow / Gilt *</label>
                <select
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={matingForm.sow_animal_id}
                  onChange={(e) => setMatingForm({ ...matingForm, sow_animal_id: e.target.value })}
                  required
                >
                  <option value="">Select Sow...</option>
                  {sows.map((s) => (
                    <option key={s.animal_id} value={s.animal_id}>
                      {s.animal_code} (Tag: {s.ear_tag || "N/A"}) - Parity {s.parity_count}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Mating Type *</label>
                  <select
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={matingForm.mating_type}
                    onChange={(e) => setMatingForm({ ...matingForm, mating_type: e.target.value })}
                  >
                    <option value="AI">AI (Artificial Insemination)</option>
                    <option value="NATURAL_MATING">Natural Mating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Mating Date *</label>
                  <input
                    type="date"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={matingForm.mating_date}
                    onChange={(e) => setMatingForm({ ...matingForm, mating_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {matingForm.mating_type === "NATURAL_MATING" ? (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Boar Animal *</label>
                  <select
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={matingForm.boar_animal_id}
                    onChange={(e) => setMatingForm({ ...matingForm, boar_animal_id: e.target.value })}
                    required
                  >
                    <option value="">Select Boar...</option>
                    {boars.map((b) => (
                      <option key={b.animal_id} value={b.animal_id}>
                        {b.animal_code} (Tag: {b.ear_tag || "N/A"})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={S.sub}>Semen Lot ID</label>
                    <input
                      type="text"
                      placeholder="e.g. SEM-BOAR-2026-01"
                      className="nf-input w-full text-sm"
                      style={S.input}
                      value={matingForm.semen_lot_id}
                      onChange={(e) => setMatingForm({ ...matingForm, semen_lot_id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={S.sub}>Dose Quantity</label>
                    <input
                      type="number"
                      step="0.1"
                      className="nf-input w-full text-sm"
                      style={S.input}
                      value={matingForm.semen_dose_qty}
                      onChange={(e) => setMatingForm({ ...matingForm, semen_dose_qty: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Second Insemination Date (48hr repeat)</label>
                <input
                  type="date"
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={matingForm.second_mating_date}
                  onChange={(e) => setMatingForm({ ...matingForm, second_mating_date: e.target.value })}
                />
              </div>

              <div className="p-3 rounded-[var(--radius-md)] border text-xs space-y-1" style={S.raised}>
                <div className="flex justify-between">
                  <span style={S.sub}>Scheduled Gestation:</span>
                  <span className="font-semibold" style={S.primary}>114 days</span>
                </div>
                <div className="flex justify-between">
                  <span style={S.sub}>Ultrasound Check:</span>
                  <span className="font-semibold" style={S.primary}>28 days post-mating</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowMatingModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Recording..." : "Save Mating Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREGNANCY CHECK */}
      {/* ========================================================================= */}
      {showPregCheckModal && selectedMating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-[var(--radius-xl)] border max-w-md w-full p-6 space-y-4 shadow-2xl" style={S.surface}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={S.primary}>
              <CheckCircle2 className="w-5 h-5" style={S.success} /> Record Pregnancy Check
            </h3>
            <p className="text-xs" style={S.sub}>
              Sow: <span className="font-semibold" style={S.primary}>{selectedMating.sow_code}</span> (Mated on {selectedMating.mating_date})
            </p>
            <form onSubmit={handlePregCheck} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Result *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPregCheckForm({ ...pregCheckForm, pregnancy_confirmed: true })}
                    className="py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    style={pregCheckForm.pregnancy_confirmed ? S.success : S.surface}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirmed Pregnant
                  </button>
                  <button
                    type="button"
                    onClick={() => setPregCheckForm({ ...pregCheckForm, pregnancy_confirmed: false })}
                    className="py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    style={!pregCheckForm.pregnancy_confirmed ? S.danger : S.surface}
                  >
                    <XCircle className="w-4 h-4" /> Failed / Not Pregnant
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Check Method</label>
                <select
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={pregCheckForm.preg_check_method}
                  onChange={(e) => setPregCheckForm({ ...pregCheckForm, preg_check_method: e.target.value })}
                >
                  <option value="ULTRASOUND">Ultrasound Scan</option>
                  <option value="RECTAL">Rectal Palpation</option>
                  <option value="VISUAL">Visual Heat Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Check Date</label>
                <input
                  type="date"
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={pregCheckForm.preg_check_date}
                  onChange={(e) => setPregCheckForm({ ...pregCheckForm, preg_check_date: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPregCheckModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Update Pregnancy Status"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD FARROWING */}
      {/* ========================================================================= */}
      {showFarrowModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-[var(--radius-xl)] border max-w-lg w-full p-6 space-y-4 shadow-2xl" style={S.surface}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={S.primary}>
              <Baby className="w-5 h-5" style={S.accent} /> Record Sow Farrowing Event
            </h3>
            <form onSubmit={handleCreateFarrowing} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Sow *</label>
                <select
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={farrowForm.sow_animal_id}
                  onChange={(e) => setFarrowForm({ ...farrowForm, sow_animal_id: e.target.value })}
                  required
                >
                  <option value="">Select Sow...</option>
                  {sows.map((s) => (
                    <option key={s.animal_id} value={s.animal_id}>
                      {s.animal_code} (Tag: {s.ear_tag || "N/A"}) - Parity {s.parity_count}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Farrowing Date *</label>
                  <input
                    type="date"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={farrowForm.farrowing_date}
                    onChange={(e) => setFarrowForm({ ...farrowForm, farrowing_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Farrowing Status</label>
                  <select
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={farrowForm.farrowing_status}
                    onChange={(e) => setFarrowForm({ ...farrowForm, farrowing_status: e.target.value })}
                  >
                    <option value="NORMAL">Normal Unassisted</option>
                    <option value="ASSISTED">Assisted Delivery</option>
                    <option value="C_SECTION">Caesarean Section</option>
                    <option value="COMPLICATIONS">Complications</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.success}>Born Live *</label>
                  <input
                    type="number"
                    min="0"
                    className="nf-input w-full text-sm font-bold"
                    style={S.input}
                    value={farrowForm.piglets_born_live}
                    onChange={(e) => setFarrowForm({ ...farrowForm, piglets_born_live: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.danger}>Stillborn</label>
                  <input
                    type="number"
                    min="0"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={farrowForm.piglets_stillborn}
                    onChange={(e) => setFarrowForm({ ...farrowForm, piglets_stillborn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Mummified</label>
                  <input
                    type="number"
                    min="0"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={farrowForm.piglets_mummified}
                    onChange={(e) => setFarrowForm({ ...farrowForm, piglets_mummified: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Avg Birth Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.45"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={farrowForm.avg_birth_weight_kg}
                    onChange={(e) => setFarrowForm({ ...farrowForm, avg_birth_weight_kg: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Total Litter Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Auto-calculated if empty"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={farrowForm.total_litter_weight_kg}
                    onChange={(e) => setFarrowForm({ ...farrowForm, total_litter_weight_kg: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowFarrowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Farrowing Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD WEANING */}
      {/* ========================================================================= */}
      {showWeanModal && selectedFarrow && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-[var(--radius-xl)] border max-w-md w-full p-6 space-y-4 shadow-2xl" style={S.surface}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={S.primary}>
              <CheckCircle2 className="w-5 h-5" style={S.accent} /> Record Litter Weaning
            </h3>
            <p className="text-xs" style={S.sub}>
              Sow: <span className="font-semibold" style={S.primary}>{selectedFarrow.sow_code}</span> (Farrowed on {selectedFarrow.farrowing_date})
            </p>
            <form onSubmit={handleWeaning} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Weaning Date *</label>
                <input
                  type="date"
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={weanForm.weaning_date}
                  onChange={(e) => setWeanForm({ ...weanForm, weaning_date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.accent}>Piglets Weaned *</label>
                  <input
                    type="number"
                    min="0"
                    className="nf-input w-full text-sm font-bold"
                    style={S.input}
                    value={weanForm.piglets_weaned}
                    onChange={(e) => setWeanForm({ ...weanForm, piglets_weaned: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Avg Wean Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7.5"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={weanForm.avg_weaning_weight_kg}
                    onChange={(e) => setWeanForm({ ...weanForm, avg_weaning_weight_kg: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowWeanModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Weaning Outcome"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG SEMEN COLLECTION */}
      {/* ========================================================================= */}
      {showSemenModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-[var(--radius-xl)] border max-w-lg w-full p-6 space-y-4 shadow-2xl" style={S.surface}>
            <h3 className="text-lg font-bold flex items-center gap-2" style={S.primary}>
              <FlaskConical className="w-5 h-5" style={S.accent} /> Log Boar Semen Collection
            </h3>
            <form onSubmit={handleCreateSemen} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={S.sub}>Boar Animal *</label>
                <select
                  className="nf-input w-full text-sm"
                  style={S.input}
                  value={semenForm.boar_animal_id}
                  onChange={(e) => setSemenForm({ ...semenForm, boar_animal_id: e.target.value })}
                  required
                >
                  <option value="">Select Boar...</option>
                  {boars.map((b) => (
                    <option key={b.animal_id} value={b.animal_id}>
                      {b.animal_code} (Tag: {b.ear_tag || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.sub}>Collection Date *</label>
                  <input
                    type="date"
                    className="nf-input w-full text-sm"
                    style={S.input}
                    value={semenForm.collection_date}
                    onChange={(e) => setSemenForm({ ...semenForm, collection_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={S.accent}>Doses Collected *</label>
                  <input
                    type="number"
                    min="1"
                    className="nf-input w-full text-sm font-bold"
                    style={S.input}
                    value={semenForm.doses_collected}
                    onChange={(e) => setSemenForm({ ...semenForm, doses_collected: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-[var(--radius-md)] border space-y-2" style={S.raised}>
                <div className="text-xs font-semibold" style={S.primary}>Period Running Costs (for Unit Cost calculation)</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px]" style={S.muted}>Amortisation (₹)</label>
                    <input
                      type="number"
                      className="nf-input w-full text-xs"
                      style={S.input}
                      value={semenForm.amortisation_period}
                      onChange={(e) => setSemenForm({ ...semenForm, amortisation_period: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px]" style={S.muted}>Feed Cost (₹)</label>
                    <input
                      type="number"
                      className="nf-input w-full text-xs"
                      style={S.input}
                      value={semenForm.feed_cost_period}
                      onChange={(e) => setSemenForm({ ...semenForm, feed_cost_period: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px]" style={S.muted}>Drugs / Med (₹)</label>
                    <input
                      type="number"
                      className="nf-input w-full text-xs"
                      style={S.input}
                      value={semenForm.drug_cost_period}
                      onChange={(e) => setSemenForm({ ...semenForm, drug_cost_period: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px]" style={S.muted}>Lab Overhead (₹)</label>
                    <input
                      type="number"
                      className="nf-input w-full text-xs"
                      style={S.input}
                      value={semenForm.overhead_cost_period}
                      onChange={(e) => setSemenForm({ ...semenForm, overhead_cost_period: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowSemenModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Calculating & Saving..." : "Save Collection Batch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
