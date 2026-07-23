"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building, RefreshCw, AlertCircle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Search, ArrowUpRight, Eye, Plus
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";
import { Dialog } from "../../../components/ui/dialog";

const S = {
  surface:  { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  raised:   { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary:  { color: "var(--text-primary)" },
  sub:      { color: "var(--text-secondary)" },
  muted:    { color: "var(--text-muted)" },
  accent:   { color: "var(--accent)" },
  border:   { borderColor: "var(--border)" },
  input:    { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

export default function AdminTenantsPage() {
  const router = useRouter();
  const [tenants,  setTenants]  = useState<any[]>([]);
  const [plans,    setPlans]    = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [search,   setSearch]   = useState("");

  const [expandedId,        setExpandedId]        = useState<string | null>(null);
  const [expandedCompanies, setExpandedCompanies] = useState<any[]>([]);
  const [loadingCos,        setLoadingCos]        = useState(false);

  const [upgradingTenant, setUpgradingTenant] = useState<any>(null);
  const [selectedPlanId,  setSelectedPlanId]  = useState("");
  const [upgrading,       setUpgrading]       = useState(false);

  // Add Tenant Modal state
  const [showAddModal, setShowAddModal]   = useState(false);
  const [creating,     setCreating]       = useState(false);
  const [createError,  setCreateError]    = useState("");
  const [createForm,   setCreateForm]     = useState({
    tenant_code: "", tenant_name: "", tenant_type: "SME",
    plan_id: "PLAN_BASIC", billing_email: "",
    admin_name: "", admin_email: "", admin_password: "",
  });

  // NOB & LOB catalog selection state for Super Admin
  const [nobsList, setNobsList] = useState<any[]>([]);
  const [lobsByNob, setLobsByNob] = useState<Record<string, any[]>>({});
  const [selectedNobIds, setSelectedNobIds] = useState<string[]>([]);
  const [selectedLobIds, setSelectedLobIds] = useState<string[]>([]);

  useEffect(() => {
    const token = getStoredToken();
    const user  = getStoredUser();
    if (!token || !user || user.userType !== "SYSTEM_ADMIN") { router.replace("/"); return; }
    loadData();
  }, [router]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(tenants); return; }
    const q = search.toLowerCase();
    setFiltered(tenants.filter((t) =>
      t.tenant_name?.toLowerCase().includes(q) ||
      t.billing_email?.toLowerCase().includes(q) ||
      t.tenant_code?.toLowerCase().includes(q)
    ));
  }, [search, tenants]);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [tList, pList, nobsData] = await Promise.all([
        api.get("/tenant"),
        api.get("/plan"),
        api.get("/setup/wizard/nobs").catch(() => []),
      ]);
      setTenants(tList); setFiltered(tList); setPlans(pList);
      setNobsList(Array.isArray(nobsData) ? nobsData : []);

      // Pre-fetch LOBs for all NOBs
      if (Array.isArray(nobsData) && nobsData.length > 0) {
        const lobMap: Record<string, any[]> = {};
        await Promise.all(
          nobsData.map(async (nob: any) => {
            try {
              const lobs = await api.get(`/setup/wizard/lobs/${nob.nob_id}`);
              lobMap[nob.nob_id] = Array.isArray(lobs) ? lobs : [];
            } catch {
              lobMap[nob.nob_id] = [];
            }
          })
        );
        setLobsByNob(lobMap);
        // By default select all NOBs and LOBs for quick setup
        const allNobIds = nobsData.map((n: any) => n.nob_id);
        const allLobIds = Object.values(lobMap).flat().map((l: any) => l.lob_id);
        setSelectedNobIds(allNobIds);
        setSelectedLobIds(allLobIds);
      }
    } catch (e: any) { setError(e?.message || "Failed to load tenants."); }
    finally { setLoading(false); }
  };

  const handleExpand = async (tenant: any) => {
    if (expandedId === tenant.tenant_id) { setExpandedId(null); return; }
    setExpandedId(tenant.tenant_id);
    setLoadingCos(true);
    try {
      // Use the correct per-tenant endpoint
      const list = await api.get(`/tenant/${tenant.tenant_id}/companies`);
      setExpandedCompanies(Array.isArray(list) ? list : []);
    } catch { setExpandedCompanies([]); }
    finally { setLoadingCos(false); }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradingTenant || !selectedPlanId) return;
    setUpgrading(true); setError(""); setSuccess("");
    try {
      await api.post(`/tenant/${upgradingTenant.tenant_id}/change-plan`, { plan_id: selectedPlanId });
      setSuccess(`Plan updated for ${upgradingTenant.tenant_name}.`);
      setUpgradingTenant(null); setSelectedPlanId("");
      await loadData();
    } catch (err: any) { setError(err?.message || "Failed to upgrade plan."); }
    finally { setUpgrading(false); }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setCreateError(""); setSuccess("");
    try {
      await api.post("/tenant/signup", {
        ...createForm,
        allowed_nob_ids: selectedNobIds,
        allowed_lob_ids: selectedLobIds,
      });
      setSuccess(`Tenant account ${createForm.tenant_name} registered successfully!`);
      setShowAddModal(false);
      setCreateForm({
        tenant_code: "", tenant_name: "", tenant_type: "SME",
        plan_id: "PLAN_BASIC", billing_email: "",
        admin_name: "", admin_email: "", admin_password: "",
      });
      await loadData();
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create tenant.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
        <span className="text-sm" style={S.sub}>Loading tenants…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={S.primary}>Tenant Registry</h1>
          <p className="text-sm mt-0.5" style={S.sub}>{tenants.length} tenants registered on platform</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={S.muted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenants…"
              className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm sm:w-60"
              style={S.input} />
          </div>
          <button onClick={() => { setCreateError(""); setShowAddModal(true); }}
            className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: "var(--accent)" }}>
            <Plus className="w-4 h-4" /> Add Tenant
          </button>
        </div>
      </div>

      {error   && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> {success}</div>}

      <Dialog
        open={Boolean(upgradingTenant)}
        onClose={() => { if (!upgrading) { setUpgradingTenant(null); setSelectedPlanId(""); } }}
        title="Change subscription plan"
        description={upgradingTenant ? `Choose a new plan for ${upgradingTenant.tenant_name}.` : undefined}
        maxWidth="sm"
      >
          <form onSubmit={handleUpgrade} className="space-y-5">
            <label className="block text-xs font-semibold uppercase tracking-wider" style={S.sub}>New plan</label>
            <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}
              className="min-h-11 w-full rounded-lg border px-3 text-sm" style={S.input}>
              <option value="">— Select new plan —</option>
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>{p.plan_name} ({p.billing_cycle})</option>
              ))}
            </select>
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end" style={S.border}>
              <button type="button" disabled={upgrading} onClick={() => { setUpgradingTenant(null); setSelectedPlanId(""); }}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="submit" disabled={!selectedPlanId || upgrading}
                className="min-h-10 rounded-lg bg-[#101b52] px-5 text-sm font-semibold text-white hover:bg-[#17266d] disabled:opacity-50">
                {upgrading ? "Updating…" : "Apply plan change"}
              </button>
            </div>
          </form>
      </Dialog>

      {/* Tenants Table */}
      <div className="rounded-lg border shadow-sm overflow-hidden" style={S.surface}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={S.raised}>
              {["#", "Tenant Name", "Email", "Plan", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={S.muted}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-sm" style={S.muted}>No tenants found.</td></tr>
            )}
            {filtered.map((tenant, idx) => {
              const isExpanded = expandedId === tenant.tenant_id;
              const active = tenant.is_active !== false;
              return (
                <React.Fragment key={tenant.tenant_id}>
                  <tr className="border-b transition-colors"
                    style={{ ...S.border, backgroundColor: isExpanded ? "var(--accent-muted)" : undefined }}>
                    <td className="px-5 py-3.5 font-mono text-xs" style={S.muted}>{idx + 1}</td>
                    <td className="px-5 py-3.5 font-semibold" style={S.primary}>
                      <div>{tenant.tenant_name}</div>
                      <div className="text-[10px] font-mono mt-0.5" style={S.muted}>{tenant.tenant_code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={S.sub}>{tenant.billing_email || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded border"
                        style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                        {tenant.plan_id?.replace("PLAN_", "") || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded inline-flex items-center gap-1 ${active ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                        {active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 flex-wrap">
                        <button onClick={() => handleExpand(tenant)}
                          className="text-xs font-medium flex items-center gap-1 hover:underline"
                          style={S.accent}>
                          {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide</> : <><ChevronDown className="w-3.5 h-3.5" /> Companies</>}
                        </button>
                        <Link href={`/admin/tenants/${tenant.tenant_id}`}
                          className="text-xs font-medium flex items-center gap-1 hover:underline"
                          style={{ color: "#6366F1" }}>
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Link>
                        {tenant.tenant_id === "00000000-0000-0000-0000-000000000000" || tenant.tenant_code === "system" ? (
                          <span className="text-xs font-medium flex items-center gap-1 text-gray-400 cursor-not-allowed opacity-50" title="System plan cannot be changed">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Upgrade
                          </span>
                        ) : (
                          <button onClick={() => { setUpgradingTenant(tenant); setSelectedPlanId(""); }}
                            className="text-xs font-medium flex items-center gap-1 hover:underline text-amber-500">
                            <ArrowUpRight className="w-3.5 h-3.5" /> Upgrade
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded companies row */}
                  {isExpanded && (
                    <tr key={`${tenant.tenant_id}-detail`}>
                      <td colSpan={6} className="px-8 py-5 border-b" style={{ backgroundColor: "var(--accent-muted)", borderColor: "var(--border)" }}>
                        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={S.muted}>
                          Companies under {tenant.tenant_name}
                        </p>
                        {loadingCos ? (
                          <div className="text-xs flex items-center gap-2" style={S.muted}>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading companies…
                          </div>
                        ) : expandedCompanies.length === 0 ? (
                          <p className="text-xs" style={S.muted}>No companies registered under this tenant yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {expandedCompanies.map((co: any) => (
                              <span key={co.company_id}
                                className="text-xs border rounded-lg px-3 py-1.5 font-medium shadow-sm flex items-center gap-1.5"
                                style={{ ...S.surface, ...S.primary }}>
                                <Building className="w-3 h-3 shrink-0" style={S.muted} />
                                {co.company_name}
                                <span className={`text-[10px] font-bold ${co.onboarding_status === "COMPLETED" ? "text-green-600" : "text-amber-500"}`}>
                                  {co.onboarding_status === "COMPLETED" ? "✓" : "⚠"}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                        <Link href={`/admin/tenants/${tenant.tenant_id}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium hover:underline"
                          style={S.accent}>
                          <Eye className="w-3 h-3" /> View full tenant details →
                        </Link>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={showAddModal}
        onClose={() => !creating && setShowAddModal(false)}
        title="Register new tenant"
        description="Create the tenant account and its first administrator. Additional setup can be completed afterward."
        maxWidth="lg"
      >
            <form onSubmit={handleCreateTenant} className="space-y-6">
              {createError && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">1. Tenant & Invoicing Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Legal Tenant Name *</label>
                    <input required placeholder="e.g. Green Valley Farms" value={createForm.tenant_name}
                      onChange={e => setCreateForm(f => ({ ...f, tenant_name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Subdomain / Code *</label>
                    <input required placeholder="e.g. gvf" value={createForm.tenant_code}
                      onChange={e => setCreateForm(f => ({ ...f, tenant_code: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "") }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Billing/Invoicing Email *</label>
                    <input required type="email" placeholder="billing@greenvalley.com" value={createForm.billing_email}
                      onChange={e => setCreateForm(f => ({ ...f, billing_email: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Pricing Plan *</label>
                    <select required value={createForm.plan_id}
                      onChange={e => setCreateForm(f => ({ ...f, plan_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input}>
                      <option value="PLAN_BASIC">Basic Plan ($49/mo)</option>
                      <option value="PLAN_PRO">Pro Plan ($149/mo)</option>
                      <option value="PLAN_ENTERPRISE">Enterprise Plan ($499/mo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t" style={S.border}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">2. Initial Tenant Admin Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Administrator Name *</label>
                    <input required placeholder="e.g. John Doe" value={createForm.admin_name}
                      onChange={e => setCreateForm(f => ({ ...f, admin_name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Administrator Email *</label>
                    <input required type="email" placeholder="admin@domain.com" value={createForm.admin_email}
                      onChange={e => setCreateForm(f => ({ ...f, admin_email: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Administrator Password *</label>
                    <input required type="password" placeholder="At least 8 characters" value={createForm.admin_password}
                      onChange={e => setCreateForm(f => ({ ...f, admin_password: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                </div>
              </div>

              {/* ── Section 3: NOB / LOB Licensing ── */}
              <div className="space-y-4 pt-4 border-t" style={S.border}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-500">3. Permitted Business Sectors (NOB & LOB)</h3>
                    <p className="text-xs mt-0.5" style={S.muted}>Select which Nature of Business (NOB) & Line of Business (LOB) options this tenant is licensed to use.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allNobIds = nobsList.map(n => n.nob_id);
                      const allLobIds = Object.values(lobsByNob).flat().map(l => l.lob_id);
                      if (selectedNobIds.length === allNobIds.length) {
                        setSelectedNobIds([]);
                        setSelectedLobIds([]);
                      } else {
                        setSelectedNobIds(allNobIds);
                        setSelectedLobIds(allLobIds);
                      }
                    }}
                    className="text-xs font-semibold px-2.5 py-1 rounded border hover:opacity-80"
                    style={{ ...S.raised, ...S.accent, borderColor: "var(--accent)" }}
                  >
                    {selectedNobIds.length === nobsList.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {nobsList.length === 0 ? (
                    <p className="text-xs italic" style={S.muted}>No NOB sectors configured in master catalog.</p>
                  ) : (
                    nobsList.map((nob: any) => {
                      const isNobChecked = selectedNobIds.includes(nob.nob_id);
                      const childLobs = lobsByNob[nob.nob_id] || [];

                      const toggleNob = () => {
                        if (isNobChecked) {
                          setSelectedNobIds(prev => prev.filter(id => id !== nob.nob_id));
                          // Deselect child LOBs
                          const childIds = new Set(childLobs.map(l => l.lob_id));
                          setSelectedLobIds(prev => prev.filter(id => !childIds.has(id)));
                        } else {
                          setSelectedNobIds(prev => [...prev, nob.nob_id]);
                          // Select all child LOBs by default
                          const childIds = childLobs.map(l => l.lob_id);
                          setSelectedLobIds(prev => Array.from(new Set([...prev, ...childIds])));
                        }
                      };

                      return (
                        <div
                          key={nob.nob_id}
                          className="rounded-lg border p-3 transition-colors"
                          style={{
                            backgroundColor: isNobChecked ? "var(--accent-muted)" : "var(--surface-raised)",
                            borderColor: isNobChecked ? "var(--accent)" : "var(--border)",
                          }}
                        >
                          <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs select-none" style={S.primary}>
                            <input
                              type="checkbox"
                              checked={isNobChecked}
                              onChange={toggleNob}
                              className="w-4 h-4 rounded accent-teal-500 cursor-pointer"
                            />
                            <span>{nob.nob_name}</span>
                            <span className="text-[10px] font-mono font-normal opacity-60">({nob.nob_code})</span>
                          </label>

                          {/* Child LOBs */}
                          {isNobChecked && childLobs.length > 0 && (
                            <div className="mt-2.5 ml-6 pt-2 border-t flex flex-wrap gap-2" style={{ borderColor: "var(--border)" }}>
                              {childLobs.map((lob: any) => {
                                const isLobChecked = selectedLobIds.includes(lob.lob_id);
                                const toggleLob = () => {
                                  if (isLobChecked) {
                                    setSelectedLobIds(prev => prev.filter(id => id !== lob.lob_id));
                                  } else {
                                    setSelectedLobIds(prev => [...prev, lob.lob_id]);
                                  }
                                };

                                return (
                                  <label
                                    key={lob.lob_id}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer select-none"
                                    style={{
                                      backgroundColor: isLobChecked ? "var(--surface)" : "transparent",
                                      borderColor: isLobChecked ? "var(--accent)" : "var(--border)",
                                      color: isLobChecked ? "var(--accent)" : "var(--text-secondary)",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isLobChecked}
                                      onChange={toggleLob}
                                      className="w-3 h-3 rounded accent-teal-500 cursor-pointer"
                                    />
                                    <span>{lob.lob_name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end" style={S.border}>
                <button type="button" disabled={creating} onClick={() => setShowAddModal(false)}
                  className="min-h-10 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#101b52] px-5 text-sm font-semibold text-white hover:bg-[#17266d] disabled:opacity-50">
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? "Provisioning..." : "Provision Tenant"}
                </button>
              </div>
            </form>
      </Dialog>
    </div>
  );
}
