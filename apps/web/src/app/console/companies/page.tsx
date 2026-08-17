"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, RefreshCw, CheckCircle,
  Settings, ArrowLeft, Activity, Plus, ArrowRightLeft,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, getActiveCompanyId, setActiveCompanyId, isTenantCompanyMode, setTenantCompanyMode, NavUser } from "../../../hooks/useAuth";
import CompanyTab from "../../../components/console/console-tabs/company-tab";
import { Drawer } from "../../../components/ui/drawer";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Select } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import { LoadingState, ErrorState } from "../../../components/ui/states";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/table";
import { PageHeader } from "../../../components/ui/PageHeader";

const S = {
  surface:  { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  raised:   { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary:  { color: "var(--text-primary)" },
  sub:      { color: "var(--text-secondary)" },
  muted:    { color: "var(--text-muted)" },
  accent:   { color: "var(--accent)" },
  border:   { borderColor: "var(--border)" },
};

function StatusBadge({ status }: { status: string }) {
  const ok = status === "COMPLETED";
  return (
    <Badge variant={ok ? "success" : "warning"}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
      {ok ? "Complete" : "Pending"}
    </Badge>
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

  if (loading) return <LoadingState label="Loading companies…" />;

  // ════════════════════════════════════════════════════════════════════════════
  // TENANT ADMIN VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (user?.userType === "TENANT_ADMIN") {

    // ── Managing a specific company ──────────────────────────────────────────
    if (managingCompany) {
      return (
        <div className="mx-auto max-w-7xl space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-7 lg:pb-7">
          {/* This view had no heading at all — the identity strip below states
              which company, but nothing stated what the page is. The strip
              stays exactly as it was; it is metadata, not the page title. */}
          <PageHeader title="Company settings" sticky={false} />

          {/* Compact navigation and company identity toolbar */}
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-4">
            <Button
              type="button"
              onClick={() => setManagingCompany(null)}
              aria-label="Back to companies"
              title="Back to companies"
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Companies</span>
            </Button>
            <div className="mx-1 hidden h-8 w-px sm:block" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-navy)" }}>
              {managingCompany.company_code?.substring(0, 2) || managingCompany.company_name?.substring(0, 2) || "CO"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-semibold" style={S.primary}>{managingCompany.company_name}</div>
              <div className="text-xs flex items-center gap-3 mt-0.5" style={S.muted}>
                <span className="font-mono">{managingCompany.company_code}</span>
                {managingCompany.registration_no && <span>Reg: {managingCompany.registration_no}</span>}
                {managingCompany.country_id && <span>{managingCompany.country_id}</span>}
              </div>
            </div>
            <StatusBadge status={managingCompany.onboarding_status} />
          </div>

          {error && <ErrorState message={error} />}

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
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
        <PageHeader
          title="Companies"
          description={`${companies.length} company record${companies.length !== 1 ? "s" : ""} in this tenant`}
          actions={
            <Button onClick={() => { setCreateError(""); setShowAddModal(true); }}>
              <Plus className="w-4 h-4" /> Add Company
            </Button>
          }
        />

        {/* Add Company Modal */}
        {/* Eight fields of legal-entity detail — a drawer. As with the invite
            form, the actions stay inside the <form> so submit behaviour is
            untouched. */}
        <Drawer open={showAddModal} onClose={() => setShowAddModal(false)} title="Add a company" description="Create the legal company record. Detailed setup continues after creation." size="lg">
              <form onSubmit={handleCreateCompany} className="space-y-5">
                {createError && <ErrorState message={createError} />}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Company Code *</label>
                    <Input required placeholder="e.g. ARUN12" value={createForm.company_code}
                      onChange={e => setCreateForm(f => ({ ...f, company_code: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Legal Entity Name *</label>
                    <Input required placeholder="e.g. Arun Private Limited" value={createForm.company_name}
                      onChange={e => setCreateForm(f => ({ ...f, company_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Display / Brand Name</label>
                    <Input placeholder="e.g. Arun Technology" value={createForm.company_display_name}
                      onChange={e => setCreateForm(f => ({ ...f, company_display_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Classification *</label>
                    <Select required value={createForm.company_type}
                      onChange={e => setCreateForm(f => ({ ...f, company_type: e.target.value }))}>
                      {["Pvt Ltd","Ltd","LLP","Partnership","Proprietorship","Trust","NGO"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Industry *</label>
                    <Select required value={createForm.industry_type}
                      onChange={e => setCreateForm(f => ({ ...f, industry_type: e.target.value }))}>
                      {["Poultry Farming","Aquaculture","Dairy","Crop Farming","Agro Processing","Livestock","Other"].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Registration No.</label>
                    <Input placeholder="e.g. U01100MH2020PTC123456" value={createForm.registration_no}
                      onChange={e => setCreateForm(f => ({ ...f, registration_no: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Tax ID (GSTIN / PAN)</label>
                    <Input placeholder="e.g. 27AABCU9603R1ZX" value={createForm.tax_id}
                      onChange={e => setCreateForm(f => ({ ...f, tax_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>Country *</label>
                    <Select required value={createForm.country_id}
                      onChange={e => setCreateForm(f => ({ ...f, country_id: e.target.value }))}>
                      <option value="IND">India</option>
                      <option value="USA">United States</option>
                      <option value="GBR">United Kingdom</option>
                      <option value="ARE">UAE</option>
                      <option value="SGP">Singapore</option>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={S.border}>
                  <Button type="submit" disabled={creating}>
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {creating ? "Creating…" : "Create Company"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
        </Drawer>

        {error && <ErrorState message={error} />}

        {/* Clean companies table — no inline expand */}
        <div className="rounded-[var(--radius-md)] border overflow-hidden" style={S.surface}>
          <table className="w-full border-collapse text-sm">
            <TableHeader>
              <tr className="border-b border-(--row-border)">
                {["#", "Company", "Reg. No.", "Country", "Onboarding", ""].map((h) => (
                  <TableHead key={h} className="px-5 whitespace-nowrap">{h}</TableHead>
                ))}
              </tr>
            </TableHeader>
            <TableBody>
              {companies.length === 0 && (
                <tr><TableCell colSpan={6} className="px-5 text-center py-12" style={S.muted}>No companies registered yet.</TableCell></tr>
              )}
              {companies.map((co, idx) => (
                <TableRow key={co.company_id}>
                  <TableCell className="px-5 py-4 font-mono" style={S.muted}>{idx + 1}</TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[var(--radius-xs)] flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
                        style={{ backgroundColor: "var(--color-navy)" }}>
                        {co.company_code?.substring(0, 2) || "CO"}
                      </div>
                      <div>
                        <div className="font-semibold" style={S.primary}>{co.company_name}</div>
                        <div className="text-[11px] font-mono" style={S.muted}>{co.company_code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 font-mono" style={S.sub}>{co.registration_no || "—"}</TableCell>
                  <TableCell className="px-5 py-4" style={S.sub}>{co.country_id || "—"}</TableCell>
                  <TableCell className="px-5 py-4"><StatusBadge status={co.onboarding_status} /></TableCell>
                  <TableCell className="px-5 py-4">
                    {co.onboarding_status === "COMPLETED" ? (
                      <div className="flex items-center gap-2">
                        <Button onClick={() => setManagingCompany(co)} variant="outline" size="sm">
                          <Settings className="w-3.5 h-3.5" />
                          Manage
                        </Button>
                        {!(isTenantCompanyMode() && co.company_id === (getActiveCompanyId() || user?.companyId)) && (
                          <Button
                            onClick={() => {
                              const currentUser = getStoredUser();
                              if (currentUser) {
                                const patched = { ...currentUser, companyId: co.company_id, company_id: co.company_id };
                                localStorage.setItem("user", JSON.stringify(patched));
                                localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
                              }
                              setActiveCompanyId(co.company_id);
                              setTenantCompanyMode(true);
                              window.location.href = "/console/dashboard";
                            }}
                            title={`Switch into ${co.company_name} — operate the console as this company`}
                            variant="secondary"
                            size="sm"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Switch
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button
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
                        variant="secondary"
                        size="sm"
                      >
                        <Activity className="w-3.5 h-3.5" style={{ color: "var(--warning)" }} />
                        Continue Setup
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
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
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
        <PageHeader title="Companies" sticky={false} />
        <div className="rounded-[var(--radius-md)] border p-12 text-center" style={S.surface}>
          <Building2 className="w-10 h-10 mx-auto mb-3" style={S.muted} />
          <p className="text-sm font-semibold" style={S.sub}>No company assigned to your account yet.</p>
          <p className="text-xs mt-1" style={S.muted}>Contact your Tenant Admin to set up your company.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
      <PageHeader title="Company settings" sticky={false} />

      {/* Company identity header */}
      <div className="flex items-center gap-4 rounded-[var(--radius-md)] border border-(--border) bg-(--surface) p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-sm font-semibold text-white" style={{ backgroundColor: "var(--color-navy)" }}>
          {myCompany.company_code?.substring(0, 2) || myCompany.company_name?.substring(0, 2) || "CO"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold" style={S.primary}>{myCompany.company_name}</div>
          <div className="text-xs flex items-center gap-3 mt-0.5" style={S.muted}>
            <span className="font-mono">{myCompany.company_code}</span>
            {myCompany.registration_no && <span>Reg: {myCompany.registration_no}</span>}
          </div>
        </div>
        <StatusBadge status={myCompany.onboarding_status} />
      </div>

      {error && <ErrorState message={error} />}

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
