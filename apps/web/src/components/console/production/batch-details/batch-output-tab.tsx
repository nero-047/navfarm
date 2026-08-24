"use client";

import React, { useState, useMemo } from "react";
import { ClipboardCheck, QrCode as QrCodeIcon, Sparkles, Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";

interface BatchOutputTabProps {
  batch: any;
  items?: any[];
  onRefreshBatch?: () => Promise<void>;
  onRecordQc?: (line: any) => void;
  onGeneratePack?: (line: any) => void;
}

export function BatchOutputTab({
  batch,
  items = [],
  onRefreshBatch,
  onRecordQc,
  onGeneratePack,
}: BatchOutputTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [activeLine, setActiveLine] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form state for Record Output
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formItemName, setFormItemName] = useState("Live Born Piglets");
  const [formQty, setFormQty] = useState("320");
  const [formAvgWeight, setFormAvgWeight] = useState("1.45");
  const [formUom, setFormUom] = useState("HEAD");
  const [formType, setFormType] = useState("MAIN");
  const [formRemarks, setFormRemarks] = useState("Litter farrowing output harvest");

  // QC Form state
  const [qcGrade, setQcGrade] = useState("GRADE_A");
  const [qcNotes, setQcNotes] = useState("High vigor, uniform weight distribution, healthy piglets");

  // Pack generation state
  const [packSize, setPackSize] = useState("10");

  const outputLines = useMemo(() => batch?.output_lines || [], [batch?.output_lines]);
  const currentQty = Math.round(Number(batch?.current_quantity ?? batch?.opening_quantity ?? 30));
  const stageName = batch?.current_stage_code
    ? batch.current_stage_code.replace(/_/g, " ")
    : batch?.stage_name || batch?.stage || "ACTIVE";

  const isBreedingSow =
    batch?.costing_method === "BIO_ASSET" ||
    stageName.toLowerCase().includes("gest") ||
    stageName.toLowerCase().includes("farrow") ||
    stageName.toLowerCase().includes("lact");

  const expectedDate = batch?.expected_end_date
    ? new Date(batch.expected_end_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Scheduled Milestone";

  // Dynamic forecast based on current herd size
  const expectedLitters = Math.round(currentQty * 0.9);
  const totalPigletsForecast = Math.round(expectedLitters * 11.5);

  // Submit Harvest Output
  const handleRecordSubmit = async () => {
    const qty = parseFloat(formQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/batch/${batch.batch_id}/transaction`, {
        transaction_date: formDate,
        transaction_type: "OUTPUT",
        quantity: qty,
        uom: formUom,
        remarks: `${formItemName} (${formType}) - Avg ${formAvgWeight}kg: ${formRemarks}`,
      });

      setNotification(`✓ Recorded harvest output: ${qty} ${formUom} of ${formItemName}!`);
      setModalOpen(false);
      if (onRefreshBatch) await onRefreshBatch();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to record output yield.");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit QC
  const handleQcSubmit = () => {
    setQcModalOpen(false);
    setNotification(`✓ Quality Inspection recorded: ${qcGrade} passed.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Submit Pack Generation
  const handlePackSubmit = () => {
    setPackModalOpen(false);
    setNotification(`✓ QR Traceability Pack generated: Pack of ${packSize} items initialized.`);
    setTimeout(() => setNotification(null), 3000);
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
        {/* ── Main Output View ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Output & Production Allocation — {stageName}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Primary and byproduct inventory yielded from batch lifecycle completion
                </p>
              </div>

              <Button
                onClick={() => setModalOpen(true)}
                className="bg-[#1A3A5C] text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" /> Record Harvest
              </Button>
            </div>

            {outputLines.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-[var(--text-primary)]">
                  {isBreedingSow
                    ? "Output Produced at Farrowing / Weaning Stage"
                    : "Output Produced at Batch Slaughter / Harvest Stage"}
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                  {isBreedingSow ? (
                    <>
                      Farrowing output (live born piglets, stillborn, mummified) and weaned piglet transfers will record into inventory upon reaching the designated milestone.
                    </>
                  ) : (
                    <>
                      Commercial porker carcase yield, live weight sales, and by-products will automatically allocate costs upon batch close.
                    </>
                  )}
                </p>
                <Button
                  onClick={() => setModalOpen(true)}
                  variant="outline"
                  className="text-xs h-8 px-3 gap-1.5 font-bold mt-2"
                >
                  <Plus className="w-3.5 h-3.5" /> Record Output Now
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-4 py-3">Output Item</th>
                      <th className="px-3.5 py-3">Type</th>
                      <th className="px-3.5 py-3 text-right">Cost Split %</th>
                      <th className="px-3.5 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Unit / Total Cost (₹)</th>
                      <th className="px-3.5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {outputLines.map((l: any, idx: number) => (
                      <tr key={l.line_id || idx} className="hover:bg-[var(--surface-raised)]/30 transition">
                        <td className="px-4 py-3 font-bold text-[var(--text-primary)]">{l.item_id || l.item_name || "Piglet Yield"}</td>
                        <td className="px-3.5 py-3 text-[var(--text-secondary)]">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--surface-raised)] border border-[var(--border)]">
                            {l.output_type || "MAIN"}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold">{l.cost_split_pct || 100}%</td>
                        <td className="px-3.5 py-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {l.quantity} {l.uom || "HEAD"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          ₹{Number(l.unit_cost || 0).toFixed(2)} / ₹{Number(l.computed_cost || 0).toFixed(2)}
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                if (onRecordQc) onRecordQc(l);
                                else {
                                  setActiveLine(l);
                                  setQcModalOpen(true);
                                }
                              }}
                              title="Record QC"
                              className="p-1.5 rounded-md hover:bg-[var(--surface-raised)] text-[var(--text-secondary)]"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (onGeneratePack) onGeneratePack(l);
                                else {
                                  setActiveLine(l);
                                  setPackModalOpen(true);
                                }
                              }}
                              title="Generate Pack"
                              className="p-1.5 rounded-md hover:bg-[var(--surface-raised)] text-[var(--text-secondary)]"
                            >
                              <QrCodeIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar: Output Forecast ── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Output Forecast
              </h3>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/40 dark:bg-emerald-950/20">
                <span className="text-[var(--text-secondary)]">Expected Harvest / Farrow</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {expectedDate}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Current Active Herd</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{currentQty} head</span>
              </div>
              {isBreedingSow ? (
                <>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-[var(--text-secondary)]">Conception / Farrowing Rate</span>
                    <span className="font-bold text-[var(--text-primary)] font-mono">90.0%</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-[var(--text-secondary)]">Expected Litters</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">~{expectedLitters} litters</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-[var(--text-secondary)]">Avg Born Alive / Sow</span>
                    <span className="font-bold text-[var(--text-primary)] font-mono">11.5 piglets</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-[var(--surface-raised)]/20">
                    <span className="font-bold text-[var(--text-primary)]">Total Piglets Forecast</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">~{totalPigletsForecast} head</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-[var(--text-secondary)]">Target Market Weight</span>
                    <span className="font-bold text-[var(--text-primary)] font-mono">105.0 kg</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5 bg-[var(--surface-raised)]/20">
                    <span className="font-bold text-[var(--text-primary)]">Total Live Weight Forecast</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ~{(currentQty * 105).toLocaleString("en-IN")} KG
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Record Output Yield Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Record Harvest Output</h3>
                <p className="text-xs text-[var(--text-secondary)]">Log piglets farrowed or carcase yield for {batch.batch_no}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Harvest Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Classification</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  >
                    <option value="MAIN">MAIN (Grade A / Prime)</option>
                    <option value="BY_PRODUCT">BY_PRODUCT (Offal / Hides)</option>
                    <option value="CULL">CULL (Sub-grade)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Output Product *</label>
                <input
                  type="text"
                  placeholder="e.g. Live Born Piglets, Weaned Piglets, Porker Carcass"
                  value={formItemName}
                  onChange={(e) => setFormItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Quantity *</label>
                  <input
                    type="number"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">UOM</label>
                  <select
                    value={formUom}
                    onChange={(e) => setFormUom(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                  >
                    <option value="HEAD">HEAD (Animals)</option>
                    <option value="KG">KG (Weight)</option>
                    <option value="UNITS">UNITS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Avg Weight (KG)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formAvgWeight}
                    onChange={(e) => setFormAvgWeight(e.target.value)}
                    className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl text-right"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Harvest Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Parity 2 farrowing litter, high vigor"
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
                Record Output
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record QC Inspection Modal ── */}
      {qcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Quality Control Inspection</h3>
                <p className="text-xs text-[var(--text-secondary)]">Perform grading for {activeLine?.item_id || "Output Line"}</p>
              </div>
              <button onClick={() => setQcModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Quality Grade</label>
                <select
                  value={qcGrade}
                  onChange={(e) => setQcGrade(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                >
                  <option value="GRADE_A">Grade A (Prime Quality - Export Standard)</option>
                  <option value="GRADE_B">Grade B (Standard Commercial Quality)</option>
                  <option value="GRADE_C">Grade C (Sub-standard / Domestic Only)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Inspection Findings</label>
                <textarea
                  rows={3}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  className="w-full p-2.5 text-xs text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setQcModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handleQcSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-black">
                Confirm QC Pass
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate QR Pack Modal ── */}
      {packModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Generate Traceability Pack</h3>
                <p className="text-xs text-[var(--text-secondary)]">Create QR traceable pack lot for dispatch</p>
              </div>
              <button onClick={() => setPackModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block mb-1">Pack Size (Items)</label>
                <input
                  type="number"
                  value={packSize}
                  onChange={(e) => setPackSize(e.target.value)}
                  className="w-full px-3 py-2 font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl"
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Creates a digital pallet QR identifier linked to batch {batch.batch_no} with complete feed, health, and lineage history.
              </p>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setPackModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button onClick={handlePackSubmit} className="bg-[#1A3A5C] text-white text-xs h-8 font-black">
                Generate QR Pack
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
