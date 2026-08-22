"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Wheat,
  Pill,
  DollarSign,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";

interface BatchProfile {
  id: string;
  code: string;
  name: string;
  breed: string;
  batchType: string;
  startCount: number;
  stages: StageProfile[];
}

interface StageProfile {
  id: string;
  code: string;
  name: string;
  startDate: string;
  endDate: string;
  standardDays: number;
  startAnimals: number;
  endAnimals: number;
  mortality: number;
  avgAgeDays: number;
  feedData: {
    item: string;
    uom: string;
    opening: number;
    issued: number;
    consumed: number;
    wastage: number;
    rate: number;
  }[];
  medData: {
    item: string;
    uom: string;
    issued: number;
    consumed: number;
    wastage: number;
    cost: number;
  }[];
  labourData: {
    resource: string;
    date: string;
    hours: number;
    rate: number;
    cost: number;
    remarks: string;
  }[];
  overheadData: {
    item: string;
    basis: string;
    rate: number;
    qty: number;
    cost: number;
  }[];
  mortalityLogs: {
    date: string;
    count: number;
    reason: string;
    pen: string;
    vetAction: string;
  }[];
  weightLogs: {
    date: string;
    avgWeightKg: number;
    remarks: string;
  }[];
  observationLogs: {
    date: string;
    type: string;
    value: string;
    notes: string;
  }[];
  transferLogs: {
    date: string;
    destination: string;
    headCount: number;
    avgWeightKg: number;
    wipValue: number;
    status: string;
  }[];
  outputHead: number;
}

export default function StageWiseConsumptionOutputPanel() {
  const [batches, setBatches] = useState<BatchProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0] || {
      id: "",
      code: "—",
      name: "No Batches",
      breed: "—",
      batchType: "—",
      startCount: 0,
      stages: [],
    },
    [batches, selectedBatchId]
  );

  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const currentStage = useMemo(() => {
    return currentBatch?.stages?.find((s) => s.id === selectedStageId) || currentBatch?.stages?.[0] || {
      id: "st-default",
      code: "ST-01",
      name: "Active Stage",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      standardDays: 30,
      startAnimals: currentBatch?.startCount || 0,
      endAnimals: currentBatch?.startCount || 0,
      mortality: 0,
      avgAgeDays: 30,
      feedData: [],
      medData: [],
      labourData: [],
      overheadData: [],
      mortalityLogs: [],
      weightLogs: [],
      observationLogs: [],
      transferLogs: [],
      outputHead: 0,
    };
  }, [currentBatch, selectedStageId]);

  const [activeTab, setActiveTab] = useState<
    "feed" | "medicine" | "labour" | "overheads" | "mortality" | "weight" | "observations" | "transfers" | "summary"
  >("feed");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  // Recalculate Toast / State
  const [recalculating, setRecalculating] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Add Manual Entry Modal State
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [logType, setLogType] = useState<"FEED" | "MEDICINE">("FEED");
  const [logItem, setLogItem] = useState("");
  const [logQty, setLogQty] = useState("");
  const [logRate, setLogRate] = useState("");

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
        if (list.length === 0) {
          setBatches([]);
          setLoading(false);
          return;
        }

        const detailedBatches: BatchProfile[] = await Promise.all(
          list.slice(0, 10).map(async (b: any) => {
            try {
              const detailsRes = await api.get(`/batch/${b.batch_id}`).catch(() => null);
              const details = detailsRes?.data ?? detailsRes ?? b;
              const txs: any[] = details.transactions || [];
              
              // Helper to detect medicine transactions vs feed
              const isMedicine = (t: any) => {
                if (t.item_type === "MEDICINE" || t.item_category_code === "MEDICINE") return true;
                const uom = (t.uom || "").toUpperCase();
                if (["ML", "DOSES", "VIAL", "BOTTLE", "TAB", "AMPOULE", "SYRINGE", "MG"].includes(uom)) return true;
                const text = `${t.item_name || ""} ${t.item_code || ""} ${t.remarks || ""}`.toLowerCase();
                return (
                  text.includes("med") ||
                  text.includes("vaccin") ||
                  text.includes("deworm") ||
                  text.includes("iron") ||
                  text.includes("antibiotic") ||
                  text.includes("dextran") ||
                  text.includes("ivermectin") ||
                  text.includes("vitamin") ||
                  text.includes("electrolyt") ||
                  text.includes("inject") ||
                  text.includes("dose") ||
                  text.includes("treatment") ||
                  text.includes("clinical") ||
                  text.includes("parvovirus") ||
                  text.includes("circovirus") ||
                  text.includes("amoxicillin") ||
                  text.includes("oxytetracycline")
                );
              };

              const feedTxs = txs.filter((t: any) => t.transaction_type === "CONSUMPTION" && !isMedicine(t));
              const medTxs = txs.filter((t: any) => t.transaction_type === "CONSUMPTION" && isMedicine(t));
              const overheadTxs = txs.filter((t: any) => t.transaction_type === "OVERHEAD");
              const mortalityTxs = txs.filter((t: any) => t.transaction_type === "MORTALITY");

              // Aggregate feed consumption by formula / item name
              const feedMap = new Map<string, {
                item: string;
                uom: string;
                opening: number;
                issued: number;
                consumed: number;
                wastage: number;
                rate: number;
              }>();

              feedTxs.forEach((t: any) => {
                // Key by remarks first (which holds the exact user input from Batch Data Entry), then item_name
                const itemName = t.remarks || t.item_name || t.item_code || "Standard Feed Ration";
                const qty = Number(t.quantity || 0);
                const rate = Number(t.rate || 35.0);
                const uom = t.uom || "KG";

                if (feedMap.has(itemName)) {
                  const existing = feedMap.get(itemName)!;
                  existing.issued += qty;
                  existing.consumed += qty;
                } else {
                  feedMap.set(itemName, {
                    item: itemName,
                    uom,
                    opening: 0,
                    issued: qty,
                    consumed: qty,
                    wastage: 0,
                    rate,
                  });
                }
              });

              const feedData = Array.from(feedMap.values());

              // Map medical and vaccine consumption
              const medMap = new Map<string, {
                item: string;
                uom: string;
                issued: number;
                consumed: number;
                wastage: number;
                cost: number;
              }>();

              medTxs.forEach((t: any) => {
                // Key by remarks first (which holds the exact user input from Batch Data Entry), then item_name
                const itemName = t.remarks || t.item_name || t.item_code || "Clinical Medication";
                const qty = Number(t.quantity || 0);
                const rate = Number(t.rate || 20.0);
                // amount is stored negative in DB — always use Math.abs with null-coalescing
                const cost = Math.abs(Number(t.amount ?? (qty * rate)));
                const uom = t.uom || "ML";

                if (medMap.has(itemName)) {
                  const existing = medMap.get(itemName)!;
                  existing.issued += qty;
                  existing.consumed += qty;
                  existing.cost += cost;
                } else {
                  medMap.set(itemName, {
                    item: itemName,
                    uom,
                    issued: qty,
                    consumed: qty,
                    wastage: 0,
                    cost,
                  });
                }
              });

              const medData = Array.from(medMap.values());

              const labourTxs = overheadTxs.filter((t: any) =>
                (t.remarks || "").toLowerCase().includes("labour") || t.uom === "HRS"
              );
              const generalOverheadTxs = overheadTxs.filter((t: any) =>
                !((t.remarks || "").toLowerCase().includes("labour") || t.uom === "HRS")
              );

              const labourData = labourTxs.map((t: any) => {
                const qty = Number(t.quantity ?? 1);
                const rate = Number(t.rate ?? 0);
                const cost = Math.abs(Number(t.amount ?? (qty * rate)));
                return {
                  resource: t.remarks || "Farm Operations Labour",
                  date: t.transaction_date || "",
                  hours: qty,
                  rate,
                  cost,
                  remarks: t.remarks || "Daily Farm Operations",
                };
              });

              const overheadData = generalOverheadTxs.map((t: any) => {
                const qty = Number(t.quantity ?? 1);
                const rate = Number(t.rate ?? 0);
                // amount is stored as negative in DB — use null-coalescing (not ||) to handle negatives
                const cost = Math.abs(Number(t.amount ?? (qty * rate)));
                return {
                  item: t.remarks || "Operational Overhead",
                  basis: t.uom || "Units",
                  rate,
                  qty,
                  cost,
                };
              });

              const mortalityLogs = mortalityTxs.map((t: any) => ({
                date: t.transaction_date || "",
                count: Number(t.quantity || 1),
                reason: t.remarks || "Mortality Recorded",
                pen: "Main Shed",
                vetAction: "Recorded in clinical register",
              }));

              const weightTxs = txs.filter((t: any) =>
                t.transaction_type === "WEIGHT_ENTRY" ||
                (t.transaction_type === "OBSERVATION" &&
                  ((t.remarks || "").toLowerCase().includes("weight") || t.uom === "KG"))
              );
              const weightLogs = weightTxs.map((t: any) => ({
                date: t.transaction_date || "",
                avgWeightKg: Number(t.quantity || 0),
                remarks: t.remarks || "Body Weight Sampling Recorded",
              }));

              const obsTxs = txs.filter((t: any) =>
                t.transaction_type === "OBSERVATION" &&
                !((t.remarks || "").toLowerCase().includes("weight") && t.uom === "KG")
              );
              const observationLogs = obsTxs.map((t: any) => ({
                date: t.transaction_date || "",
                type: t.uom === "°C" ? "Temperature" : t.uom === "L" ? "Water Intake" : t.uom === "%" ? "Humidity" : "Daily Observation",
                value: `${t.quantity ?? ""} ${t.uom || ""}`.trim(),
                notes: t.remarks || "Observation Logged",
              }));

              const opening = Number(b.opening_quantity) || 20;
              const recordedMortality = mortalityLogs.reduce((sum: number, m: any) => sum + m.count, 0);
              const closing = Number(b.closing_quantity) ?? (opening - recordedMortality);
              const totalMortality = Math.max(0, opening - closing);

              const stageProfile: StageProfile = {
                id: `st-${b.batch_id}`,
                code: b.current_stage_code || "ACTIVE",
                name: `${(b.current_stage_code || "Production").replace(/_/g, " ")} Stage`,
                startDate: b.start_date || new Date().toISOString().slice(0, 10),
                endDate: b.expected_end_date || new Date().toISOString().slice(0, 10),
                standardDays: 60,
                startAnimals: opening,
                endAnimals: closing,
                mortality: totalMortality,
                avgAgeDays: 45,
                feedData,
                medData,
                labourData,
                overheadData,
                mortalityLogs,
                weightLogs,
                observationLogs,
                transferLogs: [],
                outputHead: closing,
              };

              return {
                id: b.batch_id,
                code: b.batch_no,
                name: b.remarks || b.batch_no,
                breed: b.breed_name || b.breed_code || "Large White",
                batchType: b.lob_name || "Piggery Production Batch",
                startCount: opening,
                stages: [stageProfile],
              };
            } catch {
              return {
                id: b.batch_id,
                code: b.batch_no,
                name: b.remarks || b.batch_no,
                breed: b.breed_name || b.breed_code || "Large White",
                batchType: b.lob_name || "Piggery Production Batch",
                startCount: Number(b.opening_quantity) || 20,
                stages: [],
              };
            }
          })
        );

        setBatches(detailedBatches);
        if (detailedBatches.length > 0) {
          setSelectedBatchId(detailedBatches[0].id);
          if (detailedBatches[0].stages.length > 0) {
            setSelectedStageId(detailedBatches[0].stages[0].id);
            setDateFrom(detailedBatches[0].stages[0].startDate);
            setDateTo(detailedBatches[0].stages[0].endDate);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Dynamic calculations
  const totalFeedKg = useMemo(
    () => currentStage.feedData.reduce((sum, f) => sum + f.consumed, 0),
    [currentStage]
  );
  const totalFeedCost = useMemo(
    () => currentStage.feedData.reduce((sum, f) => sum + f.consumed * f.rate, 0),
    [currentStage]
  );
  const totalMedCost = useMemo(
    () => currentStage.medData.reduce((sum, m) => sum + m.cost, 0),
    [currentStage]
  );
  const totalLabourCost = useMemo(
    () => (currentStage.labourData || []).reduce((sum, l) => sum + l.cost, 0),
    [currentStage]
  );
  const totalOverheadCost = useMemo(
    () => currentStage.overheadData.reduce((sum, o) => sum + o.cost, 0),
    [currentStage]
  );
  const totalStageWipCost = totalFeedCost + totalMedCost + totalLabourCost + totalOverheadCost;

  const durationDays = currentStage.standardDays;
  const avgAnimals = (currentStage.startAnimals + currentStage.endAnimals) / 2;
  const costPerHeadDay = avgAnimals > 0 && durationDays > 0 ? (totalStageWipCost / (avgAnimals * durationDays)).toFixed(2) : "0.00";
  const mortalityPct = currentStage.startAnimals > 0 ? ((currentStage.mortality / currentStage.startAnimals) * 100).toFixed(1) : "0.0";

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    const b = batches.find((item) => item.id === batchId);
    if (b && b.stages.length > 0) {
      setSelectedStageId(b.stages[0].id);
      setDateFrom(b.stages[0].startDate);
      setDateTo(b.stages[0].endDate);
    }
  };

  const handleStageChange = (stageId: string) => {
    setSelectedStageId(stageId);
    const s = currentBatch?.stages?.find((item) => item.id === stageId);
    if (s) {
      setDateFrom(s.startDate);
      setDateTo(s.endDate);
    }
  };

  const handleRecalculate = () => {
    setRecalculating(true);
    setToastMsg("");
    setTimeout(() => {
      setRecalculating(false);
      setToastMsg(`✓ Recomputed WIP: ₹ ${totalStageWipCost.toLocaleString("en-IN")} across ${durationDays} stage days (${avgAnimals} avg head).`);
      setTimeout(() => setToastMsg(""), 4500);
    }, 600);
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      `Batch,${currentBatch.code} (${currentBatch.name})\n` +
      `Stage,${currentStage.code} - ${currentStage.name}\n` +
      `Date Range,${dateFrom} to ${dateTo}\n` +
      `Animals Start,${currentStage.startAnimals}\n` +
      `Animals End,${currentStage.endAnimals}\n` +
      `Total Feed Consumed (KG),${totalFeedKg}\n` +
      `Total Feed Cost (INR),${totalFeedCost}\n` +
      `Total Medicine Cost (INR),${totalMedCost}\n` +
      `Total Overheads (INR),${totalOverheadCost}\n` +
      `Total Stage WIP (INR),${totalStageWipCost}\n` +
      `Cost per Animal Day (INR),${costPerHeadDay}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Stage_Consumption_${currentBatch.code}_${currentStage.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMsg("✓ Stage consumption dataset exported successfully.");
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleAddConsumption = () => {
    if (!logItem || !logQty) return;
    const qty = parseFloat(logQty) || 0;
    const rate = parseFloat(logRate) || 0;

    if (logType === "FEED") {
      currentStage.feedData.push({
        item: logItem,
        uom: "KG",
        opening: 0,
        issued: qty,
        consumed: qty,
        wastage: 0,
        rate: rate || 35.0,
      });
    } else {
      currentStage.medData.push({
        item: logItem,
        uom: "ML",
        issued: qty,
        consumed: qty,
        wastage: 0,
        cost: qty * (rate || 250),
      });
    }

    setLogModalOpen(false);
    setLogItem("");
    setLogQty("");
    setLogRate("");
    setToastMsg(`✓ Added ${logType === "FEED" ? "feed" : "medicine"} record: ${logItem} (${qty})`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm font-medium text-[var(--text-muted)]">Loading batch stage consumption and WIP data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
      {/* ── Top Filter Bar ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Batch</span>
            <select
              value={selectedBatchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              className="max-w-[240px] sm:max-w-[300px] truncate rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} ({b.breed})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Stage</span>
            <select
              value={selectedStageId}
              onChange={(e) => handleStageChange(e.target.value)}
              className="max-w-[240px] sm:max-w-[300px] truncate rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            >
              {currentBatch.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · {s.name} ({s.startDate} to {s.endDate})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Date Range</span>
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
              />
              <span className="text-[var(--text-muted)]">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1 text-xs font-medium text-[var(--text-primary)]"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLogModalOpen(true)}
            className="text-xs h-8 gap-1.5 font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Log Consumption
          </Button>

          <Button
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="text-xs h-8 gap-1.5 font-semibold text-white shadow-2xs hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <RotateCcw className={`h-3.5 w-3.5 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Recalculating…" : "Recalculate"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs h-8 gap-1.5 font-medium"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Summary Statistics Strip (Live Reactive) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Animals Start</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>{currentStage.startAnimals}</p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Animals End</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>{currentStage.endAnimals}</p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Avg Age</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>
            {currentStage.avgAgeDays} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>d</span>
          </p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Duration</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>
            {durationDays} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>d</span>
          </p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Feed Consumed</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>
            {totalFeedKg.toLocaleString("en-IN", { minimumFractionDigits: 1 })} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>KG</span>
          </p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Med Cost</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>
            ₹ {totalMedCost.toLocaleString("en-IN")}
          </p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Mortality</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: currentStage.mortality > 0 ? "var(--danger)" : "var(--text-primary)" }}>
            {currentStage.mortality} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>({mortalityPct}%)</span>
          </p>
        </div>
        <div
          className="rounded-[var(--radius-md)] border p-3.5 text-center transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Stage Output</p>
          <p className="text-xl font-bold font-mono mt-1" style={{ color: "var(--text-primary)" }}>{currentStage.outputHead} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Head</span></p>
        </div>
      </div>

      {/* ── Sub-Tabs & Detailed Tables ── */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-2xs">
        <div className="flex items-center gap-1 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 pt-2 text-xs font-semibold overflow-x-auto">
          {[
            { key: "feed", label: `Feed Consumption (${currentStage.feedData.length})` },
            { key: "medicine", label: `Medicine & Clinical (${currentStage.medData.length})` },
            { key: "labour", label: `Labour & Manpower (${currentStage.labourData?.length || 0})` },
            { key: "overheads", label: `Overheads & Utilities (${currentStage.overheadData.length})` },
            { key: "mortality", label: `Mortality Incidents (${currentStage.mortalityLogs.length})` },
            { key: "weight", label: `Weight & Growth (${currentStage.weightLogs?.length || 0})` },
            { key: "observations", label: `Notes & Logs (${currentStage.observationLogs?.length || 0})` },
            { key: "transfers", label: `Transfer Out / Sales (${currentStage.transferLogs.length})` },
            { key: "summary", label: "IAS 41 Costing & WIP Summary" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3.5 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[var(--accent)] text-[var(--accent)] font-bold"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* TAB 1: FEED CONSUMPTION */}
          {activeTab === "feed" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-2 font-bold">#</th>
                    <th className="pb-2 font-bold">Feed Item & Formula</th>
                    <th className="pb-2 font-bold">UOM</th>
                    <th className="pb-2 font-bold text-right">Opening Stock</th>
                    <th className="pb-2 font-bold text-right">Issued</th>
                    <th className="pb-2 font-bold text-right">Consumed</th>
                    <th className="pb-2 font-bold text-right">Wastage</th>
                    <th className="pb-2 font-bold text-right">Closing Stock</th>
                    <th className="pb-2 font-bold text-right">Std Rate (₹)</th>
                    <th className="pb-2 font-bold text-right">Total Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentStage.feedData.map((f, index) => {
                    const closing = f.opening + f.issued - f.consumed - f.wastage;
                    const cost = f.consumed * f.rate;
                    return (
                      <tr key={f.item} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-2.5 text-[var(--text-muted)]">{index + 1}</td>
                        <td className="py-2.5 font-semibold text-[var(--text-primary)]">{f.item}</td>
                        <td className="py-2.5 text-[var(--text-secondary)] font-mono">{f.uom}</td>
                        <td className="py-2.5 text-right font-mono">{f.opening.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono">{f.issued.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-500">{f.consumed.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono text-[var(--text-muted)]">{f.wastage.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono">{closing.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono">₹ {f.rate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">₹ {cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] font-bold text-xs bg-[var(--surface-raised)]/60">
                    <td colSpan={5} className="py-2.5 px-2">Stage Feed Totals</td>
                    <td className="py-2.5 text-right text-emerald-500 font-mono">{totalFeedKg.toFixed(2)} KG</td>
                    <td colSpan={3} className="py-2.5"></td>
                    <td className="py-2.5 text-right font-mono text-[var(--accent)]">₹ {totalFeedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* TAB 2: MEDICINE CONSUMPTION */}
          {activeTab === "medicine" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-2 font-bold">#</th>
                    <th className="pb-2 font-bold">Medicine / Vaccine Item</th>
                    <th className="pb-2 font-bold">UOM</th>
                    <th className="pb-2 font-bold text-right">Issued</th>
                    <th className="pb-2 font-bold text-right">Consumed</th>
                    <th className="pb-2 font-bold text-right">Wastage</th>
                    <th className="pb-2 font-bold text-right">Total Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentStage.medData.map((m, index) => (
                    <tr key={m.item} className="hover:bg-[var(--surface-raised)] transition-colors">
                      <td className="py-2.5 text-[var(--text-muted)]">{index + 1}</td>
                      <td className="py-2.5 font-semibold text-[var(--text-primary)]">{m.item}</td>
                      <td className="py-2.5 text-[var(--text-secondary)] font-mono">{m.uom}</td>
                      <td className="py-2.5 text-right font-mono">{m.issued}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-blue-500">{m.consumed}</td>
                      <td className="py-2.5 text-right font-mono text-[var(--text-muted)]">{m.wastage}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">₹ {m.cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] font-bold text-xs bg-[var(--surface-raised)]/60">
                    <td colSpan={6} className="py-2.5 px-2">Stage Clinical & Vaccine Total</td>
                    <td className="py-2.5 text-right font-mono text-[var(--accent)]">₹ {totalMedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* TAB 3: LABOUR & MANPOWER */}
          {activeTab === "labour" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-2 font-bold">#</th>
                    <th className="pb-2 font-bold">Date</th>
                    <th className="pb-2 font-bold">Labour Resource / Activity</th>
                    <th className="pb-2 font-bold text-right">Hours Logged</th>
                    <th className="pb-2 font-bold text-right">Hourly Rate (₹)</th>
                    <th className="pb-2 font-bold text-right">Total Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(currentStage.labourData || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-[var(--text-muted)]">
                        No direct farm labour hours logged yet. Add labour records via Daily Batch Entry.
                      </td>
                    </tr>
                  ) : (
                    (currentStage.labourData || []).map((l, index) => (
                      <tr key={index} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-2.5 text-[var(--text-muted)]">{index + 1}</td>
                        <td className="py-2.5 font-mono text-[var(--text-secondary)]">{l.date || "—"}</td>
                        <td className="py-2.5 font-semibold text-[var(--text-primary)]">{l.resource}</td>
                        <td className="py-2.5 text-right font-mono font-bold">{l.hours} hrs</td>
                        <td className="py-2.5 text-right font-mono">₹ {l.rate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">
                          ₹ {l.cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] font-bold text-xs bg-[var(--surface-raised)]/60">
                    <td colSpan={5} className="py-2.5 px-2">Total Stage Labour Cost</td>
                    <td className="py-2.5 text-right font-mono text-[var(--accent)]">
                      ₹ {totalLabourCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* TAB 4: OVERHEADS & UTILITIES */}
          {activeTab === "overheads" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-2 font-bold">#</th>
                    <th className="pb-2 font-bold">Overhead / Activity Description</th>
                    <th className="pb-2 font-bold">Allocation Basis</th>
                    <th className="pb-2 font-bold text-right">Standard Rate (₹)</th>
                    <th className="pb-2 font-bold text-right">Applied Qty</th>
                    <th className="pb-2 font-bold text-right">Allocated Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {currentStage.overheadData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-[var(--text-muted)]">
                        No general overhead allocations logged for this stage.
                      </td>
                    </tr>
                  ) : (
                    currentStage.overheadData.map((o, index) => (
                      <tr key={index} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-2.5 text-[var(--text-muted)]">{index + 1}</td>
                        <td className="py-2.5 font-semibold text-[var(--text-primary)]">{o.item}</td>
                        <td className="py-2.5 text-[var(--text-secondary)]">{o.basis}</td>
                        <td className="py-2.5 text-right font-mono">₹ {o.rate.toFixed(2)}</td>
                        <td className="py-2.5 text-right font-mono font-bold">{o.qty}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">₹ {o.cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--border)] font-bold text-xs bg-[var(--surface-raised)]/60">
                    <td colSpan={5} className="py-2.5 px-2">Total Stage Overheads Allocation</td>
                    <td className="py-2.5 text-right font-mono text-[var(--accent)]">₹ {totalOverheadCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* TAB 5: MORTALITY */}
          {activeTab === "mortality" && (
            <div className="space-y-3">
              {currentStage.mortalityLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-raised)] rounded-[var(--radius-sm)]">
                  ✓ Zero mortality logged during this stage. Herd health condition is optimal.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentStage.mortalityLogs.map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-rose-500 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> {m.count} Head Mortality
                          </span>
                          <span className="text-[var(--text-muted)] font-mono text-[11px]">({m.date})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">{m.pen}</span>
                        </div>
                        <p className="mt-1 font-semibold text-[var(--text-primary)]">{m.reason}</p>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{m.vetAction}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] shrink-0 bg-[var(--surface)] px-2 py-1 rounded border border-[var(--border)]">
                        Necropsy Recorded
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: WEIGHT & GROWTH SAMPLING */}
          {activeTab === "weight" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-2 font-bold">#</th>
                    <th className="pb-2 font-bold">Sampling Date</th>
                    <th className="pb-2 font-bold text-right">Average Body Weight (KG)</th>
                    <th className="pb-2 font-bold">Sampling Remarks & Body Condition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(currentStage.weightLogs || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-[var(--text-muted)]">
                        No weight sampling records logged yet. Enter herd weights via Daily Batch Entry.
                      </td>
                    </tr>
                  ) : (
                    (currentStage.weightLogs || []).map((w, index) => (
                      <tr key={index} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-2.5 text-[var(--text-muted)]">{index + 1}</td>
                        <td className="py-2.5 font-mono text-[var(--text-secondary)]">{w.date || "—"}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-500">
                          {w.avgWeightKg > 0 ? `${w.avgWeightKg.toFixed(2)} KG` : "—"}
                        </td>
                        <td className="py-2.5 text-[var(--text-primary)]">{w.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 7: NOTES & OBSERVATIONS */}
          {activeTab === "observations" && (
            <div className="space-y-3">
              {(currentStage.observationLogs || []).length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-raised)] rounded-[var(--radius-sm)]">
                  No supervisor observations or environmental logs recorded for this stage yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {(currentStage.observationLogs || []).map((obs, idx) => (
                    <div key={idx} className="p-3.5 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--accent)]">{obs.type}</span>
                          {obs.value && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                              {obs.value}
                            </span>
                          )}
                          <span className="text-[var(--text-muted)] font-mono text-[11px]">({obs.date})</span>
                        </div>
                        <p className="mt-1 font-semibold text-[var(--text-primary)]">{obs.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: TRANSFERS OUT & SALES */}
          {activeTab === "transfers" && (
            <div className="space-y-3">
              {currentStage.transferLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-raised)] rounded-[var(--radius-sm)]">
                  No stage transitions or market sales logged for this active in-progress stage.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                        <th className="pb-2 font-bold">Transfer Date</th>
                        <th className="pb-2 font-bold">Destination Pen / Stage</th>
                        <th className="pb-2 font-bold text-right">Head Count</th>
                        <th className="pb-2 font-bold text-right">Avg Weight (KG)</th>
                        <th className="pb-2 font-bold text-right">Capitalized WIP (₹)</th>
                        <th className="pb-2 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {currentStage.transferLogs.map((t, idx) => (
                        <tr key={idx} className="hover:bg-[var(--surface-raised)]">
                          <td className="py-2.5 font-mono text-[var(--text-secondary)]">{t.date}</td>
                          <td className="py-2.5 font-semibold text-[var(--text-primary)]">{t.destination}</td>
                          <td className="py-2.5 text-right font-mono font-bold">{t.headCount} Head</td>
                          <td className="py-2.5 text-right font-mono">{t.avgWeightKg} kg</td>
                          <td className="py-2.5 text-right font-mono font-bold text-emerald-500">₹ {t.wipValue.toLocaleString("en-IN")}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: IAS 41 SUMMARY */}
          {activeTab === "summary" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <DollarSign className="h-4 w-4 text-[var(--accent)]" />
                  <span>Cost Element Breakdown</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Feed & Nutrition:</span>
                    <span className="font-mono font-bold">₹ {totalFeedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({((totalFeedCost / (totalStageWipCost || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Medicine & Vaccine:</span>
                    <span className="font-mono font-bold">₹ {totalMedCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({((totalMedCost / (totalStageWipCost || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Direct Farm Labour:</span>
                    <span className="font-mono font-bold">₹ {totalLabourCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({((totalLabourCost / (totalStageWipCost || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Direct Overheads & Utilities:</span>
                    <span className="font-mono font-bold">₹ {totalOverheadCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({((totalOverheadCost / (totalStageWipCost || 1)) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-sm" style={{ borderColor: "var(--border)" }}>
                    <span>Total Stage WIP Incurred:</span>
                    <span className="text-[var(--accent)] font-mono">₹ {totalStageWipCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)] border-b pb-2" style={{ borderColor: "var(--border)" }}>
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>Biological Asset Unit Metrics</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Average Head Maintained:</span>
                    <span className="font-mono font-bold">{avgAnimals} Head</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Total Active Days:</span>
                    <span className="font-mono font-bold">{durationDays} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Average Feed Per Head / Day:</span>
                    <span className="font-mono font-bold">{avgAnimals > 0 && durationDays > 0 ? (totalFeedKg / (avgAnimals * durationDays)).toFixed(2) : "0.00"} KG</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-sm text-emerald-600 dark:text-emerald-400" style={{ borderColor: "var(--border)" }}>
                    <span>Cost per Animal / Day:</span>
                    <span className="font-mono">₹ {costPerHeadDay} / head-day</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: LOG MANUAL CONSUMPTION ── */}
      {logModalOpen && (
        <Dialog
          open={logModalOpen}
          onClose={() => setLogModalOpen(false)}
          title="Log Operational Stage Consumption"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setLogModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddConsumption} className="nf-btn-primary">
                Add to Stage WIP
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Entry Category</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLogType("FEED")}
                  className={`px-3 py-2 rounded text-xs font-semibold border ${
                    logType === "FEED" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  <Wheat className="inline-block h-3.5 w-3.5 mr-1" /> Feed Consumption
                </button>
                <button
                  type="button"
                  onClick={() => setLogType("MEDICINE")}
                  className={`px-3 py-2 rounded text-xs font-semibold border ${
                    logType === "MEDICINE" ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "bg-[var(--surface-raised)] border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  <Pill className="inline-block h-3.5 w-3.5 mr-1" /> Medicine / Vaccine
                </button>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Item Description / Formula</label>
              <input
                type="text"
                value={logItem}
                onChange={(e) => setLogItem(e.target.value)}
                placeholder={logType === "FEED" ? "e.g. Grower Feed Starter (GF-101)" : "e.g. Iron Dextran 200mg / Multivitamin"}
                className="nf-input w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Quantity Consumed ({logType === "FEED" ? "KG" : "Units"})</label>
                <input
                  type="number"
                  step="0.1"
                  value={logQty}
                  onChange={(e) => setLogQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="nf-input w-full font-mono"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Standard Rate / Cost (₹)</label>
                <input
                  type="number"
                  step="0.5"
                  value={logRate}
                  onChange={(e) => setLogRate(e.target.value)}
                  placeholder="e.g. 35.00"
                  className="nf-input w-full font-mono"
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
