"use client";

import { AUTH_STORAGE, clearAuthSession } from "@/lib/api-client";

export interface CompanyRef {
  company_id:   string;
  company_name: string;
  is_primary:   boolean;
}

export interface NavUser {
  userId:     string;
  email:      string;
  fullName:   string;
  userType:   "SYSTEM_ADMIN" | "TENANT_ADMIN" | "COMPANY_ADMIN" | "STANDARD_USER";
  companyId?:  string;
  company_id?: string;
  tenantId?:   string;
  companies?:  CompanyRef[];
  permissions?: Array<{
    moduleCode:  string;
    resource:    string;
    canView:     boolean;
    canCreate:   boolean;
    canEdit:     boolean;
    canDelete?:  boolean;
    canApprove?: boolean;
  }>;
}

export function getStoredUser(): NavUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE.user);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE.accessToken);
}

export function getStoredTenantId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_STORAGE.tenantId);
}

/** The company the user is currently "working as" in this browser session */
export function getActiveCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("active_company_id") ||
    localStorage.getItem("company_id") ||
    null
  );
}

export function setActiveCompanyId(companyId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("active_company_id", companyId);
}

/**
 * Whether a TENANT_ADMIN has explicitly entered a company's operational
 * context (via "Switch" on the Companies list). Separate from
 * getActiveCompanyId() — a tenant admin's active company defaults to their
 * home company even before they've "entered" it, and the sidebar's
 * company-scoped tabs (Master Data, Inventory, Finance, Production, Role
 * Permissions, Audit Ledger, Notifications) should stay hidden until this
 * flag is explicitly set, showing only the tenant-wide tabs (Dashboard,
 * Companies, Team Management) by default.
 */
export function isTenantCompanyMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("tenant_company_mode") === "1";
}

export function setTenantCompanyMode(on: boolean): void {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem("tenant_company_mode", "1");
  else localStorage.removeItem("tenant_company_mode");
}

export function clearSession() {
  if (typeof window === "undefined") return;
  clearAuthSession();
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("active_company_id");
}

export function hasPermission(
  user: NavUser | null,
  moduleCode: string,
  resource: string,
  action: "can_view" | "can_create" | "can_edit"
): boolean {
  if (!user) return false;
  if (user.userType === "COMPANY_ADMIN" || user.userType === "TENANT_ADMIN") return true;
  const perms = user.permissions || [];
  return perms.some((p) => {
    const matchModule   = p.moduleCode === "ALL" || p.moduleCode === moduleCode;
    const matchResource = p.resource   === "ALL" || p.resource   === resource;
    if (!matchModule || !matchResource) return false;
    if (action === "can_view")   return !!p.canView;
    if (action === "can_create") return !!p.canCreate;
    if (action === "can_edit")   return !!p.canEdit;
    return false;
  });
}
