import React, { useState } from "react";
import Card from "../../source-ui/card";
import Input from "../../source-ui/input";
import Button from "../../source-ui/button";
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
        <Card className="p-0 overflow-hidden border-(--border) bg-(--surface)">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-(--border) text-[10px] font-semibold text-(--text-secondary) uppercase tracking-wider bg-(--surface)">
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
                    <td colSpan={6} className="p-8 text-center text-(--text-secondary) text-xs">No workspace operators registered.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u, idx) => {
                    const initials = u.full_name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "OP";
                    return (
                      <tr key={u.user_id} className="border-b border-(--border) text-xs hover:bg-(--surface-raised) transition-colors">
                        <td className="p-4 text-center font-mono text-(--text-muted)">{idx + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-(--accent)/10 border border-(--accent)/20 text-(--accent) font-semibold flex items-center justify-center text-xs tracking-wider">
                              {initials}
                            </div>
                            <span className="font-semibold text-(--text-primary)">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-(--text-secondary) font-mono">{u.email}</td>
                        <td className="p-4">
                          {u.role_name ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-(--accent)/10 text-(--accent) border border-(--accent)/20 text-[9px] font-semibold px-2 py-0.5 rounded-lg uppercase font-mono">
                                {u.role_code}
                              </span>
                              <span className="text-[11px] text-(--text-secondary)">{u.role_name}</span>
                              {onUnassignRole && u.assign_id && (
                                <button
                                  onClick={() => onUnassignRole(u.assign_id)}
                                  className="text-[9px] text-(--text-muted) hover:text-(--danger) ml-1.5 cursor-pointer bg-(--surface-raised) p-1 rounded-md border border-(--border) transition-colors"
                                  title="Unassign role"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-(--text-secondary) font-medium italic">No Role Assigned</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-semibold border ${
                            u.is_active ? 'bg-(--success-muted) text-(--success) border-(--success)' : 'bg-(--danger-muted) text-(--danger) border-(--danger)'
                          }`}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserForAssign(u);
                              setTargetRoleId(u.role_id || (roles.length > 0 ? roles[0].role_id : ""));
                            }}
                            className="text-[10px] font-semibold text-(--accent) hover:text-(--accent-hover) cursor-pointer bg-(--surface-raised) py-1.5 px-3 rounded-lg border border-(--border) transition-colors"
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
      <Card className="lg:col-span-4 p-6 border-(--border) bg-(--surface)">
        <h3 className="font-semibold text-(--text-primary) text-sm flex items-center gap-2 mb-4 pb-2 border-b border-(--border)">
          <UserPlus className="w-4 h-4 text-(--accent)" />
          Invite Team Member
        </h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            placeholder="Jane Doe"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            placeholder="jane@company.com"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            type="email"
            required
          />
          <Input
            label="Password"
            placeholder="Minimum 8 characters"
            value={newUser.password_hash}
            onChange={(e) => setNewUser({ ...newUser, password_hash: e.target.value })}
            type="password"
            required
          />
          <Input
            label="Phone Number"
            placeholder="+919999911111"
            value={newUser.phone}
            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-(--text-secondary) font-semibold uppercase tracking-wider">Account Role Class</label>
            <select
              value={newUser.user_type}
              onChange={(e) => setNewUser({ ...newUser, user_type: e.target.value })}
              className="bg-(--input-bg) border border-(--input-border) rounded-[var(--radius-sm)] px-4 h-12 text-xs text-(--input-text) focus:border-(--input-border-focus) cursor-pointer nf-select"
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

      <Dialog open={Boolean(selectedUserForAssign)} onClose={() => !assigning && setSelectedUserForAssign(null)} title="Assign role" description={selectedUserForAssign ? `Choose an active role for ${selectedUserForAssign.full_name}.` : undefined} maxWidth="sm">
          {selectedUserForAssign && <div className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5 mt-2">
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

            <div className="mt-2 flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setSelectedUserForAssign(null)} className="py-2 px-4 text-xs">
                Close
              </Button>
              <Button
                onClick={handleExecuteAssign}
                disabled={assigning || roles.length === 0}
                className="py-2 px-4 text-xs"
              >
                {assigning ? "Assigning..." : "Assign Role"}
              </Button>
            </div>
          </div>}
      </Dialog>

    </div>
  );
}
