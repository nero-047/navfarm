"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  Sparkles,
  Bookmark,
  Send,
  Scale,
  Activity,
  HeartPulse,
  Flame,
  Wheat,
  Calendar,
  Layers,
  ArrowRightLeft,
  DollarSign,
  Users,
  FileEdit,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";

interface BatchDataEntryTabProps {
  batch: any;
  currentDate: string;
  onDateChange?: (date: string) => void;
  items?: any[];
  batches?: any[];
  dataEntryData?: any;
  dataEntryLoading?: boolean;
  onSaveEntry: (payload: any) => Promise<void>;
  saving?: boolean;
}

export function BatchDataEntryTab({
  batch,
  currentDate,
  onDateChange,
  items: _items,
  batches: _batches,
  dataEntryData,
  dataEntryLoading = false,
  onSaveEntry,
  saving = false,
}: BatchDataEntryTabProps) {
  // Feed consumption state
  const [feedRows, setFeedRows] = useState<any[]>([]);

  // Medicine & Vaccine state
  const [medRows, setMedRows] = useState<any[]>([]);

  // Output yield state
  const [outputRows, setOutputRows] = useState<any[]>([]);

  // Overheads state
  const [overheadRows, setOverheadRows] = useState<any[]>([]);

  // Resource / Labour state
  const [resourceRows, setResourceRows] = useState<any[]>([]);

  // Weight and condition state
  const [avgWeight, setAvgWeight] = useState<string>("0");
  const [weightGain, setWeightGain] = useState<string>("0");
  const [bcsScore, setBcsScore] = useState<string>("3.0");
  const [eveningHeadCount, setEveningHeadCount] = useState<string>("0");
  const [observations, setObservations] = useState<string>("");

  // Mortality state
  const [mortRows, setMortRows] = useState<any[]>([
    { id: "mort-1", reason: "Weak / Poor body condition", count: 0, remarks: "" },
  ]);

  // Milestone / Pregnancy scan decision state
  const [checkpointResult, setCheckpointResult] = useState<"CONFIRMED" | "REPEAT" | "FAILED" | null>("CONFIRMED");

  // Transfer state
  const [transferData, setTransferData] = useState<any>({
    enabled: false,
    head_count: "",
    avg_weight: "",
    to_stage_code: "",
    to_location_id: "",
    auto_triggers_stage: true,
    remarks: "",
  });

  const [hasDraft, setHasDraft] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Calculate 15 Days list starting from batch.start_date
  const daysList = useMemo(() => {
    const rawStart = batch?.start_date ? new Date(batch.start_date) : new Date();
    const list = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(rawStart);
      d.setDate(rawStart.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const formatted = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      list.push({
        dayNo: i + 1,
        dateStr,
        label: `Day ${i + 1}`,
        sub: formatted,
        isCurrent: dateStr === currentDate,
      });
    }
    return list;
  }, [batch?.start_date, currentDate]);

  // Active Milestone line for today (if any)
  const milestoneLine = useMemo(() => {
    if (!dataEntryData?.lines) return null;
    return dataEntryData.lines.find(
      (l: any) =>
        l.category === "SCAN" ||
        l.occurrence === "MILESTONE" ||
        (l.parameter_name || "").includes("Scan") ||
        (l.parameter_name || "").includes("Checkpoint")
    );
  }, [dataEntryData]);

  // Active Transfer line for today (if any)
  const transferLine = useMemo(() => {
    if (!dataEntryData?.lines) return null;
    return dataEntryData.lines.find((l: any) => l.category === "TRANSFER" || l.line_type === "TRANSFER");
  }, [dataEntryData]);

  // Daily target standards from breed lifecycle
  const dailyStandards = dataEntryData?.daily_standards || null;
  const targetWeight = dailyStandards?.std_body_weight_kg ? Number(dailyStandards.std_body_weight_kg) : null;
  const targetAdg = dailyStandards?.std_adg_gpd ? Number(dailyStandards.std_adg_gpd) : null;

  // Opening headcount
  const openingAnimals = Number(batch?.current_quantity ?? batch?.opening_quantity ?? 30);

  // Sync state from dynamic dataEntryData when it loads or date changes
  useEffect(() => {
    if (!dataEntryData) return;

    // Check if a saved draft is loaded
    const draft = dataEntryData.draft;
    if (draft) {
      setHasDraft(true);
      if (draft.feed_lines && draft.feed_lines.length > 0) {
        setFeedRows(
          draft.feed_lines.map((f: any, idx: number) => ({
            id: f.spl_id || `draft-f-${idx}`,
            item_id: f.item_id || "",
            item_name: f.item_name || "Daily Ration Feed",
            spl_id: f.spl_id,
            parameter_id: f.parameter_id,
            lot_no: f.lot_no || `LOT-${currentDate.replace(/-/g, "").slice(2)}-01`,
            std_qty: f.std_qty || 40.0,
            actual_qty: String(f.quantity || f.actual_qty || "40.00"),
            uom: f.uom || "KG",
            unit_cost: f.rate || f.unit_cost || 12.5,
          }))
        );
      }
      if (draft.medicine_lines && draft.medicine_lines.length > 0) {
        setMedRows(
          draft.medicine_lines.map((m: any, idx: number) => ({
            id: m.spl_id || `draft-m-${idx}`,
            item_id: m.item_id || "",
            item_name: m.item_name || "Veterinary Treatment",
            spl_id: m.spl_id,
            parameter_id: m.parameter_id,
            lot_no: m.lot_no || `MEDLOT-01`,
            consumed_qty: String(m.quantity || m.consumed_qty || "1.00"),
            uom: m.uom || "DOSES",
            withdrawal_days: m.withdrawal_days || "14 days withdrawal",
            remarks: m.remarks || "",
          }))
        );
      }
      if (draft.output_lines && draft.output_lines.length > 0) {
        setOutputRows(
          draft.output_lines.map((o: any, idx: number) => ({
            id: o.spl_id || `draft-out-${idx}`,
            item_id: o.item_id || "",
            item_name: o.item_name || "Harvest Yield",
            spl_id: o.spl_id,
            parameter_id: o.parameter_id,
            expected_qty: o.expected_qty || 0,
            actual_qty: String(o.quantity || o.actual_qty || "0"),
            avg_weight: String(o.avg_weight || "1.45"),
            output_type: o.output_type || "MAIN",
            uom: o.uom || "HEAD",
            remarks: o.remarks || "",
          }))
        );
      }
      if (draft.overhead_lines && draft.overhead_lines.length > 0) {
        setOverheadRows(
          draft.overhead_lines.map((ov: any, idx: number) => ({
            id: ov.spl_id || `draft-oh-${idx}`,
            spl_id: ov.spl_id,
            parameter_id: ov.parameter_id,
            name: ov.resource_name || ov.name || "Barn Overhead Utility",
            cost: String(ov.rate || ov.cost || "85.00"),
            remarks: ov.remarks || "",
          }))
        );
      }
      if (draft.resource_lines && draft.resource_lines.length > 0) {
        setResourceRows(
          draft.resource_lines.map((r: any, idx: number) => ({
            id: r.spl_id || `draft-res-${idx}`,
            spl_id: r.spl_id,
            parameter_id: r.parameter_id,
            resource_id: r.resource_id,
            resource_name: r.resource_name || "Stockman Attendant Care",
            hours: String(r.quantity || r.hours || "2.5"),
            rate: String(r.rate || "25.00"),
            remarks: r.remarks || "",
          }))
        );
      }
      if (draft.weight) {
        if (draft.weight.avg_weight) setAvgWeight(String(draft.weight.avg_weight));
        if (draft.weight.daily_gain_gpd) setWeightGain((Number(draft.weight.daily_gain_gpd) / 1000).toFixed(2));
        if (draft.weight.bcs_score) setBcsScore(String(draft.weight.bcs_score));
        if (draft.weight.head_count) setEveningHeadCount(String(draft.weight.head_count));
        if (draft.weight.remarks) setObservations(draft.weight.remarks);
      }
      if (draft.mortality_lines && draft.mortality_lines.length > 0) {
        setMortRows(
          draft.mortality_lines.map((m: any, idx: number) => ({
            id: `draft-mort-${idx}`,
            reason: m.reason || "Weak / Poor body condition",
            count: m.quantity || 0,
            remarks: m.remarks || "",
          }))
        );
      }
      if (draft.checkpoint_decision) {
        setCheckpointResult(draft.checkpoint_decision.decision || "CONFIRMED");
      }
      if (draft.transfer) {
        setTransferData({
          enabled: true,
          head_count: String(draft.transfer.head_count || ""),
          avg_weight: String(draft.transfer.avg_weight || ""),
          to_stage_code: draft.transfer.to_stage_code || "",
          to_location_id: draft.transfer.to_location_id || "",
          auto_triggers_stage: draft.transfer.auto_triggers_stage ?? true,
          remarks: draft.transfer.remarks || "",
        });
      }
      return;
    }

    setHasDraft(false);

    // 1. Sync Feed lines from scheduler
    const feedLines = (dataEntryData.lines || []).filter(
      (l: any) => l.category === "FEED" || l.line_type === "CONSUMPTION" && (l.parameter_name || "").toUpperCase().includes("FEED")
    );
    if (feedLines.length > 0) {
      setFeedRows(
        feedLines.map((l: any, idx: number) => {
          const expected = Number(l.expected_qty || l.standard_qty || 0);
          const already = Number(l.already_entered_qty || 0);
          return {
            id: l.spl_id || `f-${idx}`,
            item_id: l.item_id || "",
            item_name: l.item_name || l.item_label || l.parameter_name || "Daily Ration Feed",
            spl_id: l.spl_id,
            parameter_id: l.parameter_id,
            lot_no: `LOT-${currentDate.replace(/-/g, "").slice(2)}-${String(idx + 1).padStart(2, "0")}`,
            std_qty: expected,
            actual_qty: already > 0 ? String(already) : expected > 0 ? String(expected) : "0.00",
            uom: l.uom || "KG",
            unit_cost: l.standard_cost || 12.5,
          };
        })
      );
    } else {
      setFeedRows([
        {
          id: "f-default",
          item_name: "Standard Lifecycle Daily Feed",
          item_id: "",
          lot_no: `LOT-${currentDate.replace(/-/g, "").slice(2)}-01`,
          std_qty: 40.0,
          actual_qty: "40.00",
          uom: "KG",
          unit_cost: 12.5,
        },
      ]);
    }

    // 2. Sync Medicine / Vaccine lines from scheduler
    const medLines = (dataEntryData.lines || []).filter(
      (l: any) =>
        l.category === "MEDICINE" ||
        l.category === "VACCINE" ||
        (l.line_type === "CONSUMPTION" &&
          ((l.parameter_name || "").toUpperCase().includes("DEWORM") ||
            (l.parameter_name || "").toUpperCase().includes("VACCINE") ||
            (l.parameter_name || "").toUpperCase().includes("INJECTION") ||
            (l.parameter_name || "").toUpperCase().includes("IRON")))
    );
    if (medLines.length > 0) {
      setMedRows(
        medLines.map((l: any, idx: number) => {
          const expected = Number(l.expected_qty || l.standard_qty || openingAnimals);
          const already = Number(l.already_entered_qty || 0);
          return {
            id: l.spl_id || `m-${idx}`,
            item_id: l.item_id || "",
            item_name: l.item_name || l.item_label || l.parameter_name || "Veterinary Treatment",
            spl_id: l.spl_id,
            parameter_id: l.parameter_id,
            lot_no: `MEDLOT-${currentDate.replace(/-/g, "").slice(2)}-${String(idx + 1).padStart(2, "0")}`,
            issued_qty: already > 0 ? String(already) : expected > 0 ? String(expected) : "1.00",
            consumed_qty: already > 0 ? String(already) : expected > 0 ? String(expected) : "1.00",
            uom: l.uom || "DOSES",
            withdrawal_days: l.withdrawal_days ? `${l.withdrawal_days} days withdrawal` : "14 days withdrawal",
            remarks: l.period_label || "Scheduled protocol",
          };
        })
      );
    } else {
      setMedRows([]);
    }

    // 3. Sync Output lines from scheduler
    const outLines = (dataEntryData.lines || []).filter(
      (l: any) => l.category === "OUTPUT" || l.line_type === "OUTPUT"
    );
    if (outLines.length > 0) {
      setOutputRows(
        outLines.map((l: any, idx: number) => {
          const expected = Number(l.expected_qty || l.standard_qty || 0);
          return {
            id: l.spl_id || `out-${idx}`,
            item_id: l.item_id || "",
            item_name: l.item_name || l.item_label || l.parameter_name || "Piglet Yield / Carcass",
            spl_id: l.spl_id,
            parameter_id: l.parameter_id,
            expected_qty: expected,
            actual_qty: expected > 0 ? String(expected) : "0",
            avg_weight: "1.45",
            output_type: "MAIN",
            uom: l.uom || "HEAD",
            remarks: "Standard harvest yield",
          };
        })
      );
    } else {
      setOutputRows([]);
    }

    // 4. Sync Overhead lines from scheduler
    const ovhLines = (dataEntryData.lines || []).filter(
      (l: any) => l.category === "OVERHEAD" || l.line_type === "OVERHEAD"
    );
    if (ovhLines.length > 0) {
      setOverheadRows(
        ovhLines.map((l: any, idx: number) => ({
          id: l.spl_id || `oh-${idx}`,
          spl_id: l.spl_id,
          parameter_id: l.parameter_id,
          name: l.parameter_name || "Barn Overhead Utility",
          cost: l.estimated_cost ? String(l.estimated_cost) : "85.00",
          remarks: l.period_label || "Daily facility utility",
        }))
      );
    } else {
      setOverheadRows([
        { id: "oh-1", name: "Barn Electricity & Ventilation", cost: "85.00", remarks: "Automated climate control" },
        { id: "oh-2", name: "Water Supply & Misting", cost: "45.00", remarks: "Drinker lines & cooling" },
      ]);
    }

    // 5. Sync Resource / Labour lines from scheduler
    const resLines = (dataEntryData.lines || []).filter(
      (l: any) => l.category === "RESOURCE" || l.line_type === "RESOURCE"
    );
    if (resLines.length > 0) {
      setResourceRows(
        resLines.map((l: any, idx: number) => ({
          id: l.spl_id || `res-${idx}`,
          spl_id: l.spl_id,
          parameter_id: l.parameter_id,
          resource_id: l.resource_id,
          resource_name: l.resource_name || l.parameter_name || "Stockman Attendant Care",
          hours: l.standard_qty ? String(l.standard_qty) : "2.5",
          rate: "25.00",
          remarks: "Daily feeding & herd inspection",
        }))
      );
    } else {
      setResourceRows([
        { id: "res-1", resource_name: "Stockman Daily Attendant Rounds", hours: "2.5", rate: "25.00", remarks: "Routine care" },
      ]);
    }

    // 6. Sync Weights & Observations
    if (dailyStandards) {
      if (dailyStandards.std_body_weight_kg) setAvgWeight(String(dailyStandards.std_body_weight_kg));
      if (dailyStandards.std_adg_gpd) setWeightGain((Number(dailyStandards.std_adg_gpd) / 1000).toFixed(2));
    } else {
      setAvgWeight(batch.costing_method === "BIO_ASSET" ? "225.00" : "45.00");
      setWeightGain("0.75");
    }

    // Set Closing Headcount
    setEveningHeadCount(String(batch?.current_quantity ?? batch?.opening_quantity ?? 35));
    setObservations("Herd in good health. Feed and water intake normal. All scheduled protocols executed.");
  }, [dataEntryData, currentDate, batch, dailyStandards, openingAnimals]);

  // Feed calculations
  const totalFeedCost = useMemo(() => {
    return feedRows.reduce((sum, r) => {
      const qty = parseFloat(r.actual_qty) || 0;
      const rate = parseFloat(r.unit_cost) || 0;
      return sum + qty * rate;
    }, 0);
  }, [feedRows]);

  const totalFeedQty = useMemo(() => {
    return feedRows.reduce((sum, r) => sum + (parseFloat(r.actual_qty) || 0), 0);
  }, [feedRows]);

  // Mortality total
  const totalMortalityToday = useMemo(() => {
    return mortRows.reduce((sum, r) => sum + (parseInt(r.count, 10) || 0), 0);
  }, [mortRows]);

  // Overheads total
  const totalOverheadCost = useMemo(() => {
    return overheadRows.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);
  }, [overheadRows]);

  // Labour total
  const totalLabourCost = useMemo(() => {
    return resourceRows.reduce((sum, r) => {
      const hrs = parseFloat(r.hours) || 0;
      const rt = parseFloat(r.rate) || 0;
      return sum + hrs * rt;
    }, 0);
  }, [resourceRows]);

  // Grand Total Day Cost
  const totalDayCost = totalFeedCost + totalOverheadCost + totalLabourCost;

  // Handlers for feed
  const updateFeedQty = (id: string, val: string) => {
    setFeedRows((prev) => prev.map((r) => (r.id === id ? { ...r, actual_qty: val } : r)));
  };

  const adjustFeedQty = (id: string, delta: number) => {
    setFeedRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const current = parseFloat(r.actual_qty) || 0;
          const next = Math.max(0, current + delta);
          return { ...r, actual_qty: next.toFixed(2) };
        }
        return r;
      })
    );
  };

  const addFeedRow = () => {
    setFeedRows((prev) => [
      ...prev,
      {
        id: `f-${Date.now()}`,
        item_name: "Supplementary Ration Feed",
        lot_no: `LOT-${currentDate.replace(/-/g, "").slice(2)}-SUP`,
        std_qty: 0,
        actual_qty: "10.00",
        uom: "KG",
        unit_cost: 12.5,
      },
    ]);
  };

  const removeFeedRow = (id: string) => {
    if (feedRows.length > 1) {
      setFeedRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Handlers for medicine
  const updateMedField = (id: string, field: string, val: string) => {
    setMedRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const addMedRow = () => {
    setMedRows((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        item_name: "Ad-hoc Treatment / Booster",
        lot_no: `MEDLOT-${currentDate.replace(/-/g, "").slice(2)}-02`,
        issued_qty: "1.00",
        consumed_qty: "1.00",
        uom: "DOSES",
        withdrawal_days: "14 days withdrawal",
        remarks: "As required by veterinarian",
      },
    ]);
  };

  const removeMedRow = (id: string) => {
    setMedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Handlers for outputs
  const updateOutputField = (id: string, field: string, val: string) => {
    setOutputRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const addOutputRow = () => {
    setOutputRows((prev) => [
      ...prev,
      {
        id: `out-${Date.now()}`,
        item_name: "Harvested Piglets / Output",
        expected_qty: 0,
        actual_qty: "10",
        avg_weight: "1.50",
        output_type: "MAIN",
        uom: "HEAD",
        remarks: "Additional yield",
      },
    ]);
  };

  const removeOutputRow = (id: string) => {
    setOutputRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Handlers for mortality
  const updateMortCount = (id: string, delta: number) => {
    setMortRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const next = Math.max(0, (r.count || 0) + delta);
          return { ...r, count: next };
        }
        return r;
      })
    );
  };

  const updateMortReason = (id: string, reason: string) => {
    setMortRows((prev) => prev.map((r) => (r.id === id ? { ...r, reason } : r)));
  };

  const addMortRow = () => {
    setMortRows((prev) => [...prev, { id: `mort-${Date.now()}`, reason: "Other", count: 1, remarks: "" }]);
  };

  const removeMortRow = (id: string) => {
    if (mortRows.length > 1) {
      setMortRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Handlers for overheads
  const updateOverheadField = (id: string, field: string, val: string) => {
    setOverheadRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const addOverheadRow = () => {
    setOverheadRows((prev) => [
      ...prev,
      { id: `oh-${Date.now()}`, name: "Miscellaneous Overhead", cost: "50.00", remarks: "" },
    ]);
  };

  const removeOverheadRow = (id: string) => {
    if (overheadRows.length > 1) {
      setOverheadRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Handlers for resources
  const updateResourceField = (id: string, field: string, val: string) => {
    setResourceRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };

  const addResourceRow = () => {
    setResourceRows((prev) => [
      ...prev,
      { id: `res-${Date.now()}`, resource_name: "Veterinary Inspection Rounds", hours: "1.0", rate: "40.00", remarks: "Health review" },
    ]);
  };

  const removeResourceRow = (id: string) => {
    if (resourceRows.length > 1) {
      setResourceRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Apply scheduled standards
  const applyScheduledStandards = () => {
    setFeedRows((prev) =>
      prev.map((r) => ({
        ...r,
        actual_qty: r.std_qty > 0 ? String(r.std_qty) : r.actual_qty,
      }))
    );
    if (targetWeight) setAvgWeight(String(targetWeight));
    if (targetAdg) setWeightGain((targetAdg / 1000).toFixed(2));
    setNotification("⚡ Scheduled standard quantities applied to all lines!");
    setTimeout(() => setNotification(null), 3000);
  };

  // Discard draft
  const handleDiscardDraft = async () => {
    if (!confirm(`Discard the saved draft for ${currentDate}?`)) return;
    try {
      await api.delete(`/batch/${batch.batch_id}/daily-entry/draft?date=${currentDate}`);
      setHasDraft(false);
      setNotification(`✓ Draft for ${currentDate} discarded.`);
      if (onDateChange) onDateChange(currentDate);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to discard draft.");
    }
  };

  // Submit Day Entry (Draft or Post)
  const handleSubmit = async (isDraft: boolean) => {
    try {
      const payload = {
        date: currentDate,
        is_draft: isDraft,
        feed_lines: feedRows.map((f) => ({
          item_id: f.item_id || undefined,
          item_name: f.item_name,
          quantity: parseFloat(f.actual_qty) || 0,
          actual_qty: f.actual_qty,
          std_qty: f.std_qty,
          uom: f.uom || "KG",
          rate: parseFloat(f.unit_cost) || 0,
          unit_cost: f.unit_cost,
          lot_no: f.lot_no,
          spl_id: f.spl_id,
          parameter_id: f.parameter_id,
        })),
        medicine_lines: medRows.map((m) => ({
          item_id: m.item_id || undefined,
          item_name: m.item_name,
          quantity: parseFloat(m.consumed_qty) || 0,
          consumed_qty: m.consumed_qty,
          uom: m.uom || "DOSES",
          lot_no: m.lot_no,
          withdrawal_days: m.withdrawal_days,
          spl_id: m.spl_id,
          parameter_id: m.parameter_id,
          remarks: m.remarks,
        })),
        output_lines: outputRows.map((o) => ({
          item_id: o.item_id || undefined,
          item_name: o.item_name,
          quantity: parseFloat(o.actual_qty) || 0,
          actual_qty: o.actual_qty,
          expected_qty: o.expected_qty,
          avg_weight: parseFloat(o.avg_weight) || undefined,
          output_type: o.output_type || "MAIN",
          uom: o.uom || "HEAD",
          spl_id: o.spl_id,
          parameter_id: o.parameter_id,
          remarks: o.remarks,
        })),
        weight: {
          avg_weight: parseFloat(avgWeight) || undefined,
          daily_gain_gpd: parseFloat(weightGain) ? parseFloat(weightGain) * 1000 : undefined,
          bcs_score: parseFloat(bcsScore) || undefined,
          head_count: parseInt(eveningHeadCount, 10) || openingAnimals,
          remarks: observations,
        },
        mortality_lines: mortRows
          .filter((r) => Number(r.count) > 0)
          .map((r) => ({
            quantity: parseInt(r.count, 10),
            reason: r.reason,
            remarks: r.remarks,
            spl_id: r.spl_id,
          })),
        overhead_lines: overheadRows.map((o) => ({
          resource_name: o.name,
          name: o.name,
          quantity: 1,
          rate: parseFloat(o.cost) || 0,
          cost: o.cost,
          uom: "DAY",
          spl_id: o.spl_id,
          parameter_id: o.parameter_id,
        })),
        resource_lines: resourceRows.map((res) => ({
          resource_id: res.resource_id,
          resource_name: res.resource_name,
          quantity: parseFloat(res.hours) || 1,
          hours: res.hours,
          rate: parseFloat(res.rate) || 25,
          uom: "HOURS",
          spl_id: res.spl_id,
          parameter_id: res.parameter_id,
          remarks: res.remarks,
        })),
        checkpoint_decision: milestoneLine
          ? {
              checkpoint_type: milestoneLine.parameter_name || "CHECKPOINT",
              decision: checkpointResult,
              confirmed_count: checkpointResult === "CONFIRMED" ? parseInt(eveningHeadCount, 10) : 0,
              repeat_count: checkpointResult === "REPEAT" ? parseInt(eveningHeadCount, 10) : 0,
              failed_count: checkpointResult === "FAILED" ? parseInt(eveningHeadCount, 10) : 0,
              remarks: observations,
            }
          : undefined,
        transfer: transferData.enabled
          ? {
              head_count: parseInt(transferData.head_count, 10) || 0,
              avg_weight: parseFloat(transferData.avg_weight) || undefined,
              to_stage_code: transferData.to_stage_code,
              to_location_id: transferData.to_location_id || undefined,
              auto_triggers_stage: transferData.auto_triggers_stage,
              remarks: transferData.remarks,
            }
          : undefined,
        remarks: observations,
      };

      if (isDraft) {
        await api.post(`/batch/${batch.batch_id}/daily-entry/draft`, payload);
        setHasDraft(true);
        setNotification(`✓ Draft day sheet saved for ${currentDate}!`);
      } else {
        await onSaveEntry(payload);
        setHasDraft(false);
        setNotification(`✓ Day sheet for ${currentDate} posted to Inventory, Costing & General Ledger!`);
      }
      setTimeout(() => setNotification(null), 5000);
    } catch {
      // Handled in parent
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {notification && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/70 p-3.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold hover:underline opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Draft In Progress Banner */}
      {hasDraft && (
        <div className="rounded-2xl border border-blue-300 dark:border-blue-800 bg-blue-50/90 dark:bg-blue-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-blue-950 dark:text-blue-100 uppercase tracking-wide">
                Saved Draft In Progress for {currentDate}
              </h4>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                You are currently editing a saved draft. Click "Post Day" to commit to ledger and inventory, or "Discard Draft" to reset to standard schedule.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscardDraft}
            className="text-xs h-8 px-3 gap-1.5 font-bold text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 self-end sm:self-center"
          >
            <RotateCcw className="w-3 h-3" /> Discard Draft
          </Button>
        </div>
      )}

      {/* ── 15-Day Date Navigator Pill Bar ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)] mb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
              15-Day Production Log Navigator
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">Custom Date:</span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="px-2 py-0.5 text-xs font-bold font-mono text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {daysList.map((d) => (
            <button
              key={d.dateStr}
              type="button"
              onClick={() => onDateChange?.(d.dateStr)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-center transition border ${
                d.isCurrent
                  ? "bg-[#1A3A5C] text-white border-[#1A3A5C] shadow-sm ring-2 ring-blue-500/30"
                  : "bg-[var(--surface-raised)]/40 hover:bg-[var(--surface-raised)] text-[var(--text-primary)] border-[var(--border)]"
              }`}
            >
              <div className="text-[11px] font-black">{d.label}</div>
              <div className={`text-[9px] font-bold ${d.isCurrent ? "text-blue-200" : "text-[var(--text-muted)]"}`}>
                {d.sub}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Top Header Toolbar ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-lg font-black shadow-xs">
            🐷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-[var(--text-primary)]">
                {batch.batch_no} · Daily Data Entry
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 uppercase tracking-wider">
                {batch.current_stage_code ? batch.current_stage_code.replace(/_/g, " ") : "ACTIVE"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Day <strong className="text-[var(--text-primary)]">{dataEntryData?.day_of_batch ?? "—"}</strong> of Lifecycle · Opening:{" "}
              <strong className="text-[var(--text-primary)]">{openingAnimals} head</strong> · Active Scheduler Parameters Loaded
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={applyScheduledStandards}
            className="text-xs h-8 px-3 gap-1.5 font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <Sparkles className="w-3.5 h-3.5" /> Apply Standards
          </Button>

          {dataEntryLoading && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold px-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading schedule…
            </div>
          )}
        </div>
      </div>

      {/* ── Active Milestone / Checkpoint Card (if due today) ── */}
      {milestoneLine && (
        <div className="rounded-2xl border-2 border-amber-400/80 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base font-bold shadow-xs">
                ⚡
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                  Milestone Checkpoint: {milestoneLine.parameter_name}
                </h4>
                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                  {milestoneLine.period_label || "Scheduled reproductive / health milestone protocol"}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 uppercase">
              Due Day {dataEntryData?.day_of_batch}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/60">
            <span className="text-xs font-bold text-amber-950 dark:text-amber-200">Select Protocol Action:</span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setCheckpointResult("CONFIRMED")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition border ${
                  checkpointResult === "CONFIRMED"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                ✓ Confirmed (Proceed)
              </button>
              <button
                type="button"
                onClick={() => setCheckpointResult("REPEAT")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition border ${
                  checkpointResult === "REPEAT"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                ↺ Repeat Checkpoint
              </button>
              <button
                type="button"
                onClick={() => setCheckpointResult("FAILED")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition border ${
                  checkpointResult === "FAILED"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-raised)]"
                }`}
              >
                ✗ Failed / Cull
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Feed, Meds, Outputs, Weight, Mortality */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Block 1: Scheduled Feed Consumption ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm font-black">
                  <Wheat className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    1. Scheduled Feed Consumption
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Morning and evening rations defined by active stage scheduler
                  </p>
                </div>
              </div>

              <div className="text-right flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Total Qty</span>
                  <span className="text-xs font-black font-mono text-[var(--text-primary)]">{totalFeedQty.toFixed(1)} KG</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Feed Cost</span>
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{totalFeedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--surface-raised)]/60 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-4 py-2.5">Feed Item</th>
                    <th className="px-3 py-2.5">Lot No</th>
                    <th className="px-3 py-2.5 text-center">Std Target</th>
                    <th className="px-3 py-2.5 text-center">Actual Consumed (KG)</th>
                    <th className="px-2 py-2.5">UOM</th>
                    <th className="px-3 py-2.5 text-right">Rate</th>
                    <th className="px-4 py-2.5 text-right">Subtotal (₹)</th>
                    <th className="px-2 py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {feedRows.map((r) => {
                    const actual = parseFloat(r.actual_qty) || 0;
                    const cost = actual * r.unit_cost;
                    const variancePct = r.std_qty > 0 ? ((actual - r.std_qty) / r.std_qty) * 100 : 0;
                    return (
                      <tr key={r.id} className="hover:bg-[var(--surface-raised)]/20 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--text-primary)]">{r.item_name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">FEED · Inventory Stock</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {r.lot_no}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-[var(--text-secondary)] font-bold">
                          {r.std_qty.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => adjustFeedQty(r.id, -1)}
                              className="w-6 h-6 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold hover:bg-[var(--surface)]"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              step="0.1"
                              value={r.actual_qty}
                              onChange={(e) => updateFeedQty(r.id, e.target.value)}
                              className="w-20 px-2 py-1 text-right text-xs font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => adjustFeedQty(r.id, 1)}
                              className="w-6 h-6 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs font-bold hover:bg-[var(--surface)]"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-3 font-semibold text-[var(--text-secondary)]">{r.uom}</td>
                        <td className="px-3 py-3 text-right font-mono text-[var(--text-secondary)]">
                          ₹{Number(r.unit_cost).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-[var(--text-primary)]">
                          ₹{cost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {r.std_qty > 0 && Math.abs(variancePct) > 1 && (
                            <span
                              className={`block text-[9px] font-bold ${
                                variancePct > 0 ? "text-amber-600" : "text-blue-600"
                              }`}
                            >
                              {variancePct > 0 ? `+${variancePct.toFixed(1)}%` : `${variancePct.toFixed(1)}%`}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeFeedRow(r.id)}
                            disabled={feedRows.length <= 1}
                            className="text-rose-600 hover:text-rose-700 disabled:opacity-20 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex items-center justify-between">
              <button
                type="button"
                onClick={addFeedRow}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add supplementary feed row
              </button>
            </div>
          </div>

          {/* ── Block 2: Health, Medications & Vaccines ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center text-sm font-black">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    2. Medications, Vaccines & Deworming
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {medRows.length} scheduled protocols · Automatic withdrawal period tracking
                  </p>
                </div>
              </div>
            </div>

            {medRows.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                <p>No mandatory medications or vaccines scheduled for Day {dataEntryData?.day_of_batch ?? "today"}.</p>
                <button
                  type="button"
                  onClick={addMedRow}
                  className="mt-2 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add ad-hoc treatment
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)]/60 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-2.5">Treatment / Vaccine</th>
                      <th className="px-3 py-2.5">Lot No</th>
                      <th className="px-3 py-2.5 text-center">Doses</th>
                      <th className="px-2 py-2.5">UOM</th>
                      <th className="px-3 py-2.5">Withdrawal Protocol</th>
                      <th className="px-4 py-2.5">Stockman Remarks</th>
                      <th className="px-2 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {medRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-raised)]/20 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--text-primary)]">{r.item_name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">MEDICINE · Veterinary Protocol</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900">
                            {r.lot_no}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            step="0.1"
                            value={r.consumed_qty}
                            onChange={(e) => updateMedField(r.id, "consumed_qty", e.target.value)}
                            className="w-20 px-2 py-1 text-center text-xs font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg font-mono"
                          />
                        </td>
                        <td className="px-2 py-3 font-semibold text-[var(--text-secondary)]">{r.uom}</td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-900">
                            {r.withdrawal_days}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={r.remarks}
                            onChange={(e) => updateMedField(r.id, "remarks", e.target.value)}
                            className="w-full px-2 py-1 text-xs text-[var(--text-primary)] bg-transparent border-b border-dashed border-[var(--border)] focus:border-purple-500"
                          />
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeMedRow(r.id)}
                            className="text-rose-600 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {medRows.length > 0 && (
              <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-raised)]/20">
                <button
                  type="button"
                  onClick={addMedRow}
                  className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add medication protocol
                </button>
              </div>
            )}
          </div>

          {/* ── Block 3: Scheduled Output / Piglet Harvest Yield (OUTPUT) ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm font-black">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    3. Output Products & Piglet Harvest Yield
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Live born piglets, weaned piglets, carcass harvest yield defined by scheduler
                  </p>
                </div>
              </div>
            </div>

            {outputRows.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                <p>No mandatory output yield scheduled for Day {dataEntryData?.day_of_batch ?? "today"}.</p>
                <button
                  type="button"
                  onClick={addOutputRow}
                  className="mt-2 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Record ad-hoc output harvest
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-raised)]/60 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-2.5">Output Product</th>
                      <th className="px-3 py-2.5 text-center">Std Yield</th>
                      <th className="px-3 py-2.5 text-center">Actual Yield</th>
                      <th className="px-2 py-2.5">UOM</th>
                      <th className="px-3 py-2.5 text-center">Avg Weight (KG)</th>
                      <th className="px-3 py-2.5">Classification</th>
                      <th className="px-2 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {outputRows.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-raised)]/20 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--text-primary)]">{r.item_name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">OUTPUT · Finished Goods</div>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-[var(--text-secondary)] font-bold">
                          {r.expected_qty}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            step="1"
                            value={r.actual_qty}
                            onChange={(e) => updateOutputField(r.id, "actual_qty", e.target.value)}
                            className="w-20 px-2 py-1 text-center text-xs font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg font-mono"
                          />
                        </td>
                        <td className="px-2 py-3 font-semibold text-[var(--text-secondary)]">{r.uom}</td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="number"
                            step="0.05"
                            value={r.avg_weight}
                            onChange={(e) => updateOutputField(r.id, "avg_weight", e.target.value)}
                            className="w-20 px-2 py-1 text-center text-xs font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg font-mono"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={r.output_type}
                            onChange={(e) => updateOutputField(r.id, "output_type", e.target.value)}
                            className="px-2 py-1 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg"
                          >
                            <option value="MAIN">MAIN (Prime)</option>
                            <option value="BY_PRODUCT">BY PRODUCT</option>
                            <option value="CULL">CULL / SECOND GRADE</option>
                          </select>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeOutputRow(r.id)}
                            className="text-rose-600 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {outputRows.length > 0 && (
              <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-raised)]/20">
                <button
                  type="button"
                  onClick={addOutputRow}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add output line
                </button>
              </div>
            )}
          </div>

          {/* ── Block 4: Herd Weighing & Growth Standards ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-black">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    4. Herd Growth & Body Condition
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Benchmarked vs Breed Lifecycle Standards ({batch.breed_id ? "Configured Breed" : "Standard"})
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)] p-4 gap-4 sm:gap-0">
              {/* Avg Weight */}
              <div className="sm:px-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] block">
                  Average Weight (KG) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={avgWeight}
                  onChange={(e) => setAvgWeight(e.target.value)}
                  className="w-full px-3 py-2 text-base font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl font-mono text-right"
                />
                {targetWeight && (
                  <div className="text-[11px] font-bold flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Std: {targetWeight} kg</span>
                    <span
                      className={
                        Number(avgWeight) >= targetWeight
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {Number(avgWeight) >= targetWeight ? "✓ On Target" : "↓ Below Target"}
                    </span>
                  </div>
                )}
              </div>

              {/* Weight Gain ADG */}
              <div className="sm:px-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] block">
                  Daily Gain (ADG - kg/d)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weightGain}
                  onChange={(e) => setWeightGain(e.target.value)}
                  className="w-full px-3 py-2 text-base font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl font-mono text-right"
                />
                {targetAdg && (
                  <div className="text-[11px] font-bold flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Std: {targetAdg} g/d</span>
                    <span className="text-emerald-600 dark:text-emerald-400">✓ In Range</span>
                  </div>
                )}
              </div>

              {/* BCS Score */}
              <div className="sm:px-4 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] block">
                  Body Condition Score (1–5)
                </label>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {["1.0", "2.0", "3.0", "4.0", "5.0"].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setBcsScore(score)}
                      className={`py-1.5 rounded-lg text-xs font-black transition border ${
                        bcsScore === score
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-[var(--surface-raised)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-center font-bold text-[var(--text-muted)]">
                  {bcsScore === "1.0"
                    ? "Emaciated"
                    : bcsScore === "3.0"
                    ? "Ideal Target"
                    : bcsScore === "5.0"
                    ? "Overweight"
                    : "Standard"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Block 5: Mortality & Culls Audit ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 flex items-center justify-center text-sm font-black">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                    5. Mortality & Culls Audit
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Audited with reason code · Updates live headcount immediately
                  </p>
                </div>
              </div>

              <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono">
                {totalMortalityToday} Head Today
              </span>
            </div>

            <div className="space-y-2">
              {mortRows.map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-[var(--surface-raised)]/30 border border-[var(--border)] text-xs"
                >
                  <div className="col-span-6 sm:col-span-7">
                    <select
                      value={r.reason}
                      onChange={(e) => updateMortReason(r.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg"
                    >
                      <option value="Weak / Poor body condition">Weakness / Poor Condition</option>
                      <option value="Crushed / Overlay">Crushed / Splay leg</option>
                      <option value="Respiratory / Cough">Respiratory / Cough</option>
                      <option value="Gastrointestinal / Scours">Scours / Gastrointestinal</option>
                      <option value="Cull / Market Ineligible">Cull / Low Growth</option>
                      <option value="Unknown Cause">Unknown Cause</option>
                    </select>
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateMortCount(r.id, -1)}
                      className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-bold text-xs flex items-center justify-center hover:bg-[var(--surface-raised)]"
                    >
                      −
                    </button>
                    <span className="text-xs font-black text-rose-600 font-mono min-w-[20px] text-center">
                      {r.count}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateMortCount(r.id, 1)}
                      className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-bold text-xs flex items-center justify-center hover:bg-[var(--surface-raised)]"
                    >
                      +
                    </button>
                  </div>

                  <div className="col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeMortRow(r.id)}
                      disabled={mortRows.length <= 1}
                      className="text-rose-600 hover:text-rose-700 disabled:opacity-20 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-1 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={addMortRow}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add another mortality cause
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Overheads, Labour, Log Notes & Bio-Asset Status */}
        <div className="space-y-6">
          {/* ── Block 6: Barn Overheads & Utilities ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                  6. Barn Overheads
                </h3>
              </div>
              <span className="text-xs font-black font-mono text-[var(--text-primary)]">
                ₹{totalOverheadCost.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              {overheadRows.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--text-secondary)] font-medium truncate">{o.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">₹</span>
                    <input
                      type="number"
                      step="1"
                      value={o.cost}
                      onChange={(e) => updateOverheadField(o.id, "cost", e.target.value)}
                      className="w-16 px-2 py-1 text-right text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeOverheadRow(o.id)}
                      disabled={overheadRows.length <= 1}
                      className="text-rose-600 hover:text-rose-700 disabled:opacity-20 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addOverheadRow}
              className="pt-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add overhead line
            </button>
          </div>

          {/* ── Block 7: Stockman Labour & Resource Attendance ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                  7. Labour & Resources
                </h3>
              </div>
              <span className="text-xs font-black font-mono text-[var(--text-primary)]">
                ₹{totalLabourCost.toFixed(2)}
              </span>
            </div>

            <div className="space-y-2">
              {resourceRows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-[var(--text-secondary)] font-medium truncate">{r.resource_name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      step="0.5"
                      value={r.hours}
                      onChange={(e) => updateResourceField(r.id, "hours", e.target.value)}
                      className="w-14 px-2 py-1 text-right text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md font-mono"
                    />
                    <span className="text-[10px] text-[var(--text-muted)] font-bold">hrs</span>
                    <button
                      type="button"
                      onClick={() => removeResourceRow(r.id)}
                      disabled={resourceRows.length <= 1}
                      className="text-rose-600 hover:text-rose-700 disabled:opacity-20 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addResourceRow}
              className="pt-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add labour line
            </button>
          </div>

          {/* ── Block 8: Evening Headcount & Daily Observations ── */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                📝
              </div>
              <h3 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                8. Log Notes & Headcount
              </h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[var(--text-secondary)]">
                Closing Evening Headcount
              </label>
              <input
                type="number"
                value={eveningHeadCount}
                onChange={(e) => setEveningHeadCount(e.target.value)}
                className="w-full px-3 py-1.5 text-sm font-black text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl font-mono text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-[var(--text-secondary)]">
                General Stockman Observations
              </label>
              <textarea
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Log daily barn temperature, appetite observations, sow parity remarks..."
                className="w-full p-2.5 text-xs text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ── Block 9: Scheduled Stage Transfer (if defined in scheduler) ── */}
          {transferLine && (
            <div className="rounded-2xl border-2 border-indigo-400/80 bg-indigo-50/50 dark:bg-indigo-950/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-100 uppercase">
                    Stage Transfer Protocol
                  </h4>
                </div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transferData.enabled}
                    onChange={(e) => setTransferData({ ...transferData, enabled: e.target.checked })}
                    className="rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Execute Transfer</span>
                </label>
              </div>

              {transferData.enabled && (
                <div className="space-y-2 pt-2 border-t border-indigo-200 dark:border-indigo-900 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-secondary)]">Head Count:</label>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={transferData.head_count}
                        onChange={(e) => setTransferData({ ...transferData, head_count: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-bold bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-secondary)]">Avg Weight (KG):</label>
                      <input
                        type="number"
                        placeholder="kg"
                        value={transferData.avg_weight}
                        onChange={(e) => setTransferData({ ...transferData, avg_weight: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-bold bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Bio-Asset IAS 41 Card (if Bio-Asset Batch) ── */}
          {batch.costing_method === "BIO_ASSET" && (
            <div className="rounded-2xl bg-gradient-to-br from-[#122842] to-[#1A3A5C] text-white p-4 shadow-sm space-y-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-200/90 flex items-center justify-between">
                <span>Bio Asset — IAS 41 Model</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold">
                  {batch.bio_asset_state?.stage || "MATURE"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-white/10">
                  <span className="text-blue-200/70">Initial Capitalized Cost</span>
                  <span className="font-mono font-bold">
                    ₹{Number(batch.bio_asset_state?.initial_cost || 1350000).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-white/10">
                  <span className="text-blue-200/70">Accumulated Amortization</span>
                  <span className="font-mono font-bold">
                    ₹{Number(batch.bio_asset_state?.accumulated_amortization || 56250).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-200/70">Net Carrying Value (NBV)</span>
                  <span className="font-mono font-black text-emerald-300">
                    ₹{Number(batch.bio_asset_state?.nca_book_value || 1293750).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Action Footer Bar ── */}
      <div className="sticky bottom-0 z-40 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4 bg-[var(--surface)] border-t border-[var(--border)] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            <Activity className="w-4 h-4" />
            <span>Day Feed: <strong className="font-mono">{totalFeedQty.toFixed(1)} KG</strong></span>
          </div>
          <div>
            <span>Day Cost: <strong className="font-mono text-[var(--text-primary)]">₹{totalDayCost.toFixed(2)}</strong></span>
          </div>
          <div>
            <span>Mortality: <strong className="font-mono text-rose-600">{totalMortalityToday}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="text-xs h-9 px-4 font-bold gap-1.5 border-blue-400/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Save as Draft
          </Button>

          <Button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="bg-[#1A3A5C] hover:bg-[#132b45] text-white text-xs h-9 px-5 font-black gap-2 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Day</span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold font-mono">
              {currentDate}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
