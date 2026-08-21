"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Upload,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export interface AnimalAssignmentRow {
  id: string;
  earTag: string;
  animalId: string;
  rfid?: string;
  sex: "Female (Gilt)" | "Female (Sow)" | "Male (Boar)" | "Piglet";
  breed: string;
  dob: string;
  ageDays: number;
  entryDate: string;
  penLocation: string;
  weightKg: number;
  source: string;
  status: "Active" | "Transferred" | "Isolated" | "Culled";
}

import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";

export interface AnimalAssignmentRow {
  id: string;
  earTag: string;
  animalId: string;
  rfid?: string;
  sex: "Female (Gilt)" | "Female (Sow)" | "Male (Boar)" | "Piglet";
  breed: string;
  dob: string;
  ageDays: number;
  entryDate: string;
  penLocation: string;
  weightKg: number;
  source: string;
  status: "Active" | "Transferred" | "Isolated" | "Culled";
}

interface BatchOption {
  id: string;
  code: string;
  name: string;
  breed: string;
  type: string;
  stage: string;
  period: string;
}

export default function BatchAnimalAssignmentPanel() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const currentBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatchId) || batches[0],
    [batches, selectedBatchId]
  );

  const [animals, setAnimals] = useState<AnimalAssignmentRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSex, setSelectedSex] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeTab, setActiveTab] = useState<"assigned" | "add" | "transfer" | "removal">("assigned");

  // Add / Assign Animal Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newAnimalId, setNewAnimalId] = useState("");
  const [newRfid, setNewRfid] = useState("");
  const [newSex, setNewSex] = useState<AnimalAssignmentRow["sex"]>("Female (Gilt)");
  const [newBreed, setNewBreed] = useState("");
  const [newPen, setNewPen] = useState("Gestation Barn 1 / Pen B-08");
  const [newWeight, setNewWeight] = useState("190.0");
  const [newSource, setNewSource] = useState("On Farm Breeding");

  // Transfer Animal Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedAnimalForTransfer, setSelectedAnimalForTransfer] = useState<AnimalAssignmentRow | null>(null);
  const [targetPen, setTargetPen] = useState("");
  const [transferReason, setTransferReason] = useState("Stage Progression to Farrowing");

  // CSV Import Modal
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvTagsText, setCsvTagsText] = useState("");

  const [toastMsg, setToastMsg] = useState("");

  // 1. Fetch live batches
  useEffect(() => {
    const companyId = getActiveCompanyId();
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.get(`/batch?companyId=${companyId}&status=ACTIVE&limit=50`)
      .then((res) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const mapped: BatchOption[] = list.map((b: any) => ({
          id: b.batch_id,
          code: b.batch_no,
          name: b.remarks || b.batch_no,
          breed: b.breed_name || b.breed_code || "Large White",
          type: b.lob_name || "Production Batch",
          stage: b.current_stage_code || "ACTIVE",
          period: b.start_date ? `${b.start_date} to ${b.expected_end_date || "ongoing"}` : "",
        }));
        setBatches(mapped);
        if (mapped.length > 0) {
          setSelectedBatchId(mapped[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // 2. Fetch live animals from DB
  useEffect(() => {
    const companyId = getActiveCompanyId();
    if (!companyId) return;
    api.get(`/animal?companyId=${companyId}&limit=200`)
      .then((res) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const mapped: AnimalAssignmentRow[] = list.map((a: any) => ({
          id: a.animal_id,
          earTag: a.tag_no || a.animal_code || `AN-${a.animal_id.slice(0, 6)}`,
          animalId: a.animal_code || a.tag_no,
          rfid: a.rfid_tag || undefined,
          sex: a.gender === "M" ? "Male (Boar)" : a.animal_type === "PIGLET" ? "Piglet" : a.animal_type === "GILT" ? "Female (Gilt)" : "Female (Sow)",
          breed: a.breed_name || a.breed_code || "Large White",
          dob: a.birth_date || "2024-01-01",
          ageDays: 300,
          entryDate: a.entry_date || "2025-01-01",
          penLocation: a.pen_name || a.shed_name || "Pen B-01",
          weightKg: Number(a.current_weight_kg) || 180.0,
          source: a.entry_type || "On Farm Breeding",
          status: a.status === "ACTIVE" ? "Active" : a.status === "QUARANTINE" ? "Isolated" : "Active",
        }));
        setAnimals(mapped);
      })
      .catch(() => {});
  }, [selectedBatchId]);

  const storageKey = `navfarm_batch_animal_assignments_${selectedBatchId || "default"}`;

  const saveAnimals = (updated: AnimalAssignmentRow[]) => {
    setAnimals(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleAddAnimal = () => {
    if (!newTag || !newAnimalId) return;
    const companyId = getActiveCompanyId();
    const newAnimal: AnimalAssignmentRow = {
      id: `an-${Date.now()}`,
      earTag: newTag,
      animalId: newAnimalId,
      rfid: newRfid || undefined,
      sex: newSex,
      breed: newBreed || currentBatch?.breed || "Large White",
      dob: "2024-04-01",
      ageDays: 320,
      entryDate: new Date().toISOString().slice(0, 10),
      penLocation: newPen,
      weightKg: parseFloat(newWeight) || 190.0,
      source: newSource,
      status: "Active",
    };

    if (companyId) {
      api.post("/animal", {
        company_id: companyId,
        animal_code: newAnimalId,
        tag_no: newTag,
        rfid_tag: newRfid || undefined,
        animal_type: newSex.includes("Gilt") ? "GILT" : newSex.includes("Sow") ? "SOW" : newSex.includes("Boar") ? "BOAR" : "PIGLET",
        gender: newSex.includes("Male") ? "M" : "F",
        current_weight_kg: parseFloat(newWeight) || 190.0,
      }).catch(() => {});
    }

    const updated = [newAnimal, ...animals];
    saveAnimals(updated);
    setAssignModalOpen(false);
    setNewTag("");
    setNewAnimalId("");
    setNewRfid("");
    setToastMsg(`✓ Animal ${newTag} (${newAnimalId}) successfully registered!`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleConfirmTransfer = () => {
    if (!selectedAnimalForTransfer || !targetPen) return;
    const updated = animals.map((a) =>
      a.id === selectedAnimalForTransfer.id
        ? { ...a, penLocation: targetPen }
        : a
    );
    saveAnimals(updated);
    setTransferModalOpen(false);
    setToastMsg(`✓ Animal ${selectedAnimalForTransfer.earTag} moved to ${targetPen} (${transferReason}).`);
    setSelectedAnimalForTransfer(null);
    setTargetPen("");
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleRemoveAnimal = (animal: AnimalAssignmentRow) => {
    if (!confirm(`Are you sure you want to remove animal ${animal.earTag}?`)) return;
    const updated = animals.filter((a) => a.id !== animal.id);
    saveAnimals(updated);
    setToastMsg(`✕ Removed animal ${animal.earTag} from batch.`);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleImportCsv = () => {
    if (!csvTagsText.trim()) return;
    const lines = csvTagsText.split("\n").filter((l) => l.trim().length > 0);
    const newRows: AnimalAssignmentRow[] = lines.map((line, idx) => {
      const parts = line.split(",").map((p) => p.trim());
      const tag = parts[0] || `ET-IMPORT-${idx + 1}`;
      const anId = parts[1] || `ANM-${tag}`;
      const pen = parts[2] || "Gestation Barn 1 / Row B";
      return {
        id: `csv-${Date.now()}-${idx}`,
        earTag: tag,
        animalId: anId,
        sex: "Female (Sow)",
        breed: currentBatch?.breed || "Large White",
        dob: "2024-05-01",
        ageDays: 290,
        entryDate: new Date().toISOString().slice(0, 10),
        penLocation: pen,
        weightKg: 195.0,
        source: "Batch Importer CSV",
        status: "Active",
      };
    });

    const updated = [...newRows, ...animals];
    saveAnimals(updated);
    setCsvModalOpen(false);
    setCsvTagsText("");
    setToastMsg(`✓ Successfully imported ${newRows.length} ear tags into batch ${currentBatch.code}!`);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const filtered = animals.filter((a) => {
    const matchSearch =
      a.earTag.toLowerCase().includes(search.toLowerCase()) ||
      a.animalId.toLowerCase().includes(search.toLowerCase()) ||
      a.penLocation.toLowerCase().includes(search.toLowerCase()) ||
      (a.rfid && a.rfid.toLowerCase().includes(search.toLowerCase()));

    const matchSex = selectedSex === "All" || a.sex.includes(selectedSex);
    const matchStatus = selectedStatus === "All" || a.status === selectedStatus;
    return matchSearch && matchSex && matchStatus;
  });

  const activeCount = animals.filter((a) => a.status === "Active").length;
  const isolatedCount = animals.filter((a) => a.status === "Isolated").length;
  const transferredCount = animals.filter((a) => a.status === "Transferred").length;

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm font-medium text-[var(--text-muted)]">Loading production batches and animal registers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-[var(--text-primary)]">
      {/* ── Top Header Strip with Batch Selector ── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-2xs">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">
              Target Batch:
            </span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="max-w-[240px] sm:max-w-[320px] truncate rounded border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] focus:outline-none"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} — {b.name} ({b.breed})
                </option>
              ))}
            </select>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0"
              style={{
                backgroundColor: "var(--accent-muted)",
                color: "var(--accent)",
                borderColor: "rgba(194, 67, 50, 0.2)",
              }}
            >
              Active Assignment
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1.5 truncate">
            Stage: <strong className="text-[var(--accent)]">{currentBatch?.stage || "Gestation"}</strong> · Timeline: <strong>{currentBatch?.period || "Day 42 of 114"}</strong> · Assigned: <strong className="text-[var(--text-primary)]">{animals.length} Head</strong>
          </p>
        </div>

        {/* Quick Assignment KPI Strip & Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1.5 rounded-[var(--radius-sm)] border text-xs" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
            <div className="text-center px-2.5 border-r" style={{ borderColor: "var(--border)" }}>
              <span className="text-[9px] uppercase font-semibold block" style={{ color: "var(--text-secondary)" }}>Total</span>
              <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>{animals.length}</span>
            </div>
            <div className="text-center px-2.5 border-r" style={{ borderColor: "var(--border)" }}>
              <span className="text-[9px] uppercase font-semibold block" style={{ color: "var(--text-secondary)" }}>Active</span>
              <span className="font-mono font-bold" style={{ color: "var(--success)" }}>{activeCount}</span>
            </div>
            <div className="text-center px-2.5 border-r" style={{ borderColor: "var(--border)" }}>
              <span className="text-[9px] uppercase font-semibold block" style={{ color: "var(--text-secondary)" }}>Isolated</span>
              <span className="font-mono font-bold" style={{ color: "var(--warning)" }}>{isolatedCount}</span>
            </div>
            <div className="text-center px-2.5">
              <span className="text-[9px] uppercase font-semibold block" style={{ color: "var(--text-secondary)" }}>Transferred</span>
              <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>{transferredCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCsvModalOpen(true)}
              className="text-xs h-8 gap-1.5 font-medium whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" /> Import Tags CSV
            </Button>
            <Button
              size="sm"
              onClick={() => setAssignModalOpen(true)}
              className="nf-btn-primary text-xs h-8 gap-1.5 font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" /> Assign Animal
            </Button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div
          className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] border flex items-center gap-2 animate-in fade-in"
          style={{
            backgroundColor: "var(--success-muted)",
            color: "var(--success)",
            borderColor: "rgba(47, 125, 91, 0.2)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Action Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[var(--border)] text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "assigned"
              ? "border-[var(--accent)] text-[var(--accent)] font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Assigned Herd Animals ({animals.length})
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "add"
              ? "border-[var(--accent)] text-[var(--accent)] font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          + Add / Assign Animals
        </button>
        <button
          onClick={() => setActiveTab("transfer")}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "transfer"
              ? "border-[var(--accent)] text-[var(--accent)] font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Pen Movements & Relocation
        </button>
        <button
          onClick={() => setActiveTab("removal")}
          className={`px-4 py-2.5 border-b-2 font-medium transition-colors whitespace-nowrap ${
            activeTab === "removal"
              ? "border-[var(--accent)] text-[var(--accent)] font-bold"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Removals, Mortality & Culls
        </button>
      </div>

      {/* ── TAB 1: ASSIGNED ANIMALS TABLE ── */}
      {activeTab === "assigned" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Sex</span>
                <select
                  value={selectedSex}
                  onChange={(e) => setSelectedSex(e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                >
                  <option value="All">All Genders</option>
                  <option value="Sow">Female (Sow)</option>
                  <option value="Gilt">Female (Gilt)</option>
                  <option value="Boar">Male (Boar)</option>
                  <option value="Piglet">Piglet</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block mb-1">Status</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Isolated">Isolated</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Culled">Culled</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search Ear Tag, RFID, Pen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="nf-input pl-8 w-full text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="px-4 py-2.5 font-bold">#</th>
                    <th className="px-4 py-2.5 font-bold">Ear Tag / RFID</th>
                    <th className="px-4 py-2.5 font-bold">Animal ID</th>
                    <th className="px-4 py-2.5 font-bold">Gender & Breed</th>
                    <th className="px-4 py-2.5 font-bold">DOB / Age</th>
                    <th className="px-4 py-2.5 font-bold">Current Pen / Crate</th>
                    <th className="px-4 py-2.5 font-bold text-right">Weight (KG)</th>
                    <th className="px-4 py-2.5 font-bold">Source</th>
                    <th className="px-4 py-2.5 font-bold">Status</th>
                    <th className="px-4 py-2.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-[var(--text-muted)]">
                        No animals found matching filters in batch {currentBatch.code}.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((animal, idx) => (
                      <tr key={animal.id} className="hover:bg-[var(--surface-raised)]/80 transition-colors">
                        <td className="px-4 py-2.5 text-[var(--text-muted)]">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono font-bold text-[var(--accent)] block">{animal.earTag}</span>
                          {animal.rfid && <span className="text-[10px] text-[var(--text-muted)] font-mono">{animal.rfid}</span>}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[var(--text-secondary)]">{animal.animalId}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-[var(--text-primary)] block">{animal.sex}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{animal.breed}</span>
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                          <span>{animal.dob}</span>
                          <span className="block text-[10px] font-semibold text-[var(--text-muted)] font-mono">{animal.ageDays} Days</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                            <Warehouse className="w-3 h-3 text-[var(--text-muted)]" />
                            {animal.penLocation}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">
                          {animal.weightKg.toFixed(1)} kg
                        </td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">{animal.source}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              animal.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : animal.status === "Isolated"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-slate-500/10 text-[var(--text-muted)]"
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" /> {animal.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedAnimalForTransfer(animal);
                                setTargetPen(animal.penLocation);
                                setTransferModalOpen(true);
                              }}
                              className="h-6 text-[10px] px-2 gap-1"
                              title="Move Pen"
                            >
                              <ArrowRightLeft className="w-3 h-3" /> Move
                            </Button>
                            <button
                              onClick={() => handleRemoveAnimal(animal)}
                              className="text-[var(--text-muted)] hover:text-rose-500 p-1 transition-colors"
                              title="Unassign animal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-[var(--surface-raised)] border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Showing {filtered.length} of {animals.length} assigned animals</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ADD ANIMALS FORM ── */}
      {activeTab === "add" && (
        <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--accent)]" /> Add Individual Animal to Batch {currentBatch.code}
            </h3>
            <Button size="sm" variant="outline" onClick={() => setCsvModalOpen(true)} className="text-xs h-7">
              <Upload className="w-3 h-3 mr-1" /> Import CSV File
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-semibold block mb-1">Visual Ear Tag No *</label>
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g. ET-25-0045"
                className="nf-input w-full font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Animal Master ID *</label>
              <input
                type="text"
                value={newAnimalId}
                onChange={(e) => setNewAnimalId(e.target.value)}
                placeholder="e.g. SOW-LW-045"
                className="nf-input w-full font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Electronic RFID Chip (Optional)</label>
              <input
                type="text"
                value={newRfid}
                onChange={(e) => setNewRfid(e.target.value)}
                placeholder="e.g. RFID-982-045"
                className="nf-input w-full font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Sex / Category</label>
              <select
                value={newSex}
                onChange={(e) => setNewSex(e.target.value as any)}
                className="nf-input w-full"
              >
                <option value="Female (Sow)">Female (Sow)</option>
                <option value="Female (Gilt)">Female (Gilt)</option>
                <option value="Male (Boar)">Male (Boar)</option>
                <option value="Piglet">Piglet</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Assigned Pen / Crate</label>
              <input
                type="text"
                value={newPen}
                onChange={(e) => setNewPen(e.target.value)}
                placeholder="e.g. Gestation Barn 1 / Pen B-08"
                className="nf-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Current Live Weight (KG)</label>
              <input
                type="number"
                step="0.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="195.0"
                className="nf-input w-full font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <Button onClick={handleAddAnimal} className="nf-btn-primary text-xs">
              Assign Animal to Batch
            </Button>
          </div>
        </div>
      )}

      {/* ── TAB 3: PEN MOVEMENTS ── */}
      {activeTab === "transfer" && (
        <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" /> Internal Pen Relocation & Movement
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Select an animal from the herd list to record pen transfers (e.g. Gestation Pens &rarr; Farrowing Crates).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {animals.slice(0, 6).map((a) => (
              <div key={a.id} className="p-3 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-[var(--accent)]">{a.earTag}</span>
                  <span className="text-[11px] text-[var(--text-secondary)] block">{a.penLocation}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedAnimalForTransfer(a);
                    setTargetPen(a.penLocation);
                    setTransferModalOpen(true);
                  }}
                  className="h-6 text-[10px] px-2"
                >
                  Relocate
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: REMOVALS & CULLS ── */}
      {activeTab === "removal" && (
        <div className="p-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] space-y-4 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Animal Removals, Culls & Disposals
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Active animals removed from this batch automatically update the batch headcount and log into the mortality register.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {animals.map((a) => (
              <div key={a.id} className="p-3 rounded bg-[var(--surface-raised)] border border-[var(--border)] text-xs flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{a.earTag}</span>
                  <span className="text-[11px] text-[var(--text-secondary)] block">{a.sex} · {a.penLocation}</span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRemoveAnimal(a)}
                  className="h-6 text-[10px] px-2"
                >
                  Remove / Cull
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: ASSIGN ANIMAL ── */}
      {assignModalOpen && (
        <Dialog
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          title={`Assign Animal to ${currentBatch.code}`}
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddAnimal} className="nf-btn-primary">
                Confirm Assignment
              </Button>
            </>
          }
        >
          <div className="space-y-3.5 text-xs pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Ear Tag Number *</label>
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g. ET-25-0089"
                  className="nf-input w-full font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Animal Master ID *</label>
                <input
                  type="text"
                  value={newAnimalId}
                  onChange={(e) => setNewAnimalId(e.target.value)}
                  placeholder="e.g. SOW-LW-089"
                  className="nf-input w-full font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Breed</label>
                <input
                  type="text"
                  value={newBreed}
                  onChange={(e) => setNewBreed(e.target.value)}
                  placeholder="e.g. Large White"
                  className="nf-input w-full"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Animal Source / Origin</label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. On Farm Breeding"
                  className="nf-input w-full"
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: TRANSFER PEN ── */}
      {transferModalOpen && selectedAnimalForTransfer && (
        <Dialog
          open={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          title={`Relocate Animal ${selectedAnimalForTransfer.earTag}`}
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmTransfer} className="nf-btn-primary">
                Record Pen Movement
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <p className="text-[var(--text-secondary)]">
              Current Location: <strong className="text-[var(--text-primary)]">{selectedAnimalForTransfer.penLocation}</strong>
            </p>

            <div>
              <label className="font-semibold block mb-1">New Destination Pen / Crate *</label>
              <input
                type="text"
                value={targetPen}
                onChange={(e) => setTargetPen(e.target.value)}
                placeholder="e.g. Farrowing Barn Pen A-04"
                className="nf-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Transfer Purpose / Remarks</label>
              <input
                type="text"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Day 110 Pre-Farrowing Relocation"
                className="nf-input w-full"
              />
            </div>
          </div>
        </Dialog>
      )}

      {/* ── MODAL: CSV EAR TAG IMPORT ── */}
      {csvModalOpen && (
        <Dialog
          open={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          title="Import Ear Tags CSV"
          maxWidth="md"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setCsvModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleImportCsv} className="nf-btn-primary">
                Import Animals
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <p className="text-[var(--text-secondary)]">
              Paste lines of comma-separated animal records (<code className="text-[var(--accent)] font-mono">EarTag, AnimalID, PenLocation</code>):
            </p>
            <textarea
              rows={5}
              value={csvTagsText}
              onChange={(e) => setCsvTagsText(e.target.value)}
              placeholder="ET-25-0010, SOW-LW-010, Gestation Barn 1 / Pen B-10&#10;ET-25-0011, SOW-LW-011, Gestation Barn 1 / Pen B-11"
              className="nf-input w-full font-mono text-xs"
            />
          </div>
        </Dialog>
      )}
    </div>
  );
}
