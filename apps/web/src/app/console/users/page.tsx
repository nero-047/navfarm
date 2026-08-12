"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus, RefreshCw, AlertCircle, CheckCircle, Shield, Building2, Search, Users,
  Pencil,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, getActiveCompanyId, NavUser } from "../../../hooks/useAuth";
import { Dialog } from "../../../components/ui/dialog";
import { EditMemberModal, UserTypeBadge, Label } from "../../../components/console/edit-member-modal";

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

// GET /auth/users returns each user's assigned role as flat fields
// (role_id/role_code/role_name/assign_id) directly on the user object, but
// every place this page displays "assigned roles" (the summary stat, the
// table column, and the edit modal's Role Assignment section) reads a
// `roles: [...]` array — the shape GET /user/:id actually returns. Without
// this normalization, a user who already has a role assigned still shows
// "No roles assigned" everywhere until you open the edit modal and trigger
// its own re-fetch, which made a real assignment look like it had silently
// failed. Apply this to every raw /auth/users response before it hits state.
function normalizeUserRoles(u: any) {
  if (Array.isArray(u.roles)) return u;
  return {
    ...u,
    roles: u.role_id ? [{ role_id: u.role_id, role_code: u.role_code, role_name: u.role_name, assign_id: u.assign_id }] : [],
  };
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const router = useRouter();
  const [user,          setUser]          = useState<NavUser | null>(null);
  const [tenantId,      setTenantId]      = useState("");
  const [users,         setUsers]         = useState<any[]>([]);
  const [companies,     setCompanies]     = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [roles,         setRoles]         = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [query,         setQuery]         = useState("");

  // Add user form
  const [showAddForm,    setShowAddForm]    = useState(false);
  const [submitting,     setSubmitting]     = useState(false);
  const [selectedCompId, setSelectedCompId] = useState("");
  const [newUser, setNewUser] = useState({
    email: "", password_hash: "", full_name: "", phone: "", user_type: "STANDARD_USER",
  });

  // Edit modal
  const [editingMember, setEditingMember] = useState<any | null>(null);

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
      const [usersListRaw, companiesList] = await Promise.all([
        api.get("/auth/users"),
        api.get(`/company/tenant/${tid}`),
      ]);
      const usersList = (Array.isArray(usersListRaw) ? usersListRaw : []).map(normalizeUserRoles);
      setCompanies(Array.isArray(companiesList) ? companiesList : []);

      const activeId = getActiveCompanyId() || storedUser.companyId || (storedUser as any).company_id;
      const myComp   = companiesList.find((c: any) => c.company_id === activeId) || companiesList[0] || null;

      if (storedUser.userType === "TENANT_ADMIN") {
        setUsers(Array.isArray(usersList) ? usersList : []);
        if (companiesList.length > 0) setSelectedCompId(companiesList[0].company_id);
      } else {
        // Merge home-company users + multi-company junction members
        // so users assigned to this company via user_company_assignments also appear
        const mergedUsers: any[] = Array.isArray(usersList) ? usersList : [];

        if (myComp?.company_id) {
          try {
            const junctionMembers: any[] = await api.get(`/user-company/company/${myComp.company_id}/members`);
            if (Array.isArray(junctionMembers) && junctionMembers.length > 0) {
              // Build a set of already-known user IDs
              const knownIds = new Set(mergedUsers.map((u: any) => u.user_id));
              // Add junction members not already in the list
              junctionMembers.forEach((m: any) => {
                if (!knownIds.has(m.user_id)) {
                  mergedUsers.push({
                    user_id:    m.user_id,
                    full_name:  m.full_name,
                    email:      m.email,
                    user_type:  m.user_type,
                    company_id: myComp.company_id, // treat as member of this company
                    is_active:  m.is_active,
                    roles:      [],
                    _via_assignment: true, // flag: added via multi-company
                  });
                }
              });
            }
          } catch { /* junction table may not exist yet — non-critical */ }

          // Filter to only this company's members (home users + junction members)
          const homeUsers = mergedUsers.filter(
            (u: any) => u.company_id === myComp.company_id && u.user_type !== "TENANT_ADMIN"
          );
          setUsers(homeUsers);
          setActiveCompany(myComp);

          try {
            const rolesList = await api.get(`/role/company/${myComp.company_id}`);
            setRoles(Array.isArray(rolesList) ? rolesList : []);
          } catch { /* non-critical */ }
        } else {
          setUsers(mergedUsers.filter((u: any) => u.user_type !== "TENANT_ADMIN"));
        }
      }
    } catch (e: any) {
      const msg = e?.message || "";
      if (!msg.toLowerCase().includes("cannot manage") && !msg.toLowerCase().includes("tenant admin")) {
        setError(msg || "Failed to load team data.");
      }
    } finally { setLoading(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCompanyId = user?.userType === "TENANT_ADMIN" ? selectedCompId : activeCompany?.company_id;
    if (!targetCompanyId || !tenantId) { setError("Please select a company to assign this user to."); return; }
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
      setUsers((Array.isArray(list) ? list : []).map(normalizeUserRoles));
    } catch (err: any) { setError(err?.message || "Failed to register user."); }
    finally { setSubmitting(false); }
  };

  const isTenantAdmin  = user?.userType === "TENANT_ADMIN";
  const isCompanyAdmin = user?.userType === "COMPANY_ADMIN";

  const companyMap: Record<string, string> = {};
  companies.forEach((c) => { companyMap[c.company_id] = c.company_name; });

  const activeCompanyId = getActiveCompanyId() || user?.companyId || (user as any)?.company_id || activeCompany?.company_id;

  // For COMPANY_ADMIN: only show users belonging to the active company, exclude TENANT_ADMIN
  // For TENANT_ADMIN: show all users
  const displayedUsers = isTenantAdmin
    ? users
    : users.filter((u) =>
        u.user_type !== "TENANT_ADMIN" &&
        u.company_id === activeCompanyId
      );

  // Access rule: a COMPANY_ADMIN cannot edit another COMPANY_ADMIN
  const canEdit = (targetUser: any): boolean => {
    if (targetUser.user_id === user?.userId) return true; // can always view/edit own profile (deactivation is blocked separately)
    if (isTenantAdmin) return true; // TENANT_ADMIN can edit anyone
    if (targetUser.user_type === "COMPANY_ADMIN" && isCompanyAdmin) return false; // blocked
    if (targetUser.user_type === "TENANT_ADMIN") return false; // always blocked
    return true;
  };

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
          <div key={item.label} className="rounded-2xl border border-(--border) bg-(--surface) p-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
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
      <Dialog open={showAddForm} onClose={() => setShowAddForm(false)} title="Invite a team member" description="Create an account and assign it to the appropriate company workspace." maxWidth="lg">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label>Full Name</Label>
              <input required value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                placeholder="Jane Smith" className={inputCls} style={S.input} />
            </div>
            <div>
              <Label>Email Address</Label>
              <input required type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="jane@company.com" className={inputCls} style={S.input} />
            </div>
            <div>
              <Label>Temporary Password</Label>
              <input required type="password" value={newUser.password_hash} onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })}
                placeholder="Min. 8 characters" className={inputCls} style={S.input} />
            </div>
            <div>
              <Label>Phone</Label>
              <input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                placeholder="+91 98765 43210" className={inputCls} style={S.input} />
            </div>

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
              <select value={newUser.user_type} onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
                className={inputCls} style={S.input}>
                {isTenantAdmin ? (
                  <option value="COMPANY_ADMIN">Company Administrator</option>
                ) : (
                  <option value="STANDARD_USER">Standard User</option>
                )}
              </select>
            </div>

            <div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-[#edf0f4] pt-5 sm:flex-row sm:justify-end">
              <button type="submit" disabled={submitting}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b1248] px-5 text-sm font-semibold text-white transition hover:bg-[#151d5e] disabled:opacity-50">
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {submitting ? "Registering…" : "Register User"}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="h-11 rounded-xl border border-(--border) bg-(--surface) px-5 text-sm font-medium text-(--text-secondary) hover:bg-(--surface-raised)">
                Cancel
              </button>
            </div>
          </form>
      </Dialog>

      {/* ── Users Table ── */}
      <div className="overflow-hidden rounded-2xl border border-(--border) bg-(--surface) shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="flex flex-col gap-3 border-b border-[#ededed] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-[#2e313f]">Workspace directory</h2>
            <p className="mt-0.5 text-xs text-[#8a8a8a]">{displayedUsers.length} member{displayedUsers.length !== 1 ? "s" : ""}</p>
          </div>
          <label className="flex h-10 w-full items-center gap-2 rounded-xl border border-(--border) bg-(--surface-raised) px-3 text-(--text-muted) transition focus-within:border-(--input-border-focus) focus-within:bg-(--surface) focus-within:ring-[3px] focus-within:ring-blue-100/80 sm:w-72">
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
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-(--text-muted)">{h}</th>
                ))}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-sm" style={S.muted}>No team members found.</td></tr>
            )}
            {visibleUsers.map((u, idx) => (
              <tr key={u.user_id} className="border-b border-[#ededed] transition-colors last:border-0 hover:bg-[#fafbfc]">
                <td className="px-5 py-4 text-xs text-[#9aa0ad]">{idx + 1}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold text-white ${u._via_assignment ? "bg-violet-600" : "bg-[linear-gradient(135deg,#1c4aa9,#0b1248)]"}`}>
                      {u.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold" style={S.primary}>{u.full_name}</span>
                        {u._via_assignment && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.3)" }}
                            title="This user manages multiple companies"
                          >
                            Multi-co
                          </span>
                        )}
                      </div>
                      {(u.designation || u.department) && (
                        <p className="mt-0.5 text-[10px] text-(--text-muted)">
                          {[u.designation, u.department].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-[#646b7c]">{u.email}</td>

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

                {/* Assigned Roles */}
                <td className="px-5 py-4">
                  {u.roles && u.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r: any) => (
                        <span key={r.assign_id || r.role_id}
                          className="inline-flex items-center gap-1 text-[11px] border px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}>
                          <Shield className="w-3 h-3" /> {r.role_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs" style={S.muted}>No roles assigned</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  {canEdit(u) ? (
                    <button
                      onClick={() => setEditingMember(u)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "var(--accent-muted)",
                        color: "var(--accent)",
                        borderColor: "var(--accent)",
                      }}
                      title="Edit member & assign roles"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg border"
                      style={{
                        backgroundColor: "var(--surface-raised)",
                        color: "var(--text-muted)",
                        borderColor: "var(--border)",
                        cursor: "not-allowed",
                      }}
                      title={u.user_type === "COMPANY_ADMIN" ? "Cannot edit another Company Admin" : "Insufficient permissions"}
                    >
                      <Shield className="w-3 h-3" /> Protected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* ── Edit Member Modal ── */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          roles={roles}
          isTenantAdmin={isTenantAdmin}
          allCompanies={companies}
          isSelf={!!user?.userId && editingMember.user_id === user.userId}
          onClose={() => setEditingMember(null)}
          onSaved={async () => {
            setEditingMember(null);
            setSuccess("Member updated successfully.");
            const list = await api.get("/auth/users");
            setUsers((Array.isArray(list) ? list : []).map(normalizeUserRoles));
          }}
        />
      )}
    </div>
  );
}
