"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, RefreshCw, AlertCircle, CheckCircle, XCircle,
  ArrowUpRight, Users, Layers, Database, Building, Mail,
  Shield, Calendar, Activity, ChevronDown, ChevronUp,
  MapPin, Phone,
} from "lucide-react";
import { api } from "../../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../../hooks/useAuth";

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

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="px-5 py-3.5 border-b" style={S.border}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={S.muted}>{label}</div>
      <div className="text-sm font-semibold truncate" style={S.primary}>{value ?? "—"}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent = false }: {
  icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; accent?: boolean;
}) {
  return (
    <div className="rounded-lg p-5 border" style={S.surface}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>{label}</span>
        <Icon className="w-4 h-4" style={accent ? { color: "var(--accent)" } : S.muted} />
      </div>
      <div className="text-2xl font-black" style={S.primary}>{value}</div>
      {sub && <div className="text-xs mt-1 truncate" style={S.sub}>{sub}</div>}
    </div>
  );
}

function Badge({ children, color = "default" }: { children: React.ReactNode; color?: "green"|"amber"|"blue"|"purple"|"default" }) {
  const cls: Record<string,string> = {
    green:   "bg-green-50 text-green-700 border-green-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    blue:    "bg-blue-50 text-blue-700 border-blue-200",
    purple:  "bg-purple-50 text-purple-700 border-purple-200",
    default: "bg-gray-50 text-gray-600 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-2.5 py-0.5 rounded-full ${cls[color]}`}>
      {children}
    </span>
  );
}

function MiniCard({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-lg border p-3" style={S.raised}>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={S.muted}>{label}</div>
      <div className="text-xs font-semibold truncate" style={S.primary}>{value ?? "—"}</div>
    </div>
  );
}

const CountryMap: Record<string, string> = {
  IND: "India",
  USA: "United States",
  GBR: "United Kingdom",
  ARE: "UAE",
  SGP: "Singapore",
  "40000000-4000-4000-4000-400000000001": "India",
};

export default function TenantDetailPage() {
  const router   = useRouter();
  const params   = useParams();
  const tenantId = params?.id as string;

  const [tenant,       setTenant]       = useState<any>(null);
  const [companies,    setCompanies]    = useState<any[]>([]);
  const [users,        setUsers]        = useState<any[]>([]);
  const [plans,        setPlans]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [upgrading,    setUpgrading]    = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const [companyDetails,  setCompanyDetails]  = useState<Record<string, any>>({});
  const [loadingDetails,  setLoadingDetails]  = useState<Record<string, boolean>>({});
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  // Catalogs mapping states
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [nobs,       setNobs]       = useState<any[]>([]);
  const [lobs,       setLobs]       = useState<any[]>([]);

  useEffect(() => {
    const token = getStoredToken();
    const user  = getStoredUser();
    if (!token || !user || user.userType !== "SYSTEM_ADMIN") { router.replace("/"); return; }
    if (!tenantId) { router.replace("/admin/tenants"); return; }
    loadAll();
  }, [tenantId]); // eslint-disable-line

  const loadAll = async () => {
    setLoading(true); setError("");
    try {
      const [tenantData, companiesList, usersList, plansList, currenciesList, nobsList] = await Promise.all([
        api.get(`/tenant/${tenantId}`),
        api.get(`/tenant/${tenantId}/companies`),
        api.get(`/tenant/${tenantId}/users`),
        api.get("/plan"),
        api.get("/currency").catch(() => []),
        api.get("/setup/wizard/nobs").catch(() => []),
      ]);
      setTenant(tenantData);
      const cos = Array.isArray(companiesList) ? companiesList : [];
      setCompanies(cos);
      setUsers(Array.isArray(usersList) ? usersList : []);
      setPlans(Array.isArray(plansList) ? plansList : []);
      setSelectedPlan(tenantData?.plan_id || "");
      setCurrencies(currenciesList || []);
      setNobs(nobsList || []);

      // If we have NOBs, load all of their LOB sub-sectors in parallel
      if (nobsList && nobsList.length > 0) {
        try {
          const lobsPromises = nobsList.map((nobItem: any) =>
            api.get(`/setup/wizard/lobs/${nobItem.nob_id}`).catch(() => [])
          );
          const lobsResult = await Promise.all(lobsPromises);
          setLobs(lobsResult.flat());
        } catch (err) {
          console.error("Failed to load LOB sub-sectors:", err);
        }
      }

      if (cos.length > 0) {
        const detailsMap: Record<string, any> = {};
        const results = await Promise.allSettled(
          cos.map((co: any) => api.get(`/setup/wizard/company-details/${co.company_id}`, {
            headers: { "x-tenant-id": tenantId }
          }))
        );
        results.forEach((r, i) => {
          if (r.status === "fulfilled") detailsMap[cos[i].company_id] = r.value;
        });
        setCompanyDetails(detailsMap);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load tenant details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = useCallback(async (companyId: string) => {
    if (companyDetails[companyId] || loadingDetails[companyId]) return;
    setLoadingDetails(prev => ({ ...prev, [companyId]: true }));
    try {
      const d = await api.get(`/setup/wizard/company-details/${companyId}`, {
        headers: { "x-tenant-id": tenantId }
      });
      setCompanyDetails(prev => ({ ...prev, [companyId]: d }));
    } catch { /* silent */ }
    finally { setLoadingDetails(prev => ({ ...prev, [companyId]: false })); }
  }, [companyDetails, loadingDetails, tenantId]);

  const toggleExpand = (companyId: string) => {
    if (expandedCompany === companyId) { setExpandedCompany(null); return; }
    setExpandedCompany(companyId);
    fetchCompanyDetails(companyId);
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || selectedPlan === tenant?.plan_id) return;
    setUpgrading(true); setError(""); setSuccess("");
    try {
      await api.post(`/tenant/${tenantId}/change-plan`, { plan_id: selectedPlan });
      setSuccess("Subscription plan updated successfully.");
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to update plan.");
    } finally { setUpgrading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
      <span className="text-sm" style={S.sub}>Loading tenant details…</span>
    </div>
  );

  if (!tenant) return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" /> Tenant not found.
      </div>
      <Link href="/admin/tenants" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium" style={S.accent}>
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>
    </div>
  );

  const completedCos = companies.filter((c) => c.onboarding_status === "COMPLETED").length;
  const activeUsers  = users.filter((u) => u.is_active).length;
  const planLabel    = tenant.plan_id?.replace("PLAN_", "") || "—";
  const companyMap   = Object.fromEntries(companies.map((c) => [c.company_id, c.company_name]));
  const isSystemTenant = tenant?.tenant_id === "00000000-0000-0000-0000-000000000000" || tenant?.tenant_code === "system";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <Link href="/admin/tenants" className="inline-flex items-center gap-1.5 text-sm font-medium mb-4 hover:underline" style={S.sub}>
          <ArrowLeft className="w-4 h-4" /> Back to Tenants
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black" style={S.primary}>{tenant.tenant_name}</h1>
            <p className="text-sm mt-0.5 flex items-center gap-1.5" style={S.sub}>
              <Mail className="w-3.5 h-3.5" /> {tenant.billing_email || "—"}
              <span className="mx-2 opacity-40">·</span>
              <span className="font-mono text-xs">{tenant.tenant_code}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={tenant.is_active ? "green" : "default"}>
              {tenant.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {tenant.is_active ? "Active" : "Inactive"}
            </Badge>
            {tenant.is_trial && <Badge color="amber">Trial</Badge>}
          </div>
        </div>
      </div>

      {error   && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> {success}</div>}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Building} label="Companies" value={companies.length}
          sub={`${completedCos} onboarded · ${companies.length - completedCos} pending`} accent />
        <StatCard icon={Users}    label="Users"      value={users.length}
          sub={`${activeUsers} active · ${users.length - activeUsers} inactive`} accent />
        <StatCard icon={Layers}   label="Plan"       value={planLabel}
          sub={tenant.billing_cycle || "—"} accent />
        <StatCard icon={Database} label="Database"   value={tenant.db_name || "—"}
          sub={`${tenant.db_host || "localhost"}:${tenant.db_port || 3306}`} accent />
      </div>

      {/* Tenant Config */}
      <div className="rounded-lg border overflow-hidden" style={S.surface}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={S.border}>
          <Shield className="w-4 h-4" style={S.accent} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>Tenant Configuration</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <InfoRow label="Tenant ID"       value={tenant.tenant_id} />
          <InfoRow label="Tenant Code"     value={tenant.tenant_code} />
          <InfoRow label="Type"            value={tenant.tenant_type || "STANDARD"} />
          <InfoRow label="Plan"            value={planLabel} />
          <InfoRow label="Billing Cycle"   value={tenant.billing_cycle || "—"} />
          <InfoRow label="Max Companies"   value={tenant.max_companies} />
          <InfoRow label="Max Users"       value={tenant.max_users} />
          <InfoRow label="API Rate Limit"  value={tenant.api_rate_limit ? `${tenant.api_rate_limit} req/hr` : "—"} />
          <InfoRow label="Plan Start"      value={tenant.plan_start_date || "—"} />
          <InfoRow label="Plan End"        value={tenant.plan_end_date || "Ongoing"} />
          <InfoRow label="DB Host"         value={`${tenant.db_host || "localhost"}:${tenant.db_port || 3306}`} />
          <InfoRow label="DB Name"         value={tenant.db_name || "—"} />
          <InfoRow label="Billing Email"   value={tenant.billing_email || "—"} />
          <InfoRow label="Created At"      value={tenant.created_at ? new Date(tenant.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
        </div>
      </div>

      {/* Plan Upgrade */}
      <div className="rounded-lg border" style={S.surface}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={S.border}>
          <ArrowUpRight className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>Change Subscription Plan</h2>
        </div>
        <form onSubmit={handleUpgrade} className="px-6 py-5 flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={S.sub}>Select Plan</label>
            <select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)}
              disabled={isSystemTenant}
              className="border rounded-lg px-4 py-2.5 text-sm min-w-[220px] disabled:opacity-60 cursor-not-allowed" style={S.input}>
              <option value="">— Select a plan —</option>
              {plans.map((p) => (
                <option key={p.plan_id} value={p.plan_id}>{p.plan_name} — {p.billing_cycle} · ${p.price}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={isSystemTenant || !selectedPlan || upgrading || selectedPlan === tenant?.plan_id}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {upgrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
            {upgrading ? "Updating…" : "Apply Plan Change"}
          </button>
          {isSystemTenant ? (
            <p className="text-xs text-amber-600 font-semibold">This is the platform admin tenant; subscription plan is fixed.</p>
          ) : selectedPlan && selectedPlan === tenant?.plan_id && (
            <p className="text-xs" style={S.muted}>This is the current plan.</p>
          )}
        </form>
      </div>

      {/* ── Companies Table ── */}
      <div className="rounded-lg border overflow-hidden" style={S.surface}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={S.border}>
          <Building className="w-4 h-4" style={S.accent} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>
            Companies under this Tenant ({companies.length})
          </h2>
          <button onClick={loadAll} className="ml-auto text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg border" style={{ ...S.raised, ...S.sub }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={S.raised}>
                {["#", "Company Name", "Reg. No.", "Country", "Currency", "NOB", "LOBs", "Onboarding", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={S.muted}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-sm" style={S.muted}>No companies registered yet.</td></tr>
              ) : companies.map((co, idx) => {
                const d          = companyDetails[co.company_id];
                const isExpanded = expandedCompany === co.company_id;
                const isLoading  = loadingDetails[co.company_id];

                const regNo      = d?.company?.registration_no  || co.company_reg_no || "—";
                const country    = d?.company?.country_id        || co.country         || "—";
                const currency   = d?.company?.base_currency_id  || co.currency_id     || "—";
                const modules    = d?.modules || [];

                const nobCodes   = modules.filter((m: string) => !m.includes("_"));
                const lobCodes   = modules.filter((m: string) => m.includes("_"));

                // Resolve country name
                const countryName = CountryMap[country] || country;

                // Resolve currency name
                const currencyObj = currencies.find(c => c.currency_id === currency || c.iso_code === currency);
                const currencyName = currencyObj ? `${currencyObj.currency_name} (${currencyObj.iso_code})` : currency;

                // Resolve Nature of Business names
                const resolvedNobs = nobCodes.map((code: string) => {
                  const found = nobs.find(n => n.nob_code === code);
                  return found ? found.nob_name : code;
                });

                // Resolve Line of Business names
                const resolvedLobs = lobCodes.map((code: string) => {
                  const found = lobs.find(l => l.lob_code === code);
                  return found ? found.lob_name : code;
                });

                return (
                  <React.Fragment key={co.company_id}>
                    <tr
                      onClick={() => toggleExpand(co.company_id)}
                      className="border-b transition-colors cursor-pointer hover:opacity-90"
                      style={{ ...S.border, backgroundColor: isExpanded ? "var(--accent-muted)" : undefined }}
                    >
                      <td className="px-4 py-3.5 font-mono text-xs" style={S.muted}>{idx + 1}</td>
                      <td className="px-4 py-3.5 font-semibold" style={S.primary}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[10px] font-black shrink-0"
                            style={{ backgroundColor: "var(--accent)" }}>
                            {co.company_code?.substring(0, 2) || "CO"}
                          </div>
                          <div>
                            <div>{co.company_name || "—"}</div>
                            <div className="text-[10px] font-mono" style={S.muted}>{co.company_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs" style={S.sub}>{regNo}</td>
                      <td className="px-4 py-3.5 text-xs" style={S.sub}>{countryName}</td>
                      <td className="px-4 py-3.5 text-xs font-semibold" style={S.sub}>
                        {currencyName}
                      </td>
                      <td className="px-4 py-3.5">
                        {resolvedNobs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {resolvedNobs.map((n: string) => (
                              <span key={n} className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                                style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>{n}</span>
                            ))}
                          </div>
                        ) : <span style={S.muted}>—</span>}
                      </td>
                      <td className="px-4 py-3.5 max-w-[220px]">
                        {resolvedLobs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {resolvedLobs.slice(0, 3).map((l: string) => (
                              <span key={l} className="text-[10px] px-1.5 py-0.5 rounded border font-semibold"
                                style={{ backgroundColor: "var(--surface-raised)", color: "var(--text-secondary)", borderColor: "var(--border)" }}>{l}</span>
                            ))}
                            {resolvedLobs.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ ...S.raised, ...S.muted }}>+{resolvedLobs.length - 3}</span>
                            )}
                          </div>
                        ) : <span style={S.muted}>—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {co.onboarding_status === "COMPLETED" ? (
                          <Badge color="green"><CheckCircle className="w-3 h-3" /> Complete</Badge>
                        ) : (
                          <Badge color="amber"><Activity className="w-3 h-3" /> {co.onboarding_status || "Pending"}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-xs font-semibold flex items-center gap-1 justify-end" style={S.accent}>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          {isExpanded ? "Hide" : "Details"}
                        </span>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr key={`${co.company_id}-expanded`}>
                        <td colSpan={9} className="border-b p-0" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                          {isLoading ? (
                            <div className="flex items-center gap-2 px-8 py-6 text-sm" style={S.muted}>
                              <RefreshCw className="w-4 h-4 animate-spin" /> Loading details…
                            </div>
                          ) : d ? (
                            <div className="px-6 py-5 space-y-6 border-l-4" style={{ borderColor: "var(--accent)" }}>

                              {/* Profile */}
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={S.muted}>
                                  <Building className="w-3.5 h-3.5" /> Company Profile
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                                  <MiniCard label="Legal Name"   value={d.company?.company_name} />
                                  <MiniCard label="Display Name" value={d.company?.company_display_name || d.company?.company_name} />
                                  <MiniCard label="Type"         value={d.company?.company_type} />
                                  <MiniCard label="Industry"     value={d.company?.industry_type} />
                                  <MiniCard label="Tax ID"       value={d.company?.tax_id} />
                                  <MiniCard label="Country"      value={countryName} />
                                  <MiniCard label="Currency"     value={currencyName} />
                                </div>
                              </div>

                              {/* Address */}
                              {d.address && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={S.muted}>
                                    <MapPin className="w-3.5 h-3.5" /> Registered Address
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    <MiniCard label="Type"    value={d.address.address_type} />
                                    <MiniCard label="Line 1"  value={d.address.line1} />
                                    <MiniCard label="City"    value={d.address.city} />
                                    <MiniCard label="State"   value={d.address.state_id} />
                                    <MiniCard label="Pincode" value={d.address.pincode} />
                                  </div>
                                </div>
                              )}

                              {/* Contact */}
                              {d.contact && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={S.muted}>
                                    <Phone className="w-3.5 h-3.5" /> Primary Contact
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <MiniCard label="Name"        value={d.contact.full_name} />
                                    <MiniCard label="Designation" value={d.contact.designation} />
                                    <MiniCard label="Email"       value={d.contact.email} />
                                    <MiniCard label="Phone"       value={d.contact.phone_primary} />
                                  </div>
                                </div>
                              )}

                              {/* Fiscal */}
                              {d.fiscal && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={S.muted}>
                                    <Calendar className="w-3.5 h-3.5" /> Fiscal Configuration
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                    <MiniCard label="Fiscal Year"    value={d.fiscal.current_fiscal_year} />
                                    <MiniCard label="Start Month"    value={d.fiscal.fiscal_start_month} />
                                    <MiniCard label="Period Type"    value={d.fiscal.period_type} />
                                    <MiniCard label="Standard"       value={d.fiscal.accounting_standard} />
                                    <MiniCard label="Inventory Val." value={d.fiscal.inventory_valuation} />
                                    <MiniCard label="FY Format"      value={d.fiscal.fiscal_year_format} />
                                  </div>
                                </div>
                              )}

                              {/* Modules */}
                              {modules.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={S.muted}>
                                    <Layers className="w-3.5 h-3.5" /> Enabled Modules ({modules.length})
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {modules.map((m: string) => {
                                      const isLob = m.includes("_");
                                      const displayName = isLob
                                        ? (lobs.find(l => l.lob_code === m)?.lob_name || m)
                                        : (nobs.find(n => n.nob_code === m)?.nob_name || m);
                                      return (
                                        <span key={m}
                                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isLob ? "border-teal-200 bg-teal-50 text-teal-700" : "border-purple-200 bg-purple-50 text-purple-700"}`}>
                                          {displayName}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Associated Members */}
                              {(() => {
                                const coUsers = users.filter(u => u.company_id === co.company_id);
                                return coUsers.length > 0 ? (
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5" style={S.muted}>
                                      <Users className="w-3.5 h-3.5" /> Associated Members ({coUsers.length})
                                    </p>
                                    <div className="rounded-lg border overflow-hidden" style={S.surface}>
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b" style={S.raised}>
                                            {["#", "Name", "Email", "Phone", "Type", "Role", "Status"].map(h => (
                                              <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={S.muted}>{h}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {coUsers.map((u: any, i: number) => (
                                            <tr key={u.user_id} className="border-b" style={S.border}>
                                              <td className="px-4 py-2.5 font-mono" style={S.muted}>{i + 1}</td>
                                              <td className="px-4 py-2.5 font-semibold" style={S.primary}>
                                                <div className="flex items-center gap-2">
                                                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                                                    style={{ backgroundColor: "var(--accent)" }}>
                                                    {u.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?"}
                                                  </div>
                                                  {u.full_name || "—"}
                                                </div>
                                              </td>
                                              <td className="px-4 py-2.5" style={S.sub}>{u.email || "—"}</td>
                                              <td className="px-4 py-2.5" style={S.sub}>{u.phone || "—"}</td>
                                              <td className="px-4 py-2.5">
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded border"
                                                  style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                                                  {u.user_type?.replace(/_/g, " ") || "—"}
                                                </span>
                                              </td>
                                              <td className="px-4 py-2.5" style={S.sub}>{u.role_name || u.role_code || "—"}</td>
                                              <td className="px-4 py-2.5">
                                                <Badge color={u.is_active ? "green" : "default"}>
                                                  {u.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          ) : (
                            <p className="px-8 py-5 text-xs" style={S.muted}>No detailed setup found for this company.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Users Table ── */}
      <div className="rounded-lg border overflow-hidden" style={S.surface}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={S.border}>
          <Users className="w-4 h-4" style={S.accent} />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={S.sub}>
            Users in this Tenant ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={S.raised}>
                {["#", "Full Name", "Email", "Phone", "Type", "Role", "Company", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap" style={S.muted}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-sm" style={S.muted}>No users found.</td></tr>
              ) : users.map((u, idx) => (
                <tr key={u.user_id || idx} className="border-b hover:opacity-90 transition-opacity" style={S.border}>
                  <td className="px-4 py-3.5 font-mono text-xs" style={S.muted}>{idx + 1}</td>
                  <td className="px-4 py-3.5 font-semibold" style={S.primary}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: "var(--accent)" }}>
                        {u.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?"}
                      </div>
                      {u.full_name || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={S.sub}>{u.email || "—"}</td>
                  <td className="px-4 py-3.5 text-xs" style={S.sub}>{u.phone || "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                      style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                      {u.user_type?.replace(/_/g, " ") || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={S.sub}>{u.role_name || u.role_code || "—"}</td>
                  <td className="px-4 py-3.5 text-xs" style={S.sub}>
                    {u.company_id ? (
                      <div>
                        <div className="font-semibold" style={S.primary}>{companyMap[u.company_id] || "Unknown"}</div>
                        <div className="font-mono text-[10px] mt-0.5" style={S.muted}>{u.company_id.substring(0, 12)}…</div>
                      </div>
                    ) : u.user_type === "TENANT_ADMIN" ? (
                      <Badge color="purple">All Companies</Badge>
                    ) : (
                      <span style={S.muted}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge color={u.is_active ? "green" : "default"}>
                      {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
