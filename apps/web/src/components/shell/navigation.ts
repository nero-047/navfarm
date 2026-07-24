import {
  BarChart3, Bell, Boxes, Building2, ClipboardCheck, Database, Gauge,
  History, LayoutDashboard, Layers, QrCode, Settings, ShieldAlert, UserPlus, Users, Wrench, Landmark,
} from 'lucide-react';
import type { AppScope, NavigationRule } from '../../lib/authorization';

export interface AppNavItem extends NavigationRule {
  label: string;
  icon: typeof LayoutDashboard;
}

export function navigationForScope(scope: AppScope, companySlug?: string): AppNavItem[] {
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
    ];
  }
  const root = `/${companySlug || 'company'}`;
  return [
    { label: 'Dashboard', href: `${root}/dashboard`, icon: LayoutDashboard, permission: 'company.view' },
    { label: 'Batches', href: `${root}/batches`, icon: Boxes, permission: 'batches.view', module: 'Batches' },
    { label: 'Operations', href: `${root}/operations`, icon: Gauge, permission: 'operations.create', module: 'Batches' },
    { label: 'Quality control', href: `${root}/quality`, icon: ClipboardCheck, permission: 'quality.view', module: 'QC' },
    { label: 'Traceability', href: `${root}/traceability`, icon: QrCode, permission: 'traceability.view', module: 'QR' },
    { label: 'Resources & KPIs', href: `${root}/resources`, icon: Wrench, permission: 'resources.view' },
    { label: 'Master data', href: `${root}/masters`, icon: Database, permission: 'company.view' },
    { label: 'Accounting', href: `${root}/accounting/readiness`, icon: Landmark, permission: 'finance.view', module: 'Finance' },
    { label: 'Reports', href: `${root}/reports`, icon: BarChart3, permission: 'finance.view' },
    { label: 'Settings', href: `${root}/settings`, icon: Settings, permission: 'company.manage' },
  ];
}
