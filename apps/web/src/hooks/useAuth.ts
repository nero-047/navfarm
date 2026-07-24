'use client';

import type { AuthSession } from '../contracts/api';
import { can } from '../lib/authorization';
import { api } from '../lib/api-client';

export interface CompanyRef {
  company_id: string;
  company_name: string;
  is_primary: boolean;
}

export interface NavUser {
  userId: string;
  email: string;
  fullName: string;
  userType: 'SYSTEM_ADMIN' | 'TENANT_ADMIN' | 'COMPANY_ADMIN' | 'STANDARD_USER';
  companyId?: string;
  company_id?: string;
  tenantId?: string;
  companies?: CompanyRef[];
  permissions?: Array<Record<string, unknown>>;
}

let currentSession: AuthSession | null = null;

export function setSessionSnapshot(session: AuthSession | null) {
  currentSession = session;
}

export function getStoredUser(): NavUser | null {
  return currentSession?.user as NavUser | null;
}

export function getStoredToken(): string | null {
  return currentSession ? 'http-only-session' : null;
}

export function getStoredTenantId(): string | null {
  return currentSession?.activeTenantId ?? null;
}

export function getActiveCompanyId(): string | null {
  return currentSession?.activeCompanyId ?? null;
}

export function setActiveCompanyId(companyId: string): void {
  if (!currentSession) return;
  currentSession = { ...currentSession, activeCompanyId: companyId };
  void api.put<AuthSession>('/auth/context', {
    tenantId: currentSession.activeTenantId,
    companyId,
  }).then(setSessionSnapshot);
}

export function clearSession() {
  currentSession = null;
  void api.post('/auth/logout');
}

export function hasPermission(
  _user: NavUser | null,
  moduleCode: string,
  resource: string,
  action: 'can_view' | 'can_create' | 'can_edit',
): boolean {
  const mapping = {
    'COMPANY:SETTINGS:can_view': 'company.view',
    'COMPANY:SETTINGS:can_create': 'company.manage',
    'COMPANY:SETTINGS:can_edit': 'company.manage',
    'RBAC:USER:can_view': 'users.view',
    'RBAC:USER:can_create': 'users.manage',
    'RBAC:USER:can_edit': 'users.manage',
    'RBAC:ROLE:can_view': 'roles.view',
    'RBAC:ROLE:can_create': 'roles.manage',
    'RBAC:ROLE:can_edit': 'roles.manage',
    'AUDIT:LOGS:can_view': 'audit.view',
    'NOTIFICATION:SETTINGS:can_view': 'notifications.manage',
  } as const;
  const permission = mapping[`${moduleCode}:${resource}:${action}` as keyof typeof mapping];
  return permission ? can(currentSession, permission) : false;
}
