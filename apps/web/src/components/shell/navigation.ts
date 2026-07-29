import {
  BarChart3, Bell, Boxes, Building2, ClipboardCheck, Database, Gauge,
  History, LayoutDashboard, Layers, QrCode, Settings, ShieldAlert, UserPlus,
  Users, Wrench, Landmark, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import type { AppScope, NavigationRule } from '../../lib/authorization';
import { WORKSPACE_PRESENTATION } from '../../lib/workspace-presentation';
import type { WorkspaceMembership } from '../../contracts/api';

export interface AppNavItem extends NavigationRule {
  label: string;
  icon: typeof LayoutDashboard;
}

export function navigationForScope(
  scope: AppScope,
  companySlug?: string,
  workspace?: WorkspaceMembership | null,
): AppNavItem[] {
  if (scope === 'platform') {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, permission: 'platform.manage' },
      { label: 'Tenants', href: '/admin/tenants', icon: Building2, permission: 'platform.manage' },
      { label: 'Plans', href: '/admin/plans', icon: Layers, permission: 'platform.manage' },
      { label: 'Master data', href: '/admin/masters', icon: Database, permission: 'platform.manage' },
      { label: 'Audit logs', href: '/admin/audit', icon: History, permission: 'platform.manage' },
    ];
  }
  if (scope === 'tenant') {
    return [
      { label: 'Dashboard', href: '/console/dashboard', icon: LayoutDashboard, permission: 'tenant.view' },
      { label: 'Tenant profile', href: '/console/profile', icon: Settings, permission: 'tenant.manage' },
      { label: 'Companies', href: '/console/companies', icon: Building2, permission: 'company.view' },
      { label: 'Team management', href: '/console/users', icon: Users, permission: 'users.view' },
      { label: 'Invitations', href: '/console/invitations', icon: UserPlus, permission: 'users.manage' },
      { label: 'Role permissions', href: '/console/roles', icon: ShieldAlert, permission: 'roles.view' },
      { label: 'Subscription', href: '/console/subscription', icon: Layers, permission: 'tenant.view' },
      { label: 'Usage & limits', href: '/console/usage', icon: Gauge, permission: 'tenant.view' },
      { label: 'Audit ledger', href: '/console/audit', icon: History, permission: 'audit.view' },
      { label: 'Notifications', href: '/console/notifications', icon: Bell, permission: 'notifications.manage' },
      { label: 'Settings', href: '/console/profile', icon: Settings, permission: 'tenant.manage' },
    ];
  }
  const root = `/${companySlug || 'company'}`;
  if (scope === 'company') {
    return [
      { label: 'Overview', href: `${root}/overview`, icon: LayoutDashboard, permission: 'company.view' },
      { label: 'Setup', href: `${root}/setup`, icon: Building2, permission: 'company.view' },
      { label: 'Workspaces', href: `${root}/workspaces`, icon: Layers, permission: 'workspaces.view' },
      { label: 'Masters', href: `${root}/masters`, icon: Database, permission: 'masters.view' },
      { label: 'Accounting', href: `${root}/accounting/readiness`, icon: Landmark, permission: 'finance.view' },
      { label: 'Members', href: `${root}/members`, icon: Users, permission: 'users.view' },
      { label: 'Roles & permissions', href: `${root}/roles`, icon: ShieldCheck, permission: 'roles.view' },
      { label: 'Readiness', href: `${root}/readiness`, icon: CheckCircle2, permission: 'company.view' },
      { label: 'Settings', href: `${root}/settings`, icon: Settings, permission: 'company.view' },
    ];
  }
  const workspaceRoot = `${root}/workspaces/${workspace?.workspaceSlug ?? 'workspace'}`;
  const productionLabel = workspace ? WORKSPACE_PRESENTATION[workspace.workspaceType].productionLabel : 'Production cycles';
  return [
    { label: 'Dashboard', href: `${workspaceRoot}/dashboard`, icon: LayoutDashboard, workspacePermission: 'workspaces.view' },
    { label: productionLabel, href: `${workspaceRoot}/batches`, icon: Boxes, workspacePermission: 'batches.view', module: 'Batches' },
    { label: 'Operations', href: `${workspaceRoot}/operations`, icon: Gauge, workspacePermission: 'operations.create', module: 'Batches' },
    { label: 'Quality', href: `${workspaceRoot}/quality`, icon: ClipboardCheck, workspacePermission: 'quality.view', module: 'QC' },
    { label: 'Traceability', href: `${workspaceRoot}/traceability`, icon: QrCode, workspacePermission: 'traceability.view', module: 'QR' },
    { label: 'Resources', href: `${workspaceRoot}/resources`, icon: Wrench, workspacePermission: 'resources.view', module: 'Resources' },
    { label: 'Costing', href: `${workspaceRoot}/costing`, icon: Landmark, workspacePermission: 'costs.view', module: 'Finance' },
    { label: 'Reports', href: `${workspaceRoot}/reports`, icon: BarChart3, workspacePermission: 'reports.export', module: 'Analytics' },
    { label: 'Workspace masters', href: `${workspaceRoot}/masters`, icon: Database, workspacePermission: 'workspaces.view' },
    { label: 'Workspace settings', href: `${workspaceRoot}/settings`, icon: Settings, workspacePermission: 'workspaces.view' },
  ];
}
