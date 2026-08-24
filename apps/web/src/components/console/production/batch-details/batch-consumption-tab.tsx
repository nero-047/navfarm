"use client";

import React, { useState, useMemo } from "react";
import { Download, Plus, X, Loader2, CheckCircle2, Wheat, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";

interface BatchConsumptionTabProps {
  batch: any;
  items?: any[];
  onRefreshBatch?: () => Promise<void>;
}

export function BatchConsumptionTab({ batch, items = [], onRefreshBatch }: BatchConsumptionTabProps) {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "FEED" | "MEDICINE">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<"FEED" | "MEDICINE">("FEED");
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formItemId] = useState<string>("");
  const [formCustomName, setFormCustomName] = useState<string>("");
  const [formQty, setFormQty] = useState<string>("40");
  const [formRate, setFormRate] = useState<string>("12.50");
  const [formLotNo, setFormLotNo] = useState<string>(`LOT-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-01`);
  const [formRemarks, setFormRemarks] = useState<string>("");

  const txs = useMemo(() => {
    return (batch?.transactions || []).filter((t: any) => t.transaction_type === "CONSUMPTION");
  }, [batch?.transactions]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; category: string; uom: string; consumed: number; cost: number; lotNo: string }>();

    for (const t of txs) {
      const isMed =
        t.uom === "ML" ||
        t.uom === "DOSES" ||
        (t.remarks || "").toLowerCase().includes("inj") ||
        (t.remarks || "").toLowerCase().includes("vac") ||
        (t.remarks || "").toLowerCase().includes("deworm") ||
        (t.remarks || "").toLowerCase().includes("lot: med");
      const category = isMed ? "MEDICINE" : "FEED";
      const uom = t.uom || (isMed ? "DOSES" : "KG");
      const qty = Math.abs(Number(t.quantity || 0));
      const rate = Number(t.rate) || (isMed ? 25.0 : 12.5);
      const amount = t.amount !== undefined && t.amount !== null ? Math.abs(Number(t.amount)) : qty * rate;

      let lotNo = "LOT-STD";
      let name = isMed ? "Veterinary Medicine / Vaccine" : "Standard Daily Ration";

      if (t.remarks) {
        const lotMatch = t.remarks.match(/Lot:\s*([^\s\-\)]+)/i);
        if (lotMatch) lotNo = lotMatch[1];
        name = t.remarks.replace(/^Daily Feed:\s*/i, "").replace(/^Lot:\s*[^\s\-]+\s*[-–]?\s*/i, "").replace(/Feed Consumption:\s*/i, "").trim() || name;
      }

      const key = t.item_id || `${category}-${name}`;

      if (!map.has(key)) {
        map.set(key, { name, category, uom, consumed: 0, cost: 0, lotNo });
      }
      const rec = map.get(key)!;
      rec.consumed += qty;
      rec.cost += amount;
    }

    return map;
  }, [txs]);

  const consumptionRecords = useMemo(() => {
    if (grouped.size === 0) {
      return [];
    }

    return Array.from(grouped.entries()).map(([key, val]) => {
      const opening = val.consumed * 1.35;
      const issued = val.consumed * 1.02;
      const wastage = val.consumed * 0.015;
      const closing = Math.max(0, opening - val.consumed - wastage);

      return {
        id: key,
        category: val.category,
        name: val.name,
        lotNo: val.lotNo,
        meta: `Recorded across batch lifecycle`,
        uom: val.uom,
        opening: opening.toFixed(1),
        issued: issued.toFixed(1),
        consumed: val.consumed.toFixed(1),
        wastage: wastage.toFixed(1),
        closing: closing.toFixed(1),
        cost: val.cost.toFixed(2),
      };
    });
  }, [grouped]);

  const totalConsumptionCost = useMemo(() => {
    return consumptionRecords.reduce((sum, r) => sum + parseFloat(r.cost), 0);
  }, [consumptionRecords]);

  const totalFeedCost = useMemo(() => {
    return consumptionRecords.filter((r) => r.category === "FEED").reduce((sum, r) => sum + parseFloat(r.cost), 0);
  }, [consumptionRecords]);

  const totalMedCost = useMemo(() => {
    return consumptionRecords.filter((r) => r.category === "MEDICINE").reduce((sum, r) => sum + parseFloat(r.cost), 0);
  }, [consumptionRecords]);

  const totalFeedQty = useMemo(() => {
    return consumptionRecords.filter((r) => r.category === "FEED").reduce((sum, r) => sum + parseFloat(r.consumed), 0);
  }, [consumptionRecords]);

  const filtered = useMemo(() => {
    return consumptionRecords.filter((c) => activeCategory === "ALL" || c.category === activeCategory);
  }, [consumptionRecords, activeCategory]);

  const stageName = batch?.current_stage_code
    ? batch.current_stage_code.replace(/_/g, " ")
    : batch?.stage_name || batch?.stage || "ACTIVE";

  // Handle Record Consumption Submission
  const handleRecordSubmit = async () => {
    if (!formQty || Number(formQty) <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    setSubmitting(true);
    try {
      const selectedItem = items.find((i: any) => i.item_id === formItemId);
      const itemName = selectedItem?.item_name || formCustomName || (formType === "FEED" ? "Supplement Feed Ration" : "Veterinary Treatment");
      const remarks = `Lot: ${formLotNo} - ${itemName}${formRemarks ? ` (${formRemarks})` : ""}`;

      await api.post(`/batch/${batch.batch_id}/transaction`, {
        transaction_date: formDate,
        transaction_type: "CONSUMPTION",
        item_id: formItemId || undefined,
        quantity: parseFloat(formQty),
        rate: parseFloat(formRate) || undefined,
        uom: formType === "FEED" ? "KG" : "DOSES",
        remarks,
      });

      setNotification(`✓ Recorded consumption for ${itemName} (${formQty} ${formType === "FEED" ? "KG" : "DOSES"})!`);
      setModalOpen(false);
      if (onRefreshBatch) await onRefreshBatch();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to record consumption.");
    } finally {
      setSubmitting(false);
    }
  };

  // CSV Export
  const handleExport = () => {
    const headers = "Category,Item Name,Lot No,UOM,Consumed Qty,Total Cost (INR)\n";
    const rows = consumptionRecords
      .map((r) => `"${r.category}","${r.name}","${r.lotNo}","${r.uom}",${r.consumed},${r.cost}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Batch_Consumption_${batch.batch_no}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 p-3.5 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-100 shadow-md">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Consumption Table ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            {/* Header & Export */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Consumption Summary — {stageName}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Live FIFO inventory relief entries posted from daily operations
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport} className="text-xs h-8 px-3 gap-1.5 font-bold">
                  <Download className="w-3.5 h-3.5" /> Export
                </Button>
                <Button
                  onClick={() => setModalOpen(true)}
                  className="bg-[#1A3A5C] hover:bg-[#132b45] text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Consumption
                </Button>
              </div>
            </div>

            {/* Sub-Category Filter Strip */}
            <div className="flex items-center gap-4 px-4 border-b border-[var(--border)] text-xs font-semibold bg-[var(--surface-raised)]/10">
              {(["ALL", "FEED", "MEDICINE"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`py-2.5 border-b-2 capitalize transition -mb-[1px] ${
                    activeCategory === cat
                      ? "border-[#1A3A5C] dark:border-blue-400 text-[#1A3A5C] dark:text-blue-300 font-black"
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {cat === "ALL" ? "All items" : cat.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Wheat className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
                <p className="font-bold text-[var(--text-primary)]">No consumption records found for this category</p>
                <p>Use the "Record Consumption" button to log supplementary rations or health treatments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[700px]">
                  <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3">Item details</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Lot No</th>
                      <th className="px-3 py-3 text-right">Consumed</th>
                      <th className="px-2.5 py-3">UOM</th>
                      <th className="px-4 py-3 text-right">Total Cost (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filtered.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--surface-raised)]/30 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--text-primary)]">{r.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{r.meta}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.category === "FEED"
                                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                                : "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200"
                            }`}
                          >
                            {r.category}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--text-secondary)]">
                            {r.lotNo}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          {Number(r.consumed).toLocaleString("en-IN", { minimumFractionDigits: 1 })}
                        </td>
                        <td className="px-2.5 py-3 font-semibold text-[var(--text-secondary)]">{r.uom}</td>
                        <td className="px-4 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          ₹{parseFloat(r.cost).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
              <span>Showing {filtered.length} item line types</span>
              <span className="text-[var(--text-primary)]">
                Stage feed total: <strong className="font-mono font-black text-emerald-600 dark:text-emerald-400">{totalFeedQty.toFixed(1)} KG</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Summary ── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Cost Breakdown
              </h3>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Feed Nutrition Rations</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">
                  ₹{totalFeedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Veterinary Medicines & Vaccines</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">
                  ₹{totalMedCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-[var(--surface-raised)]/30">
                <span className="font-black text-[var(--text-primary)]">Total Accumulated Cost</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  ₹{totalConsumptionCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs p-4 space-y-2 text-xs">
            <h4 className="font-black uppercase tracking-wider text-[var(--text-primary)] text-[10px]">
              Valuation & Ledger Model
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Consumption issues relieve raw feed and medicine inventories directly at standard unit rate, debiting WIP Batch Biological Cost account.
            </p>
          </div>
        </div>
      </div>

      {/* ── Record Consumption Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Record Ad-hoc Consumption</h3>
                <p className="text-xs text-[var(--text-secondary)]">Log supplementary feed or medication issue for {batch.batch_no}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Type</label>
                  <div className="grid grid-cols-2 gap-1 bg-[var(--input-bg)] border border-[var(--input-border)] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("FEED");
                        setFormQty("40");
                        setFormRate("12.50");
                      }}
                      className={`py-1 rounded-lg font-bold text-center transition flex items-center justify-center gap-1 ${
                        formType === "FEED" ? "bg-emerald-600 text-white" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      <Wheat className="w-3 h-3" /> Feed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormType("MEDICINE");
                        setFormQty("10");
                        setFormRate("25.00");
                      }}
                      className={`py-1 rounded-lg font-bold text-center transition flex items-center justify-center gap-1 ${
                        formType === "MEDICINE" ? "bg-purple-600 text-white" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      <HeartPulse className="w-3 h-3" /> Medicine
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">
                  Item Description / Name *
                </label>
                <input
                  type="text"
                  placeholder={formType === "FEED" ? "e.g. Grower Mash Supplement" : "e.g. Tylosin 200mg / Electrolyte"}
                  value={formCustomName}
                  onChange={(e) => setFormCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">
                    Quantity ({formType === "FEED" ? "KG" : "DOSES"}) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-right"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Unit Rate (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-right"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Lot No</label>
                  <input
                    type="text"
                    value={formLotNo}
                    onChange={(e) => setFormLotNo(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Remarks / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon extra ration or booster round"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                onClick={handleRecordSubmit}
                disabled={submitting}
                className="bg-[#1A3A5C] text-white text-xs h-8 font-black gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Post Consumption
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
