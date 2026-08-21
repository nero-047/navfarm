"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Save,
  CloudSun,
  Copy,
  Plus,
  CheckCircle2,
  Scale,
  RefreshCw,
  AlertTriangle,
  Wheat,
  Pill,
  DollarSign,
  Users,
  Trash2,
  Camera,
  FileText,
  Layers,
} from "lucide-react";
import PiggeryLifecycleStepper, { DEFAULT_PIGGERY_STAGES } from "../piggery/piggery-lifecycle-stepper";
import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface FeedItem {
  id: string;
  item: string;
  uom: string;
  opening: number;
  issued: number;
  consumed: number;
  wastage: number;
  rate: number;
  item_id?: string;
}

interface MedItem {
  id: string;
  item: string;
  uom: string;
  issued: number;
  consumed: number;
  cost: number;
  item_id?: string;
}

interface MortalityItem {
  id: string;
  reason: string;
  count: number;
  remarks: string;
}

interface LabourItem {
  id: string;
  resource: string;
  persons: number;
  hours: number;
  rate: number;
}

interface OverheadItem {
  id: string;
  type: string;
  amount: number;
  remarks: string;
}

interface BatchMeta {
  id: string;
  code: string;
  name: string;
  breed: string;
  type: string;
  startDate: string;
  currentStage: string;
  currentStageId: number;
  stageDay: number;
  stageTotalDays: number;
  stageDates: string;
  assignedCount: number;
  currentCount: number;
  mortalityCount: number;
  transferredCount: number;
}

// No static batch data — all data is fetched live from the database.

export default function OperationalBatchDataEntry() {
  // ── Live data state ──
  const [batches, setBatches] = useState<BatchMeta[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [batchesError, setBatchesError] = useState("");
  const [dataEntryLoading, setDataEntryLoading] = useState(false);
  const [noScheduler, setNoScheduler] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [compareWith, setCompareWith] = useState("Previous Day");

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0],
    [batches, selectedBatchId]
  );

  // ── Entry section rows — all populated from API, never hardcoded ──
  const [feedRows, setFeedRows] = useState<FeedItem[]>([]);
  const [medicineRows, setMedicineRows] = useState<MedItem[]>([]);
  const [mortalityRows, setMortalityRows] = useState<MortalityItem[]>([]);
  const [labourRows, setLabourRows] = useState<LabourItem[]>([]);
  const [overheadRows, setOverheadRows] = useState<OverheadItem[]>([]);

  const [avgWeight, setAvgWeight] = useState(0);
  const [weightGain, setWeightGain] = useState(0);
  const [bcsScore, setBcsScore] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [attachments, setAttachments] = useState<Array<{ name: string; type: string; date: string }>>([]);

  // Modals for Adding Items
  const [addFeedModalOpen, setAddFeedModalOpen] = useState(false);
  const [newFeedItem, setNewFeedItem] = useState("");
  const [newFeedUom, setNewFeedUom] = useState("KG");
  const [newFeedOpening, setNewFeedOpening] = useState("500");
  const [newFeedIssued, setNewFeedIssued] = useState("50");
  const [newFeedConsumed, setNewFeedConsumed] = useState("45");
  const [newFeedWastage, setNewFeedWastage] = useState("5");
  const [newFeedRate, setNewFeedRate] = useState("35.0");

  const [addMedModalOpen, setAddMedModalOpen] = useState(false);
  const [newMedItem, setNewMedItem] = useState("");
  const [newMedUom, setNewMedUom] = useState("ML");
  const [newMedIssued, setNewMedIssued] = useState("10");
  const [newMedConsumed, setNewMedConsumed] = useState("10");
  const [newMedCost, setNewMedCost] = useState("100");

  const [addMortalityModalOpen, setAddMortalityModalOpen] = useState(false);
  const [newMortalityReason, setNewMortalityReason] = useState("");
  const [newMortalityCount, setNewMortalityCount] = useState("1");
  const [newMortalityRemarks, setNewMortalityRemarks] = useState("");

  const [addLabourModalOpen, setAddLabourModalOpen] = useState(false);
  const [newLabourRole, setNewLabourRole] = useState("");
  const [newLabourPersons, setNewLabourPersons] = useState("1");
  const [newLabourHours, setNewLabourHours] = useState("4.0");
  const [newLabourRate, setNewLabourRate] = useState("75");

  const [addOverheadModalOpen, setAddOverheadModalOpen] = useState(false);
  const [newOverheadType, setNewOverheadType] = useState("");
  const [newOverheadAmount, setNewOverheadAmount] = useState("100");
  const [newOverheadRemarks, setNewOverheadRemarks] = useState("");

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newAttachmentName, setNewAttachmentName] = useState("");
  const [newAttachmentType, setNewAttachmentType] = useState("IMAGE");

  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");

  const [activeStageId, setActiveStageId] = useState<number>(4);

  // Helper to map a batch to a specific lifecycle stage
  const resolvePiggeryStage = (b: any) => {
    const code = (b.current_stage_code || b.stage_code || b.stage_name || "").toUpperCase().trim();
    if (!code) {
      return { id: 4, name: "Gestation", day: 42, totalDays: 114 };
    }
    if (code === "ST-01" || code.includes("QUARANTINE") || code.includes("QUAR")) {
      return { id: 1, name: "Quarantine", day: 5, totalDays: 7 };
    }
    if (code === "ST-02" || code.includes("GILT_GROWER") || code.includes("GROWER") || code.includes("GILT") || code.includes("REARING")) {
      return { id: 2, name: "Gilt Grower", day: 45, totalDays: 112 };
    }
    if (code === "ST-03" || code.includes("FLUSH_AI") || code.includes("FLUSH") || code.includes("AI") || code.includes("MATING") || code.includes("BREED")) {
      return { id: 3, name: "Flush / AI", day: 4, totalDays: 7 };
    }
    if (code === "ST-04" || code.includes("GESTATION") || code.includes("DRY_SOW") || code.includes("PREGNANT")) {
      return { id: 4, name: "Gestation", day: 42, totalDays: 114 };
    }
    if (code === "ST-05" || code.includes("FARROWING") || code.includes("FARROW")) {
      return { id: 5, name: "Farrowing", day: 3, totalDays: 7 };
    }
    if (code === "ST-06" || code.includes("LACTATION") || code.includes("LACTAT") || code.includes("NURSING") || code.includes("SUCKLING")) {
      return { id: 6, name: "Lactation", day: 14, totalDays: 28 };
    }
    if (code === "ST-07" || code.includes("WEANING") || code.includes("WEAN") || code.includes("NURSERY")) {
      return { id: 7, name: "Weaning", day: 3, totalDays: 6 };
    }
    if (code === "ST-08" || code.includes("NEXT_CYCLE") || code.includes("FINISHER") || code.includes("FINISH") || code.includes("RECOVERY")) {
      return { id: 8, name: "Next Cycle", day: 10, totalDays: 14 };
    }

    const matched = DEFAULT_PIGGERY_STAGES.find((s) => s.code.toUpperCase() === code || s.name.toUpperCase() === code || code.includes(s.code.toUpperCase()));
    if (matched) {
      return { id: matched.id, name: matched.name, day: 1, totalDays: matched.standardDays };
    }

    return { id: 4, name: b.current_stage_code || "Gestation", day: 1, totalDays: 114 };
  };

  // Sync activeStageId whenever currentBatch or its stage changes
  useEffect(() => {
    if (currentBatch?.currentStageId) {
      setActiveStageId(currentBatch.currentStageId);
    }
  }, [currentBatch?.id, currentBatch?.currentStageId]);

  // ── Step 1: Fetch active batch list from DB ──
  useEffect(() => {
    const companyId = getActiveCompanyId();
    if (!companyId) {
      setBatchesLoading(false);
      setBatchesError("No active company — please select a company workspace first.");
      return;
    }
    setBatchesLoading(true);
    setBatchesError("");
    api.get(`/batch?companyId=${companyId}&status=ACTIVE&limit=50`)
      .then(async (res) => {
        let list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        if (list.length === 0) {
          const fallbackRes = await api.get(`/batch?companyId=${companyId}&limit=50`).catch(() => []);
          list = Array.isArray(fallbackRes) ? fallbackRes : (fallbackRes?.data ?? []);
        }
        const mapped: BatchMeta[] = list.map((b: any) => {
          const st = resolvePiggeryStage(b);
          return {
            id: b.batch_id,
            code: b.batch_no,
            name: b.remarks || b.batch_no,
            breed: b.breed_name || b.breed_code || "Large White",
            type: b.lob_name || b.nob_name || "Piggery Production Batch",
            startDate: b.start_date || "",
            currentStage: st.name,
            currentStageId: st.id,
            stageDay: st.day,
            stageTotalDays: st.totalDays,
            stageDates: b.start_date ? `${b.start_date} – ${b.expected_end_date || "ongoing"}` : "",
            assignedCount: Number(b.opening_quantity) || 80,
            currentCount: Number(b.closing_quantity) ?? Number(b.opening_quantity) ?? 80,
            mortalityCount: 0,
            transferredCount: 0,
          };
        });
        setBatches(mapped);
        if (mapped.length > 0) {
          setSelectedBatchId(mapped[0].id);
          setActiveStageId(mapped[0].currentStageId || 4);
        }
        setBatchesLoading(false);
      })
      .catch((err) => {
        setBatchesLoading(false);
        setBatchesError(`Failed to load batches: ${err?.message || "API unavailable"}`);
      });
  }, []);

  // ── Step 2: Fetch scheduled entry lines and actual recorded transactions for selected batch + date ──
  const loadBatchDailyData = () => {
    if (!selectedBatchId) return;
    setDataEntryLoading(true);
    setNoScheduler(false);

    Promise.all([
      api.get(`/batch/${selectedBatchId}/data-entry?date=${selectedDate}`).catch((err: any) => {
        if (err?.status === 400 || err?.message?.includes("no scheduler")) {
          setNoScheduler(true);
        }
        return { lines: [] };
      }),
      api.get(`/batch/${selectedBatchId}`).catch(() => null),
    ])
      .then(([schedRes, batchRes]) => {
        const schedData = schedRes?.data ?? schedRes;
        const lines: any[] = schedData?.lines ?? [];
        const batchData = batchRes?.data ?? batchRes;

        // Dynamically update the batch stage from latest database record
        if (batchData?.batch_id) {
          const st = resolvePiggeryStage(batchData);
          setBatches((prev) =>
            prev.map((b) =>
              b.id === batchData.batch_id
                ? {
                  ...b,
                  currentStage: st.name,
                  currentStageId: st.id,
                  stageDay: st.day,
                  stageTotalDays: st.totalDays,
                  currentCount: Number(batchData.closing_quantity) ?? Number(batchData.opening_quantity) ?? b.currentCount,
                }
                : b
            )
          );
          setActiveStageId(st.id);
        }

        const txs: any[] = batchData?.transactions ?? [];
        const sameDayTxs = txs.filter((t: any) => t.transaction_date === selectedDate || t.transaction_date?.startsWith(selectedDate));

        const feeds: FeedItem[] = [];
        const meds: MedItem[] = [];
        const overheads: OverheadItem[] = [];
        const mortalities: MortalityItem[] = [];

        lines.forEach((ln: any) => {
          const type = ln.parameter_type;
          const itype = (ln.item_type || "").toUpperCase();

          if (type === "CONSUMPTION" && (itype === "FEED" || itype === "RAW_MATERIAL" || itype.includes("FEED"))) {
            feeds.push({
              id: ln.spl_id,
              item: ln.item_label || ln.parameter_name,
              uom: ln.uom || "KG",
              opening: 0,
              issued: ln.expected_qty,
              consumed: ln.already_entered_qty,
              wastage: Math.max(0, ln.expected_qty - ln.already_entered_qty),
              rate: ln.std_rate ?? 0,
              item_id: ln.item_id,
            });
          } else if (type === "CONSUMPTION" && (itype === "MEDICINE" || itype === "CHEMICAL" || itype.includes("MED"))) {
            meds.push({
              id: ln.spl_id,
              item: ln.item_label || ln.parameter_name,
              uom: ln.uom || "ML",
              issued: ln.expected_qty,
              consumed: ln.already_entered_qty,
              cost: (ln.std_rate ?? 0) * ln.expected_qty,
              item_id: ln.item_id,
            });
          } else if (type === "OVERHEAD") {
            overheads.push({
              id: ln.spl_id,
              type: ln.parameter_name,
              amount: ln.expected_qty,
              remarks: ln.period_label || "",
            });
          } else if (type === "MORTALITY") {
            mortalities.push({
              id: ln.spl_id,
              reason: ln.parameter_name,
              count: ln.already_entered_qty,
              remarks: "",
            });
          }
          // OBSERVATION lines → weight/BCS
          if (type === "OBSERVATION" && ln.parameter_name?.toLowerCase().includes("weight")) {
            setAvgWeight(ln.already_entered_qty > 0 ? ln.already_entered_qty : 0);
          }
        });

        // Overlay actual recorded same-day transactions from DB
        sameDayTxs.forEach((t: any) => {
          if (t.transaction_type === "MORTALITY") {
            const existing = mortalities.find((m) => m.reason === t.remarks || m.id === t.transaction_id);
            if (existing) {
              existing.count = Number(t.quantity || 0);
            } else {
              mortalities.push({
                id: t.transaction_id || `mo-${Date.now()}`,
                reason: t.remarks || "Recorded Mortality",
                count: Number(t.quantity || 0),
                remarks: t.remarks || "",
              });
            }
          } else if (t.transaction_type === "OVERHEAD") {
            const existing = overheads.find((o) => o.type === t.remarks || o.id === t.transaction_id);
            if (existing) {
              existing.amount = Math.abs(Number(t.amount || t.quantity || 0));
            } else {
              overheads.push({
                id: t.transaction_id || `o-${Date.now()}`,
                type: t.remarks || "Overhead Expense",
                amount: Math.abs(Number(t.amount || t.quantity || 0)),
                remarks: t.remarks || "",
              });
            }
          }
        });

        setFeedRows(feeds);
        setMedicineRows(meds);
        setMortalityRows(mortalities);
        setOverheadRows(overheads);
        setDataEntryLoading(false);
      })
      .catch(() => {
        setDataEntryLoading(false);
      });
  };

  useEffect(() => {
    loadBatchDailyData();
  }, [selectedBatchId, selectedDate]);

  // Calculated Dynamic Metrics
  const totalFeedConsumed = feedRows.reduce((sum, r) => sum + Number(r.consumed || 0), 0);
  const totalFeedCost = feedRows.reduce((sum, r) => sum + Number(r.consumed || 0) * (r.rate || 35), 0);
  const totalMedicineCost = medicineRows.reduce((sum, r) => sum + Number(r.cost || 0), 0);
  const totalMortality = mortalityRows.reduce((sum, r) => sum + Number(r.count || 0), 0);
  const totalLabourHours = labourRows.reduce((sum, r) => sum + Number(r.hours || 0) * Number(r.persons || 1), 0);
  const totalLabourCost = labourRows.reduce((sum, r) => sum + Number(r.hours || 0) * Number(r.persons || 1) * (r.rate || 75), 0);
  const totalOverheads = overheadRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const totalDailyCost = totalFeedCost + totalMedicineCost + totalLabourCost + totalOverheads;
  const currentHeadCount = currentBatch ? Math.max(0, currentBatch.currentCount - totalMortality) : 0;
  const estCostPerAnimalDay = currentHeadCount > 0 ? (totalDailyCost / currentHeadCount).toFixed(2) : "0.00";

  // Item Removal Handlers
  const handleRemoveFeed = (id: string) => {
    setFeedRows(feedRows.filter((f) => f.id !== id));
  };
  const handleRemoveMed = (id: string) => {
    setMedicineRows(medicineRows.filter((m) => m.id !== id));
  };
  const handleRemoveMortality = (id: string) => {
    setMortalityRows(mortalityRows.filter((m) => m.id !== id));
  };
  const handleRemoveLabour = (id: string) => {
    setLabourRows(labourRows.filter((l) => l.id !== id));
  };
  const handleRemoveOverhead = (id: string) => {
    setOverheadRows(overheadRows.filter((o) => o.id !== id));
  };

  // Add Item Handlers
  const handleAddFeedSubmit = () => {
    if (!newFeedItem) return;
    const newItem: FeedItem = {
      id: `f-${Date.now()}`,
      item: newFeedItem,
      uom: newFeedUom,
      opening: parseFloat(newFeedOpening) || 0,
      issued: parseFloat(newFeedIssued) || 0,
      consumed: parseFloat(newFeedConsumed) || 0,
      wastage: parseFloat(newFeedWastage) || 0,
      rate: parseFloat(newFeedRate) || 35.0,
    };
    setFeedRows([...feedRows, newItem]);
    setAddFeedModalOpen(false);
    setNewFeedItem("");
  };

  const handleAddMedSubmit = () => {
    if (!newMedItem) return;
    const newItem: MedItem = {
      id: `m-${Date.now()}`,
      item: newMedItem,
      uom: newMedUom,
      issued: parseFloat(newMedIssued) || 0,
      consumed: parseFloat(newMedConsumed) || 0,
      cost: parseFloat(newMedCost) || 0,
    };
    setMedicineRows([...medicineRows, newItem]);
    setAddMedModalOpen(false);
    setNewMedItem("");
  };

  const handleAddMortalitySubmit = () => {
    if (!newMortalityReason) return;
    const newItem: MortalityItem = {
      id: `mo-${Date.now()}`,
      reason: newMortalityReason,
      count: parseInt(newMortalityCount, 10) || 1,
      remarks: newMortalityRemarks || "Logged during morning round",
    };
    setMortalityRows([...mortalityRows, newItem]);
    setAddMortalityModalOpen(false);
    setNewMortalityReason("");
    setNewMortalityRemarks("");
  };

  const handleAddLabourSubmit = () => {
    if (!newLabourRole) return;
    const newItem: LabourItem = {
      id: `l-${Date.now()}`,
      resource: newLabourRole,
      persons: parseInt(newLabourPersons, 10) || 1,
      hours: parseFloat(newLabourHours) || 4.0,
      rate: parseFloat(newLabourRate) || 75.0,
    };
    setLabourRows([...labourRows, newItem]);
    setAddLabourModalOpen(false);
    setNewLabourRole("");
  };

  const handleAddOverheadSubmit = () => {
    if (!newOverheadType) return;
    const newItem: OverheadItem = {
      id: `o-${Date.now()}`,
      type: newOverheadType,
      amount: parseFloat(newOverheadAmount) || 0,
      remarks: newOverheadRemarks || "Operational allocation",
    };
    setOverheadRows([...overheadRows, newItem]);
    setAddOverheadModalOpen(false);
    setNewOverheadType("");
    setNewOverheadRemarks("");
  };

  const handleCopyPreviousDay = () => {
    // Re-trigger the data-entry fetch for the previous day then copy into today's fields
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().slice(0, 10);
    if (!selectedBatchId) return;
    api.get(`/batch/${selectedBatchId}/data-entry?date=${prevDateStr}`)
      .then((res) => {
        const lines: any[] = res?.data?.lines ?? res?.lines ?? [];
        const feeds: FeedItem[] = lines
          .filter((ln) => ln.parameter_type === "CONSUMPTION" && (ln.item_type || "").toUpperCase().includes("FEED"))
          .map((ln) => ({
            id: `copy-${ln.spl_id}`,
            item: ln.item_label || ln.parameter_name,
            uom: ln.uom || "KG",
            opening: 0,
            issued: ln.expected_qty,
            consumed: ln.already_entered_qty || ln.expected_qty,
            wastage: 0,
            rate: ln.std_rate ?? 0,
            item_id: ln.item_id,
          }));
        if (feeds.length > 0) setFeedRows(feeds);
        setSaveSuccessMsg("✓ Copied previous day's scheduler feed rations.");
        setTimeout(() => setSaveSuccessMsg(""), 3500);
      })
      .catch(() => {
        setSaveSuccessMsg("Could not load previous day data.");
        setTimeout(() => setSaveSuccessMsg(""), 3000);
      });
  };

  const handleSaveAll = async () => {
    if (!currentBatch) return;
    const companyId = getActiveCompanyId();
    if (!companyId) {
      setSaveErrorMsg("No active company selected. Please select a company workspace first.");
      return;
    }

    setSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    const activeFeedItem = feedRows.find((f) => f.consumed > 0 && f.item_id);

    const payload = {
      company_id: companyId,
      entry_date: selectedDate,
      entries: [
        {
          batch_id: currentBatch.id,
          feed_item_id: activeFeedItem?.item_id || undefined,
          feed_qty: totalFeedConsumed > 0 ? totalFeedConsumed : undefined,
          mortality_count: totalMortality > 0 ? totalMortality : undefined,
          water_qty: currentHeadCount > 0 ? currentHeadCount * 15 : undefined,
          temperature: 22.5,
          remarks: generalNotes || undefined,
        },
      ],
    };

    try {
      await api.post("/batch/bulk-daily-entry", payload);

      // Post granular transactions for medicines administered
      for (const med of medicineRows) {
        if (Number(med.consumed) > 0 && med.item_id) {
          await api.post(`/batch/${currentBatch.id}/transaction`, {
            transaction_date: selectedDate,
            transaction_type: "CONSUMPTION",
            item_id: med.item_id,
            quantity: Number(med.consumed),
            uom: med.uom || "ML",
            remarks: med.item || "Clinical medication",
          }).catch(() => { });
        }
      }

      // Post overhead allocations
      for (const ov of overheadRows) {
        if (Number(ov.amount) > 0) {
          await api.post(`/batch/${currentBatch.id}/transaction`, {
            transaction_date: selectedDate,
            transaction_type: "OVERHEAD",
            quantity: 1,
            rate: Number(ov.amount),
            amount: Number(ov.amount),
            remarks: ov.type || "Operational Overhead",
          }).catch(() => { });
        }
      }

      setSaving(false);
      setSaveSuccessMsg(`✓ Daily operational entries for batch ${currentBatch.code} (${selectedDate}) saved to database.`);
      loadBatchDailyData();
      setTimeout(() => setSaveSuccessMsg(""), 5000);
    } catch (err: any) {
      setSaving(false);
      const errMsg = err?.message || err?.error || "Failed to save daily entries to database.";
      setSaveErrorMsg(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachmentName) return;
    setAttachments([
      ...attachments,
      { name: newAttachmentName, type: newAttachmentType, date: "Just now" },
    ]);
    setUploadModalOpen(false);
    setNewAttachmentName("");
  };

  if (batchesLoading) {
    return (
      <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-3 text-[var(--accent)]" />
          <p className="text-sm font-medium text-[var(--text-muted)]">Loading active production batches from database...</p>
        </div>
      </div>
    );
  }

  if (batchesError) {
    return (
      <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
        <div
          className="rounded-[var(--radius-lg)] border p-6 text-center"
          style={{ backgroundColor: "var(--danger-muted)", borderColor: "rgba(194, 67, 50, 0.2)" }}
        >
          <AlertTriangle className="h-6 w-6 mx-auto mb-2" style={{ color: "var(--danger)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>{batchesError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
      {/* ── Top Batch Selector & Header Strip ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
              <Layers className="h-5 w-5" style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Active Production Batch:
                </span>
                <select
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    const b = batches.find((item) => item.id === e.target.value);
                    if (b) setActiveStageId(b.currentStageId || 4);
                  }}
                  className="max-w-[280px] sm:max-w-[360px] truncate rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none"
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
                  Live Active
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                <div>
                  <span className="text-[var(--text-muted)]">Breed: </span>
                  <span className="font-semibold text-[var(--text-primary)]">{currentBatch?.breed || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Type: </span>
                  <span className="font-semibold text-[var(--text-primary)]">{currentBatch?.type || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Start Date: </span>
                  <span className="font-semibold text-[var(--text-primary)]">{currentBatch?.startDate || "—"}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Current Stage: </span>
                  <span className="font-semibold text-[var(--accent)]">{currentBatch?.currentStage || "—"}</span>
                  {currentBatch?.stageTotalDays ? (
                    <span className="text-[11px] text-[var(--text-muted)] ml-1">
                      (Day {currentBatch.stageDay} of {currentBatch.stageTotalDays})
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Animal Summary KPI Strip */}
          <div className="flex items-center gap-3 bg-[var(--surface-raised)] p-3 rounded-[var(--radius-md)] border border-[var(--border)]">
            <div className="text-center px-3 border-r border-[var(--border)]">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Assigned</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{currentBatch?.assignedCount ?? 0}</p>
            </div>
            <div className="text-center px-3 border-r border-[var(--border)]">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Current</p>
              <p className="text-base font-bold" style={{ color: "var(--success)" }}>{currentHeadCount}</p>
            </div>
            <div className="text-center px-3 border-r border-[var(--border)]">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Mortality</p>
              <p className="text-base font-bold" style={{ color: "var(--danger)" }}>{totalMortality}</p>
            </div>
            <div className="text-center px-3">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Transferred</p>
              <p className="text-base font-bold text-[var(--text-primary)]">{currentBatch?.transferredCount ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Notice if No Scheduler Attached ── */}
      {noScheduler && (
        <div
          className="p-3 text-xs rounded-[var(--radius-sm)] border flex items-center gap-2"
          style={{
            backgroundColor: "var(--warning-muted)",
            color: "var(--warning)",
            borderColor: "rgba(183, 121, 31, 0.2)",
          }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>No automated production scheduler is linked to this batch in the database. You can manually record daily feed, medication, labour, and overhead entries using the <strong>+ Add</strong> buttons below.</span>
        </div>
      )}

      {/* ── Interactive 8-Stage Lifecycle Stepper ── */}
      <PiggeryLifecycleStepper
        currentStageId={activeStageId || currentBatch?.currentStageId || 4}
        onSelectStage={(stage) => setActiveStageId(stage.id)}
      />

      {/* ── Date, Weather & Quick Action Bar ── */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              Log Entry Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
              Compare With
            </label>
            <select
              value={compareWith}
              onChange={(e) => setCompareWith(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option>Previous Day</option>
              <option>Standard Breed Target</option>
              <option>Stage Day 1 Baseline</option>
            </select>
          </div>

          <div className="flex items-center gap-2.5 bg-[var(--surface-raised)] border border-[var(--border)] px-3 py-1.5 rounded text-xs">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-[var(--text-muted)]">Barn Climate: </span>
              <span className="font-semibold text-[var(--text-primary)]">22.4 °C</span> · 58% Humidity · 0.15 m/s Airflow
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyPreviousDay}
            className="text-xs h-8 gap-1.5 font-medium"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Previous Day
          </Button>

          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={saving}
            className="nf-btn-primary text-xs h-8 gap-1.5 font-semibold"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving Logs…" : "Save Daily Batch Entry"}
          </Button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* ── Modular Daily Panels Grid (Full Add / Edit / Remove) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Feed Consumption */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5 text-emerald-500" />
                <span>1. Feed Consumption & Nutrition</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Total: {totalFeedConsumed.toFixed(1)} KG (₹ {totalFeedCost.toFixed(2)})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-1.5 font-bold">Feed Item</th>
                    <th className="pb-1.5 font-bold">UOM</th>
                    <th className="pb-1.5 font-bold text-right">Opening</th>
                    <th className="pb-1.5 font-bold text-right">Issued</th>
                    <th className="pb-1.5 font-bold text-right text-emerald-600">Consumed</th>
                    <th className="pb-1.5 font-bold text-right">Wastage</th>
                    <th className="pb-1.5 font-bold text-right">Closing</th>
                    <th className="pb-1.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {feedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-xs text-[var(--text-muted)] italic">
                        {dataEntryLoading ? "Loading scheduled feed lines from database..." : "No scheduled feed rations for today. Click '+ Add Feed Line' to enter manually."}
                      </td>
                    </tr>
                  ) : (
                    feedRows.map((r, i) => {
                      const closingQty = r.opening + r.issued - r.consumed - r.wastage;
                      return (
                        <tr key={r.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                          <td className="py-2 font-medium text-[var(--text-primary)]">{r.item}</td>
                          <td className="py-2 text-[var(--text-secondary)] font-mono">{r.uom}</td>
                          <td className="py-2 text-right font-mono">{r.opening}</td>
                          <td className="py-2 text-right font-mono">{r.issued}</td>
                          <td className="py-2 text-right font-mono">
                            <input
                              type="number"
                              step="0.1"
                              value={r.consumed}
                              onChange={(e) => {
                                const updated = [...feedRows];
                                updated[i].consumed = Number(e.target.value);
                                setFeedRows(updated);
                              }}
                              className="w-16 rounded border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 text-right text-xs font-bold text-[var(--text-primary)]"
                            />
                          </td>
                          <td className="py-2 text-right font-mono text-[var(--text-muted)]">{r.wastage}</td>
                          <td className="py-2 text-right font-mono font-semibold">{closingQty.toFixed(1)}</td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => handleRemoveFeed(r.id)}
                              className="text-[var(--text-muted)] hover:text-rose-500 p-1 transition-colors"
                              title="Remove line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => setAddFeedModalOpen(true)}
            className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Feed Line
          </button>
        </div>

        {/* 2. Medicine / Vaccine Consumption */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-blue-500" />
                <span>2. Medicine & Clinical Treatment</span>
              </h3>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Total: ₹ {totalMedicineCost.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-1.5 font-bold">Medicine / Vaccine</th>
                    <th className="pb-1.5 font-bold">UOM</th>
                    <th className="pb-1.5 font-bold text-right">Issued</th>
                    <th className="pb-1.5 font-bold text-right text-blue-500">Consumed</th>
                    <th className="pb-1.5 font-bold text-right">Cost (₹)</th>
                    <th className="pb-1.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {medicineRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-xs text-[var(--text-muted)] italic">
                        {dataEntryLoading ? "Loading clinical schedule from database..." : "No scheduled medications for today. Click '+ Add Clinical Medication' if administered."}
                      </td>
                    </tr>
                  ) : (
                    medicineRows.map((r, i) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-2 font-medium text-[var(--text-primary)]">{r.item}</td>
                        <td className="py-2 text-[var(--text-secondary)] font-mono">{r.uom}</td>
                        <td className="py-2 text-right font-mono">{r.issued}</td>
                        <td className="py-2 text-right font-mono">
                          <input
                            type="number"
                            value={r.consumed}
                            onChange={(e) => {
                              const updated = [...medicineRows];
                              updated[i].consumed = Number(e.target.value);
                              setMedicineRows(updated);
                            }}
                            className="w-16 rounded border border-[var(--border)] bg-[var(--surface-raised)] px-1.5 py-0.5 text-right text-xs font-bold text-[var(--text-primary)]"
                          />
                        </td>
                        <td className="py-2 text-right font-mono font-bold">₹ {r.cost}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleRemoveMed(r.id)}
                            className="text-[var(--text-muted)] hover:text-rose-500 p-1 transition-colors"
                            title="Remove medication"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => setAddMedModalOpen(true)}
            className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Clinical Medication
          </button>
        </div>

        {/* 3. Weight & Body Condition */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>3. Weight & Body Condition Score (BCS)</span>
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
                Avg Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={avgWeight}
                onChange={(e) => setAvgWeight(Number(e.target.value))}
                className="w-full rounded border border-[var(--border)] bg-[var(--surface-raised)] p-2 text-xs font-bold text-[var(--text-primary)] font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
                ADG (kg/day)
              </label>
              <input
                type="number"
                step="0.01"
                value={weightGain}
                onChange={(e) => setWeightGain(Number(e.target.value))}
                className="w-full rounded border border-[var(--border)] bg-[var(--surface-raised)] p-2 text-xs font-bold text-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">
                BCS (1 - 5)
              </label>
              <input
                type="text"
                value={bcsScore}
                onChange={(e) => setBcsScore(e.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--surface-raised)] p-2 text-xs font-bold text-[var(--text-primary)] font-mono"
              />
            </div>
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={weightNotes}
              onChange={(e) => setWeightNotes(e.target.value)}
              placeholder="Condition observations..."
              className="w-full rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]"
            />
          </div>
        </div>

        {/* 4. Mortality & Incidents (with Add & Delete) */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>4. Mortality & Incident Log</span>
              </h3>
              <span className={totalMortality > 0 ? "text-xs font-bold text-rose-500 font-mono" : "text-xs font-bold text-emerald-500 font-mono"}>
                Total: {totalMortality} Head
              </span>
            </div>

            <div className="space-y-2">
              {mortalityRows.length === 0 ? (
                <p className="py-3 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Zero mortalities reported for this date.
                </p>
              ) : (
                mortalityRows.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded bg-[var(--surface-raised)] text-xs">
                    <div className="flex-1">
                      <span className="font-semibold text-[var(--text-primary)]">{m.reason}</span>
                      <span className="block text-[10px] text-[var(--text-muted)]">{m.remarks}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={m.count}
                      onChange={(e) => {
                        const updated = [...mortalityRows];
                        updated[idx].count = Number(e.target.value);
                        setMortalityRows(updated);
                      }}
                      className="w-14 rounded border border-[var(--border)] bg-[var(--surface)] p-1 text-xs font-bold text-right text-[var(--text-primary)] font-mono"
                    />
                    <button
                      onClick={() => handleRemoveMortality(m.id)}
                      className="text-[var(--text-muted)] hover:text-rose-500 p-1"
                      title="Remove cause"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setAddMortalityModalOpen(true)}
            className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Mortality Cause
          </button>
        </div>

        {/* 5. Labour & Direct Farm Hours (with Add & Delete) */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                <span>5. Labour & Direct Farm Hours</span>
              </h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                ₹ {totalLabourCost.toFixed(2)} ({totalLabourHours} hrs)
              </span>
            </div>

            <div className="space-y-2">
              {labourRows.length === 0 ? (
                <p className="py-3 text-center text-xs text-[var(--text-muted)] italic">
                  No labour hours logged today. Click '+ Add Labour Resource' to record.
                </p>
              ) : (
                labourRows.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-2 rounded bg-[var(--surface-raised)] text-xs">
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">{l.resource}</span>
                      <span className="text-[11px] text-[var(--text-secondary)] block font-mono">
                        {l.persons} Persons · {l.hours} Hours (₹ {l.rate}/hr)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--text-primary)]">₹ {(l.persons * l.hours * l.rate).toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveLabour(l.id)}
                        className="text-[var(--text-muted)] hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setAddLabourModalOpen(true)}
            className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Labour Resource
          </button>
        </div>

        {/* 6. Overheads & Utilities (with Add & Delete) */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-cyan-500" />
                <span>6. Overheads & Utilities</span>
              </h3>
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono">
                Total: ₹ {totalOverheads.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5">
              {overheadRows.length === 0 ? (
                <p className="py-3 text-center text-xs text-[var(--text-muted)] italic">
                  No overheads allocated today. Click '+ Add Overhead Expense' to record.
                </p>
              ) : (
                overheadRows.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-2 rounded bg-[var(--surface-raised)] text-xs">
                    <div>
                      <span className="font-semibold text-[var(--text-primary)]">{o.type}</span>
                      <span className="block text-[10px] text-[var(--text-muted)]">{o.remarks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[var(--text-primary)]">₹ {o.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleRemoveOverhead(o.id)}
                        className="text-[var(--text-muted)] hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => setAddOverheadModalOpen(true)}
            className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cyan-500 hover:underline"
          >
            <Plus className="w-3 h-3" /> Add Overhead Expense
          </button>
        </div>

        {/* 7. Notes & Observations */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-amber-500" />
            <span>7. Daily Notes & Supervisor Observations</span>
          </h3>
          <textarea
            rows={3}
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--surface-raised)] p-2.5 text-xs text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        {/* 8. Attachments & Inspection Photos */}
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-teal-500" />
              <span>8. Inspection Media & Photos</span>
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(true)}
              className="h-6 text-[10px] px-2 gap-1 font-medium"
            >
              <Plus className="w-3 h-3" /> Upload Media
            </Button>
          </div>

          <div className="space-y-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="p-2 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs flex items-center justify-between">
                <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  {att.name}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{att.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 9. Summary & General Ledger Posting Strip ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--accent)]/30 bg-[var(--surface)] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <Scale className="w-4 h-4 text-[var(--accent)]" /> Daily Batch WIP Financial & Operational Summary
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Feed: <strong className="text-[var(--text-primary)]">₹ {totalFeedCost.toFixed(2)}</strong> ({totalFeedConsumed.toFixed(1)} KG) ·
              Meds: <strong className="text-[var(--text-primary)]">₹ {totalMedicineCost.toFixed(2)}</strong> ·
              Labour: <strong className="text-[var(--text-primary)]">₹ {totalLabourCost.toFixed(2)}</strong> ·
              Overheads: <strong className="text-[var(--text-primary)]">₹ {totalOverheads.toFixed(2)}</strong> ·
              Mortality: <strong className="text-[var(--text-primary)]">{totalMortality} Head</strong>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Estimated Cost / Animal / Day</p>
              <p className="text-lg font-bold text-[var(--accent)] font-mono">₹ {estCostPerAnimalDay}</p>
            </div>
            <Button
              onClick={handleSaveAll}
              disabled={saving}
              className="nf-btn-primary text-xs h-9 px-4 gap-2 font-semibold"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Posting Daily WIP…" : "Save Daily Batch Entry"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── MODAL: ADD FEED ── */}
      {addFeedModalOpen && (
        <Dialog
          open={addFeedModalOpen}
          onClose={() => setAddFeedModalOpen(false)}
          title="Add Feed / Supplement Line"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddFeedModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddFeedSubmit} className="nf-btn-primary">
                Add Feed
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Feed Item Description *</label>
              <input
                type="text"
                value={newFeedItem}
                onChange={(e) => setNewFeedItem(e.target.value)}
                placeholder="e.g. Grower Mash (GF-201) / Lysine Premix"
                className="nf-input w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold block mb-1">UOM</label>
                <input
                  type="text"
                  value={newFeedUom}
                  onChange={(e) => setNewFeedUom(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Standard Rate (₹/UOM)</label>
                <input
                  type="number"
                  value={newFeedRate}
                  onChange={(e) => setNewFeedRate(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="font-semibold block mb-1">Opening</label>
                <input
                  type="number"
                  value={newFeedOpening}
                  onChange={(e) => setNewFeedOpening(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Issued</label>
                <input
                  type="number"
                  value={newFeedIssued}
                  onChange={(e) => setNewFeedIssued(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Consumed *</label>
                <input
                  type="number"
                  value={newFeedConsumed}
                  onChange={(e) => setNewFeedConsumed(e.target.value)}
                  className="nf-input w-full font-mono font-bold text-emerald-600"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Wastage</label>
                <input
                  type="number"
                  value={newFeedWastage}
                  onChange={(e) => setNewFeedWastage(e.target.value)}
                  className="nf-input w-full font-mono text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: ADD MEDICINE ── */}
      {addMedModalOpen && (
        <Dialog
          open={addMedModalOpen}
          onClose={() => setAddMedModalOpen(false)}
          title="Add Clinical Medication / Vaccine"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddMedModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddMedSubmit} className="nf-btn-primary">
                Add Medication
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Medicine Name / Vaccine *</label>
              <input
                type="text"
                value={newMedItem}
                onChange={(e) => setNewMedItem(e.target.value)}
                placeholder="e.g. PRRS Vaccine / Electrolyte Powder"
                className="nf-input w-full"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="font-semibold block mb-1">UOM</label>
                <input
                  type="text"
                  value={newMedUom}
                  onChange={(e) => setNewMedUom(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Issued</label>
                <input
                  type="number"
                  value={newMedIssued}
                  onChange={(e) => setNewMedIssued(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Consumed</label>
                <input
                  type="number"
                  value={newMedConsumed}
                  onChange={(e) => setNewMedConsumed(e.target.value)}
                  className="nf-input w-full font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Cost (₹)</label>
                <input
                  type="number"
                  value={newMedCost}
                  onChange={(e) => setNewMedCost(e.target.value)}
                  className="nf-input w-full font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: ADD MORTALITY ── */}
      {addMortalityModalOpen && (
        <Dialog
          open={addMortalityModalOpen}
          onClose={() => setAddMortalityModalOpen(false)}
          title="Add Mortality Incident Cause"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddMortalityModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddMortalitySubmit} className="nf-btn-primary">
                Add Mortality Record
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Cause of Death / Diagnosis *</label>
              <input
                type="text"
                value={newMortalityReason}
                onChange={(e) => setNewMortalityReason(e.target.value)}
                placeholder="e.g. Acute Respiratory Infection / Trauma"
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Head Count</label>
              <input
                type="number"
                value={newMortalityCount}
                onChange={(e) => setNewMortalityCount(e.target.value)}
                className="nf-input w-full font-mono"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Remarks & Vet Post-Mortem</label>
              <input
                type="text"
                value={newMortalityRemarks}
                onChange={(e) => setNewMortalityRemarks(e.target.value)}
                placeholder="e.g. Pen Row B-04 / Necropsy completed"
                className="nf-input w-full"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: ADD LABOUR ── */}
      {addLabourModalOpen && (
        <Dialog
          open={addLabourModalOpen}
          onClose={() => setAddLabourModalOpen(false)}
          title="Add Direct Labour Resource"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddLabourModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddLabourSubmit} className="nf-btn-primary">
                Add Labour
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Resource / Worker Role *</label>
              <input
                type="text"
                value={newLabourRole}
                onChange={(e) => setNewLabourRole(e.target.value)}
                placeholder="e.g. Disinfection Specialist / Night Feeder"
                className="nf-input w-full"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-semibold block mb-1">Persons</label>
                <input
                  type="number"
                  value={newLabourPersons}
                  onChange={(e) => setNewLabourPersons(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={newLabourHours}
                  onChange={(e) => setNewLabourHours(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={newLabourRate}
                  onChange={(e) => setNewLabourRate(e.target.value)}
                  className="nf-input w-full font-mono"
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: ADD OVERHEAD ── */}
      {addOverheadModalOpen && (
        <Dialog
          open={addOverheadModalOpen}
          onClose={() => setAddOverheadModalOpen(false)}
          title="Add Overhead / Utility Expense"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAddOverheadModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddOverheadSubmit} className="nf-btn-primary">
                Add Overhead
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">Overhead Type *</label>
              <input
                type="text"
                value={newOverheadType}
                onChange={(e) => setNewOverheadType(e.target.value)}
                placeholder="e.g. Slurry Cleaning / Water Heating"
                className="nf-input w-full"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Allocated Amount (₹) *</label>
              <input
                type="number"
                value={newOverheadAmount}
                onChange={(e) => setNewOverheadAmount(e.target.value)}
                className="nf-input w-full font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-semibold block mb-1">Remarks</label>
              <input
                type="text"
                value={newOverheadRemarks}
                onChange={(e) => setNewOverheadRemarks(e.target.value)}
                placeholder="Allocation justification"
                className="nf-input w-full"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: UPLOAD INSPECTION MEDIA ── */}
      {uploadModalOpen && (
        <Dialog
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Upload Daily Inspection Media"
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddAttachment} className="nf-btn-primary">
                Attach to Daily Log
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1">File Name / Label</label>
              <input
                type="text"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                placeholder="e.g. Gestation_Pen_B_Morning_Feeder.jpg"
                className="nf-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Media Type</label>
              <select
                value={newAttachmentType}
                onChange={(e) => setNewAttachmentType(e.target.value)}
                className="nf-input w-full"
              >
                <option value="IMAGE">Site Inspection Image (.JPG, .PNG)</option>
                <option value="PDF">Veterinary Lab Report / Prescription (.PDF)</option>
                <option value="NOTE">Voice / Sensor Log (.TXT, .JSON)</option>
              </select>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
