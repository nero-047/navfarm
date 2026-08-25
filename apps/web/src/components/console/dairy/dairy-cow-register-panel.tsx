"use client";

import React, { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DairyCow {
  id: string;
  tag: string;
  rfid: string;
  name: string;
  breed: string;
  dob: string;
  lactationNumber: number;
  dim: number; // Days in milk
  stage: "EARLY_LAC" | "MID_LAC" | "LATE_LAC" | "DRY" | "PREG_HEIFER" | "CALF";
  status: "MILKING" | "DRY" | "PREGNANT" | "QUARANTINE" | "SICK";
  dailyYieldL: number;
  fatPct: number;
  snfPct: number;
  scc: number;
  lastCalvingDate: string;
  pregnancyStatus: "CONFIRMED" | "OPEN" | "INSEMINATED";
  damTag?: string;
  sireTag?: string;
}

const INITIAL_COWS: DairyCow[] = [
  { id: "1", tag: "COW-25-0001", rfid: "RF-982-1001", name: "Bella 1", breed: "Holstein Friesian", dob: "2021-04-12", lactationNumber: 3, dim: 34, stage: "EARLY_LAC", status: "MILKING", dailyYieldL: 32.4, fatPct: 4.18, snfPct: 8.88, scc: 120000, lastCalvingDate: "2025-03-25", pregnancyStatus: "OPEN", damTag: "COW-22-0044", sireTag: "BULL-CAN-HF" },
  { id: "2", tag: "COW-25-0002", rfid: "RF-982-1002", name: "Daisy 2", breed: "Holstein Friesian", dob: "2022-01-18", lactationNumber: 2, dim: 45, stage: "EARLY_LAC", status: "MILKING", dailyYieldL: 29.8, fatPct: 4.10, snfPct: 8.82, scc: 135000, lastCalvingDate: "2025-03-14", pregnancyStatus: "INSEMINATED", damTag: "COW-22-0012", sireTag: "BULL-USA-HF" },
  { id: "3", tag: "COW-25-0003", rfid: "RF-982-1003", name: "Rosie 3", breed: "Jersey Cross", dob: "2020-08-05", lactationNumber: 4, dim: 142, stage: "MID_LAC", status: "MILKING", dailyYieldL: 24.5, fatPct: 4.85, snfPct: 9.10, scc: 110000, lastCalvingDate: "2024-12-07", pregnancyStatus: "CONFIRMED", damTag: "COW-20-0005", sireTag: "BULL-NZ-JERSEY" },
  { id: "4", tag: "COW-25-0004", rfid: "RF-982-1004", name: "Molly 4", breed: "Holstein Friesian", dob: "2022-06-20", lactationNumber: 2, dim: 220, stage: "LATE_LAC", status: "MILKING", dailyYieldL: 21.0, fatPct: 4.25, snfPct: 8.90, scc: 160000, lastCalvingDate: "2024-09-20", pregnancyStatus: "CONFIRMED", damTag: "COW-21-0089", sireTag: "BULL-CAN-HF" },
  { id: "5", tag: "COW-25-0005", rfid: "RF-982-1005", name: "Buttercup", breed: "Holstein Friesian", dob: "2020-02-14", lactationNumber: 4, dim: 0, stage: "DRY", status: "DRY", dailyYieldL: 0.0, fatPct: 0.0, snfPct: 0.0, scc: 0, lastCalvingDate: "2024-05-10", pregnancyStatus: "CONFIRMED", damTag: "COW-19-0033", sireTag: "BULL-USA-HF" },
  { id: "6", tag: "COW-25-0006", rfid: "RF-982-1006", name: "Luna 6", breed: "Holstein Friesian", dob: "2023-03-01", lactationNumber: 0, dim: 0, stage: "PREG_HEIFER", status: "PREGNANT", dailyYieldL: 0.0, fatPct: 0.0, snfPct: 0.0, scc: 0, lastCalvingDate: "—", pregnancyStatus: "CONFIRMED", damTag: "COW-21-0010", sireTag: "BULL-CAN-HF" },
  { id: "7", tag: "COW-25-0007", rfid: "RF-982-1007", name: "Stella 7", breed: "Jersey", dob: "2021-11-11", lactationNumber: 3, dim: 28, stage: "EARLY_LAC", status: "MILKING", dailyYieldL: 26.2, fatPct: 4.90, snfPct: 9.15, scc: 125000, lastCalvingDate: "2025-03-31", pregnancyStatus: "OPEN", damTag: "COW-21-0065", sireTag: "BULL-NZ-JERSEY" },
  { id: "8", tag: "COW-25-0008", rfid: "RF-982-1008", name: "Penny 8", breed: "Holstein Friesian", dob: "2022-09-09", lactationNumber: 1, dim: 60, stage: "EARLY_LAC", status: "MILKING", dailyYieldL: 30.5, fatPct: 4.05, snfPct: 8.80, scc: 140000, lastCalvingDate: "2025-02-27", pregnancyStatus: "INSEMINATED", damTag: "COW-22-0050", sireTag: "BULL-USA-HF" },
];

export default function DairyCowRegisterPanel() {
  const [cows, setCows] = useState<DairyCow[]>(INITIAL_COWS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [breedFilter, setBreedFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Cow Form State
  const [newCow, setNewCow] = useState({
    tag: "COW-25-0009",
    rfid: "RF-982-1009",
    name: "Clover",
    breed: "Holstein Friesian",
    dob: "2023-01-10",
    lactationNumber: 1,
    stage: "EARLY_LAC",
    status: "MILKING",
    dailyYieldL: 28.0,
    fatPct: 4.15,
    snfPct: 8.85,
    lastCalvingDate: "2025-04-01",
    pregnancyStatus: "OPEN",
  });

  const filteredCows = cows.filter((c) => {
    const matchesSearch =
      c.tag.toLowerCase().includes(search.toLowerCase()) ||
      c.rfid.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesBreed = breedFilter === "ALL" || c.breed === breedFilter;
    return matchesSearch && matchesStatus && matchesBreed;
  });

  const handleAddCow = (e: React.FormEvent) => {
    e.preventDefault();
    const created: DairyCow = {
      id: String(cows.length + 1),
      tag: newCow.tag,
      rfid: newCow.rfid,
      name: newCow.name,
      breed: newCow.breed,
      dob: newCow.dob,
      lactationNumber: Number(newCow.lactationNumber),
      dim: 10,
      stage: newCow.stage as any,
      status: newCow.status as any,
      dailyYieldL: Number(newCow.dailyYieldL),
      fatPct: Number(newCow.fatPct),
      snfPct: Number(newCow.snfPct),
      scc: 130000,
      lastCalvingDate: newCow.lastCalvingDate,
      pregnancyStatus: newCow.pregnancyStatus as any,
    };
    setCows([created, ...cows]);
    setShowAddModal(false);
  };

  const totalHerd = cows.length;
  const milkingHerd = cows.filter((c) => c.status === "MILKING").length;
  const dryHerd = cows.filter((c) => c.status === "DRY").length;
  const pregnantHeifers = cows.filter((c) => c.status === "PREGNANT").length;
  const avgYield = (
    cows.filter((c) => c.dailyYieldL > 0).reduce((acc, c) => acc + c.dailyYieldL, 0) /
    (milkingHerd || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* 4 Summary Stat Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Total Dairy Herd</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{totalHerd} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Head</span></span>
          </div>
          <p className="text-[11px] font-medium mt-1" style={{ color: "var(--success)" }}>100% RFID Tagged</p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Milking Cows</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{milkingHerd}</span>
            <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>({((milkingHerd / totalHerd) * 100).toFixed(0)}% in Milk)</span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Active lactation stages</p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Avg Yield / Cow</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--accent)" }}>{avgYield} L</span>
            <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>/ Day</span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Daily parlor average</p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-4 transition-all hover:bg-[var(--surface-raised)]"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Dry & Heifers</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{dryHerd + pregnantHeifers} <span className="text-xs font-normal" style={{ color: "var(--text-secondary)" }}>Head</span></span>
          </div>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>{dryHerd} Dry • {pregnantHeifers} Heifers</p>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <Search className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search Tag, RFID, Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-xs w-44 font-medium"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="MILKING">Milking</option>
            <option value="DRY">Dry</option>
            <option value="PREGNANT">Pregnant Heifer</option>
          </select>

          <select
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <option value="ALL">All Breeds</option>
            <option value="Holstein Friesian">Holstein Friesian</option>
            <option value="Jersey">Jersey</option>
            <option value="Jersey Cross">Jersey Cross</option>
          </select>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="nf-press flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
          style={{ backgroundColor: "var(--accent)" }}
        >
          <Plus className="h-4 w-4" /> Register Dairy Cow
        </button>
      </div>

      {/* Dairy Cow Table */}
      <div
        className="rounded-[var(--radius-lg)] border overflow-hidden"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className="border-b text-[11px] font-semibold uppercase text-[var(--text-secondary)]"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              >
                <th className="p-3">Ear Tag & Name</th>
                <th className="p-3">RFID Tag</th>
                <th className="p-3">Breed</th>
                <th className="p-3 text-center">Lact #</th>
                <th className="p-3 text-center">DIM</th>
                <th className="p-3">Current Stage</th>
                <th className="p-3 text-right">Daily Milk (L)</th>
                <th className="p-3 text-right">Fat % / SNF %</th>
                <th className="p-3 text-center">Reproduction</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filteredCows.map((cow) => {
                const isMilking = cow.status === "MILKING";
                return (
                  <tr key={cow.id} className="hover:bg-[var(--surface-raised)] transition-colors">
                    <td className="p-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🐄</span>
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-600">{cow.tag}</span>
                          <p className="text-[10px] text-[var(--text-secondary)] font-normal">{cow.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[var(--text-secondary)]">{cow.rfid}</td>
                    <td className="p-3">{cow.breed}</td>
                    <td className="p-3 text-center font-mono font-bold">{cow.lactationNumber || "—"}</td>
                    <td className="p-3 text-center font-mono">{cow.dim > 0 ? `${cow.dim} d` : "—"}</td>
                    <td className="p-3">
                      <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-600">
                        {cow.stage.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600">
                      {cow.dailyYieldL > 0 ? `${cow.dailyYieldL.toFixed(1)} L` : "0.0 L"}
                    </td>
                    <td className="p-3 text-right font-mono text-[11px]">
                      {cow.fatPct > 0 ? `${cow.fatPct.toFixed(2)}% / ${cow.snfPct.toFixed(2)}%` : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-bold ${
                          cow.pregnancyStatus === "CONFIRMED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : cow.pregnancyStatus === "INSEMINATED"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-black/5 dark:bg-white/5 text-[var(--text-secondary)]"
                        }`}
                      >
                        {cow.pregnancyStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-bold ${
                          isMilking
                            ? "bg-emerald-500/10 text-emerald-600"
                            : cow.status === "DRY"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {cow.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Dairy Cow */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register Individual Dairy Cow"
        description="Add a registered dairy cow with tag metadata and production benchmarks."
        maxWidth="lg"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-dairy-cow-form" size="sm" className="nf-btn-primary">
              Save Dairy Cow
            </Button>
          </>
        }
      >
        <form id="add-dairy-cow-form" onSubmit={handleAddCow} className="space-y-4 text-xs pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">Ear Tag ID *</label>
              <input
                type="text"
                required
                value={newCow.tag}
                onChange={(e) => setNewCow({ ...newCow, tag: e.target.value })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-mono font-semibold"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">RFID Electronic Tag</label>
              <input
                type="text"
                value={newCow.rfid}
                onChange={(e) => setNewCow({ ...newCow, rfid: e.target.value })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-mono"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">Cow Name</label>
              <input
                type="text"
                value={newCow.name}
                onChange={(e) => setNewCow({ ...newCow, name: e.target.value })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-semibold"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">Breed</label>
              <select
                value={newCow.breed}
                onChange={(e) => setNewCow({ ...newCow, breed: e.target.value })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-semibold nf-select"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              >
                <option value="Holstein Friesian">Holstein Friesian</option>
                <option value="Jersey">Jersey</option>
                <option value="Jersey Cross">Jersey Cross</option>
                <option value="Gir (Indigenous)">Gir (Indigenous)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">Lactation #</label>
              <input
                type="number"
                value={newCow.lactationNumber}
                onChange={(e) => setNewCow({ ...newCow, lactationNumber: Number(e.target.value) })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-mono"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">Daily Yield (L)</label>
              <input
                type="number"
                step="0.1"
                value={newCow.dailyYieldL}
                onChange={(e) => setNewCow({ ...newCow, dailyYieldL: Number(e.target.value) })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-mono font-bold text-blue-600"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="nf-text-label block text-[var(--text-secondary)] mb-1">Fat %</label>
              <input
                type="number"
                step="0.01"
                value={newCow.fatPct}
                onChange={(e) => setNewCow({ ...newCow, fatPct: Number(e.target.value) })}
                className="w-full rounded-[var(--radius-sm)] border p-2 font-mono"
                style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
              />
            </div>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
