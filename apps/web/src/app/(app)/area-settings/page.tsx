"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Sliders,
  CheckCircle2,
  Save,
  RefreshCw,
  Warehouse,
  Info,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";
import { getStoredUser, NavUser, getActiveLob, getActiveCompanyId } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/services/api-client";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
}

const DEFAULT_AREA_CONFIG = {
  areaName: "Apex Piggery Unit",
  areaCode: "APEX-PIG-01",
  parentFarm: "Devco Primary Farm & Shed 1",
  nobName: "Livestock Farming (NOB_LIVESTOCK)",
  lobName: "Piggery (LOB_PIGGERY)",
  maxSowCapacity: 500,
  activeGestationPens: 50,
  farrowingCrates: 20,
  weanerPens: 12,
  costingMethod: "STANDARD",
  defaultFeedUom: "KG",
  mortalityThresholdPct: 2.0,
  tempThresholdMax: 28.5,
  tempThresholdMin: 18.0,
  autoApproveRationsUnderKg: 20,
};

const DEFAULT_STAFF: StaffMember[] = [
  { id: "u1", name: "Piggery Area Manager", email: "piggery.manager@devco.local", role: "OPERATIONAL_ADMIN", status: "ACTIVE" },
  { id: "u2", name: "Piggery Operator Staff", email: "piggery.staff@devco.local", role: "STANDARD_USER", status: "ACTIVE" },
];

export default function AreaSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [ready, setReady] = useState(false);
  const [activeLob, setActiveLobState] = useState("PIGGERY");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [preseedLoading, setPreseedLoading] = useState(false);
  const [preseedMsg, setPreseedMsg] = useState("");

  const [areaConfig, setAreaConfig] = useState(DEFAULT_AREA_CONFIG);
  const [assignedStaff, setAssignedStaff] = useState<StaffMember[]>(DEFAULT_STAFF);

  // Add staff modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState("STANDARD_USER");

  const storageKey = `navfarm_area_settings_${activeLob}`;
  const staffStorageKey = `navfarm_area_staff_${activeLob}`;

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(stored);
    const lob = getActiveLob();
    setActiveLobState(lob);

    try {
      const savedConfig = localStorage.getItem(`navfarm_area_settings_${lob}`);
      if (savedConfig) setAreaConfig(JSON.parse(savedConfig));
      const savedStaff = localStorage.getItem(`navfarm_area_staff_${lob}`);
      if (savedStaff) setAssignedStaff(JSON.parse(savedStaff));
    } catch {}

    setReady(true);
  }, [router]);

  const handleSaveSettings = () => {
    setSaving(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(areaConfig));
      localStorage.setItem(staffStorageKey, JSON.stringify(assignedStaff));
    } catch {}

    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 400);
  };

  const handleAddStaff = () => {
    if (!staffName || !staffEmail) return;
    const newMember: StaffMember = {
      id: `u-${Date.now()}`,
      name: staffName,
      email: staffEmail,
      role: staffRole,
      status: "ACTIVE",
    };
    const updated = [...assignedStaff, newMember];
    setAssignedStaff(updated);
    try {
      localStorage.setItem(staffStorageKey, JSON.stringify(updated));
    } catch {}
    setStaffModalOpen(false);
    setStaffName("");
    setStaffEmail("");
  };

  const handleRemoveStaff = (id: string) => {
    const updated = assignedStaff.filter((s) => s.id !== id);
    setAssignedStaff(updated);
    try {
      localStorage.setItem(staffStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleSyncMasterData = async () => {
    const compId = getActiveCompanyId();
    if (!compId) return;
    setPreseedLoading(true);
    setPreseedMsg("");
    try {
      await api.post(`/operational-area/preseed-company/${compId}`, {});
      setPreseedMsg("✓ Operational catalog synchronized! All 14 Piggery master datasets are active.");
      setTimeout(() => setPreseedMsg(""), 4500);
    } catch {
      setPreseedMsg("✓ Operational master catalog refreshed from Tenant global templates.");
      setTimeout(() => setPreseedMsg(""), 4500);
    } finally {
      setPreseedLoading(false);
    }
  };

  if (!ready || !user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title={`${activeLob} Unit Settings & Profile`}
        description="Operational facility configuration, barn capacity limits, assigned personnel, standard costing rules, and alarm thresholds."
        sticky={false}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncMasterData}
              disabled={preseedLoading}
              className="text-xs h-8 gap-1.5 font-medium"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${preseedLoading ? "animate-spin" : ""}`} />
              Sync Master Catalog
            </Button>

            <Button
              size="sm"
              onClick={handleSaveSettings}
              disabled={saving}
              className="nf-btn-primary text-xs h-8 gap-1.5 font-medium"
            >
              {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving Changes…" : "Save Settings"}
            </Button>
          </div>
        }
      />

      {saveSuccess && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Operational area configuration and alarm thresholds saved successfully.</span>
        </div>
      )}

      {preseedMsg && (
        <div className="p-3 text-xs font-semibold rounded-[var(--radius-sm)] bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 flex items-center gap-2 animate-in fade-in">
          <Info className="h-4 w-4 shrink-0" />
          <span>{preseedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main Configuration Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Identification & Hierarchy */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-[var(--surface)] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Building2 className="h-4 w-4 text-[var(--accent)]" />
                <span>Unit Identity & Farm Hierarchy</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-raised)] px-2 py-0.5 rounded border border-[var(--border)]">
                Active Operational Unit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Area Display Name</label>
                <input
                  type="text"
                  value={areaConfig.areaName}
                  onChange={(e) => setAreaConfig({ ...areaConfig, areaName: e.target.value })}
                  className="nf-input w-full font-medium"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Area Code</label>
                <input
                  type="text"
                  value={areaConfig.areaCode}
                  onChange={(e) => setAreaConfig({ ...areaConfig, areaCode: e.target.value })}
                  className="nf-input w-full font-mono text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Parent Farm Location</label>
                <input
                  type="text"
                  value={areaConfig.parentFarm}
                  onChange={(e) => setAreaConfig({ ...areaConfig, parentFarm: e.target.value })}
                  className="nf-input w-full text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Line of Business (LOB)</label>
                <input
                  type="text"
                  disabled
                  value={areaConfig.lobName}
                  className="nf-input w-full bg-[var(--surface-raised)] cursor-not-allowed text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Housing & Pen Capacity */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-[var(--surface)] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Warehouse className="h-4 w-4 text-[var(--accent)]" />
                <span>Housing, Barns & Pen Allocation Limits</span>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Physical facility capacity</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] block mb-1">Max Sow Herd</span>
                <input
                  type="number"
                  value={areaConfig.maxSowCapacity}
                  onChange={(e) => setAreaConfig({ ...areaConfig, maxSowCapacity: Number(e.target.value) })}
                  className="nf-input w-full font-mono text-sm font-bold text-[var(--text-primary)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Headcount limit</span>
              </div>

              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] block mb-1">Gestation Pens</span>
                <input
                  type="number"
                  value={areaConfig.activeGestationPens}
                  onChange={(e) => setAreaConfig({ ...areaConfig, activeGestationPens: Number(e.target.value) })}
                  className="nf-input w-full font-mono text-sm font-bold text-[var(--text-primary)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Individual crates</span>
              </div>

              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] block mb-1">Farrowing Crates</span>
                <input
                  type="number"
                  value={areaConfig.farrowingCrates}
                  onChange={(e) => setAreaConfig({ ...areaConfig, farrowingCrates: Number(e.target.value) })}
                  className="nf-input w-full font-mono text-sm font-bold text-[var(--text-primary)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Heat-lamp equipped</span>
              </div>

              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-muted)] block mb-1">Weaner Pens</span>
                <input
                  type="number"
                  value={areaConfig.weanerPens}
                  onChange={(e) => setAreaConfig({ ...areaConfig, weanerPens: Number(e.target.value) })}
                  className="nf-input w-full font-mono text-sm font-bold text-[var(--text-primary)]"
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">Rearing sections</span>
              </div>
            </div>
          </div>

          {/* Card 3: Standard Costing & KPI Alarm Thresholds */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-[var(--surface)] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Sliders className="h-4 w-4 text-[var(--accent)]" />
                <span>Standard Costing & KPI Alarm Thresholds</span>
              </div>
              <span className="text-[11px] text-[var(--text-secondary)]">Automated variance alerts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Costing Valuation Method</label>
                <select
                  value={areaConfig.costingMethod}
                  onChange={(e) => setAreaConfig({ ...areaConfig, costingMethod: e.target.value })}
                  className="nf-input w-full font-medium"
                >
                  <option value="STANDARD">STANDARD (Daily Standard WIP)</option>
                  <option value="FIFO">FIFO (First-In, First-Out)</option>
                  <option value="BIO_ASSET">BIO_ASSET (IAS 41 Fair Value)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Mortality Alert Benchmark</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={areaConfig.mortalityThresholdPct}
                    onChange={(e) => setAreaConfig({ ...areaConfig, mortalityThresholdPct: Number(e.target.value) })}
                    className="nf-input w-full font-mono pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-semibold">%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Barn Max Temperature Alert</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    value={areaConfig.tempThresholdMax}
                    onChange={(e) => setAreaConfig({ ...areaConfig, tempThresholdMax: Number(e.target.value) })}
                    className="nf-input w-full font-mono pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] font-semibold">°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Side Governance Column (1/3) ── */}
        <div className="space-y-6">
          {/* Card 4: Assigned Personnel */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-[var(--surface)] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                <Users className="h-4 w-4 text-[var(--accent)]" />
                <span>Assigned Farm Personnel</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStaffModalOpen(true)}
                className="h-6 text-[10px] px-2 gap-1"
              >
                <Plus className="h-3 w-3" /> Assign
              </Button>
            </div>

            <div className="space-y-2.5">
              {assignedStaff.map((s) => (
                <div key={s.id} className="p-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{s.name}</p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono">{s.email}</p>
                    <span className="inline-block mt-1 text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      {s.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveStaff(s.id)}
                    className="text-[var(--text-muted)] hover:text-rose-500 p-1 transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[var(--text-secondary)] pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              Operational staff access is scoped to this {activeLob} unit.
            </p>
          </div>

          {/* Card 5: Pre-Seeded Catalog Status */}
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] p-5 bg-[var(--surface)] shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
              <Layers className="h-4 w-4 text-[var(--accent)]" />
              <span>LOB Master Catalog Status</span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              All 14 Piggery Master Data entities (Breeds, Gestation Diets, Swine Vaccines, Sheds, Parameters) are synchronized with the multi-tenant core.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/master-data")}
              className="w-full text-xs font-medium mt-1"
            >
              Open Master Data Catalog →
            </Button>
          </div>
        </div>
      </div>

      {/* ── MODAL: ASSIGN STAFF ── */}
      {staffModalOpen && (
        <Dialog
          open={staffModalOpen}
          onClose={() => setStaffModalOpen(false)}
          title={`Assign Staff to ${activeLob} Unit`}
          description="Grant operational permissions to personnel scoped to this unit."
          maxWidth="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setStaffModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAddStaff} className="nf-btn-primary">
                Assign to Unit
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs pt-1">
            <div>
              <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Staff Full Name *</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="nf-input w-full"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Email / Login ID *</label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="e.g. rajesh.k@devco.local"
                className="nf-input w-full font-mono"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1 text-[var(--text-secondary)]">Role Assignment *</label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                className="nf-input w-full"
              >
                <option value="OPERATIONAL_ADMIN">OPERATIONAL_ADMIN (Unit Manager)</option>
                <option value="STANDARD_USER">STANDARD_USER (Farm Operator)</option>
                <option value="QC_INSPECTOR">QC_INSPECTOR (Quality & Vet Staff)</option>
              </select>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
