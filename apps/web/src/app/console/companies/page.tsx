"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, RefreshCw, AlertCircle, CheckCircle,
  Settings, ArrowLeft, Activity, Plus,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, getActiveCompanyId, setActiveCompanyId, NavUser } from "../../../hooks/useAuth";
import CompanyTab from "../../../components/console/console-tabs/company-tab";
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

function StatusBadge({ status }: { status: string }) {
  const ok = status === "COMPLETED";
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full">
      <CheckCircle className="w-3 h-3" /> Complete
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">
      <Activity className="w-3 h-3" /> Pending
    </span>
  );
}

export default function CompaniesPage() {
  const router = useRouter();
  const [user,           setUser]           = useState<NavUser | null>(null);
  const [tenantId,       setTenantId]       = useState("");
  const [companies,      setCompanies]      = useState<any[]>([]);
  const [currencies,     setCurrencies]     = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState("");

  // The company currently being managed in the bottom panel (Tenant Admin)
  const [managingCompany, setManagingCompany] = useState<any>(null);

  // Add Company modal (Tenant Admin)
  const [showAddModal, setShowAddModal]   = useState(false);
  const [creating,     setCreating]       = useState(false);
  const [createError,  setCreateError]    = useState("");
  const [createForm,   setCreateForm]     = useState({
    company_code: "", company_name: "", company_display_name: "",
    company_type: "Pvt Ltd", industry_type: "Poultry Farming",
    country_id: "IND", default_timezone_id: "Asia/Kolkata",
    registration_no: "", tax_id: "",
  });

  // For Company Admin / Standard User — their own company
  const [myCompany, setMyCompany] = useState<any>(null);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tid = getStoredTenantId();
    if (!token || !storedUser || !tid) { router.replace("/"); return; }
    setUser(storedUser); setTenantId(tid);
    loadData(storedUser, tid);
  }, [router]);

  const loadData = async (storedUser: NavUser, tid: string) => {
    setLoading(true); setError("");
    try {
      const [companiesList, currList] = await Promise.all([
        api.get(`/company/tenant/${tid}`),
        api.get("/currency"),
      ]);
      setCurrencies(currList);

      if (storedUser.userType === "TENANT_ADMIN") {
        setCompanies(companiesList);
        // If currently managing a company, refresh its data too
        if (managingCompany) {
          const refreshed = companiesList.find((c: any) => c.company_id === managingCompany.company_id);
          if (refreshed) setManagingCompany(refreshed);
        }
      } else {
        // Company Admin / Standard User — show the active company (respects switch)
        const activeId = getActiveCompanyId() || storedUser.companyId || storedUser.company_id;
        const mine = companiesList.find((c: any) => c.company_id === activeId) || companiesList[0] || null;
        setMyCompany(mine);
      }
    } catch (e: any) { setError(e?.message || "Failed to load companies."); }
    finally { setLoading(false); }
  };

  const handleRefresh = () => { if (user && tenantId) loadData(user, tenantId); };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setCreating(true); setCreateError("");
    try {
      await api.post("/company", { ...createForm });
      setShowAddModal(false);
      setCreateForm({ company_code: "", company_name: "", company_display_name: "",
        company_type: "Pvt Ltd", industry_type: "Poultry Farming",
        country_id: "IND", default_timezone_id: "Asia/Kolkata",
        registration_no: "", tax_id: "" });
      if (user && tenantId) loadData(user, tenantId);
    } catch (err: any) { setCreateError(err?.message || "Failed to create company."); }
    finally { setCreating(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
      <span className="text-sm" style={S.sub}>Loading companies…</span>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // TENANT ADMIN VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (user?.userType === "TENANT_ADMIN") {

    // ── Managing a specific company ──────────────────────────────────────────
    if (managingCompany) {
      return (
        <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6 lg:p-7">
          {/* Compact navigation and company identity toolbar */}
          <div className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <button
              type="button"
              onClick={() => setManagingCompany(null)}
              aria-label="Back to companies"
              title="Back to companies"
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#e3e7ee] px-3 text-sm font-semibold text-[#0b1248] transition hover:bg-[#f5f7fb]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Companies</span>
            </button>
            <div className="mx-1 hidden h-8 w-px bg-[#e7eaf0] sm:block" />
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1c4aa9,#0b1248)] text-sm font-black text-white">
              {managingCompany.company_code?.substring(0, 2) || managingCompany.company_name?.substring(0, 2) || "CO"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold text-[#2e313f]">{managingCompany.company_name}</div>
              <div className="text-xs flex items-center gap-3 mt-0.5" style={S.muted}>
                <span className="font-mono">{managingCompany.company_code}</span>
                {managingCompany.registration_no && <span>Reg: {managingCompany.registration_no}</span>}
                {managingCompany.country_id && <span>{managingCompany.country_id}</span>}
              </div>
            </div>
            <StatusBadge status={managingCompany.onboarding_status} />
          </div>

          {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

          {/* Company settings — pass ONLY this one company */}
          <div>
            <CompanyTab
              activeCompany={managingCompany}
              currencies={currencies}
              tenantId={tenantId}
              onRefreshCompany={handleRefresh as any}
              companies={[managingCompany]}
              currentUser={user}
              onSelectCompany={(company) => void company}
              skipDirectory={true}
            />
          </div>
        </div>
      );
    }

    // ── Companies directory table ────────────────────────────────────────────
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
        {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={S.primary}>Companies</h1>
            <p className="text-sm mt-0.5" style={S.sub}>
              {companies.length} company record{companies.length !== 1 ? "s" : ""} in this tenant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setCreateError(""); setShowAddModal(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg shadow-sm"
              style={{ backgroundColor: "var(--accent)" }}>
              <Plus className="w-4 h-4" /> Add Company
            </button>
          </div>
        </div>

        {/* Add Company Modal */}
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} title="Add a company" description="Create the legal company record. Detailed setup continues after creation." maxWidth="lg">
              <form onSubmit={handleCreateCompany} className="space-y-5">
                {createError && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Company Code *</label>
                    <input required placeholder="e.g. ARUN12" value={createForm.company_code}
                      onChange={e => setCreateForm(f => ({ ...f, company_code: e.target.value.toUpperCase() }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Legal Entity Name *</label>
                    <input required placeholder="e.g. Arun Private Limited" value={createForm.company_name}
                      onChange={e => setCreateForm(f => ({ ...f, company_name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Display / Brand Name</label>
                    <input placeholder="e.g. Arun Technology" value={createForm.company_display_name}
                      onChange={e => setCreateForm(f => ({ ...f, company_display_name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Classification *</label>
                    <select required value={createForm.company_type}
                      onChange={e => setCreateForm(f => ({ ...f, company_type: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input}>
                      {["Pvt Ltd","Ltd","LLP","Partnership","Proprietorship","Trust","NGO"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Industry *</label>
                    <select required value={createForm.industry_type}
                      onChange={e => setCreateForm(f => ({ ...f, industry_type: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input}>
                      {["Poultry Farming","Aquaculture","Dairy","Crop Farming","Agro Processing","Livestock","Other"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Registration No.</label>
                    <input placeholder="e.g. U01100MH2020PTC123456" value={createForm.registration_no}
                      onChange={e => setCreateForm(f => ({ ...f, registration_no: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Tax ID (GSTIN / PAN)</label>
                    <input placeholder="e.g. 27AABCU9603R1ZX" value={createForm.tax_id}
                      onChange={e => setCreateForm(f => ({ ...f, tax_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>Country *</label>
                    <select required value={createForm.country_id}
                      onChange={e => setCreateForm(f => ({ ...f, country_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={S.input}>
                      <option value="IND">India</option>
                      <option value="USA">United States</option>
                      <option value="GBR">United Kingdom</option>
                      <option value="ARE">UAE</option>
                      <option value="SGP">Singapore</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-[#edf0f4] pt-5 sm:flex-row sm:justify-end">
                  <button type="submit" disabled={creating}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1248] px-5 text-sm font-semibold text-white hover:bg-[#151d5e] disabled:opacity-50">
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creating ? "Creating…" : "Create Company"}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="h-11 rounded-xl border border-(--border) bg-(--surface) px-5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised)">
                    Cancel
                  </button>
                </div>
              </form>
        </Dialog>

        {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

        {/* Clean companies table — no inline expand */}
        <div className="rounded-lg border shadow-sm overflow-hidden" style={S.surface}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={S.raised}>
                {["#", "Company", "Reg. No.", "Country", "Onboarding", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={S.muted}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-sm" style={S.muted}>No companies registered yet.</td></tr>
              )}
              {companies.map((co, idx) => (
                <tr key={co.company_id}
                  className="border-b transition-colors hover:opacity-90"
                  style={S.border}>
                  <td className="px-5 py-4 font-mono text-xs" style={S.muted}>{idx + 1}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-white text-[11px] font-black shrink-0"
                        style={{ backgroundColor: "var(--accent)" }}>
                        {co.company_code?.substring(0, 2) || "CO"}
                      </div>
                      <div>
                        <div className="font-semibold" style={S.primary}>{co.company_name}</div>
                        <div className="text-[11px] font-mono" style={S.muted}>{co.company_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs" style={S.sub}>{co.registration_no || "—"}</td>
                  <td className="px-5 py-4 text-xs" style={S.sub}>{co.country_id || "—"}</td>
                  <td className="px-5 py-4"><StatusBadge status={co.onboarding_status} /></td>
                  <td className="px-5 py-4">
                    {co.onboarding_status === "COMPLETED" ? (
                      <button
                        onClick={() => setManagingCompany(co)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                        <Settings className="w-3.5 h-3.5" />
                        Manage
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const currentUser = getStoredUser();
                          if (currentUser) {
                            const patched = {
                              ...currentUser,
                              companyId: co.company_id,
                              company_id: co.company_id,
                            };
                            localStorage.setItem("user", JSON.stringify(patched));
                            localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
                          }
                          setActiveCompanyId(co.company_id);
                          window.location.reload();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                        style={{ backgroundColor: "var(--surface-raised)", color: "var(--text-primary)", borderColor: "var(--border)" }}>
                        <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        Continue Setup
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // COMPANY ADMIN / STANDARD USER VIEW — single company
  // ════════════════════════════════════════════════════════════════════════════
  if (!myCompany) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 xl:p-8">
        <div className="rounded-lg border p-12 text-center" style={S.surface}>
          <Building2 className="w-10 h-10 mx-auto mb-3" style={S.muted} />
          <p className="text-sm font-semibold" style={S.sub}>No company assigned to your account yet.</p>
          <p className="text-xs mt-1" style={S.muted}>Contact your Tenant Admin to set up your company.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6 xl:p-8">
      {/* Company identity header */}
      <div className="flex items-center gap-4 rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1c4aa9,#0b1248)] text-sm font-black text-white">
          {myCompany.company_code?.substring(0, 2) || myCompany.company_name?.substring(0, 2) || "CO"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold" style={S.primary}>{myCompany.company_name}</div>
          <div className="text-xs flex items-center gap-3 mt-0.5" style={S.muted}>
            <span className="font-mono">{myCompany.company_code}</span>
            {myCompany.registration_no && <span>Reg: {myCompany.registration_no}</span>}
          </div>
        </div>
        <StatusBadge status={myCompany.onboarding_status} />
      </div>

      {error && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}

      <CompanyTab
          activeCompany={myCompany}
          currencies={currencies}
          tenantId={tenantId}
          onRefreshCompany={handleRefresh as any}
          companies={[myCompany]}
          currentUser={user}
          onSelectCompany={(company) => void company}
      />
    </div>
  );
}
