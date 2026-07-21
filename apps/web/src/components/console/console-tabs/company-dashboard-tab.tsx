import React from "react";
import Card from "../../source-ui/card";
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

const USER_TYPE_LABELS: Record<string, { label: string; description: string; color: string }> = {
  SYSTEM_ADMIN: { label: "System Administrator", description: "Full platform-level access across all tenants", color: "rose" },
  TENANT_ADMIN: { label: "Tenant Administrator", description: "Manages all companies and users within the tenant", color: "purple" },
  COMPANY_ADMIN: { label: "Company Administrator", description: "Full access to company settings, team, and operations", color: "teal" },
  STANDARD_USER: { label: "Standard Operator", description: "Access is governed by assigned RBAC role permissions", color: "blue" },
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

  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string; iconBorder: string }> = {
    teal: { bg: "hover:border-teal-500/30", border: "border-teal-500/20", text: "text-teal-400", iconBg: "bg-teal-500/10", iconBorder: "border-teal-500/20" },
  };

  const userTypeColor = colorMap.teal;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">

      {/* Session Context Card — User Identity + Role */}
      <Card className="p-6 border-[#1a1f2e] bg-[#0b0f19]">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-lg tracking-wider">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white">{currentUser?.fullName || "User"}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${userTypeColor.border} ${userTypeColor.text} ${userTypeColor.iconBg}`}>
                {currentUser?.userType || "USER"}
              </span>
              {currentUserRecord?.role_code && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/20 text-blue-400 bg-blue-500/10">
                  {currentUserRecord.role_code}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{currentUser?.email || "—"}</p>
            <p className="text-[11px] text-gray-500 mt-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold text-white">{userTypeInfo.label}</span>
              <span className="text-gray-600">—</span>
              <span>{userTypeInfo.description}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Role & Permissions Card */}
      <Card className="p-6 border-[#1a1f2e] bg-[#0b0f19]">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-[#1a1f2e] pb-3">
          <Shield className="w-4 h-4 text-teal-400" />
          Your Access Scope
        </h3>

        {hasAllAccess ? (
          <div className="flex items-center gap-3 bg-teal-500/5 border border-teal-500/10 rounded-xl px-4 py-3">
            <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <span className="text-sm font-semibold text-white">Full Administrative Access</span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                As a <strong className="text-teal-400">{userTypeInfo.label}</strong>, you bypass all RBAC permission checks.
                You have unrestricted access to all modules, resources, and actions within your scope.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* RBAC Role Assignment */}
            {currentUserRecord?.role_name ? (
              <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-white">
                    Assigned Role: {currentUserRecord.role_name}
                  </span>
                  <span className="ml-2 bg-[#121824] border border-[#1a1f2e] text-gray-400 text-[10px] font-bold px-2 py-0.5 rounded font-mono">
                    {currentUserRecord.role_code}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Your permissions are governed by this role's policy matrix.
                  </p>
                </div>
              </div>
            ) : !isAdmin ? (
              <div className="flex items-center gap-3 bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
                <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-white">No Role Assigned</span>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Your account has no RBAC role. Contact your administrator to get access permissions.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Granular Permissions Summary */}
            {userPermissions.length > 0 && !hasAllAccess && (
              <div className="mt-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Granular Permissions</p>
                <div className="flex flex-wrap gap-2">
                  {userPermissions.slice(0, 8).map((p: any, i: number) => (
                    <span key={i} className="bg-[#121824] border border-[#1a1f2e] rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-gray-300">
                      {p.moduleCode}.{p.resource}
                      <span className="text-gray-600 ml-1">
                        ({Object.entries(ACTION_LABELS).filter(([key]) => p[key]).map(([, label]) => label).join(", ") || "none"})
                      </span>
                    </span>
                  ))}
                  {userPermissions.length > 8 && (
                    <span className="text-[10px] text-gray-600 self-center">+{userPermissions.length - 8} more</span>
                  )}
                </div>
              </div>
            )}

            {/* RBAC-specific: show available roles in the company */}
            {isAdmin && roles.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Available RBAC Roles in Company</p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((r: any) => (
                    <span key={r.role_id} className="bg-[#121824] border border-[#1a1f2e] rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-gray-300">
                      {r.role_name}
                      <span className="text-gray-600 ml-1">({r.role_code})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Company Info Card */}
      <Card className="flex flex-col justify-between p-6 border-[#1a1f2e] bg-[#0b0f19] hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/[0.01] rounded-bl-full pointer-events-none group-hover:bg-teal-500/[0.02] transition-all" />
        <div>
          <div className="flex justify-between items-start">
            <span className="text-[#8b8fa3] text-[10px] font-bold uppercase tracking-widest">Active Company</span>
            <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-white mt-4 tracking-tight">
            {activeCompany?.company_name || "Unassigned"}
          </div>
          <div className="text-[10px] text-[#545869] font-mono mt-1">
            ID: {activeCompany?.company_id?.substring(0, 8)}...
          </div>
        </div>
        <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 mt-6 bg-emerald-500/5 border border-emerald-500/10 py-1 px-2.5 rounded-lg w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          Onboarding: Complete
        </div>
      </Card>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-teal-400" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.tab}
                onClick={() => onNavigateTab(action.tab)}
                className="p-5 rounded-2xl bg-[#0b0f19] border border-[#1a1f2e] hover:border-teal-500/30 transition-all duration-200 text-left group cursor-pointer hover:scale-[1.02]"
              >
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-teal-400 transition-colors">{action.label}</h4>
                <p className="text-[11px] text-gray-500 mt-1">{action.description}</p>
                <div className="flex items-center gap-1 mt-3 text-[10px] font-semibold text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
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
