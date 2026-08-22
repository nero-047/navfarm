"use client";

import React, { useEffect, useState } from "react";
import {
  RefreshCw, AlertCircle, X, Shield, Building2, UserCheck, ChevronDown,
} from "lucide-react";
import { api } from "../../services/api-client";
import { Badge, type BadgeProps } from "../ui/badge";

const S = {
  surface:  { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  raised:   { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary:  { color: "var(--text-primary)" },
  sub:      { color: "var(--text-secondary)" },
  muted:    { color: "var(--text-muted)" },
  accent:   { color: "var(--accent)" },
  input:    { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

const inputCls = "nf-input";

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1" style={S.sub}>{children}</label>;
}

export function UserTypeBadge({ type }: { type: string }) {
  const variants: Record<string, BadgeProps["variant"]> = {
    TENANT_ADMIN: "neutral",
    COMPANY_ADMIN: "neutral",
    STANDARD_USER: "neutral",
    SYSTEM_ADMIN: "danger",
  };
  return <Badge variant={variants[type] || "neutral"}>{type?.replace(/_/g, " ")}</Badge>;
}

export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? "success" : "danger"} dot>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

// ── Edit Member Modal ────────────────────────────────────────────────────────
// Shared between Team Management (/users) and the Companies page's
// "Company operators" panel — one place to view/edit a user's profile,
// toggle Account Active, assign/remove their role, and manage which
// companies they can access, instead of each screen building its own
// partial (and inevitably diverging) version of the same thing.
interface EditModalProps {
  member: any;
  roles: any[];
  isTenantAdmin: boolean;
  onClose: () => void;
  onSaved:        () => void;
  allCompanies:   any[];
  /** True when the account being edited is the currently logged-in user's
   * own — locks the Account Active checkbox on, since deactivating yourself
   * would lock you out with no other session able to undo it (the backend
   * rejects this too; this just surfaces it before the user tries). */
  isSelf?: boolean;
}

export function EditMemberModal({ member, roles, isTenantAdmin, onClose, onSaved, allCompanies, isSelf = false }: EditModalProps) {
  const [form, setForm] = useState({
    full_name:   member.full_name   || "",
    phone:       member.phone       || "",
    department:  member.department  || "",
    designation: member.designation || "",
    employee_id: member.employee_id || "",
    user_type:   member.user_type   || "STANDARD_USER",
    is_active:   member.is_active   !== false,
  });
  const [saving, setSaving]     = useState(false);
  const [error,  setError]      = useState("");

  // Role assignment state
  const [selectedRoleId,  setSelectedRoleId]  = useState("");
  const [assigning,       setAssigning]        = useState(false);
  const [assignError,     setAssignError]      = useState("");
  const [assignedRoles,   setAssignedRoles]    = useState<any[]>(member.roles || []);

  // Company assignment state
  const [companyAssignments,    setCompanyAssignments]    = useState<any[]>([]);
  const [companyAssignLoading,  setCompanyAssignLoading]  = useState(true);
  const [companyAssignError,    setCompanyAssignError]    = useState("");
  const [addingCompany,         setAddingCompany]         = useState(false);

  // Load existing company assignments on mount — only a TENANT_ADMIN can see/manage this section
  useEffect(() => {
    if (!isTenantAdmin) { setCompanyAssignLoading(false); return; }
    api.get(`/user-company/${member.user_id}/companies`)
      .then((rows: any[]) => {
        setCompanyAssignments(Array.isArray(rows) ? rows : []);
        setCompanyAssignError(""); // clear any stale error
      })
      .catch(() => {
        setCompanyAssignments([]);
        // Silent — table may not exist yet; backend auto-creates on next write
      })
      .finally(() => setCompanyAssignLoading(false));
  }, [member.user_id, isTenantAdmin]);

  const handleAddCompany = async (companyId: string) => {
    if (!companyId) return;
    setAddingCompany(true); setCompanyAssignError("");
    try {
      await api.post("/user-company/assign", { userId: member.user_id, companyId });
      // Re-fetch to get full company details
      const updated = await api.get(`/user-company/${member.user_id}/companies`);
      setCompanyAssignments(Array.isArray(updated) ? updated : []);
    } catch (err: any) {
      const msg = err?.message || "Failed to assign company.";
      // If table didn't exist, backend creates it — retry once automatically
      if (msg.toLowerCase().includes("doesn't exist") || msg.toLowerCase().includes("internal")) {
        try {
          await api.post("/user-company/assign", { userId: member.user_id, companyId });
          const updated = await api.get(`/user-company/${member.user_id}/companies`);
          setCompanyAssignments(Array.isArray(updated) ? updated : []);
        } catch (retryErr: any) {
          setCompanyAssignError(retryErr?.message || "Failed to assign company.");
        }
      } else {
        setCompanyAssignError(msg);
      }
    } finally { setAddingCompany(false); }
  };

  const handleRemoveCompany = async (assignId: string) => {
    setCompanyAssignError("");
    try {
      await api.delete(`/user-company/assign/${assignId}`);
      setCompanyAssignments((prev) => prev.filter((a) => a.assign_id !== assignId));
    } catch (err: any) {
      setCompanyAssignError(err?.message || "Failed to remove company.");
    }
  };

  // Companies not yet assigned
  const assignedCompanyIds = new Set(companyAssignments.map((a) => a.company_id));
  const unassignedCompanies = allCompanies.filter((c) => !assignedCompanyIds.has(c.company_id));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.put(`/user/${member.user_id}`, form);
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to update member.");
    } finally { setSaving(false); }
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId) return;
    setAssigning(true); setAssignError("");
    try {
      await api.post("/role/assign", { userId: member.user_id, roleId: selectedRoleId });
      // Re-fetch user to get updated roles
      const updated = await api.get(`/user/${member.user_id}`);
      setAssignedRoles(updated.roles || []);
      setSelectedRoleId("");
    } catch (err: any) {
      setAssignError(err?.message || "Failed to assign role.");
    } finally { setAssigning(false); }
  };

  const handleUnassignRole = async (assignId: string) => {
    setAssignError("");
    try {
      await api.delete(`/role/assign/${assignId}`);
      setAssignedRoles((prev) => prev.filter((r) => r.assign_id !== assignId));
    } catch (err: any) {
      setAssignError(err?.message || "Failed to remove role.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(46,49,63,0.5)" }}>
      <div
        className="w-full max-w-lg mx-4 rounded-[var(--radius-lg)] overflow-hidden"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: "var(--accent)" }}
            >
              {member.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold" style={S.primary}>{member.full_name}</p>
              <p className="text-xs" style={S.muted}>{member.email}</p>
            </div>
          </div>
          <button onClick={onClose} style={S.muted} className="hover:opacity-70 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh]">
          {/* Profile Form */}
          <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={S.muted}>Profile Details</p>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ backgroundColor: "var(--danger-muted)", borderColor: "var(--danger)", color: "var(--danger)" }}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required className={inputCls} style={S.input} placeholder="Jane Smith" />
              </div>
              <div>
                <Label>Phone</Label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls} style={S.input} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Department</Label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={inputCls} style={S.input} placeholder="Farm Operations" />
              </div>
              <div>
                <Label>Designation</Label>
                <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className={inputCls} style={S.input} placeholder="Senior Farm Manager" />
              </div>
              <div>
                <Label>Employee ID</Label>
                <input value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                  className={inputCls} style={S.input} placeholder="EMP-001" />
              </div>
              {!isTenantAdmin && (
                <div>
                  <Label>User Type</Label>
                  <select value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}
                    className={`${inputCls} nf-select`} style={S.input}>
                    <option value="STANDARD_USER">Standard User</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className={`flex items-center gap-2 select-none text-sm ${isSelf ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`} style={S.primary}>
                <input
                  type="checkbox"
                  checked={isSelf ? true : form.is_active}
                  disabled={isSelf}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--accent)]"
                />
                Account Active
              </label>
              {isSelf ? (
                <span className="text-[11px]" style={S.muted}>You can&apos;t deactivate your own account.</span>
              ) : !form.is_active && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded" style={{ background: "var(--danger-muted)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
                  Will be deactivated
                </span>
              )}
            </div>

            <div className="flex gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium rounded-lg border"
                style={{ ...S.raised, ...S.sub, borderColor: "var(--border)" }}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Role Assignment Section */}
          {!isTenantAdmin && (
            <div className="px-6 pb-6 space-y-3 border-t" style={{ borderColor: "var(--border)", paddingTop: "1.25rem" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={S.muted}>Role Assignment</p>

              {assignError && (
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ backgroundColor: "var(--danger-muted)", borderColor: "var(--danger)", color: "var(--danger)" }}>
                  <AlertCircle className="w-4 h-4 shrink-0" /> {assignError}
                </div>
              )}

              {/* Current roles */}
              {assignedRoles.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {assignedRoles.map((r: any) => (
                    <span
                      key={r.assign_id || r.role_id}
                      className="inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full font-semibold"
                      style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)", borderColor: "var(--accent)" }}
                    >
                      <Shield className="w-3 h-3" /> {r.role_name}
                      {r.assign_id && (
                        <button
                          onClick={() => handleUnassignRole(r.assign_id)}
                          className="ml-0.5 hover:text-[var(--danger)] transition-colors"
                          title="Remove role"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={S.muted}>No roles assigned yet.</p>
              )}

              {/* Assign new role */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm appearance-none pr-8 nf-select"
                    style={S.input}
                  >
                    <option value="">— Select a role to assign —</option>
                    {roles.map((r: any) => (
                      <option key={r.role_id} value={r.role_id}>{r.role_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={S.muted} />
                </div>
                <button
                  disabled={!selectedRoleId || assigning}
                  onClick={handleAssignRole}
                  className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {assigning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  {assigning ? "Assigning…" : "Assign Role"}
                </button>
              </div>

              {roles.length === 0 && (
                <p className="text-xs" style={S.muted}>
                  No roles defined yet.{" "}
                  <a href="/roles" className="underline" style={S.accent}>Create roles first</a>.
                </p>
              )}
            </div>
          )}

          {/* ── Company Assignment Section — tenant-level concern, only a TENANT_ADMIN may move a user across companies ── */}
          {isTenantAdmin && (
          <div className="px-6 pb-6 space-y-3 border-t" style={{ borderColor: "var(--border)", paddingTop: "1.25rem" }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={S.accent} />
              <p className="text-xs font-semibold uppercase tracking-widest" style={S.muted}>Company Access</p>
            </div>

            {companyAssignError && (
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs" style={{ backgroundColor: "var(--danger-muted)", borderColor: "var(--danger)", color: "var(--danger)" }}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {companyAssignError}
              </div>
            )}

            {/* Current assignments */}
            {companyAssignLoading ? (
              <p className="text-xs" style={S.muted}>Loading…</p>
            ) : companyAssignments.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {companyAssignments.map((a: any) => (
                  <span
                    key={a.assign_id}
                    className="inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full font-semibold"
                    style={{
                      backgroundColor: a.is_primary ? "var(--accent-muted)" : "var(--surface-raised)",
                      color: a.is_primary ? "var(--accent)" : "var(--text-primary)",
                      borderColor: a.is_primary ? "var(--accent)" : "var(--border)",
                    }}
                  >
                    <Building2 className="w-3 h-3" />
                    {a.company_name}
                    {a.is_primary && <span className="text-[9px] font-semibold">(Home)</span>}
                    {!a.is_primary && (
                      <button
                        onClick={() => handleRemoveCompany(a.assign_id)}
                        className="ml-0.5 hover:text-[var(--danger)] transition-colors"
                        title="Remove from company"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={S.muted}>Only assigned to home company.</p>
            )}

            {/* Add to another company */}
            {unassignedCompanies.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <select
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) { handleAddCompany(e.target.value); e.target.value = ""; } }}
                    className="w-full border rounded-lg px-3 py-2 text-sm appearance-none pr-8 nf-select"
                    style={S.input}
                    disabled={addingCompany}
                  >
                    <option value="">— Assign to another company —</option>
                    {unassignedCompanies.map((c: any) => (
                      <option key={c.company_id} value={c.company_id}>{c.company_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={S.muted} />
                </div>
                {addingCompany && <RefreshCw className="w-4 h-4 animate-spin" style={S.accent} />}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
