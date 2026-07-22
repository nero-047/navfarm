"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, RefreshCw, AlertCircle, CheckCircle, X, Shield, Building2, Search, Users,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, NavUser } from "../../../hooks/useAuth";

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

const inputCls = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={S.sub}>{children}</label>;
}

function UserTypeBadge({ type }: { type: string }) {
  const styles: Record<string, React.CSSProperties> = {
    TENANT_ADMIN:  { background: "#eef0f8", color: "#0b1248", border: "1px solid #ccd1e3" },
    COMPANY_ADMIN: { background: "#eaf1ff", color: "#1c4aa9", border: "1px solid #bfd0f3" },
    STANDARD_USER: { background: "var(--surface-raised)", color: "var(--text-secondary)", border: "1px solid var(--border)" },
    SYSTEM_ADMIN:  { background: "#FEE2E2", color: "#DC2626", border: "1px solid #FCA5A5" },
  };
  const st = styles[type] || styles.STANDARD_USER;
  return (
    <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide" style={st}>
      {type?.replace(/_/g, " ")}
    </span>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const [user,          setUser]          = useState<NavUser | null>(null);
  const [tenantId,      setTenantId]      = useState("");
  const [users,         setUsers]         = useState<any[]>([]);
  const [companies,     setCompanies]     = useState<any[]>([]);   // all companies in tenant
  const [activeCompany, setActiveCompany] = useState<any>(null);   // company admin's company
  const [roles,         setRoles]         = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [query,         setQuery]         = useState("");

  // Add user form
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [selectedCompId, setSelectedCompId] = useState(""); // for tenant admin to pick company
  const [newUser, setNewUser] = useState({
    email: "", password_hash: "", full_name: "", phone: "", user_type: "STANDARD_USER",
  });

  // Role assign
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [targetRoleId,    setTargetRoleId]    = useState("");
  const [assigning,       setAssigning]       = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tid = getStoredTenantId();
    if (!token || !storedUser || !tid) { router.replace("/"); return; }
    setUser(storedUser); setTenantId(tid);
    if (storedUser.userType === "TENANT_ADMIN") {
      setNewUser((u) => ({ ...u, user_type: "COMPANY_ADMIN" }));
    }
    loadData(storedUser, tid);
  }, [router]);

  const loadData = async (storedUser: NavUser, tid: string) => {
    setLoading(true); setError("");
    try {
      const [usersList, companiesList] = await Promise.all([
        api.get("/auth/users"),
        api.get(`/company/tenant/${tid}`),
      ]);
      setUsers(Array.isArray(usersList) ? usersList : []);
      setCompanies(Array.isArray(companiesList) ? companiesList : []);

      if (storedUser.userType === "TENANT_ADMIN") {
        // Tenant Admin — no specific company; set first for invite form default
        if (companiesList.length > 0) setSelectedCompId(companiesList[0].company_id);
        // Don't fetch roles — tenant admin manages admins, not roles
      } else {
        // Company Admin / Standard User — their own company
        const myId = storedUser.companyId || storedUser.company_id;
        const myComp = companiesList.find((c: any) => c.company_id === myId) || companiesList[0] || null;
        setActiveCompany(myComp);
        if (myComp?.company_id) {
          try {
            const rolesList = await api.get(`/role/company/${myComp.company_id}`);
            setRoles(Array.isArray(rolesList) ? rolesList : []);
          } catch {
            // Role fetch failure is non-critical — skip silently
          }
        }
      }
    } catch (e: any) {
      // Only show critical load errors, not permission-related backend warnings
      const msg = e?.message || "";
      if (!msg.toLowerCase().includes("cannot manage") && !msg.toLowerCase().includes("tenant admin")) {
        setError(msg || "Failed to load team data.");
      }
    } finally { setLoading(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCompanyId = user?.userType === "TENANT_ADMIN" ? selectedCompId : activeCompany?.company_id;
    if (!targetCompanyId || !tenantId) {
      setError("Please select a company to assign this user to.");
      return;
    }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const targetComp = companies.find((c) => c.company_id === targetCompanyId);
      await api.post("/auth/register-admin", {
        ...newUser,
        tenant_id: tenantId,
        company_id: targetCompanyId,
        timezone_pref_id: targetComp?.default_timezone_id || "Asia/Kolkata",
      });
      setSuccess("User registered successfully.");
      setShowAddForm(false);
      setNewUser({ email: "", password_hash: "", full_name: "", phone: "", user_type: user?.userType === "TENANT_ADMIN" ? "COMPANY_ADMIN" : "STANDARD_USER" });
      const list = await api.get("/auth/users");
      setUsers(Array.isArray(list) ? list : []);
    } catch (err: any) { setError(err?.message || "Failed to register user."); }
    finally { setSubmitting(false); }
  };

  const handleAssignRole = async (userId: string) => {
    if (!targetRoleId) return;
    setAssigning(true); setError(""); setSuccess("");
    try {
      await api.post("/role/assign", { userId, roleId: targetRoleId });
      setSuccess("Role assigned successfully.");
      setAssigningUserId(null); setTargetRoleId("");
      const list = await api.get("/auth/users");
      setUsers(Array.isArray(list) ? list : []);
    } catch (err: any) { setError(err?.message || "Failed to assign role."); }
    finally { setAssigning(false); }
  };

  const handleUnassignRole = async (assignId: string) => {
    setError(""); setSuccess("");
    try {
      await api.delete(`/role/assign/${assignId}`);
      setSuccess("Role removed.");
      const list = await api.get("/auth/users");
      setUsers(Array.isArray(list) ? list : []);
    } catch (err: any) { setError(err?.message || "Failed to remove role."); }
  };

  const isTenantAdmin  = user?.userType === "TENANT_ADMIN";
  const isCompanyAdmin = user?.userType === "COMPANY_ADMIN";

  // Build a companyId → name map for the user table
  const companyMap: Record<string, string> = {};
  companies.forEach((c) => { companyMap[c.company_id] = c.company_name; });

  // Company Admin must NOT see TENANT_ADMIN users.
  // They should only see users that belong to their own company.
  const myCompanyId = user?.companyId || user?.company_id || activeCompany?.company_id;
  const displayedUsers = isCompanyAdmin
    ? users.filter((u) => u.user_type !== "TENANT_ADMIN" && u.company_id === myCompanyId)
    : users; // Tenant Admin sees everyone
  const visibleUsers = displayedUsers.filter((member) => {
    const value = `${member.full_name ?? ""} ${member.email ?? ""} ${member.user_type ?? ""} ${companyMap[member.company_id] ?? ""}`.toLowerCase();
    return value.includes(query.trim().toLowerCase());
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
      <span className="text-sm" style={S.sub}>Loading team…</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1c4aa9]">People & access</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[#2e313f] sm:text-[30px]">Team management</h1>
          <p className="mt-1 text-sm leading-6 text-[#707070]">
            Invite people, control workspace access, and assign company roles.
          </p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1248] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#151d5e] active:scale-[0.98]">
          <UserPlus className="w-4 h-4" /> Invite User
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Workspace members", value: displayedUsers.length, detail: "Across the organization", tone: "bg-blue-50 text-[#1c4aa9]" },
          { label: "Administrators", value: displayedUsers.filter((member) => member.user_type?.includes("ADMIN")).length, detail: "Tenant and company admins", tone: "bg-red-50 text-[#c24332]" },
          { label: "Roles assigned", value: displayedUsers.filter((member) => member.roles?.length).length, detail: `${displayedUsers.filter((member) => !member.roles?.length).length} awaiting assignment`, tone: "bg-emerald-50 text-emerald-700" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#e3e7ee] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-medium text-[#707070]">{item.label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-[#2e313f]">{item.value}</p></div>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}><Users size={17} /></span>
            </div>
            <p className="mt-2 text-[11px] text-[#8a8a8a]">{item.detail}</p>
          </div>
        ))}
      </div>

      {error   && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> {success}</div>}

      {/* ── Add User Form ── */}
      {showAddForm && (
        <div className="overflow-hidden rounded-2xl border border-[#e3e7ee] bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b" style={S.border}>
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" style={S.accent} />
              <h2 className="text-sm font-semibold text-[#2e313f]">Register new team member</h2>
            </div>
            <button onClick={() => setShowAddForm(false)} style={S.muted}><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleAddUser} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <input required value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Jane Smith" className={inputCls} style={S.input} />
            </div>
            <div>
              <Label>Email Address</Label>
              <input required type="email" value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="jane@company.com" className={inputCls} style={S.input} />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <input required type="password" value={newUser.password_hash}
                onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })}
                placeholder="Min. 8 characters" className={inputCls} style={S.input} />
            </div>
            <div>
              <Label>Phone</Label>
              <input value={newUser.phone}
                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+91 98765 43210" className={inputCls} style={S.input} />
            </div>

            {/* Tenant Admin picks target company */}
            {isTenantAdmin && (
              <div>
                <Label>Assign to Company</Label>
                <select value={selectedCompId} onChange={(e) => setSelectedCompId(e.target.value)}
                  className={inputCls} style={S.input}>
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label>User Type</Label>
              <select value={newUser.user_type}
                onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                className={inputCls} style={S.input}>
                {isTenantAdmin ? (
                  <option value="COMPANY_ADMIN">Company Administrator</option>
                ) : (
                  // Company Admin can only invite standard operators for their company
                  <option value="STANDARD_USER">Standard User</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "var(--accent)" }}>
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {submitting ? "Registering…" : "Register User"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border" style={{ ...S.raised, ...S.sub }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="overflow-hidden rounded-2xl border border-[#e3e7ee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#ededed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#2e313f]">Workspace directory</h2>
            <p className="mt-0.5 text-xs text-[#8a8a8a]">{displayedUsers.length} member{displayedUsers.length !== 1 ? "s" : ""}</p>
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#e3e7ee] bg-[#f7f8fa] px-3 text-[#8a90a0] transition focus-within:border-[#2f66d0] focus-within:bg-white focus-within:ring-[3px] focus-within:ring-blue-100/80 sm:w-72">
            <Search size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members" className="nf-embedded-input min-w-0 flex-1 border-0 bg-transparent text-xs text-[#30364b] outline-none" />
          </label>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-sm">
          <thead>
            <tr className="border-b border-[#ededed] bg-[#fafafa]">
              {["#", "Name", "Email", isTenantAdmin ? "Company" : "", "Type", "Assigned Roles", "Actions"]
                .filter(Boolean)
                .map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a90a0]">{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-sm" style={S.muted}>No team members found.</td></tr>
            )}
            {visibleUsers.map((u, idx) => (
              <React.Fragment key={u.user_id}>
                <tr className="border-b border-[#ededed] transition-colors last:border-0 hover:bg-[#fafbfc]">
                  <td className="px-5 py-4 text-xs text-[#9aa0ad]">{idx + 1}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1c4aa9,#0b1248)] text-[10px] font-bold text-white">
                        {u.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?"}
                      </div>
                      <span className="font-semibold text-[#2e313f]">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#646b7c]">{u.email}</td>

                  {/* Company column only for Tenant Admin */}
                  {isTenantAdmin && (
                    <td className="px-5 py-4">
                      {u.company_id ? (
                        <div className="flex items-center gap-1 text-xs" style={S.sub}>
                          <Building2 className="w-3 h-3 shrink-0" style={S.muted} />
                          {companyMap[u.company_id] || u.company_id?.substring(0, 8) + "…"}
                        </div>
                      ) : (
                        <span className="text-xs" style={S.muted}>—</span>
                      )}
                    </td>
                  )}

                  <td className="px-5 py-4"><UserTypeBadge type={u.user_type} /></td>
                  <td className="px-5 py-4">
                    {u.roles && u.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r: any) => (
                          <span key={r.assign_id || r.role_id}
                            className="inline-flex items-center gap-1 text-[11px] border px-2 py-0.5 rounded font-medium"
                            style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                            <Shield className="w-3 h-3" /> {r.role_name}
                            {r.assign_id && (
                              <button onClick={() => handleUnassignRole(r.assign_id)}
                                className="ml-1 hover:text-red-500 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs" style={S.muted}>No roles assigned</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {/* Role assignment only available for Company Admin (has roles) */}
                    {!isTenantAdmin && roles.length > 0 && (
                      <button
                        onClick={() => setAssigningUserId(assigningUserId === u.user_id ? null : u.user_id)}
                        className="text-xs font-semibold hover:underline" style={S.accent}>
                        Assign Role
                      </button>
                    )}
                  </td>
                </tr>

                {/* Role assign inline row */}
                {!isTenantAdmin && assigningUserId === u.user_id && (
                  <tr key={`${u.user_id}-assign`}>
                    <td colSpan={6} className="px-5 py-3 border-b" style={{ backgroundColor: "var(--accent-muted)", borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Shield className="w-4 h-4 shrink-0" style={S.accent} />
                        <select value={targetRoleId} onChange={(e) => setTargetRoleId(e.target.value)}
                          className="border rounded-lg px-3 py-2 text-sm min-w-[180px]" style={S.input}>
                          <option value="">— Select role —</option>
                          {roles.map((r: any) => (
                            <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                          ))}
                        </select>
                        <button disabled={!targetRoleId || assigning}
                          onClick={() => handleAssignRole(u.user_id)}
                          className="px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
                          style={{ backgroundColor: "var(--accent)" }}>
                          {assigning ? "Assigning…" : "Assign"}
                        </button>
                        <button onClick={() => { setAssigningUserId(null); setTargetRoleId(""); }} style={S.muted}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
