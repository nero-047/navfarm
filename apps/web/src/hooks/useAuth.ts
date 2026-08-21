"use client";

import { AUTH_STORAGE, clearAuthSession } from "@/lib/api-client";

export type WorkspaceScope = "TENANT" | "COMPANY" | "OPERATIONAL";

export interface CompanyRef {
  company_id:   string;
  company_name: string;
  is_primary:   boolean;
}

export interface OperationalAreaRef {
  area_id:      string;
  area_code:    string;
  area_name:    string;
  company_id:   string;
  lob_id:       string;
  nob_id:       string;
  is_primary?:  boolean;
}

export interface NavUser {
  userId:              string;
  email:               string;
  fullName:            string;
  userType:            "SYSTEM_ADMIN" | "TENANT_ADMIN" | "COMPANY_ADMIN" | "OPERATIONAL_ADMIN" | "STANDARD_USER";
  companyId?:          string;
  company_id?:         string;
  tenantId?:           string;
  operationalAreaId?:  string;
  operational_area_id?: string;
  companies?:          CompanyRef[];
  operationalAreas?:   OperationalAreaRef[];
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

/** The active workspace scope: TENANT, COMPANY, or OPERATIONAL */
export function getActiveWorkspaceScope(): WorkspaceScope {
  if (typeof window === "undefined") return "COMPANY";
  const user = getStoredUser();
  const stored = localStorage.getItem("active_workspace_scope") as WorkspaceScope;
  if (stored) return stored;

  if (user?.userType === "TENANT_ADMIN") return "TENANT";
  if (user?.userType === "OPERATIONAL_ADMIN") return "OPERATIONAL";
  return "COMPANY";
}

export function setActiveWorkspaceScope(scope: WorkspaceScope): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("active_workspace_scope", scope);
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

/** The active operational area the user is currently inspecting/operating */
export function getActiveOperationalAreaId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("active_operational_area_id") || null;
}

export function setActiveOperationalAreaId(areaId: string | null): void {
  if (typeof window === "undefined") return;
  if (areaId) localStorage.setItem("active_operational_area_id", areaId);
  else localStorage.removeItem("active_operational_area_id");
}

/** The active LOB code/id for the active operational scope (e.g. 'PIGGERY', 'DAIRY', 'LVS_PIGGERY') */
export function getActiveLob(): string {
  if (typeof window === "undefined") return "PIGGERY";
  return localStorage.getItem("active_lob") || "PIGGERY";
}

export function setActiveLob(lob: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("active_lob", lob);
}

/** Legacy helper preserved for backwards compatibility */
export function isTenantCompanyMode(): boolean {
  return getActiveWorkspaceScope() !== "TENANT";
}

export function setTenantCompanyMode(on: boolean): void {
  setActiveWorkspaceScope(on ? "COMPANY" : "TENANT");
}

export function clearSession() {
  if (typeof window === "undefined") return;
  clearAuthSession();
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("tenant_id");
  localStorage.removeItem("active_company_id");
  localStorage.removeItem("active_workspace_scope");
  localStorage.removeItem("active_operational_area_id");
  localStorage.removeItem("active_lob");
  localStorage.removeItem("tenant_company_mode");
}

export function hasPermission(
  user: NavUser | null,
  moduleCode: string,
  resource: string,
  action: "can_view" | "can_create" | "can_edit"
): boolean {
  if (!user) return false;
  if (user.userType === "TENANT_ADMIN" || user.userType === "COMPANY_ADMIN") return true;
  if (user.userType === "OPERATIONAL_ADMIN") {
    // Operational admins have full operational and master permissions within their assigned area
    if (
      moduleCode === "PRODUCTION" ||
      moduleCode === "PIGGERY" ||
      moduleCode === "DAIRY" ||
      moduleCode === "POULTRY" ||
      moduleCode === "MASTER_DATA" ||
      moduleCode === "INVENTORY"
    ) {
      return true;
    }
  }
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
