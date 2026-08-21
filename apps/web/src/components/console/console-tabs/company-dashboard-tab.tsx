import React from "react";
import { Card } from "@/components/ui/card";
import { Building2, ArrowRight, Shield, ShieldAlert, CheckCircle, XCircle, Settings, Users } from "lucide-react";

interface CompanyDashboardTabProps {
  activeCompany: any;
  usersCount: number;
  companiesCount: number;
  tenantPlanInfo: any;
  onNavigateTab: (tab: string) => void;
  currentUser?: any;
  users?: any[];
  roles?: any[];
}

const USER_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  SYSTEM_ADMIN: { label: "System Administrator", description: "Full platform-level access across all tenants" },
  TENANT_ADMIN: { label: "Tenant Administrator", description: "Manages all companies and users within the tenant" },
  COMPANY_ADMIN: { label: "Company Administrator", description: "Full access to company settings, team, and operations" },
  STANDARD_USER: { label: "Standard Operator", description: "Access is governed by assigned RBAC role permissions" },
};

const ACTION_LABELS: Record<string, string> = {
  can_view: "View",
  can_create: "Create",
  can_edit: "Edit",
  can_delete: "Delete",
  can_approve: "Approve",
  can_export: "Export",
  can_print: "Print",
};

export default function CompanyDashboardTab({
  activeCompany,
  onNavigateTab,
  currentUser,
  users = [],
  roles = [],
}: CompanyDashboardTabProps) {
  const isAdmin = currentUser?.userType === "COMPANY_ADMIN" || currentUser?.userType === "TENANT_ADMIN";
  const userTypeInfo = USER_TYPE_LABELS[currentUser?.userType] || USER_TYPE_LABELS.STANDARD_USER;
  const initials = currentUser?.fullName?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "U";

  const currentUserRecord = users.find(
    (u: any) =>
      u.user_id === currentUser?.userId ||
      u.email === currentUser?.email
  );

  const userPermissions = currentUser?.permissions || [];
  const hasAllAccess = userPermissions.some(
    (p: any) => p.moduleCode === "ALL" && p.resource === "ALL"
  );

  const quickActions = [
    {
      label: "Company Profile",
      description: "View and edit your company settings",
      icon: Settings,
      tab: "company",
    },
    {
      label: "Team Management",
      description: "Manage users and their access",
      icon: Users,
      tab: "users",
    },
    {
      label: "Role Permissions",
      description: "Configure RBAC policies",
      icon: ShieldAlert,
      tab: "roles",
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Session Context Card — User Identity + Role */}
      <Card className="p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-[var(--radius-md)] border flex items-center justify-center font-semibold text-lg tracking-wider"
            style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)", color: "var(--accent)" }}
          >
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{currentUser?.fullName || "User"}</h2>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)", color: "var(--accent)" }}
              >
                {currentUser?.userType || "USER"}
              </span>
              {currentUserRecord?.role_code && (
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                  style={{ backgroundColor: "var(--color-blue-soft)", borderColor: "var(--info)", color: "var(--info)" }}
                >
                  {currentUserRecord.role_code}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{currentUser?.email || "—"}</p>
            <p className="text-[11px] mt-1.5 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Shield className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{userTypeInfo.label}</span>
              <span style={{ color: "var(--text-muted)" }}>—</span>
              <span>{userTypeInfo.description}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Role & Permissions Card */}
      <Card className="p-6" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <h3
          className="text-sm font-semibold mb-4 flex items-center gap-2 border-b pb-3"
          style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
        >
          <Shield className="w-4 h-4" style={{ color: "var(--accent)" }} />
          Your Access Scope
        </h3>

        {hasAllAccess ? (
          <div
            className="flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 border"
            style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.15)" }}
          >
            <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "var(--accent)" }} />
            <div>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Full Administrative Access</span>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                As a <strong style={{ color: "var(--accent)" }}>{userTypeInfo.label}</strong>, you bypass all RBAC permission checks.
                You have unrestricted access to all modules, resources, and actions within your scope.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* RBAC Role Assignment */}
            {currentUserRecord?.role_name ? (
              <div
                className="flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 border"
                style={{ backgroundColor: "var(--color-blue-soft)", borderColor: "var(--info)" }}
              >
                <ShieldAlert className="w-5 h-5 shrink-0" style={{ color: "var(--info)" }} />
                <div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Assigned Role: {currentUserRecord.role_name}
                  </span>
                  <span
                    className="ml-2 border text-[10px] font-semibold px-2 py-0.5 rounded font-mono"
                    style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    {currentUserRecord.role_code}
                  </span>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Your permissions are governed by this role&apos;s policy matrix.
                  </p>
                </div>
              </div>
            ) : !isAdmin ? (
              <div
                className="flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-3 border"
                style={{ backgroundColor: "var(--warning-muted)", borderColor: "var(--warning)" }}
              >
                <XCircle className="w-5 h-5 shrink-0" style={{ color: "var(--warning)" }} />
                <div>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>No Role Assigned</span>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    Your account has no RBAC role. Contact your administrator to get access permissions.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Granular Permissions Summary */}
            {userPermissions.length > 0 && !hasAllAccess && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Granular Permissions
                </p>
                <div className="flex flex-wrap gap-2">
                  {userPermissions.slice(0, 8).map((p: any, i: number) => (
                    <span
                      key={i}
                      className="border rounded-lg px-2.5 py-1.5 text-[10px] font-mono"
                      style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      {p.moduleCode}.{p.resource}
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                        ({Object.entries(ACTION_LABELS).filter(([key]) => p[key]).map(([, label]) => label).join(", ") || "none"})
                      </span>
                    </span>
                  ))}
                  {userPermissions.length > 8 && (
                    <span className="text-[10px] self-center" style={{ color: "var(--text-muted)" }}>
                      +{userPermissions.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* RBAC-specific: show available roles in the company */}
            {isAdmin && roles.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>
                  Available RBAC Roles in Company
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r: any) => (
                    <span
                      key={r.role_id}
                      className="border rounded-lg px-2.5 py-1.5 text-[10px] font-mono"
                      style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      {r.role_name}
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>({r.role_code})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Company Info Card */}
      <Card
        className="flex flex-col justify-between p-6 transition-all duration-300 relative overflow-hidden group"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none transition-all"
          style={{ backgroundColor: "rgba(194,67,50,0.03)" }}
        />
        <div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>Active Company</span>
            <div
              className="p-2 rounded-[var(--radius-sm)] border"
              style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)", color: "var(--accent)" }}
            >
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-semibold mt-4 tracking-tight" style={{ color: "var(--text-primary)" }}>
            {activeCompany?.company_name || "Unassigned"}
          </div>
          <div className="text-[10px] font-mono mt-1" style={{ color: "var(--text-muted)" }}>
            ID: {activeCompany?.company_id?.substring(0, 8)}...
          </div>
        </div>
        <div
          className="text-[11px] font-semibold flex items-center gap-1.5 mt-6 py-1 px-2.5 rounded-lg w-fit border"
          style={{ color: "var(--success)", backgroundColor: "var(--success-muted)", borderColor: "var(--success)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: "var(--success)" }} />
          Onboarding: Complete
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <ArrowRight className="w-4 h-4" style={{ color: "var(--accent)" }} />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.tab}
                onClick={() => onNavigateTab(action.tab)}
                className="p-5 rounded-[var(--radius-md)] border transition-all duration-200 text-left group cursor-pointer hover:scale-[1.02]"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(194,67,50,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div
                  className="w-10 h-10 rounded-[var(--radius-sm)] border flex items-center justify-center mb-3"
                  style={{ backgroundColor: "var(--accent-muted)", borderColor: "rgba(194,67,50,0.2)", color: "var(--accent)" }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{action.label}</h4>
                <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>{action.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--accent)" }}>
                  Navigate <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
