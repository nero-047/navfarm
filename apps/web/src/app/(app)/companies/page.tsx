"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, RefreshCw, CheckCircle,
  Settings, Activity, Plus,
} from "lucide-react";
import { api } from "@/services/api-client";
import { updateStoredUser, getActiveCompanyId, setActiveCompanyId } from "@/hooks/useAuth";
import { useCompaniesPageData } from "@/components/console/companies/use-companies-page-data";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/ui/states";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/PageHeader";

const S = {
  surface:  { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  primary:  { color: "var(--text-primary)" },
  sub:      { color: "var(--text-secondary)" },
  muted:    { color: "var(--text-muted)" },
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

export default function CompaniesIndexPage() {
  const router = useRouter();
  const { user, tenantId, companies, loading, error, reload } = useCompaniesPageData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    company_code: "", company_name: "", company_display_name: "",
    company_type: "Pvt Ltd", industry_type: "Poultry Farming",
    country_id: "IND", default_timezone_id: "Asia/Kolkata",
    registration_no: "", tax_id: "",
  });

  // Non-tenant-admins (and tenant admins who don't manage the directory)
  // land straight on their own company's settings route.
  useEffect(() => {
    if (loading || !user || user.userType === "TENANT_ADMIN") return;
    const activeId = getActiveCompanyId() || user.companyId || (user as any).company_id;
    const myCompany = companies.find((c: any) => c.company_id === activeId) || companies[0];
    if (myCompany) router.replace(`/companies/${myCompany.company_id}`);
  }, [loading, user, companies, router]);

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
      reload();
    } catch (err: any) { setCreateError(err?.message || "Failed to create company."); }
    finally { setCreating(false); }
  };

  if (loading) return <LoadingState label="Loading companies…" />;

  // ── Tenant-wide directory (Tenant Admin) ──
  if (user?.userType === "TENANT_ADMIN") {
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

        <div className="rounded-[var(--radius-md)] border overflow-hidden" style={S.surface}>
          <table className="w-full border-collapse text-sm">
            <TableHeader>
              <tr className="border-b" style={{ borderColor: "var(--row-border)" }}>
                {["#", "Company", "Reg. No.", "Country", "Onboarding", "Actions"].map((h) => (
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
                      <Button onClick={() => router.push(`/companies/${co.company_id}`)} variant="outline" size="sm">
                        <Settings className="w-3.5 h-3.5" />
                        Manage
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          updateStoredUser({ companyId: co.company_id, company_id: co.company_id });
                          setActiveCompanyId(co.company_id);
                          router.push(`/companies/${co.company_id}`);
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

  // ── Fallback for a non-admin user without an assigned company ──
  if (!companies.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
        <PageHeader title="Company settings" sticky={false} />
        <div className="rounded-[var(--radius-md)] border p-12 text-center" style={S.surface}>
          <Building2 className="w-10 h-10 mx-auto mb-3" style={S.muted} />
          <p className="text-sm font-semibold" style={S.sub}>No company assigned to your account yet.</p>
          <p className="text-xs mt-1" style={S.muted}>Contact your Tenant Admin to set up your company.</p>
        </div>
      </div>
    );
  }

  // Redirecting to /companies/[companyId]
  return null;
}
