import React from "react";
import {
  Building2,
  Users,
  ShieldAlert,
  History,
  LayoutDashboard,
  Bell,
  LogOut
} from "lucide-react";
import DashboardTab from "./console-tabs/dashboard-tab";
import CompanyDashboardTab from "./console-tabs/company-dashboard-tab";
import CompanyTab from "./console-tabs/company-tab";
import UsersTab from "./console-tabs/users-tab";
import RolesTab from "./console-tabs/roles-tab";
import AuditTab from "./console-tabs/audit-tab";
import NotificationTab from "./console-tabs/notification-tab";

interface OperationalConsoleProps {
  activeConsoleTab: "dashboard" | "company" | "users" | "roles" | "audit" | "notification";
  setActiveConsoleTab: (tab: "dashboard" | "company" | "users" | "roles" | "audit" | "notification") => void;
  activeCompany: any;
  setActiveCompany: (company: any) => void;
  users: any[];
  companies: any[];
  tenantPlanInfo: any;
  currencies: any[];
  roles: any[];
  auditLogs: any[];
  onAddUser: (data: any) => Promise<void>;
  onAssignRole: (userId: string, roleId: string) => Promise<void>;
  onUnassignRole?: (assignId: string) => Promise<void>;
  onRefreshRoles: () => Promise<void>;
  loadConsoleWorkspace: () => Promise<void>;
  isSubmitting: boolean;
  actionError: string;
  actionSuccess: string;
  setActionError: (msg: string) => void;
  setActionSuccess: (msg: string) => void;
  currentUser: any;
  onLogout?: () => void;
}

export default function OperationalConsole({
  activeConsoleTab,
  setActiveConsoleTab,
  activeCompany,
  setActiveCompany,
  users,
  companies,
  tenantPlanInfo,
  currencies,
  roles,
  auditLogs,
  onAddUser,
  onAssignRole,
  onUnassignRole,
  onRefreshRoles,
  loadConsoleWorkspace,
  isSubmitting,
  actionError,
  actionSuccess,
  setActionError,
  setActionSuccess,
  currentUser,
  onLogout,
}: OperationalConsoleProps) {
  const hasPermission = (moduleCode: string, resource: string, action: "can_view" | "can_create" | "can_edit") => {
    if (currentUser?.userType === "COMPANY_ADMIN" || currentUser?.userType === "TENANT_ADMIN") return true;
    const perms = currentUser?.permissions || [];
    return perms.some((p: any) => {
      const matchesModule = p.moduleCode === 'ALL' || p.moduleCode === moduleCode;
      const matchesResource = p.resource === 'ALL' || p.resource === resource;
      if (!matchesModule || !matchesResource) return false;
      if (action === 'can_view') return !!p.canView;
      if (action === 'can_create') return !!p.canCreate;
      if (action === 'can_edit') return !!p.canEdit;
      return false;
    });
  };

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* Sidebar Nav — theme-aware */}
      <aside style={{
        width: 240, flexShrink: 0,
        backgroundColor: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex", flexDirection: "column", gap: 4,
        padding: "20px 16px",
      }} className="hidden md:flex animate-fade-in">
        {[
          { tab: "dashboard", label: currentUser?.userType === "COMPANY_ADMIN" ? "Dashboard" : "Operational", icon: <LayoutDashboard className="w-4 h-4" />, perm: () => currentUser?.userType === "TENANT_ADMIN" || currentUser?.userType === "COMPANY_ADMIN" },
          { tab: "company",   label: "Companies",           icon: <Building2    className="w-4 h-4" />, perm: () => hasPermission("COMPANY", "SETTINGS", "can_view") },
          { tab: "users",     label: "Team Management",     icon: <Users        className="w-4 h-4" />, perm: () => hasPermission("RBAC", "USER", "can_view") },
          { tab: "roles",     label: "Role Permissions",    icon: <ShieldAlert  className="w-4 h-4" />, perm: () => hasPermission("RBAC", "ROLE", "can_view") },
          { tab: "audit",     label: "Audit Ledger",        icon: <History      className="w-4 h-4" />, perm: () => hasPermission("AUDIT", "LOGS", "can_view") },
          { tab: "notification", label: "Notifications",   icon: <Bell         className="w-4 h-4" />, perm: () => hasPermission("NOTIFICATION", "SETTINGS", "can_view") },
        ].filter(item => item.perm()).map(item => {
          const isActive = activeConsoleTab === item.tab;
          return (
            <button key={item.tab} onClick={() => setActiveConsoleTab(item.tab as any)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px", borderRadius: 10,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: isActive ? "1px solid var(--accent)" : "1px solid transparent",
                backgroundColor: isActive ? "var(--accent-muted)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--sidebar-text)",
                transition: "all 150ms",
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--row-hover)"; } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; } }}
            >
              {item.icon} {item.label}
            </button>
          );
        })}

        {onLogout && (
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border)", width: "100%" }}>
            <button onClick={onLogout}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 14px", borderRadius: 10,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                border: "1px solid transparent",
                backgroundColor: "transparent",
                color: "var(--text-muted)",
                transition: "all 150ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#EF4444"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main Workspace */}
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}
        className="animate-fade-in">

        {/* Mobile Navigation Dropdown */}
        <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16 }} className="block md:hidden">
          <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 6 }}>Navigation Menu</label>
          <select
            value={activeConsoleTab}
            onChange={(e) => setActiveConsoleTab(e.target.value as any)}
            style={{ width: "100%", height: 44, border: "1px solid var(--input-border)", borderRadius: 10, padding: "0 12px", fontSize: 14, cursor: "pointer" }}
          >
            {(currentUser?.userType === "TENANT_ADMIN" || currentUser?.userType === "COMPANY_ADMIN") && <option value="dashboard">{currentUser?.userType === "COMPANY_ADMIN" ? "Dashboard" : "Operational Summary"}</option>}
            {hasPermission("COMPANY", "SETTINGS", "can_view") && <option value="company">Company Details</option>}
            {hasPermission("RBAC", "USER", "can_view") && <option value="users">Team Management</option>}
            {hasPermission("RBAC", "ROLE", "can_view") && <option value="roles">Role Permissions</option>}
            {hasPermission("AUDIT", "LOGS", "can_view") && <option value="audit">Audit Ledger</option>}
            {hasPermission("NOTIFICATION", "SETTINGS", "can_view") && <option value="notification">Notification Engine</option>}
          </select>
        </div>


        {/* Header info */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white capitalize">
            {activeConsoleTab === "dashboard" && (currentUser?.userType === "COMPANY_ADMIN" ? "Company Dashboard" : "Console Dashboard")}
            {activeConsoleTab === "company" && "Company Profile Settings"}
            {activeConsoleTab === "users" && "Team User Accounts"}
            {activeConsoleTab === "roles" && "RBAC Role Scopes"}
            {activeConsoleTab === "audit" && "Security Logs Trail"}
            {activeConsoleTab === "notification" && "Notification Engine Settings"}
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Active Tenant database: <span className="font-mono text-[10px] md:text-xs text-gray-400">{tenantPlanInfo?.db_name || "tenant_system"}</span>
          </p>
        </div>

        {activeConsoleTab === "dashboard" && currentUser?.userType === "COMPANY_ADMIN" && (
          <CompanyDashboardTab
            activeCompany={activeCompany}
            usersCount={users.length}
            companiesCount={companies.length}
            tenantPlanInfo={tenantPlanInfo}
            onNavigateTab={(tab) => setActiveConsoleTab(tab as any)}
            currentUser={currentUser}
            users={users}
            roles={roles}
          />
        )}
        {activeConsoleTab === "dashboard" && currentUser?.userType !== "COMPANY_ADMIN" && (
          <DashboardTab
            activeCompany={activeCompany}
            usersCount={users.length}
            companiesCount={companies.length}
            tenantPlanInfo={tenantPlanInfo}
          />
        )}
        {activeConsoleTab === "company" && (
          <CompanyTab
            activeCompany={activeCompany}
            currencies={currencies}
            tenantId={tenantPlanInfo?.tenant_id}
            onRefreshCompany={loadConsoleWorkspace}
            companies={companies}
            currentUser={currentUser}
            onSelectCompany={setActiveCompany}
          />
        )}
        {activeConsoleTab === "users" && (
          <UsersTab
            users={users}
            roles={roles}
            onAddUser={onAddUser}
            onAssignRole={onAssignRole}
            onUnassignRole={onUnassignRole}
            isSubmitting={isSubmitting}
            currentUser={currentUser}
            activeCompany={activeCompany}
          />
        )}
        {activeConsoleTab === "roles" && (
          <RolesTab
            roles={roles}
            companyId={activeCompany?.company_id}
            onRefreshRoles={onRefreshRoles}
            actionError={actionError}
            actionSuccess={actionSuccess}
            setActionError={setActionError}
            setActionSuccess={setActionSuccess}
          />
        )}
        {activeConsoleTab === "audit" && (
          <AuditTab auditLogs={auditLogs} />
        )}
        {activeConsoleTab === "notification" && (
          <NotificationTab companyId={activeCompany?.company_id} />
        )}

      </main>
    </div>
  );
}
