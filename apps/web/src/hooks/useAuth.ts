"use client";

import { AUTH_STORAGE, clearAuthSession } from "@/lib/api-client";

export interface NavUser {
  userId: string;
  email: string;
  fullName: string;
  userType: "SYSTEM_ADMIN" | "TENANT_ADMIN" | "COMPANY_ADMIN" | "STANDARD_USER";
  companyId?: string;
  company_id?: string;
  permissions?: Array<{
    moduleCode: string;
    resource: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete?: boolean;
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

export function clearSession() {
  if (typeof window === "undefined") return;
  clearAuthSession();
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("tenant_id");
}

export function hasPermission(
  user: NavUser | null,
  moduleCode: string,
  resource: string,
  action: "can_view" | "can_create" | "can_edit"
): boolean {
  if (!user) return false;
  if (user.userType === "COMPANY_ADMIN") return true;
  if (user.userType === "TENANT_ADMIN") {
    return (
      (moduleCode === "COMPANY" && resource === "SETTINGS") ||
      moduleCode === "PLAN" ||
      (moduleCode === "RBAC" && resource !== "ROLE")
    );
  }
  const perms = user.permissions || [];
  return perms.some((p) => {
    const matchModule = p.moduleCode === "ALL" || p.moduleCode === moduleCode;
    const matchResource = p.resource === "ALL" || p.resource === resource;
    if (!matchModule || !matchResource) return false;
    if (action === "can_view") return !!p.canView;
    if (action === "can_create") return !!p.canCreate;
    if (action === "can_edit") return !!p.canEdit;
    return false;
  });
}
