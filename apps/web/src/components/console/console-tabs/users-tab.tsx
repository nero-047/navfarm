import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Dialog } from "../../ui/dialog";

interface UsersTabProps {
  users: any[];
  roles: any[];
  onAddUser: (data: any) => Promise<void>;
  onAssignRole: (userId: string, roleId: string) => Promise<void>;
  onUnassignRole?: (assignId: string) => Promise<void>;
  isSubmitting: boolean;
  currentUser?: any;
  activeCompany?: any;
}

export default function UsersTab({
  users,
  roles,
  onAddUser,
  onAssignRole,
  onUnassignRole,
  isSubmitting,
  currentUser,
  activeCompany
}: UsersTabProps) {
  const isTenantAdmin = currentUser?.userType === "TENANT_ADMIN";

  const [newUser, setNewUser] = useState({
    email: "",
    password_hash: "",
    full_name: "",
    phone: "",
    user_type: isTenantAdmin ? "COMPANY_ADMIN" : "STANDARD_USER"
  });

  const [selectedUserForAssign, setSelectedUserForAssign] = useState<any>(null);
  const [targetRoleId, setTargetRoleId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(newUser).then(() => {
      setNewUser({
        email: "",
        password_hash: "",
        full_name: "",
        phone: "",
        user_type: isTenantAdmin ? "COMPANY_ADMIN" : "STANDARD_USER"
      });
    });
  };

  const handleExecuteAssign = async () => {
    if (!selectedUserForAssign || !targetRoleId) return;
    setAssigning(true);
    try {
      await onAssignRole(selectedUserForAssign.user_id, targetRoleId);
      setSelectedUserForAssign(null);
      setTargetRoleId("");
    } finally {
      setAssigning(false);
    }
  };

  const companyId = currentUser?.companyId || currentUser?.company_id || activeCompany?.company_id;
  const filteredUsers = isTenantAdmin
    ? users.filter((u) => u.user_type === "COMPANY_ADMIN" || u.user_type === "TENANT_ADMIN")
    : users.filter((u) => u.user_type === "STANDARD_USER" && u.company_id === companyId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      {/* Users List Table */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <Card className="p-0 overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-[10px] font-semibold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role Assignment</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs" style={{ color: "var(--text-secondary)" }}>No workspace operators registered.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const initials = u.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "OP";
                    return (
                      <tr key={u.user_id} className="border-b text-xs transition-colors hover:bg-[var(--surface-raised)]" style={{ borderColor: "var(--border)" }}>
                        <td className="p-4 text-center font-mono" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[var(--radius-sm)] border font-semibold flex items-center justify-center text-xs tracking-wider" style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)", color: "var(--accent)" }}>
                              {initials}
                            </div>
                            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{u.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono" style={{ color: "var(--text-secondary)" }}>{u.email}</td>
                        <td className="p-4">
                          {u.role_name ? (
                            <div className="flex items-center gap-2">
                              <span className="border text-[9px] font-semibold px-2 py-0.5 rounded-lg uppercase font-mono" style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)", color: "var(--accent)" }}>
                                {u.role_code}
                              </span>
                              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{u.role_name}</span>
                              {onUnassignRole && u.assign_id && (
                                <button
                                  onClick={() => onUnassignRole(u.assign_id)}
                                  className="text-[9px] ml-1.5 cursor-pointer p-1 rounded-md border transition-colors hover:text-[var(--danger)]"
                                  style={{ color: "var(--text-muted)", backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
                                  title="Unassign role"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-medium italic" style={{ color: "var(--text-secondary)" }}>No Role Assigned</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className="px-2.5 py-0.5 rounded-lg text-[9px] font-semibold border"
                            style={u.is_active ? { backgroundColor: "var(--success-muted)", color: "var(--success)", borderColor: "var(--success)" } : { backgroundColor: "var(--danger-muted)", color: "var(--danger)", borderColor: "var(--danger)" }}
                          >
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserForAssign(u);
                              setTargetRoleId(u.role_id || (roles.length > 0 ? roles[0].role_id : ""));
                            }}
                            className="text-[10px] font-semibold cursor-pointer py-1.5 px-3 rounded-[var(--radius-sm)] border transition-colors hover:opacity-90"
                            style={{
                              color: "var(--accent)",
                              backgroundColor: "var(--surface-raised)",
                              borderColor: "var(--border)",
                            }}
                          >
                            Assign Role
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add User Panel */}
      <Card className="lg:col-span-4 p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4 pb-2 border-b" style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}>
          <UserPlus className="w-4 h-4" style={{ color: "var(--accent)" }} />
          Invite Team Member
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Full Name" htmlFor="invite-user-full-name" required>
            <Input
              id="invite-user-full-name"
              placeholder="Jane Doe"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              required
            />
          </Field>
          <Field label="Email Address" htmlFor="invite-user-email" required>
            <Input
              id="invite-user-email"
              placeholder="jane@company.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              type="email"
              required
            />
          </Field>
          <Field label="Password" htmlFor="invite-user-password" required>
            <Input
              id="invite-user-password"
              placeholder="Minimum 8 characters"
              value={newUser.password_hash}
              onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })}
              type="password"
              required
            />
          </Field>
          <Field label="Phone Number" htmlFor="invite-user-phone">
            <Input
              id="invite-user-phone"
              placeholder="+919999911111"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Account Role Class</label>
            <select
              value={newUser.user_type}
              onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
              className="rounded-[var(--radius-sm)] px-4 h-12 text-xs cursor-pointer nf-select border"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
            >
              {isTenantAdmin ? (
                <>
                  <option value="COMPANY_ADMIN">Company Administrator</option>
                  <option value="TENANT_ADMIN">Tenant Administrator</option>
                </>
              ) : (
                <option value="STANDARD_USER">Standard Operator</option>
              )}
            </select>
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full justify-center text-xs">
            {isSubmitting ? "Inviting..." : "Add User"}
          </Button>
        </form>
      </Card>

      <Dialog
        open={Boolean(selectedUserForAssign)}
        onClose={() => !assigning && setSelectedUserForAssign(null)}
        title="Assign role"
        description={selectedUserForAssign ? `Choose an active role for ${selectedUserForAssign.full_name}.` : undefined}
        maxWidth="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedUserForAssign(null)} disabled={assigning}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteAssign}
              disabled={assigning || roles.length === 0}
              className="nf-btn-primary"
            >
              {assigning ? "Assigning..." : "Assign Role"}
            </Button>
          </>
        }
      >
        {selectedUserForAssign && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Available Roles</label>
              {roles.length === 0 ? (
                <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 text-center text-xs text-[var(--text-secondary)]">
                  No roles defined. Please create a role first in the Roles tab.
                </div>
              ) : (
                <select
                  value={targetRoleId}
                  onChange={(e) => setTargetRoleId(e.target.value)}
                  className="w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none nf-select"
                >
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.role_name} ({role.role_code})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
}
