"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Filter,
  ChevronRight,
  Activity,
  Layers,
  ArrowUpRight,
  Wheat,
  Building2,
  DollarSign,
} from "lucide-react";
import { api } from "../../../services/api-client";
import {
  getStoredUser,
  getStoredToken,
  getStoredTenantId,
  getActiveCompanyId,
  setActiveCompanyId,
  getActiveWorkspaceScope,
  setActiveWorkspaceScope,
  getActiveLob,
  setActiveLob,
  setActiveOperationalAreaId,
  WorkspaceScope,
  NavUser,
} from "../../../hooks/useAuth";
import { LoadingState, ErrorState } from "../../../components/ui/states";
import { PageHeader } from "../../../components/ui/PageHeader";
import DairyLifecycleStepper from "../../../components/console/dairy/dairy-lifecycle-stepper";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<NavUser | null>(null);
  const [scope, setScope] = useState<WorkspaceScope>("COMPANY");
  const [activeLob, setActiveLobState] = useState<string>("PIGGERY");
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [operationalAreas, setOperationalAreas] = useState<any[]>([]);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [filterTenantCompany, setFilterTenantCompany] = useState<string>("ALL");
  const [filterLob, setFilterLob] = useState<string>("ALL");
  const [filterArea, setFilterArea] = useState<string>("ALL");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tenantId = getStoredTenantId();
    if (!token || !storedUser || !tenantId) {
      router.replace("/");
      return;
    }
    const currentScope = getActiveWorkspaceScope();
    const currentLob = getActiveLob();
    const compId = getActiveCompanyId() || storedUser.companyId || (storedUser as any).company_id || "";

    setUser(storedUser);
    setScope(currentScope);
    setActiveLobState(currentLob);
    setActiveCompanyIdState(compId);

    loadDashboard(storedUser, tenantId, compId, currentScope);
  }, [router]);

  const loadDashboard = async (storedUser: NavUser, tenantId: string, compId: string, currentScope: WorkspaceScope = getActiveWorkspaceScope()) => {
    setLoading(true);
    try {
      // The tenant record and the full cross-tenant company list are only
      // ever rendered in TENANT scope — for COMPANY/OPERATIONAL scope the
      // active company's name/id is already in storedUser.companies, so
      // skip both tenant-wide calls instead of syncing data nothing reads.
      const isTenantScope = currentScope === "TENANT";
      const [tenant, compRes, areasRes, batchRes, animalRes] = await Promise.all([
        isTenantScope ? api.get(`/tenant/${tenantId}`).catch(() => null) : Promise.resolve(null),
        isTenantScope ? api.get(`/company/tenant/${tenantId}`).catch(() => []) : Promise.resolve(storedUser.companies || []),
        api.get(`/operational-area${compId && currentScope !== "TENANT" ? `?company_id=${compId}` : ""}`).catch(() => []),
        api.get(`/batch${compId && currentScope !== "TENANT" ? `?companyId=${compId}` : ""}&limit=100`).catch(() => []),
        api.get(`/animal${compId && currentScope !== "TENANT" ? `?companyId=${compId}` : ""}&limit=500`).catch(() => []),
      ]);

      setTenantInfo(tenant);
      if (Array.isArray(compRes)) setCompanies(compRes);
      if (Array.isArray(areasRes)) setOperationalAreas(areasRes);
      setBatches(Array.isArray(batchRes) ? batchRes : (batchRes?.data ?? []));
      setAnimals(Array.isArray(animalRes) ? animalRes : (animalRes?.data ?? []));
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading live farm telemetry…" />;

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={() => user && loadDashboard(user, getStoredTenantId() || "", activeCompanyId, scope)} />
      </div>
    );
  }

  // Active Company Record
  const activeCompany = companies.find((c) => c.company_id === activeCompanyId) || companies[0];

  // Dynamic LOB options for filter
  const availableLobs = Array.from(
    new Set(
      operationalAreas
        .filter((a) => scope === "TENANT" || !activeCompanyId || a.company_id === activeCompanyId)
        .map((a) => a.lob_code || a.lob_name || "PIGGERY")
    )
  );

  // Switch to an operational area
  const handleEnterArea = (area: any) => {
    setActiveCompanyId(area.company_id);
    setActiveOperationalAreaId(area.area_id);
    setActiveWorkspaceScope("OPERATIONAL");
    const lobResolved = area.lob_code?.includes("DAIRY") || area.area_name?.toLowerCase().includes("dairy") ? "DAIRY" : "PIGGERY";
    setActiveLob(lobResolved);
    window.location.href = "/console/dashboard";
  };

  // Switch to a company
  const handleEnterCompany = (comp: any) => {
    setActiveCompanyId(comp.company_id);
    setActiveOperationalAreaId(null);
    setActiveWorkspaceScope("COMPANY");
    window.location.href = "/console/dashboard";
  };  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-7 space-y-6" style={{ color: "var(--text-primary)" }}>
      {/* ── Top Header Bar & Scope-Specific Title & Filters ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <PageHeader
            title={
              scope === "TENANT"
                ? `${tenantInfo?.tenant_name || "Enterprise"} Executive Overview`
                : scope === "COMPANY"
                ? `${activeCompany?.company_name || "Company"} Performance`
                : `${activeLob} Unit Operations`
            }
            description={
              scope === "TENANT"
                ? "Consolidated multi-entity livestock inventory, live batch WIP valuations, and entity matrix."
                : scope === "COMPANY"
                ? "Commercial operations, active batches, headcount records, and operational units."
                : activeLob === "DAIRY"
                ? "Milking yields, butterfat and SNF metrics, cold chain chiller status, and feeding rations."
                : "Swine gestation timelines, feeding allocations, farrowing benchmarks, and herd health."
            }
            sticky={false}
          />
        </div>

        {/* ── Filters Bar ── */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tenant Scope Filters: Company + LOB */}
          {scope === "TENANT" && (
            <>
              {companies.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <Building2 className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <span style={{ color: "var(--text-secondary)" }}>Company:</span>
                  <select
                    value={filterTenantCompany}
                    onChange={(e) => setFilterTenantCompany(e.target.value)}
                    className="bg-transparent font-semibold outline-none cursor-pointer"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <option value="ALL">All Companies ({companies.length})</option>
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availableLobs.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <Filter className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <span style={{ color: "var(--text-secondary)" }}>LOB:</span>
                  <select
                    value={filterLob}
                    onChange={(e) => setFilterLob(e.target.value)}
                    className="bg-transparent font-semibold outline-none cursor-pointer"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <option value="ALL">All LOBs ({availableLobs.length})</option>
                    {availableLobs.map((lob) => (
                      <option key={lob} value={lob}>
                        {lob}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Company Scope Filters: LOB + Area */}
          {scope === "COMPANY" && availableLobs.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <Filter className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                <span style={{ color: "var(--text-secondary)" }}>LOB:</span>
                <select
                  value={filterLob}
                  onChange={(e) => setFilterLob(e.target.value)}
                  className="bg-transparent font-semibold outline-none cursor-pointer"
                  style={{ color: "var(--text-primary)" }}
                >
                  <option value="ALL">All Company LOBs ({availableLobs.length})</option>
                  {availableLobs.map((lob) => (
                    <option key={lob} value={lob}>
                      {lob}
                    </option>
                  ))}
                </select>
              </div>

              {operationalAreas.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <Layers className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                  <span style={{ color: "var(--text-secondary)" }}>Unit:</span>
                  <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="bg-transparent font-semibold outline-none cursor-pointer"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <option value="ALL">All Units ({operationalAreas.length})</option>
                    {operationalAreas.map((a) => (
                      <option key={a.area_id} value={a.area_id}>
                        {a.area_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Operational Area Badge */}
          {scope === "OPERATIONAL" && (
            <div className="flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: "var(--surface-raised)", border: "1px solid var(--border)" }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--success)" }} />
              <span>Unit: {activeLob}</span>
            </div>
          )}

          <button
            onClick={() => user && loadDashboard(user, getStoredTenantId() || "", activeCompanyId, scope)}
            className="nf-press flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--surface-raised)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            title="Refresh live telemetry"
          >
            <Activity className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── 1. TENANT SCOPE DASHBOARD (Group Multi-Entity Command Center) ── */}
      {/* ========================================================================= */}
      {scope === "TENANT" && (
        <div className="space-y-6">
          {/* 4 Group KPI Stat Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => router.push("/console/companies")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Operating Companies
                </span>
                <Building2 className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">{companies.length}</span>
                <span className="text-xs font-medium" style={{ color: "var(--success)" }}>Active</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>{companies.map(c => c.company_name).slice(0, 2).join(", ") || "Configured Entities"}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>

            <div
              onClick={() => router.push("/console/piggery")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Biological Census
                </span>
                <Activity className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">
                  {animals.length > 0 ? animals.length : batches.reduce((sum, b) => sum + (Number(b.closing_quantity) || Number(b.opening_quantity) || 0), 0)}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Head Count</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Across {batches.length} Production Batches</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>

            <div
              onClick={() => router.push("/console/production?tab=batches")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Active Batches
                </span>
                <Layers className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">
                  {batches.filter(b => b.status === "ACTIVE" || !b.status).length}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>In Progress</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>{operationalAreas.length} Operational Units</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>

            <div
              onClick={() => router.push("/console/finance")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Group Batch Valuation
                </span>
                <DollarSign className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">
                  ₹ {batches.reduce((sum, b) => sum + (Number(b.wip_value) || 0), 0).toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>WIP</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Standard Direct Cost Allocation</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>
          </div>

          {/* Tenant Executive Multi-Company Benchmark Table */}
          <div className="rounded-[var(--radius-md)] border p-5 space-y-4" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Entity Performance & Operational Matrix</h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Comparative overview across legal entities and operational units.
                </p>
              </div>
              <Link href="/console/companies" className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: "var(--accent)" }}>
                View All Companies <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b text-[11px] font-semibold uppercase" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                    <th className="pb-2.5">Company Legal Entity</th>
                    <th className="pb-2.5">Nature of Business</th>
                    <th className="pb-2.5">Operating Units</th>
                    <th className="pb-2.5 text-right">Batches</th>
                    <th className="pb-2.5 text-right">Population</th>
                    <th className="pb-2.5 text-right">Status</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {companies.map((comp) => {
                    const compAreas = operationalAreas.filter((a) => a.company_id === comp.company_id);
                    const compAnimals = animals.filter((a) => a.company_id === comp.company_id);
                    const compBatches = batches.filter((b) => b.company_id === comp.company_id);
                    const compHeadcount = compAnimals.length > 0
                      ? compAnimals.length
                      : compBatches.reduce((sum, b) => sum + (Number(b.closing_quantity) || Number(b.opening_quantity) || 0), 0);

                    return (
                      <tr key={comp.company_id} className="hover:bg-[var(--surface-raised)] transition-colors">
                        <td className="py-3 font-semibold" style={{ color: "var(--text-primary)" }}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
                            <span>{comp.company_name}</span>
                          </div>
                        </td>
                        <td className="py-3" style={{ color: "var(--text-secondary)" }}>{comp.nob_name || "Livestock Farming"}</td>
                        <td className="py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {compAreas.length > 0 ? (
                              compAreas.map((a) => (
                                <span key={a.area_id} className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-medium border" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                                  {a.area_name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>No Units</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">{compBatches.length}</td>
                        <td className="py-3 text-right font-mono font-semibold">{compHeadcount} Head</td>
                        <td className="py-3 text-right">
                          <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-medium border" style={{ backgroundColor: "var(--success-muted)", borderColor: "var(--success)", color: "var(--success)" }}>
                            Active
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleEnterCompany(comp)}
                            className="nf-press rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: "var(--accent)" }}
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── 2. COMPANY SCOPE DASHBOARD (Legal Entity Overview & Units) ── */}
      {/* ========================================================================= */}
      {scope === "COMPANY" && (
        <div className="space-y-6">
          {/* 4 Company KPI Stat Strips */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => router.push("/console/operational-areas")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Operational Units
                </span>
                <Layers className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">{operationalAreas.length}</span>
                <span className="text-xs font-medium" style={{ color: "var(--success)" }}>Configured</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>{operationalAreas.map(a => a.area_name).join(", ") || "Active Units"}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>

            <div
              onClick={() => router.push("/console/piggery")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Biological Population
                </span>
                <Activity className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">
                  {animals.length > 0 ? animals.length : batches.reduce((sum, b) => sum + (Number(b.closing_quantity) || Number(b.opening_quantity) || 0), 0)}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Head Count</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>{animals.length} Identified Animal Records</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>

            <div
              onClick={() => router.push("/console/production?tab=batches")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Production Batches
                </span>
                <Layers className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">
                  {batches.filter(b => b.status === "ACTIVE" || !b.status).length}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Batches</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Active Lifecycle Progression</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>

            <div
              onClick={() => router.push("/console/finance")}
              className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Active Batch WIP
                </span>
                <DollarSign className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight font-mono">
                  ₹ {batches.reduce((sum, b) => sum + (Number(b.wip_value) || 0), 0).toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>WIP</span>
              </div>
              <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                <span>Live Batch WIP Valuation</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
              </p>
            </div>
          </div>

          {/* Operational Area Cards */}
          <div className="rounded-[var(--radius-md)] border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Operational Units ({operationalAreas.length})</h2>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Line of business units for {activeCompany?.company_name}.
                </p>
              </div>
              <Link href="/console/operational-areas" className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: "var(--accent)" }}>
                Manage Units <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {operationalAreas.map((area) => {
                const isPig = area.lob_code?.includes("PIG") || area.area_name?.toLowerCase().includes("pig");
                const isDairy = area.lob_code?.includes("DAIRY") || area.area_name?.toLowerCase().includes("dairy");
                return (
                  <div
                    key={area.area_id}
                    className="flex flex-col justify-between rounded-[var(--radius-sm)] border p-4 transition-all hover:bg-[var(--surface)]"
                    style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold" style={{ color: "var(--accent)" }}>{area.area_code}</span>
                        <span className="rounded-[var(--radius-pill)] px-2 py-0.5 text-[10px] font-medium border" style={{ backgroundColor: "var(--success-muted)", borderColor: "var(--success)", color: "var(--success)" }}>
                          Active
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {area.area_name}
                      </h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {isPig ? "Swine Rearing, Gestation & Farrowing Unit" : isDairy ? "Dairy Milking, Herd Health & Chiller Section" : "Agricultural Operational Area"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                        {isPig ? "Swine Livestock · Batch Operations" : isDairy ? "Dairy Cattle · Batch Operations" : "Production Batch"}
                      </span>
                      <button
                        onClick={() => handleEnterArea(area)}
                        className="nf-press flex items-center gap-1 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "var(--accent)" }}
                      >
                        <span>Open Unit</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ── 3. OPERATIONAL SCOPE: PIGGERY DASHBOARD ── */}
      {/* ========================================================================= */}
      {scope === "OPERATIONAL" && activeLob === "PIGGERY" && (() => {
        const activeBatch = batches.find(b => b.status === "ACTIVE") || batches[0];
        const assignedHead = Number(activeBatch?.closing_quantity) || Number(activeBatch?.opening_quantity) || (animals.length > 0 ? animals.length : 0);

        return (
          <div className="space-y-6">
            {/* 4 Piggery Operational Stat Strips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => router.push("/console/piggery")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Breeding Sows & Gilts
                  </span>
                  <Activity className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight font-mono">{animals.length > 0 ? animals.length : assignedHead}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--success)" }}>Active Herd</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>{activeBatch?.breed_name || "Large White Lineage"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>

              <div
                onClick={() => router.push("/console/production?tab=batches")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Active Gestation Batch
                  </span>
                  <Layers className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight font-mono truncate" style={{ color: "var(--accent)" }}>
                    {activeBatch?.batch_no || "PIG-SOW-001"}
                  </span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Stage: {activeBatch?.current_stage_code || "ACTIVE"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>

              <div
                onClick={() => router.push("/console/production?tab=stage-consumption")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Active Batches
                  </span>
                  <Wheat className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight font-mono">{batches.length}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Batches</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Under Active Operations</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>

              <div
                onClick={() => router.push("/console/piggery")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Batch WIP Valuation
                  </span>
                  <DollarSign className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight font-mono">
                    ₹ {Number(activeBatch?.wip_value || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>WIP</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Direct Cost Allocation</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>
            </div>

            {/* Gestation Batch Progress & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-[var(--radius-md)] border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Active Sow Batch Lifecycle: {activeBatch?.batch_no || "PIG-BATCH-001"}</h3>
                    <Link href="/console/production?tab=daily-operational-entry" className="text-xs font-semibold hover:underline" style={{ color: "var(--accent)" }}>
                      Open Batch Entry →
                    </Link>
                  </div>
                  <div className="rounded-[var(--radius-sm)] border p-4 space-y-3" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                    <div className="flex justify-between text-xs">
                      <span>Current Stage: <strong>{activeBatch?.current_stage_code || "GESTATION"}</strong></span>
                      <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>Active Lifecycle</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: "65%", backgroundColor: "var(--accent)" }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs" style={{ borderColor: "var(--border)" }}>
                      <div><span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Breed</span><p className="font-semibold">{activeBatch?.breed_name || "Large White"}</p></div>
                      <div><span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Assigned Head</span><p className="font-semibold">{assignedHead} Head</p></div>
                      <div><span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Status</span><p className="font-semibold" style={{ color: "var(--success)" }}>{activeBatch?.status || "ACTIVE"}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[var(--radius-md)] border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push("/console/production?tab=daily-operational-entry")}
                      className="nf-press flex w-full items-center justify-between rounded-[var(--radius-sm)] border p-2.5 text-xs font-semibold hover:bg-[var(--surface-raised)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span>Log Daily Operations</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => router.push("/console/piggery")}
                      className="nf-press flex w-full items-center justify-between rounded-[var(--radius-sm)] border p-2.5 text-xs font-semibold hover:bg-[var(--surface-raised)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span>Animal Ear Tag Register</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* ── 4. OPERATIONAL SCOPE: DAIRY DASHBOARD ── */}
      {/* ========================================================================= */}
      {scope === "OPERATIONAL" && activeLob === "DAIRY" && (() => {
        const dairyBatches = batches.filter(b => (b.batch_no || "").includes("COW") || (b.lob_name || "").includes("DAIRY"));
        const activeDairyBatch = dairyBatches[0] || batches[0];
        const dairyHead = animals.filter(a => a.animal_type?.includes("COW") || a.breed_name?.includes("Holstein") || a.gender === "F").length || 80;

        return (
          <div className="space-y-6">
            {/* 4 Dairy Operational Stat Strips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => router.push("/console/piggery")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Total Dairy Herd
                  </span>
                  <Activity className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight font-mono">{dairyHead}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--success)" }}>Active Head</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Holstein Friesian Herd</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>

              <div
                onClick={() => router.push("/console/production?tab=daily-operational-entry")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Dairy Batches
                  </span>
                  <Layers className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight font-mono">{dairyBatches.length || 1}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Batches</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Batch: {activeDairyBatch?.batch_no || "COW-LAC-001"}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>

              <div
                onClick={() => router.push("/console/production?tab=stage-consumption")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Milk Quality Benchmark
                  </span>
                  <Activity className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight font-mono">4.15% Fat</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>8.85% SNF</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Grade A Standard</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>

              <div
                onClick={() => router.push("/console/inventory")}
                className="nf-press group rounded-[var(--radius-md)] border p-5 transition-all hover:bg-[var(--surface-raised)] cursor-pointer"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Active WIP Asset
                  </span>
                  <DollarSign className="h-4 w-4" style={{ color: "var(--text-secondary)" }} />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight font-mono">
                    ₹ {Number(activeDairyBatch?.wip_value || 0).toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Valuation</span>
                </div>
                <p className="mt-2 text-xs flex items-center justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span>Biological Asset Valuation</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[var(--accent)]" />
                </p>
              </div>
            </div>

            {/* 9-Stage Dairy Stepper & Quick Actions */}
            <DairyLifecycleStepper currentStageCode={activeDairyBatch?.current_stage_code || "EARLY_LAC"} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-[var(--radius-md)] border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <h3 className="text-sm font-semibold mb-3">Today's Milking Session Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[var(--radius-sm)] border p-3.5" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                      <span className="text-[11px] uppercase font-semibold" style={{ color: "var(--text-secondary)" }}>Morning Session</span>
                      <p className="text-2xl font-bold font-mono mt-1">1,180 L</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Avg 14.75 L / cow • Fat: 4.18%</p>
                    </div>
                    <div className="rounded-[var(--radius-sm)] border p-3.5" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
                      <span className="text-[11px] uppercase font-semibold" style={{ color: "var(--text-secondary)" }}>Evening Session</span>
                      <p className="text-2xl font-bold font-mono mt-1">1,100 L</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Avg 13.75 L / cow • Fat: 4.12%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[var(--radius-md)] border p-5" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <h3 className="text-sm font-semibold mb-3">Dairy Quick Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => router.push("/console/production?tab=daily-operational-entry")}
                      className="nf-press flex w-full items-center justify-between rounded-[var(--radius-sm)] border p-2.5 text-xs font-semibold hover:bg-[var(--surface-raised)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span>Log Daily Milking & TMR Feed</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => router.push("/console/piggery")}
                      className="nf-press flex w-full items-center justify-between rounded-[var(--radius-sm)] border p-2.5 text-xs font-semibold hover:bg-[var(--surface-raised)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span>Dairy Cattle Register</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
