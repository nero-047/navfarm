"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus, Search, Loader2, Inbox, Eye, Trash2, Pill, AlertCircle, AlertTriangle, ChevronRight, Scan, ArrowRight, Pencil,
} from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";
import RfidScannerModal from "@/components/console/piggery/rfid-scanner-modal";
import AnimalStageTransitionModal from "@/components/console/piggery/animal-stage-transition-modal";
import {
  TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

// ── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;
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
};

const inputCls = "nf-input";

const STATUS_STYLE: Record<string, any> = {
  ACTIVE:      { color: "var(--success)",        borderColor: "var(--success)",        backgroundColor: "var(--success-muted)" },
  QUARANTINE:  { color: "var(--warning)",        borderColor: "var(--warning)",        backgroundColor: "var(--warning-muted)" },
  SICK:        { color: "var(--danger)",         borderColor: "var(--danger)",         backgroundColor: "var(--danger-muted)" },
  PREGNANT:    { color: "var(--accent)",         borderColor: "var(--accent)",         backgroundColor: "var(--surface-raised)" },
  LACTATING:   { color: "var(--accent)",         borderColor: "var(--accent)",         backgroundColor: "var(--surface-raised)" },
  DRY:         { color: "var(--text-secondary)", borderColor: "var(--border)",         backgroundColor: "var(--surface-raised)" },
  CULLED:      { color: "var(--text-secondary)", borderColor: "var(--border)",         backgroundColor: "var(--surface-secondary)" },
  DEAD:        { color: "var(--text-muted)",     borderColor: "var(--border)",         backgroundColor: "var(--surface-secondary)" },
  SOLD:        { color: "var(--text-muted)",     borderColor: "var(--border)",         backgroundColor: "var(--surface-secondary)" },
  SLAUGHTERED: { color: "var(--text-muted)",     borderColor: "var(--border)",         backgroundColor: "var(--surface-secondary)" },
};

const ANIMAL_TYPES = ["SOW", "BOAR", "GILT", "PIGLET", "COMMERCIAL_PIG"];
const GENDERS      = [{ value: "F", label: "Female" }, { value: "M", label: "Male" }];
const ENTRY_TYPES  = ["PURCHASED_IMPORTED", "PURCHASED_LOCAL", "BORN_ON_FARM", "TRANSFERRED_IN"];
// Live/in-herd condition statuses editable from the correction form — the terminal
// disposal statuses (CULLED/DEAD/SOLD/SLAUGHTERED) only come from the Dispose flow,
// which also records disposal_date/type/value and the resulting book-value impact.
const EDITABLE_STATUSES = ["ACTIVE", "QUARANTINE", "SICK", "PREGNANT", "LACTATING", "DRY"];
const DISPOSAL_TYPES = ["SOLD", "SLAUGHTERED", "DIED", "TRANSFERRED"] as const;

function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function Badge({ label, style }: { label: string; style: any }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={style}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

// ── Withdrawal warning banner ─────────────────────────────────────────────────
// The API returns a 400 with a message like:
//   "Cannot slaughter — withdrawal period not elapsed for: Ivermectin (3 day(s) remaining, last dose 2026-08-15); Oxytetracycline (1 day(s) remaining, last dose 2026-08-18)"
// We parse and render that as structured rows rather than a raw toast.

function WithdrawalWarning({ message }: { message: string }) {
  // Strip the prefix up to the colon after "for:", then split on ";"
  const afterColon = message.replace(/^Cannot slaughter[^:]*:\s*/, "");
  const items = afterColon.split(";").map((s) => s.trim()).filter(Boolean);
  return (
    <div
      className="rounded-[var(--radius-md)] border p-4"
      style={S.danger}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Cannot slaughter — withdrawal period not elapsed</p>
          {items.length > 0 && (
            <ul className="mt-2 space-y-1">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs">
                  <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnimalPanel() {
  const companyId = getActiveCompanyId();

  // ── List state ──────────────────────────────────────────────────────────────
  const [rows, setRows]         = useState<Row[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [includeDisposed, setIncludeDisposed] = useState(false);
  const [page, setPage]         = useState(1);
  const [pageSize]              = useState(PAGE_SIZE);

  // ── Reference data ──────────────────────────────────────────────────────────
  const [nobs, setNobs]       = useState<Row[]>([]);
  const [lobs, setLobs]       = useState<Row[]>([]);
  const [breeds, setBreeds]   = useState<Row[]>([]);
  const [items, setItems]     = useState<Row[]>([]);
  const [medItems, setMedItems] = useState<Row[]>([]); // MEDICINE + VACCINE filtered
  const [uoms, setUoms]       = useState<Row[]>([]);
  const [batches, setBatches] = useState<Row[]>([]);
  const [stages, setStages]   = useState<Row[]>([]);
  const [locations, setLocations] = useState<Row[]>([]);

  // ── Fast Scanner Modal ──────────────────────────────────────────────────
  const [scannerOpen, setScannerOpen] = useState(false);

  // ── Stage Transition Modal ──────────────────────────────────────────────
  const [transitionOpen, setTransitionOpen]     = useState(false);
  const [transitionAnimal, setTransitionAnimal] = useState<Row | null>(null);

  // ── Stage-Duration Overdue: auto-prompt once per visit when the backend
  // flags animals whose stage_master.typical_duration_days/auto_move_on_day
  // has elapsed (see stage-overdue.util.ts / animal.service.ts enrichAnimal()).
  const hasAutoPromptedOverdue = useRef(false);
  const [overdueBannerDismissed, setOverdueBannerDismissed] = useState(false);

  // ── Create animal modal ─────────────────────────────────────────────────────
  const [createOpen, setCreateOpen]   = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [createError, setCreateError]   = useState("");
  const [createNobId, setCreateNobId]   = useState("");
  const [createForm, setCreateForm]     = useState<Row>({
    animal_type: "", gender: "", entry_type: "", entry_date: new Date().toISOString().slice(0, 10),
    breed_id: "", item_id: "", acquisition_cost: "", dob: "", ear_tag: "", rfid_tag: "",
    source_receipt_id: "", source_batch_id: "", notes: "", status: "ACTIVE",
  });

  // ── Detail modal ────────────────────────────────────────────────────────────
  const [viewing, setViewing]     = useState<Row | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "medications" | "valuation" | "lineage">("overview");

  // ── Medication log ──────────────────────────────────────────────────────────
  const [medLogs, setMedLogs]         = useState<Row[]>([]);
  const [medLoading, setMedLoading]   = useState(false);
  const [medError, setMedError]       = useState("");

  // ── Bio-Asset Ledger ────────────────────────────────────────────────────────
  const [ledgerEntries, setLedgerEntries] = useState<Row[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError]     = useState("");

  // ── Lineage (pedigree) ──────────────────────────────────────────────────────
  const [lineage, setLineage]           = useState<{ ancestors: Row[]; descendants: Row[] } | null>(null);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [lineageError, setLineageError]     = useState("");

  // ── Log dose modal ──────────────────────────────────────────────────────────
  const [doseOpen, setDoseOpen]       = useState(false);
  const [doseSaving, setDoseSaving]   = useState(false);
  const [doseError, setDoseError]     = useState("");
  const [doseForm, setDoseForm]       = useState<Row>({
    item_id: "", administered_date: new Date().toISOString().slice(0, 10),
    dose_qty: "", uom: "", administered_by: "", notes: "",
  });

  // ── Edit modal — corrects mistakes on an already-registered animal (breed, DOB,
  // tags, lineage, breeding tier, condition status, notes). Deliberately excludes
  // disposal-terminal statuses (CULLED/DEAD/SOLD/SLAUGHTERED) and valuation fields —
  // those go through the dedicated Dispose flow so book-value/GL math stays correct.
  const [editOpen, setEditOpen]     = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError]   = useState("");
  const [editForm, setEditForm]     = useState<Row>({});
  const [editBreeds, setEditBreeds] = useState<Row[]>([]);

  const openEdit = () => {
    if (!viewing) return;
    setEditForm({
      breed_id: viewing.breed_id || "",
      dob: viewing.dob || "",
      ear_tag: viewing.ear_tag || "",
      rfid_tag: viewing.rfid_tag || "",
      sire_animal_id: viewing.sire_animal_id || "",
      dam_animal_id: viewing.dam_animal_id || "",
      breeding_tier: viewing.breeding_tier || "",
      status: EDITABLE_STATUSES.includes(viewing.status) ? viewing.status : "",
      notes: viewing.notes || "",
    });
    setEditError("");
    setEditOpen(true);
  };

  useEffect(() => {
    if (!editOpen || !viewing?.lob_id) { setEditBreeds([]); return; }
    const qs = new URLSearchParams();
    qs.set("lobId", viewing.lob_id);
    api.get(`/breed?${qs.toString()}`).then((r) => setEditBreeds(unwrap<Row[]>(r) || [])).catch(() => setEditBreeds([]));
  }, [editOpen, viewing?.lob_id]);

  const handleEditSave = async () => {
    if (!viewing) return;
    setEditSaving(true);
    setEditError("");
    try {
      const payload: Row = {
        breed_id: editForm.breed_id || undefined,
        dob: editForm.dob || undefined,
        ear_tag: editForm.ear_tag || undefined,
        rfid_tag: editForm.rfid_tag || undefined,
        sire_animal_id: editForm.sire_animal_id || undefined,
        dam_animal_id: editForm.dam_animal_id || undefined,
        breeding_tier: editForm.breeding_tier || undefined,
        status: editForm.status || undefined,
        notes: editForm.notes || undefined,
      };
      const res = await api.put(`/animal/${viewing.animal_id}`, payload);
      const updated = unwrap<Row>(res);
      setViewing((v) => (v ? { ...v, ...updated } : updated));
      setEditOpen(false);
      await load();
    } catch (err: any) {
      setEditError(err?.message || "Failed to update animal.");
    } finally {
      setEditSaving(false);
    }
  };

  // ── Dispose modal ───────────────────────────────────────────────────────────
  const [disposeOpen, setDisposeOpen]   = useState(false);
  const [disposeSaving, setDisposeSaving] = useState(false);
  const [disposeError, setDisposeError]   = useState("");
  const [disposeIsWithdrawal, setDisposeIsWithdrawal] = useState(false);
  const [disposeForm, setDisposeForm]   = useState<Row>({
    disposal_type: "SOLD", disposal_date: new Date().toISOString().slice(0, 10),
    disposal_value: "", notes: "",
  });

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (includeDisposed) params.set("includeDisposed", "true");
      params.set("limit", "200");
      const res = await api.get(`/animal?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
      setPage(1);
    } catch (err: any) {
      setError(err?.message || "Failed to load animals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, statusFilter, includeDisposed]); // eslint-disable-line react-hooks/exhaustive-deps

  const overdueAnimals = rows.filter((r) => r.is_stage_overdue);

  // Auto-populate the transition modal once per visit for the most overdue animal —
  // "if the stage period is done, automatically prompt to change the stage."
  useEffect(() => {
    if (hasAutoPromptedOverdue.current || overdueAnimals.length === 0 || transitionOpen) return;
    hasAutoPromptedOverdue.current = true;
    const mostOverdue = [...overdueAnimals].sort((a, b) => (b.days_in_stage || 0) - (a.days_in_stage || 0))[0];
    setTransitionAnimal(mostOverdue);
    setTransitionOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  // Reference data — loaded once on mount
  useEffect(() => {
    const qs = companyId ? `?companyId=${companyId}&limit=500` : "?limit=500";
    api.get(`/setup/wizard/nobs${qs}`).then((r) => setNobs(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/uom${qs}`).then((r) => setUoms(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/batch${qs}`).then((r) => setBatches(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/stage?limit=100`).then((r) => setStages(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/location${qs}`).then((r) => setLocations(unwrap<Row[]>(r) || [])).catch(() => {});
    // Items — scoped for medicine/vaccine picker separately from living-asset picker
    api.get(`/item${qs}`).then((r) => {
      const all = unwrap<Row[]>(r) || [];
      setItems(all);
      setMedItems(all.filter((i: Row) => ["MEDICINE", "VACCINE"].includes(i.item_type)));
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // LOBs depend on selected NOB (create form)
  useEffect(() => {
    if (!createNobId) { setLobs([]); return; }
    api.get(`/setup/wizard/lobs/${createNobId}`).then((r) => setLobs(unwrap<Row[]>(r) || [])).catch(() => setLobs([]));
  }, [createNobId]);

  // Breeds depend on LOB
  useEffect(() => {
    if (!createForm.lob_id) { setBreeds([]); return; }
    const qs = new URLSearchParams();
    if (companyId) qs.set("companyId", companyId);
    if (createNobId) qs.set("nobId", createNobId);
    if (createForm.lob_id) qs.set("lobId", createForm.lob_id);
    qs.set("limit", "200");
    api.get(`/breed?${qs.toString()}`).then((r) => setBreeds(unwrap<Row[]>(r) || [])).catch(() => {});
  }, [createForm.lob_id, createNobId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Medication logs — loaded when opening the medications tab
  const loadMedLogs = async (animalId: string) => {
    setMedLoading(true);
    setMedError("");
    try {
      const res = await api.get(`/animal/${animalId}/medications`);
      setMedLogs(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setMedError(err?.message || "Failed to load medication log.");
    } finally {
      setMedLoading(false);
    }
  };

  // Bio-Asset Ledger entries — loaded when opening the valuation tab
  const loadBioAssetLedger = async (animalId: string) => {
    setLedgerLoading(true);
    setLedgerError("");
    try {
      const res = await api.get(`/animal/${animalId}/bio-asset-ledger`);
      setLedgerEntries(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setLedgerError(err?.message || "Failed to load bio-asset ledger entries.");
    } finally {
      setLedgerLoading(false);
    }
  };

  // Lineage — loaded when opening the lineage tab
  const loadLineage = async (animalId: string) => {
    setLineageLoading(true);
    setLineageError("");
    try {
      const res = await api.get(`/animal/${animalId}/lineage`);
      const data = unwrap<Row>(res);
      setLineage({ ancestors: data?.ancestors || [], descendants: data?.descendants || [] });
    } catch (err: any) {
      setLineageError(err?.message || "Failed to load lineage.");
    } finally {
      setLineageLoading(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openView = async (row: Row) => {
    const res = await api.get(`/animal/${row.animal_id}`);
    setViewing(unwrap<Row>(res));
    setDetailTab("overview");
    setMedLogs([]);
    setLedgerEntries([]);
    setLineage(null);
  };

  const handleDetailTabChange = (tab: "overview" | "medications" | "valuation" | "lineage") => {
    setDetailTab(tab);
    if (tab === "medications" && viewing) loadMedLogs(viewing.animal_id);
    if (tab === "valuation" && viewing) loadBioAssetLedger(viewing.animal_id);
    if (tab === "lineage" && viewing) loadLineage(viewing.animal_id);
  };


  const handleCreate = async () => {
    setCreateSaving(true);
    setCreateError("");
    try {
      if (!createNobId) throw new Error("Nature of Business is required.");
      if (!createForm.lob_id) throw new Error("Line of Business is required.");
      if (!createForm.animal_type) throw new Error("Animal type is required.");
      if (!createForm.gender) throw new Error("Gender is required.");
      if (!createForm.entry_type) throw new Error("Entry type is required.");
      if (!createForm.entry_date) throw new Error("Entry date is required.");
      if (!createForm.breed_id) throw new Error("Breed is required.");
      if (!createForm.item_id) throw new Error("Item (living asset) is required.");
      if (!createForm.acquisition_cost) throw new Error("Acquisition cost is required.");

      await api.post("/animal", {
        company_id: companyId,
        nob_id: createNobId,
        lob_id: createForm.lob_id,
        animal_type: createForm.animal_type,
        gender: createForm.gender,
        entry_type: createForm.entry_type,
        entry_date: createForm.entry_date,
        breed_id: createForm.breed_id,
        item_id: createForm.item_id,
        acquisition_cost: Number(createForm.acquisition_cost),
        dob: createForm.dob || undefined,
        ear_tag: createForm.ear_tag || undefined,
        rfid_tag: createForm.rfid_tag || undefined,
        breeding_tier: createForm.breeding_tier || undefined,
        source_receipt_id: createForm.source_receipt_id || undefined,
        source_batch_id: createForm.source_batch_id || undefined,
        notes: createForm.notes || undefined,
        status: createForm.status || "ACTIVE",
      });
      setCreateOpen(false);
      load();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to register animal.");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleLogDose = async () => {
    if (!viewing) return;
    setDoseSaving(true);
    setDoseError("");
    try {
      if (!doseForm.item_id) throw new Error("Select a medicine or vaccine.");
      if (!doseForm.administered_date) throw new Error("Date of administration is required.");
      await api.post(`/animal/${viewing.animal_id}/medications`, {
        item_id: doseForm.item_id,
        administered_date: doseForm.administered_date,
        dose_qty: doseForm.dose_qty ? Number(doseForm.dose_qty) : undefined,
        uom: doseForm.uom || undefined,
        administered_by: doseForm.administered_by || undefined,
        notes: doseForm.notes || undefined,
      });
      setDoseOpen(false);
      setDoseForm({ item_id: "", administered_date: new Date().toISOString().slice(0, 10), dose_qty: "", uom: "", administered_by: "", notes: "" });
      loadMedLogs(viewing.animal_id);
    } catch (err: any) {
      setDoseError(err?.message || "Failed to log dose.");
    } finally {
      setDoseSaving(false);
    }
  };

  const handleDispose = async () => {
    if (!viewing) return;
    setDisposeSaving(true);
    setDisposeError("");
    setDisposeIsWithdrawal(false);
    try {
      if (!disposeForm.disposal_type) throw new Error("Disposal type is required.");
      if (!disposeForm.disposal_date) throw new Error("Date is required.");
      await api.patch(`/animal/${viewing.animal_id}/dispose`, {
        disposal_type: disposeForm.disposal_type,
        disposal_date: disposeForm.disposal_date,
        disposal_value: disposeForm.disposal_value ? Number(disposeForm.disposal_value) : undefined,
        notes: disposeForm.notes || undefined,
      });
      setDisposeOpen(false);
      setViewing(null);
      load();
    } catch (err: any) {
      const msg: string = err?.message || "Failed to dispose animal.";
      // Withdrawal-period errors have a specific prefix — surface them structured
      if (msg.includes("Cannot slaughter")) {
        setDisposeIsWithdrawal(true);
      }
      setDisposeError(msg);
    } finally {
      setDisposeSaving(false);
    }
  };

  // ── Pagination ───────────────────────────────────────────────────────────────
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
          <input
            id="animal-search"
            className={inputCls}
            style={{ paddingLeft: "2rem" }}
            placeholder="Search code, RFID, ear tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="animal-status-filter"
          className={inputCls}
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_STYLE).map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={S.sub}>
          <input
            type="checkbox"
            checked={includeDisposed}
            onChange={(e) => setIncludeDisposed(e.target.checked)}
            className="rounded"
          />
          Include disposed
        </label>

        <Button variant="outline" size="sm" onClick={() => setScannerOpen(true)}>
          <Scan className="mr-1.5 h-3.5 w-3.5" /> RFID Fast Scanner
        </Button>

        <Button id="animal-create-btn" size="sm" onClick={() => {
          setCreateNobId("");
          setCreateForm({ animal_type: "", gender: "", entry_type: "", entry_date: new Date().toISOString().slice(0, 10), breed_id: "", item_id: "", acquisition_cost: "", dob: "", ear_tag: "", rfid_tag: "", source_receipt_id: "", source_batch_id: "", notes: "", status: "ACTIVE", lob_id: "" });
          setCreateError("");
          setCreateOpen(true);
        }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Register Animal
        </Button>
      </div>

      {error && <div className="mb-4"><InlineAlert variant="danger">{error}</InlineAlert></div>}

      {!overdueBannerDismissed && overdueAnimals.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-xs" style={S.warning}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>{overdueAnimals.length}</strong> animal{overdueAnimals.length === 1 ? " has" : "s have"} exceeded its
              configured stage duration and may be ready to advance.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const mostOverdue = [...overdueAnimals].sort((a, b) => (b.days_in_stage || 0) - (a.days_in_stage || 0))[0];
                setTransitionAnimal(mostOverdue);
                setTransitionOpen(true);
              }}
            >
              Review
            </Button>
            <button onClick={() => setOverdueBannerDismissed(true)} className="text-xs font-semibold hover:underline" style={S.muted}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── List table ── */}
      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Ear Tag</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" style={S.muted} />
                </TableCell>
              </TableRow>
            )}
            {!loading && pagedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center">
                  <Inbox className="mx-auto h-8 w-8 mb-3" style={S.muted} />
                  <p className="text-sm" style={S.sub}>No animals found.</p>
                </TableCell>
              </TableRow>
            )}
            {!loading && pagedRows.map((row) => (
              <TableRow key={row.animal_id} className="cursor-pointer hover:bg-[var(--surface-raised)]" onClick={() => openView(row)}>
                <TableCell className="font-mono text-xs font-semibold" style={S.accent}>{row.animal_code}</TableCell>
                <TableCell style={S.sub}>{row.animal_type?.replace(/_/g, " ")}</TableCell>
                <TableCell style={S.sub}>{row.gender === "F" ? "Female" : row.gender === "M" ? "Male" : row.gender}</TableCell>
                <TableCell style={S.sub}>{row.breed_id || "—"}</TableCell>
                <TableCell>
                  <Badge label={row.status || "ACTIVE"} style={STATUS_STYLE[row.status] || STATUS_STYLE.ACTIVE} />
                </TableCell>
                <TableCell style={S.muted}>{formatDate(row.entry_date)}</TableCell>
                <TableCell style={S.muted}>{row.ear_tag || "—"}</TableCell>
                <TableCell>
                  <button
                    aria-label="View animal"
                    className="p-1 rounded hover:bg-[var(--surface-secondary)]"
                    style={S.muted}
                    onClick={(e) => { e.stopPropagation(); openView(row); }}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>

      {rows.length > pageSize && (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={rows.length}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* ═══ Create Animal Modal ═══════════════════════════════════════════════ */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register Animal"
        description="Auto-generates an animal code from the ANIMAL_PIGGERY number series."
        maxWidth="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={createSaving}>Cancel</Button>
            <Button id="animal-create-save-btn" onClick={handleCreate} disabled={createSaving}>
              {createSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Register"}
            </Button>
          </>
        }
      >
        {createError && <div className="mb-4"><InlineAlert variant="danger">{createError}</InlineAlert></div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* NOB */}
          <div>
            <label className="nf-label" htmlFor="ca-nob">Nature of Business *</label>
            <select id="ca-nob" className={inputCls} value={createNobId} onChange={(e) => { setCreateNobId(e.target.value); setCreateForm((f) => ({ ...f, lob_id: "" })); }}>
              <option value="">— select —</option>
              {nobs.map((n) => <option key={n.nob_id} value={n.nob_id}>{n.nob_name}</option>)}
            </select>
          </div>

          {/* LOB */}
          <div>
            <label className="nf-label" htmlFor="ca-lob">Line of Business *</label>
            <select id="ca-lob" className={inputCls} value={createForm.lob_id} onChange={(e) => setCreateForm((f) => ({ ...f, lob_id: e.target.value }))}>
              <option value="">— select NOB first —</option>
              {lobs.map((l) => <option key={l.lob_id} value={l.lob_id}>{l.lob_name}</option>)}
            </select>
          </div>

          {/* Animal type */}
          <div>
            <label className="nf-label" htmlFor="ca-type">Animal Type *</label>
            <select id="ca-type" className={inputCls} value={createForm.animal_type} onChange={(e) => setCreateForm((f) => ({ ...f, animal_type: e.target.value }))}>
              <option value="">— select —</option>
              {ANIMAL_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="nf-label" htmlFor="ca-gender">Gender *</label>
            <select id="ca-gender" className={inputCls} value={createForm.gender} onChange={(e) => setCreateForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="">— select —</option>
              {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>

          {/* Entry type */}
          <div>
            <label className="nf-label" htmlFor="ca-entry-type">Entry Type *</label>
            <select id="ca-entry-type" className={inputCls} value={createForm.entry_type} onChange={(e) => setCreateForm((f) => ({ ...f, entry_type: e.target.value }))}>
              <option value="">— select —</option>
              {ENTRY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          {/* Entry date */}
          <div>
            <label className="nf-label" htmlFor="ca-entry-date">Entry Date *</label>
            <input id="ca-entry-date" type="date" className={inputCls} value={createForm.entry_date} onChange={(e) => setCreateForm((f) => ({ ...f, entry_date: e.target.value }))} />
          </div>

          {/* Breed */}
          <div>
            <label className="nf-label" htmlFor="ca-breed">Breed *</label>
            <select id="ca-breed" className={inputCls} value={createForm.breed_id} onChange={(e) => setCreateForm((f) => ({ ...f, breed_id: e.target.value }))}>
              <option value="">— select LOB first —</option>
              {breeds.map((b) => <option key={b.breed_id} value={b.breed_id}>{b.breed_name}</option>)}
            </select>
          </div>

          {/* Item (living asset) */}
          <div>
            <label className="nf-label" htmlFor="ca-item">Item (living asset catalogue) *</label>
            <select id="ca-item" className={inputCls} value={createForm.item_id} onChange={(e) => setCreateForm((f) => ({ ...f, item_id: e.target.value }))}>
              <option value="">— select —</option>
              {items.filter((i) => i.item_type === "LIVING_ASSET" || !i.item_type).map((i) => <option key={i.item_id} value={i.item_id}>{i.item_name}</option>)}
            </select>
          </div>

          {/* Acquisition cost */}
          <div>
            <label className="nf-label" htmlFor="ca-cost">Acquisition Cost *</label>
            <input id="ca-cost" type="number" min="0" step="0.01" className={inputCls} placeholder="0.00" value={createForm.acquisition_cost} onChange={(e) => setCreateForm((f) => ({ ...f, acquisition_cost: e.target.value }))} />
          </div>

          {/* DOB */}
          <div>
            <label className="nf-label" htmlFor="ca-dob">Date of Birth</label>
            <input id="ca-dob" type="date" className={inputCls} value={createForm.dob} onChange={(e) => setCreateForm((f) => ({ ...f, dob: e.target.value }))} />
          </div>

          {/* Ear tag */}
          <div>
            <label className="nf-label" htmlFor="ca-ear-tag">Ear Tag</label>
            <input id="ca-ear-tag" type="text" className={inputCls} placeholder="Visual tag number" value={createForm.ear_tag} onChange={(e) => setCreateForm((f) => ({ ...f, ear_tag: e.target.value }))} />
          </div>

          {/* RFID */}
          <div>
            <label className="nf-label" htmlFor="ca-rfid">RFID Tag</label>
            <input id="ca-rfid" type="text" className={inputCls} placeholder="RFID scan number (unique)" value={createForm.rfid_tag} onChange={(e) => setCreateForm((f) => ({ ...f, rfid_tag: e.target.value }))} />
          </div>

          {/* Breeding-pyramid tier */}
          <div>
            <label className="nf-label" htmlFor="ca-breeding-tier">Breeding Tier</label>
            <select id="ca-breeding-tier" className={inputCls} value={createForm.breeding_tier || ""} onChange={(e) => setCreateForm((f) => ({ ...f, breeding_tier: e.target.value }))}>
              <option value="">— not set —</option>
              <option value="GGP">GGP (Great-Grandparent / Nucleus)</option>
              <option value="GP">GP (Grandparent)</option>
              <option value="PS">PS (Parent Stock)</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
          </div>

          {/* Source receipt — shown when PURCHASED */}
          {["PURCHASED_IMPORTED", "PURCHASED_LOCAL"].includes(createForm.entry_type) && (
            <div>
              <label className="nf-label" htmlFor="ca-receipt">Source Receipt ID *</label>
              <input id="ca-receipt" type="text" className={inputCls} placeholder="Goods Receipt UUID" value={createForm.source_receipt_id} onChange={(e) => setCreateForm((f) => ({ ...f, source_receipt_id: e.target.value }))} />
            </div>
          )}

          {/* Source batch — shown when BORN_ON_FARM */}
          {createForm.entry_type === "BORN_ON_FARM" && (
            <div>
              <label className="nf-label" htmlFor="ca-batch">Source Batch *</label>
              <select id="ca-batch" className={inputCls} value={createForm.source_batch_id} onChange={(e) => setCreateForm((f) => ({ ...f, source_batch_id: e.target.value }))}>
                <option value="">— select batch —</option>
                {batches.map((b) => <option key={b.batch_id} value={b.batch_id}>{b.batch_no || b.batch_id}</option>)}
              </select>
            </div>
          )}

          {/* Notes — full width */}
          <div className="sm:col-span-2">
            <label className="nf-label" htmlFor="ca-notes">Notes</label>
            <textarea id="ca-notes" className={inputCls} rows={2} value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Dialog>

      {/* ═══ Detail modal ═════════════════════════════════════════════════════ */}
      {viewing && (
        <Dialog
          open={!!viewing}
          onClose={() => setViewing(null)}
          title={`Animal: ${viewing.animal_code}`}
          description={`${viewing.animal_type?.replace(/_/g, " ")} · ${viewing.gender === "F" ? "Female" : viewing.gender === "M" ? "Male" : viewing.gender}`}
          maxWidth="xl"
          footer={
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  id="animal-dispose-btn"
                  variant="destructive"
                  size="sm"
                  disabled={!viewing.is_active}
                  onClick={() => {
                    setDisposeForm({ disposal_type: "SOLD", disposal_date: new Date().toISOString().slice(0, 10), disposal_value: "", notes: "" });
                    setDisposeError("");
                    setDisposeIsWithdrawal(false);
                    setDisposeOpen(true);
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  {viewing.is_active ? "Dispose" : "Disposed"}
                </Button>

                {viewing.is_active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTransitionAnimal(viewing);
                      setTransitionOpen(true);
                    }}
                  >
                    <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                    Transfer Stage / Pen
                  </Button>
                )}

                <Button id="animal-edit-btn" variant="outline" size="sm" onClick={openEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
            </div>
          }
        >
          {/* Tabs */}
          <div className="mb-5 flex gap-1 rounded-[var(--radius-sm)] p-1 text-sm" style={{ backgroundColor: "var(--surface-raised)" }}>
            {(["overview", "medications", "valuation", "lineage"] as const).map((tab) => (
              <button
                key={tab}
                id={`animal-detail-tab-${tab}`}
                onClick={() => handleDetailTabChange(tab)}
                className="flex-1 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold transition-colors"
                style={detailTab === tab
                  ? { backgroundColor: "var(--surface)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }
                  : { color: "var(--text-secondary)" }}
              >
                {tab === "overview" ? "Overview" : tab === "medications" ? "Medication Log" : tab === "valuation" ? "Valuation & Ledger" : "Lineage"}
              </button>
            ))}
          </div>

          {/* ── Overview tab ── */}
          {detailTab === "overview" && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-3">
              {[
                ["Animal Code", viewing.animal_code],
                ["Type", viewing.animal_type?.replace(/_/g, " ")],
                ["Gender", viewing.gender === "F" ? "Female" : viewing.gender === "M" ? "Male" : viewing.gender],
                ["Status", viewing.status],
                ["Entry Type", viewing.entry_type?.replace(/_/g, " ")],
                ["Entry Date", formatDate(viewing.entry_date)],
                ["Date of Birth", formatDate(viewing.dob)],
                ["Ear Tag", viewing.ear_tag || "—"],
                ["RFID Tag", viewing.rfid_tag || "—"],
                ["Acquisition Cost", viewing.acquisition_cost ? `₹${Number(viewing.acquisition_cost).toLocaleString("en-IN")}` : "—"],
                ["Book Value", viewing.book_value ? `₹${Number(viewing.book_value).toLocaleString("en-IN")}` : "—"],
                ["Disposal Date", viewing.is_active ? "—" : formatDate(viewing.disposal_date)],
                ["Disposal Type", viewing.disposal_type || "—"],
                ["Disposal Value", viewing.disposal_value ? `₹${Number(viewing.disposal_value).toLocaleString("en-IN")}` : "—"],
                ["Gain / Loss on Disposal", viewing.gain_loss_on_disposal ? `₹${Number(viewing.gain_loss_on_disposal).toLocaleString("en-IN")}` : "—"],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs uppercase tracking-wide" style={S.muted}>{label as string}</p>
                  <p className="mt-0.5 font-medium" style={S.primary}>{val as string}</p>
                </div>
              ))}
              {viewing.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-xs uppercase tracking-wide" style={S.muted}>Notes</p>
                  <p className="mt-0.5 text-sm" style={S.sub}>{viewing.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Medications tab ── */}
          {detailTab === "medications" && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold" style={S.primary}>Medication history</p>
                {viewing.is_active && (
                  <Button
                    id="animal-log-dose-btn"
                    size="sm"
                    onClick={() => {
                      setDoseForm({ item_id: "", administered_date: new Date().toISOString().slice(0, 10), dose_qty: "", uom: "", administered_by: "", notes: "" });
                      setDoseError("");
                      setDoseOpen(true);
                    }}
                  >
                    <Pill className="mr-1.5 h-3.5 w-3.5" /> Log Dose
                  </Button>
                )}
              </div>

              {medError && <div className="mb-4"><InlineAlert variant="danger">{medError}</InlineAlert></div>}

              {medLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" style={S.muted} />
                </div>
              ) : medLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <Pill className="mx-auto h-7 w-7 mb-2" style={S.muted} />
                  <p className="text-sm" style={S.sub}>No doses recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Administered By</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medLogs.map((log) => (
                        <TableRow key={log.log_id}>
                          <TableCell style={S.sub}>{formatDate(log.administered_date)}</TableCell>
                          <TableCell style={S.primary} className="font-medium">{
                            items.find((i) => i.item_id === log.item_id)?.item_name || log.item_id
                          }</TableCell>
                          <TableCell style={S.muted}>
                            {log.dose_qty ? `${log.dose_qty}${log.uom ? " " + log.uom : ""}` : "—"}
                          </TableCell>
                          <TableCell style={S.muted}>{log.administered_by || "—"}</TableCell>
                          <TableCell style={S.muted}>{log.notes || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Valuation & Bio-Asset Ledger tab ── */}
          {detailTab === "valuation" && (
            <div>
              {/* Valuation KPIs */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={S.muted}>Net Book Value (NBV)</p>
                  <p className="mt-1 text-lg font-bold" style={S.primary}>
                    ₹{viewing.book_value ? Number(viewing.book_value).toLocaleString("en-IN") : viewing.acquisition_cost ? Number(viewing.acquisition_cost).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={S.muted}>Opening Asset Value</p>
                  <p className="mt-1 text-lg font-bold" style={S.primary}>
                    ₹{viewing.total_opening_asset_value ? Number(viewing.total_opening_asset_value).toLocaleString("en-IN") : viewing.acquisition_cost ? Number(viewing.acquisition_cost).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={S.muted}>Total Amortized</p>
                  <p className="mt-1 text-lg font-bold" style={S.primary}>
                    ₹{viewing.total_amortised ? Number(viewing.total_amortised).toLocaleString("en-IN") : "0"}
                  </p>
                </div>
                <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={S.muted}>Monthly Amortization</p>
                  <p className="mt-1 text-lg font-bold" style={S.primary}>
                    {viewing.amortisation_monthly ? `₹${Number(viewing.amortisation_monthly).toLocaleString("en-IN")}` : "—"}
                  </p>
                </div>
              </div>

              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold" style={S.primary}>IAS 41 Biological Asset Ledger</p>
                <span className="text-xs" style={S.muted}>{ledgerEntries.length} transaction(s)</span>
              </div>

              {ledgerError && <div className="mb-4"><InlineAlert variant="danger">{ledgerError}</InlineAlert></div>}

              {ledgerLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" style={S.muted} />
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm" style={S.sub}>No biological asset ledger entries found.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
                  <table className="w-full text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Posting Date</TableHead>
                        <TableHead>Entry Type</TableHead>
                        <TableHead>Doc No</TableHead>
                        <TableHead>Headcount</TableHead>
                        <TableHead className="text-right">Cost Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ledgerEntries.map((entry) => (
                        <TableRow key={entry.entry_id}>
                          <TableCell style={S.sub}>{formatDate(entry.posting_date)}</TableCell>
                          <TableCell>
                            <Badge
                              label={entry.entry_type}
                              style={
                                entry.entry_type === "ACQUISITION"
                                  ? { color: "var(--accent)", borderColor: "var(--accent)", backgroundColor: "var(--surface-raised)" }
                                  : entry.entry_type === "AMORTIZATION"
                                  ? { color: "var(--warning)", borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)" }
                                  : entry.entry_type === "TRANSFORMATION" || entry.entry_type === "DISPOSAL"
                                  ? { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" }
                                  : { color: "var(--text-secondary)", borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" }
                              }
                            />
                          </TableCell>
                          <TableCell style={S.primary} className="font-mono text-xs">{entry.document_no || "—"}</TableCell>
                          <TableCell style={S.muted}>{entry.quantity ? Number(entry.quantity).toFixed(0) : "1"}</TableCell>
                          <TableCell className="text-right font-medium" style={Number(entry.cost_amount) < 0 ? S.danger : S.primary}>
                            ₹{Number(entry.cost_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell style={S.muted}>{entry.status || "ACTIVE"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Lineage / Pedigree tab ── */}
          {detailTab === "lineage" && (
            <div>
              {lineageError && <div className="mb-4"><InlineAlert variant="danger">{lineageError}</InlineAlert></div>}

              {lineageLoading ? (
                <div className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" style={S.muted} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-semibold" style={S.primary}>
                      Ancestors ({lineage?.ancestors.length || 0})
                    </p>
                    {(!lineage || lineage.ancestors.length === 0) ? (
                      <p className="text-xs" style={S.muted}>No sire/dam recorded.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {lineage.ancestors.map((a) => (
                          <li key={a.animal_id} className="rounded-[var(--radius-sm)] border p-2 text-xs" style={S.raised}>
                            <span className="font-mono font-semibold" style={S.primary}>{a.animal_code}</span>{" "}
                            <span style={S.muted}>
                              ({a.gender === "F" ? "Dam" : "Sire"}, gen {a.depth}
                              {a.breeding_tier ? `, ${a.breeding_tier}` : ""})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold" style={S.primary}>
                      Descendants ({lineage?.descendants.length || 0})
                    </p>
                    {(!lineage || lineage.descendants.length === 0) ? (
                      <p className="text-xs" style={S.muted}>No offspring recorded.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {lineage.descendants.map((d) => (
                          <li key={d.animal_id} className="rounded-[var(--radius-sm)] border p-2 text-xs" style={S.raised}>
                            <span className="font-mono font-semibold" style={S.primary}>{d.animal_code}</span>{" "}
                            <span style={S.muted}>
                              (gen {d.depth}{d.breeding_tier ? `, ${d.breeding_tier}` : ""})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Dialog>
      )}

      {/* ═══ Edit Animal Modal — corrects mistakes on an already-registered animal ═══ */}
      {viewing && (
        <Dialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Edit: ${viewing.animal_code}`}
          description="Corrects registration mistakes — breed, DOB, tags, lineage, breeding tier, condition, notes."
          maxWidth="lg"
          footer={
            <>
              <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={editSaving}>Cancel</Button>
              <Button id="animal-edit-save-btn" onClick={handleEditSave} disabled={editSaving}>
                {editSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Changes"}
              </Button>
            </>
          }
        >
          {editError && <div className="mb-4"><InlineAlert variant="danger">{editError}</InlineAlert></div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="nf-label" htmlFor="ea-breed">Breed</label>
              <select id="ea-breed" className={inputCls} value={editForm.breed_id || ""} onChange={(e) => setEditForm((f) => ({ ...f, breed_id: e.target.value }))}>
                <option value="">— unchanged —</option>
                {editBreeds.map((b) => <option key={b.breed_id} value={b.breed_id}>{b.breed_name}</option>)}
              </select>
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-dob">Date of Birth</label>
              <input id="ea-dob" type="date" className={inputCls} value={editForm.dob || ""} onChange={(e) => setEditForm((f) => ({ ...f, dob: e.target.value }))} />
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-ear-tag">Ear Tag</label>
              <input id="ea-ear-tag" type="text" className={inputCls} placeholder="Visual tag number" value={editForm.ear_tag || ""} onChange={(e) => setEditForm((f) => ({ ...f, ear_tag: e.target.value }))} />
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-rfid">RFID Tag</label>
              <input id="ea-rfid" type="text" className={inputCls} placeholder="RFID scan number (unique)" value={editForm.rfid_tag || ""} onChange={(e) => setEditForm((f) => ({ ...f, rfid_tag: e.target.value }))} />
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-breeding-tier">Breeding Tier</label>
              <select id="ea-breeding-tier" className={inputCls} value={editForm.breeding_tier || ""} onChange={(e) => setEditForm((f) => ({ ...f, breeding_tier: e.target.value }))}>
                <option value="">— not set —</option>
                <option value="GGP">GGP (Great-Grandparent / Nucleus)</option>
                <option value="GP">GP (Grandparent)</option>
                <option value="PS">PS (Parent Stock)</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-status">Condition Status</label>
              <select id="ea-status" className={inputCls} value={editForm.status || ""} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="">— unchanged —</option>
                {EDITABLE_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-sire">Sire (father)</label>
              <select id="ea-sire" className={inputCls} value={editForm.sire_animal_id || ""} onChange={(e) => setEditForm((f) => ({ ...f, sire_animal_id: e.target.value }))}>
                <option value="">— not set —</option>
                {rows.filter((a) => a.gender === "M" && a.animal_id !== viewing.animal_id).map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>{a.animal_code}{a.ear_tag ? ` (${a.ear_tag})` : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="nf-label" htmlFor="ea-dam">Dam (mother)</label>
              <select id="ea-dam" className={inputCls} value={editForm.dam_animal_id || ""} onChange={(e) => setEditForm((f) => ({ ...f, dam_animal_id: e.target.value }))}>
                <option value="">— not set —</option>
                {rows.filter((a) => a.gender === "F" && a.animal_id !== viewing.animal_id).map((a) => (
                  <option key={a.animal_id} value={a.animal_id}>{a.animal_code}{a.ear_tag ? ` (${a.ear_tag})` : ""}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="nf-label" htmlFor="ea-notes">Notes</label>
              <textarea id="ea-notes" className={inputCls} rows={2} value={editForm.notes || ""} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </Dialog>
      )}

      {/* ═══ Log Dose Modal ════════════════════════════════════════════════════ */}
      <Dialog
        open={doseOpen}
        onClose={() => setDoseOpen(false)}
        title="Log Medication / Vaccine Dose"
        description="Records an administration event and updates the withdrawal-period timer for slaughter eligibility."
        maxWidth="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDoseOpen(false)} disabled={doseSaving}>Cancel</Button>
            <Button id="animal-dose-save-btn" onClick={handleLogDose} disabled={doseSaving}>
              {doseSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Log Dose"}
            </Button>
          </>
        }
      >
        {doseError && <div className="mb-4"><InlineAlert variant="danger">{doseError}</InlineAlert></div>}

        <div className="space-y-4">
          <div>
            <label className="nf-label" htmlFor="dose-item">Medicine / Vaccine *</label>
            <select id="dose-item" className={inputCls} value={doseForm.item_id} onChange={(e) => setDoseForm((f) => ({ ...f, item_id: e.target.value }))}>
              <option value="">— select —</option>
              {medItems.map((i) => (
                <option key={i.item_id} value={i.item_id}>
                  {i.item_name}{i.withdrawal_days != null ? ` (${i.withdrawal_days}d withdrawal)` : ""}
                </option>
              ))}
            </select>
            {medItems.length === 0 && (
              <p className="mt-1 text-xs" style={S.muted}>No MEDICINE or VACCINE items found. Add them in Master Data → Items first.</p>
            )}
          </div>

          <div>
            <label className="nf-label" htmlFor="dose-date">Date Administered *</label>
            <input id="dose-date" type="date" className={inputCls} value={doseForm.administered_date} onChange={(e) => setDoseForm((f) => ({ ...f, administered_date: e.target.value }))} />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="nf-label" htmlFor="dose-qty">Quantity</label>
              <input id="dose-qty" type="number" min="0" step="0.001" className={inputCls} placeholder="e.g. 2.5" value={doseForm.dose_qty} onChange={(e) => setDoseForm((f) => ({ ...f, dose_qty: e.target.value }))} />
            </div>
            <div className="w-28">
              <label className="nf-label" htmlFor="dose-uom">UOM</label>
              <select id="dose-uom" className={inputCls} value={doseForm.uom} onChange={(e) => setDoseForm((f) => ({ ...f, uom: e.target.value }))}>
                <option value="">—</option>
                {uoms.map((u) => <option key={u.uom_id || u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="nf-label" htmlFor="dose-by">Administered By</label>
            <input id="dose-by" type="text" className={inputCls} placeholder="Vet / handler name (free text)" value={doseForm.administered_by} onChange={(e) => setDoseForm((f) => ({ ...f, administered_by: e.target.value }))} />
          </div>

          <div>
            <label className="nf-label" htmlFor="dose-notes">Notes</label>
            <textarea id="dose-notes" className={inputCls} rows={2} value={doseForm.notes} onChange={(e) => setDoseForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Dialog>

      {/* ═══ Dispose Modal ═════════════════════════════════════════════════════ */}
      <Dialog
        open={disposeOpen}
        onClose={() => setDisposeOpen(false)}
        title={`Dispose Animal${viewing ? ` — ${viewing.animal_code}` : ""}`}
        description="This is a permanent exit from the register. The animal record is kept for audit."
        maxWidth="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDisposeOpen(false)} disabled={disposeSaving}>Cancel</Button>
            <Button id="animal-dispose-confirm-btn" variant="destructive" onClick={handleDispose} disabled={disposeSaving}>
              {disposeSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : "Confirm Disposal"}
            </Button>
          </>
        }
      >
        {/* Structured withdrawal warning — shown instead of generic error when it's that specific error */}
        {disposeError && disposeIsWithdrawal
          ? <WithdrawalWarning message={disposeError} />
          : disposeError
            ? <div className="mb-4"><InlineAlert variant="danger">{disposeError}</InlineAlert></div>
            : null
        }

        {/* Show a proactive hint when slaughter is selected, before the user submits */}
        {disposeForm.disposal_type === "SLAUGHTERED" && !disposeError && (
          <div className="mb-4 rounded-[var(--radius-md)] border p-3 text-xs" style={S.warning}>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Slaughter is blocked if any medicine withdrawal period has not elapsed. Check the Medication Log tab to confirm clearance before proceeding.</span>
            </div>
          </div>
        )}

        <div className="space-y-4 mt-1">
          <div>
            <label className="nf-label" htmlFor="dispose-type">Disposal Type *</label>
            <select id="dispose-type" className={inputCls} value={disposeForm.disposal_type} onChange={(e) => { setDisposeForm((f) => ({ ...f, disposal_type: e.target.value })); setDisposeError(""); setDisposeIsWithdrawal(false); }}>
              {DISPOSAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="nf-label" htmlFor="dispose-date">Date *</label>
            <input id="dispose-date" type="date" className={inputCls} value={disposeForm.disposal_date} onChange={(e) => setDisposeForm((f) => ({ ...f, disposal_date: e.target.value }))} />
          </div>

          <div>
            <label className="nf-label" htmlFor="dispose-value">Disposal Value (sale/salvage)</label>
            <input id="dispose-value" type="number" min="0" step="0.01" className={inputCls} placeholder="0.00" value={disposeForm.disposal_value} onChange={(e) => setDisposeForm((f) => ({ ...f, disposal_value: e.target.value }))} />
          </div>

          <div>
            <label className="nf-label" htmlFor="dispose-notes">Notes</label>
            <textarea id="dispose-notes" className={inputCls} rows={2} value={disposeForm.notes} onChange={(e) => setDisposeForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>
      </Dialog>

      {/* ── RFID / Barcode Fast Scanner Modal ── */}
      <RfidScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onAnimalUpdated={load}
        medItems={medItems}
      />

      {/* ── Animal Stage & Pen Transition Modal ── */}
      <AnimalStageTransitionModal
        open={transitionOpen}
        onClose={() => setTransitionOpen(false)}
        animal={transitionAnimal}
        onSuccess={() => {
          load();
          setViewing(null);
        }}
        stages={stages}
        locations={locations}
        batches={batches}
      />
    </div>
  );
}
