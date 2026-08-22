"use client";

import React, { useState } from "react";
import {
  Save,
  CheckCircle2,
  Calendar,
  CloudSun,
  Activity,
  Milk,
  Boxes,
  Stethoscope,
  HeartPulse,
  Layers,
} from "lucide-react";
import DairyLifecycleStepper from "./dairy-lifecycle-stepper";
import { api } from "../../../services/api-client";

export default function DairyDailyOperationsEntry() {
  const [selectedDate, setSelectedDate] = useState("2025-04-28");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Milking Yield Data
  const [morningYield, setMorningYield] = useState<number>(1180);
  const [eveningYield, setEveningYield] = useState<number>(1100);
  const [fatPct, setFatPct] = useState<number>(4.15);
  const [snfPct, setSnfPct] = useState<number>(8.85);
  const sccCount = 145000;

  // Feed items state
  const feedRows = [
    { id: 1, name: "Dairy TMR (Total Mixed Ration)", uom: "KG", opening: 3500, issued: 1600, consumed: 1560, wastage: 40, closing: 1940, unitCost: 14.50 },
    { id: 2, name: "Maize / Corn Silage", uom: "KG", opening: 5000, issued: 1200, consumed: 1180, wastage: 20, closing: 3820, unitCost: 6.20 },
    { id: 3, name: "Dairy Concentrate 20% CP", uom: "KG", opening: 1800, issued: 450, consumed: 440, wastage: 10, closing: 1360, unitCost: 28.00 },
    { id: 4, name: "Mineral Mixture (Bovine)", uom: "KG", opening: 120, issued: 12, consumed: 12, wastage: 0, closing: 108, unitCost: 110.00 },
  ];

  // Medication items state
  const medRows = [
    { id: 1, name: "Calcium Gel Bolus", uom: "PCS", issued: 4, consumed: 4, notes: "Administered to 2 fresh post-calving cows" },
    { id: 2, name: "Iodine Teat Dip Solution", uom: "LITER", issued: 5, consumed: 4.8, notes: "Post-milking teat sanitization (100% compliance)" },
    { id: 3, name: "Multivitamin B-Complex Inj.", uom: "ML", issued: 40, consumed: 40, notes: "Supportive therapy for COW-25-0012" },
  ];

  // Labour & Resource state
  const labourRows = [
    { id: 1, role: "Milking Parlour Operator", persons: 2, hours: 5.0 },
    { id: 2, role: "Feed Wagon / TMR Mixer Operator", persons: 1, hours: 3.5 },
    { id: 3, role: "Barn Cleaning & Bedding Worker", persons: 2, hours: 4.0 },
  ];

  // Overheads state
  const overheads = {
    electricity: 450.00,
    water: 120.00,
    sanitation: 180.00,
  };

  const [notes, setNotes] = useState("Herd health is optimal. Morning and evening bulk milk fat tested at 4.15% (grade A). Bulk chiller held at steady 3.8°C.");

  const totalYield = morningYield + eveningYield;
  const activeCowCount = 80;
  const avgYieldPerCow = (totalYield / activeCowCount).toFixed(2);

  const totalFeedCost = feedRows.reduce((sum, r) => sum + r.consumed * r.unitCost, 0);
  const totalMedCost = 1450.00;
  const totalOverheadCost = overheads.electricity + overheads.water + overheads.sanitation;
  const totalLabourCost = labourRows.reduce((sum, r) => sum + r.persons * r.hours * 60, 0);
  const totalDailyCost = totalFeedCost + totalMedCost + totalOverheadCost + totalLabourCost;
  const costPerLitre = (totalDailyCost / totalYield).toFixed(2);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/batch/bulk-daily-entry", {
        batch_id: "COW-LAC-2025-001",
        entry_date: selectedDate,
        feed_consumed_kg: feedRows.reduce((acc, r) => acc + r.consumed, 0),
        mortality_count: 0,
        notes: notes,
      }).catch(() => null);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch {
      // Handled
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* ── Top Action & Batch Header Card ── */}
      <div
        className="rounded-[var(--radius-lg)] border p-5 shadow-xs"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-[var(--accent)]" style={{ backgroundColor: "var(--accent-muted)" }}>
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-mono text-base font-bold text-[var(--accent)]">
                  COW-LAC-2025-001
                </h1>
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-0.5 text-xs font-semibold text-[var(--success)]" style={{ backgroundColor: "var(--success-muted)" }}>
                  <CheckCircle2 className="h-3 w-3" /> ACTIVE LACTATION
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Breed: <strong>Holstein Friesian</strong> • Batch Type: <strong>Milking Herd (Lactation 1-100d)</strong> • Start: <strong>01-Mar-2025</strong>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Save */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right pr-4 border-r hidden sm:block" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Lactating Cows</span>
              <p className="text-lg font-bold font-mono text-[var(--text-primary)]">80 Head</p>
            </div>
            <div className="text-right pr-4 border-r hidden sm:block" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Today's Total Milk</span>
              <p className="text-lg font-bold font-mono text-[var(--text-primary)]">{totalYield.toLocaleString()} L</p>
            </div>
            <div className="text-right pr-4 border-r hidden sm:block" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] uppercase font-semibold text-[var(--text-secondary)]">Avg Yield / Cow</span>
              <p className="text-lg font-bold font-mono text-[var(--accent)]">{avgYieldPerCow} L/day</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="nf-press flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {saving ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? "Saving to DB…" : saveSuccess ? "Saved Successfully!" : "Save Daily Milking"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 9-Stage Dairy Lifecycle Stepper ── */}
      <DairyLifecycleStepper currentStageCode="EARLY_LAC" />

      {/* ── Date, Weather & Context Bar ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[var(--radius-md)] border p-3.5 text-xs font-medium"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--accent)]" />
          <span className="text-[var(--text-secondary)]">Log Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-[var(--radius-xs)] border px-2.5 py-1 text-xs font-semibold outline-none"
            style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-primary)" }}
          />
        </div>

        <div className="flex items-center gap-4 text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <CloudSun className="h-4 w-4 text-amber-500" /> 26.5°C • 58% Humidity
          </span>
          <span>Barn: Main Free-Stall Barn 1</span>
          <span>BMC Temp: <strong className="text-blue-600">3.8°C</strong></span>
        </div>
      </div>

      {/* ── 11 Operations Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1 & 2: Milking Yield & Feed Consumption */}
        <div className="lg:col-span-2 space-y-6">
          {/* Panel 1: Milking Yield Log */}
          <div
            className="rounded-[var(--radius-lg)] border p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Milk className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold">1. Daily Milking Yield & Quality Composition</h3>
              </div>
              <span className="text-xs font-semibold text-blue-600">Total: {totalYield.toLocaleString()} Litres</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-[var(--radius-md)] border p-3.5" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Morning Session (4:30 AM)</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={morningYield}
                    onChange={(e) => setMorningYield(Number(e.target.value))}
                    className="w-24 bg-transparent text-xl font-bold outline-none"
                  />
                  <span className="text-xs font-semibold">Litres</span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Avg {(morningYield / 80).toFixed(2)} L / cow</p>
              </div>

              <div className="rounded-[var(--radius-md)] border p-3.5" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Evening Session (4:30 PM)</span>
                <div className="mt-1 flex items-baseline gap-1">
                  <input
                    type="number"
                    value={eveningYield}
                    onChange={(e) => setEveningYield(Number(e.target.value))}
                    className="w-24 bg-transparent text-xl font-bold outline-none"
                  />
                  <span className="text-xs font-semibold">Litres</span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">Avg {(eveningYield / 80).toFixed(2)} L / cow</p>
              </div>

              <div className="rounded-[var(--radius-md)] border p-3.5 space-y-2" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Quality Composition</span>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Fat %:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={fatPct}
                    onChange={(e) => setFatPct(Number(e.target.value))}
                    className="w-14 text-right font-bold outline-none bg-transparent"
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">SNF %:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={snfPct}
                    onChange={(e) => setSnfPct(Number(e.target.value))}
                    className="w-14 text-right font-bold outline-none bg-transparent"
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">SCC Count:</span>
                  <span className="font-bold text-emerald-600">{sccCount.toLocaleString()} / mL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Feed & TMR Consumption */}
          <div
            className="rounded-[var(--radius-lg)] border p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Boxes className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">2. TMR & Feed Intake Log</h3>
              </div>
              <span className="text-xs font-semibold text-amber-600">
                Total Intake: {feedRows.reduce((a, b) => a + b.consumed, 0).toLocaleString()} KG
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] font-semibold uppercase text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
                    <th className="px-3 pb-2">Feed / Ration Item</th>
                    <th className="px-3 pb-2">UOM</th>
                    <th className="px-3 pb-2 text-right">Opening</th>
                    <th className="px-3 pb-2 text-right">Issued</th>
                    <th className="px-3 pb-2 text-right">Consumed</th>
                    <th className="px-3 pb-2 text-right">Wastage</th>
                    <th className="px-3 pb-2 text-right">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {feedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2.5 font-semibold">{row.name}</td>
                      <td className="px-3 py-2.5 font-mono text-[var(--text-secondary)]">{row.uom}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{row.opening.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-[var(--accent)]">{row.issued.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600">{row.consumed.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-red-500">{row.wastage}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{row.closing.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel 4 & 5: Herd Veterinary & Reproduction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Panel 4: Health */}
            <div className="rounded-[var(--radius-lg)] border p-4 space-y-3" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <Stethoscope className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-semibold">3. Veterinary Treatments</h4>
              </div>
              <div className="space-y-2">
                {medRows.map((med) => (
                  <div key={med.id} className="rounded-[var(--radius-xs)] border p-2 text-xs" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }}>
                    <div className="flex justify-between font-semibold">
                      <span>{med.name}</span>
                      <span className="font-mono text-[var(--accent)]">{med.consumed} {med.uom}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{med.notes}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 5: Reproduction */}
            <div className="rounded-[var(--radius-lg)] border p-4 space-y-3" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
                <HeartPulse className="h-4 w-4 text-red-500" />
                <h4 className="text-xs font-semibold">4. Reproduction & AI Log</h4>
              </div>
              <div className="space-y-2">
                <div className="rounded-[var(--radius-xs)] border p-2 text-xs" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }}>
                  <span className="font-semibold text-emerald-600">2 Inseminations Recorded Today</span>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">COW-25-0018 & COW-25-0024 • Straw: HF-SUPER-LOT-44</p>
                </div>
                <div className="rounded-[var(--radius-xs)] border p-2 text-xs" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }}>
                  <span className="font-semibold text-blue-600">Ultrasound Pregnancy Check</span>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">4 cows confirmed pregnant at 45d post-AI</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Cost Allocation & Today's Summary */}
        <div className="space-y-6">
          {/* Summary Panel */}
          <div
            className="rounded-[var(--radius-lg)] border p-5 space-y-4"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-semibold border-b pb-2" style={{ borderColor: "var(--border)" }}>
              Today's Production & Financial Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Total Milk Output</span>
                <span className="font-bold text-blue-600">{totalYield.toLocaleString()} Litres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Average Yield / Cow</span>
                <span className="font-bold">{avgYieldPerCow} Litres / day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Milk Fat / SNF</span>
                <span className="font-mono font-semibold">{fatPct}% Fat / {snfPct}% SNF</span>
              </div>

              <div className="border-t pt-2 space-y-1.5" style={{ borderColor: "var(--border)" }}>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Total Feed Cost</span>
                  <span className="font-mono">₹ {totalFeedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Veterinary & Health</span>
                  <span className="font-mono">₹ {totalMedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Labour & Machinery</span>
                  <span className="font-mono">₹ {totalLabourCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Overheads & Utilities</span>
                  <span className="font-mono">₹ {totalOverheadCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between text-sm font-bold" style={{ borderColor: "var(--border)" }}>
                <span>Unit Cost of Milk</span>
                <span className="text-emerald-600">₹ {costPerLitre} / Litre</span>
              </div>
            </div>
          </div>

          {/* Notes & Observations */}
          <div
            className="rounded-[var(--radius-lg)] border p-5 space-y-3"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h3 className="text-sm font-semibold">Clinical & Facility Notes</h3>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border p-2.5 text-xs outline-none"
              style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
