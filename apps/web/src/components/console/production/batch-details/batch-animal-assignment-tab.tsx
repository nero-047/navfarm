"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Upload,
  Plus,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Tag,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api-client";

interface BatchAnimalAssignmentTabProps {
  batch: any;
  onRefreshBatch?: () => Promise<void>;
}

export function BatchAnimalAssignmentTab({ batch, onRefreshBatch }: BatchAnimalAssignmentTabProps) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [unassignedList, setUnassignedList] = useState<any[]>([]);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([]);
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Upload tags state
  const [rawTagsInput, setRawTagsInput] = useState("");
  const [submittingUpload, setSubmittingUpload] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const openingQty = Math.round(Number(batch?.opening_quantity || 30));
  const breedName = batch?.breed_name || "Yorkshire Swine";
  const isBreedingSow = batch?.costing_method === "BIO_ASSET";

  // Fetch assigned animals for this batch
  const fetchAnimals = async () => {
    if (!batch?.batch_id) return;
    setLoading(true);
    try {
      const res = await api.get(`/animal?currentBatchId=${batch.batch_id}&limit=200`);
      const data = Array.isArray(res) ? res : res?.data || [];
      setAnimals(data);
    } catch {
      setAnimals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batch?.batch_id]);

  // Load unassigned animals when open assign modal
  const openAssignModal = async () => {
    setAssignModalOpen(true);
    setSelectedAnimalIds([]);
    setLoadingUnassigned(true);
    try {
      const res = await api.get(`/animal?limit=100`);
      const data = Array.isArray(res) ? res : res?.data || [];
      // Filter those not in current batch
      const available = data.filter((a: any) => !a.current_batch_id || a.current_batch_id !== batch.batch_id);
      setUnassignedList(available);
    } catch {
      setUnassignedList([]);
    } finally {
      setLoadingUnassigned(false);
    }
  };

  // Submit assign animals
  const handleAssignSubmit = async () => {
    if (selectedAnimalIds.length === 0) return;
    setSubmittingAssign(true);
    try {
      await api.post(`/batch/${batch.batch_id}/assign-animals`, {
        animal_ids: selectedAnimalIds,
      });
      setNotification(`✓ Successfully assigned ${selectedAnimalIds.length} animals to batch!`);
      setAssignModalOpen(false);
      await fetchAnimals();
      if (onRefreshBatch) await onRefreshBatch();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to assign animals.");
    } finally {
      setSubmittingAssign(false);
    }
  };

  // Submit bulk tag upload
  const handleUploadSubmit = async () => {
    const tags = rawTagsInput
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) {
      alert("Please enter at least one ear tag or RFID tag.");
      return;
    }

    setSubmittingUpload(true);
    try {
      await api.post(`/batch/${batch.batch_id}/bulk-register-animals`, {
        tags,
        breed_id: batch.breed_id,
        animal_type: isBreedingSow ? "SOW" : "PORKER",
        gender: isBreedingSow ? "F" : "M",
      });
      setNotification(`✓ Registered and assigned ${tags.length} animals to batch!`);
      setUploadModalOpen(false);
      setRawTagsInput("");
      await fetchAnimals();
      if (onRefreshBatch) await onRefreshBatch();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to register animals.");
    } finally {
      setSubmittingUpload(false);
    }
  };

  // Unassign an animal
  const handleUnassignAnimal = async (animalId: string, tag: string) => {
    if (!confirm(`Are you sure you want to unassign animal ${tag} from this batch?`)) return;
    try {
      await api.post(`/batch/${batch.batch_id}/unassign-animals`, {
        animal_ids: [animalId],
      });
      setNotification(`✓ Unassigned animal ${tag} from batch.`);
      await fetchAnimals();
      if (onRefreshBatch) await onRefreshBatch();
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err?.message || "Failed to unassign animal.");
    }
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      const earTag = a.ear_tag || a.ear_tag_no || "";
      const code = a.animal_code || "";
      const matchesSearch =
        !search ||
        earTag.toLowerCase().includes(search.toLowerCase()) ||
        code.toLowerCase().includes(search.toLowerCase()) ||
        (a.rfid_tag || "").toLowerCase().includes(search.toLowerCase());

      const aSex = (a.gender === "F" || a.sex === "FEMALE") ? "FEMALE" : "MALE";
      const matchesSex = sexFilter === "ALL" || aSex === sexFilter;

      const aStatus = a.status || "ACTIVE";
      const matchesStatus = statusFilter === "ALL" || aStatus === statusFilter;

      return matchesSearch && matchesSex && matchesStatus;
    });
  }, [animals, search, sexFilter, statusFilter]);

  const totalAssigned = animals.length;
  const activeCount = animals.filter((a) => a.status === "ACTIVE" || a.status === "PREGNANT" || a.status === "LACTATING").length;
  const sickCount = animals.filter((a) => a.status === "SICK" || a.status === "UNDER_OBSERVATION").length;

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
        {/* ── Main Animal List Table ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            {/* Header & Action Toolbar */}
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                    Assigned Animals — {totalAssigned} Head ({breedName})
                  </h3>
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Individual ear-tag and RFID tracking linked to batch {batch.batch_no}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadModalOpen(true)}
                  className="text-xs h-8 px-3 gap-1.5 font-bold border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload ear tags
                </Button>
                <Button
                  type="button"
                  onClick={openAssignModal}
                  className="bg-[#1A3A5C] hover:bg-[#132b45] text-white text-xs h-8 px-3 gap-1.5 font-bold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Assign animals
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-raised)]/10 flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by ear tag, animal code, or RFID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md font-medium"
                />
              </div>

              <select
                value={sexFilter}
                onChange={(e) => setSexFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md"
              >
                <option value="ALL">Sex: All</option>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-bold text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md"
              >
                <option value="ALL">Status: All</option>
                <option value="ACTIVE">Active</option>
                <option value="PREGNANT">Pregnant</option>
                <option value="LACTATING">Lactating</option>
                <option value="UNDER_OBSERVATION">Under Observation</option>
                <option value="SICK">Sick / Treatment</option>
              </select>
            </div>

            {/* Table */}
            {filteredAnimals.length === 0 ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                <p className="font-bold text-[var(--text-primary)]">No animals matching current filter</p>
                <p>Click "Assign animals" or "Upload ear tags" to register herd animals into this batch.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[700px]">
                  <thead className="bg-[var(--surface-raised)]/50 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)]">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-4 py-3">Ear Tag</th>
                      <th className="px-3.5 py-3">Animal Code</th>
                      <th className="px-2.5 py-3">Sex</th>
                      <th className="px-3 py-3">RFID Tag</th>
                      <th className="px-3.5 py-3">Parity / Stats</th>
                      <th className="px-3.5 py-3 text-center">Status</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {filteredAnimals.map((anm, idx) => {
                      const tag = anm.ear_tag || anm.ear_tag_no || `ET-${String(idx + 1).padStart(3, "0")}`;
                      const sex = (anm.gender === "F" || anm.sex === "FEMALE") ? "Female" : "Male";
                      const status = anm.status || "ACTIVE";
                      const isGood = status === "ACTIVE" || status === "PREGNANT" || status === "LACTATING";
                      return (
                        <tr key={anm.animal_id || anm.id || idx} className="hover:bg-[var(--surface-raised)]/30 transition">
                          <td className="px-3 py-3 text-[var(--text-muted)] font-mono">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-[#1A3A5C] dark:text-blue-300 font-mono">
                            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {tag}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-[var(--text-secondary)] font-mono font-bold">{anm.animal_code}</td>
                          <td className="px-2.5 py-3 font-bold text-[var(--text-secondary)]">{sex}</td>
                          <td className="px-3 py-3 font-mono text-[var(--text-muted)]">{anm.rfid_tag || "—"}</td>
                          <td className="px-3.5 py-3 text-[var(--text-secondary)]">
                            {anm.parity_count !== undefined ? (
                              <span>Parity: <strong>{anm.parity_count}</strong> · Born: <strong>{anm.total_piglets_born_live || 0}</strong></span>
                            ) : (
                              <span>Age: ~{anm.age_days || 120}d</span>
                            )}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isGood
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200"
                                  : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isGood ? "bg-emerald-600" : "bg-amber-600"
                                }`}
                              />
                              {status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleUnassignAnimal(anm.animal_id || anm.id, tag)}
                              title="Unassign from batch"
                              className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
            )}

            <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-raised)]/20 flex items-center justify-between text-xs text-[var(--text-secondary)] font-medium">
              <span>Showing {filteredAnimals.length} of {totalAssigned} animals</span>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar Summary ── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                Assignment Summary
              </h3>
            </div>

            <div className="divide-y divide-[var(--border)] text-xs">
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Total Registered</span>
                <span className="font-black text-[var(--text-primary)] font-mono text-sm">{totalAssigned} head</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Active & Productive</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{activeCount} head</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Under Clinical Observation</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">{sickCount} head</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Breed Standard</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{breedName}</span>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <span className="text-[var(--text-secondary)]">Opening Headcount</span>
                <span className="font-bold text-[var(--text-primary)] font-mono">{openingQty} head</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-950 dark:text-blue-200">
              <Tag className="w-4 h-4 text-blue-600" />
              <span>RFID Wand Scanner Ready</span>
            </div>
            <p className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
              Animals assigned to this batch can be scanned with Bluetooth RFID wands during daily feeding and weighing sessions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Assign Animals Modal ── */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Assign Animals to {batch.batch_no}</h3>
                <p className="text-xs text-[var(--text-secondary)]">Select available registered animals to link to this batch</p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {loadingUnassigned ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading unassigned animals…
                </div>
              ) : unassignedList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500 opacity-60" />
                  No unassigned animals found. Use "Upload Ear Tags" to register new animals directly.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--border)]">
                    <span className="font-bold text-[var(--text-secondary)]">Available Unassigned Animals:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedAnimalIds.length === unassignedList.length) {
                          setSelectedAnimalIds([]);
                        } else {
                          setSelectedAnimalIds(unassignedList.map((a) => a.animal_id));
                        }
                      }}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                    >
                      {selectedAnimalIds.length === unassignedList.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--border)] max-h-72 overflow-y-auto">
                    {unassignedList.map((anm) => {
                      const isChecked = selectedAnimalIds.includes(anm.animal_id);
                      return (
                        <label
                          key={anm.animal_id}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition ${
                            isChecked ? "bg-blue-50/70 dark:bg-blue-950/60" : "hover:bg-[var(--surface-raised)]/40"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAnimalIds([...selectedAnimalIds, anm.animal_id]);
                                } else {
                                  setSelectedAnimalIds(selectedAnimalIds.filter((id) => id !== anm.animal_id));
                                }
                              }}
                              className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-black text-xs text-[var(--text-primary)] font-mono">
                                {anm.ear_tag || anm.animal_code}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)]">
                                {anm.animal_type} · RFID: {anm.rfid_tag || "—"}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--surface-raised)] text-[var(--text-secondary)]">
                            {anm.status || "ACTIVE"}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                {selectedAnimalIds.length} animals selected
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setAssignModalOpen(false)} className="text-xs h-8">
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignSubmit}
                  disabled={submittingAssign || selectedAnimalIds.length === 0}
                  className="bg-[#1A3A5C] text-white text-xs h-8 font-black gap-1.5"
                >
                  {submittingAssign && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Assign {selectedAnimalIds.length} Animals
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Ear Tags Modal ── */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[var(--text-primary)]">Bulk Register & Assign Ear Tags</h3>
                <p className="text-xs text-[var(--text-secondary)]">Paste a list of ear tags or RFID tags to register into {batch.batch_no}</p>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--surface-raised)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="text-xs font-bold text-[var(--text-secondary)] block">
                Ear Tags List (separated by commas or new lines):
              </label>
              <textarea
                rows={6}
                value={rawTagsInput}
                onChange={(e) => setRawTagsInput(e.target.value)}
                placeholder="ET-SOW-101&#10;ET-SOW-102&#10;ET-SOW-103&#10;ET-SOW-104"
                className="w-full p-3 text-xs font-mono text-[var(--text-primary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl resize-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Animals will be registered under breed <strong>{breedName}</strong> and attached to this batch immediately.
              </p>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-raised)]/30 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadModalOpen(false)} className="text-xs h-8">
                Cancel
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={submittingUpload}
                className="bg-[#1A3A5C] text-white text-xs h-8 font-black gap-1.5"
              >
                {submittingUpload && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Register & Attach Animals
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
