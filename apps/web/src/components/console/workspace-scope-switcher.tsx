"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Building,
  Plus,
  Layers,
} from "lucide-react";
import {
  getStoredUser,
  getActiveWorkspaceScope,
  setActiveWorkspaceScope,
  getActiveCompanyId,
  setActiveCompanyId,
  getActiveOperationalAreaId,
  setActiveOperationalAreaId,
  getActiveLob,
  setActiveLob,
  WorkspaceScope,
  NavUser
} from "@/hooks/useAuth";
import { api } from "@/lib/api-client";

interface OperationalAreaItem {
  area_id: string;
  area_code: string;
  area_name: string;
  company_id: string;
  company_name?: string;
  lob_id: string;
  nob_id: string;
  lob_code?: string;
  lob_name?: string;
}

export default function WorkspaceScopeSwitcher({
  onScopeChanged
}: {
  onScopeChanged?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<NavUser | null>(null);
  const [currentScope, setCurrentScope] = useState<WorkspaceScope>("COMPANY");
  const [companies, setCompanies] = useState<any[]>([]);
  const [operationalAreas, setOperationalAreas] = useState<OperationalAreaItem[]>([]);
  const [activeCompId, setActiveCompId] = useState<string | null>(null);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);
  const [activeLobCode, setActiveLobCode] = useState<string>("PIGGERY");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);

    const scope = getActiveWorkspaceScope();
    setCurrentScope(scope);

    const compId = getActiveCompanyId();
    setActiveCompId(compId);

    const areaId = getActiveOperationalAreaId();
    setActiveAreaId(areaId);

    const lob = getActiveLob();
    setActiveLobCode(lob);

    // Fetch companies and operational areas
    const tenantId = localStorage.getItem("tenant_id") || storedUser?.tenantId;
    const isTenantAdminUser = storedUser?.userType === "TENANT_ADMIN";

    if (tenantId) {
      api.get(`/company/tenant/${tenantId}`).then((res: any) => {
        if (Array.isArray(res)) {
          if (isTenantAdminUser) {
            setCompanies(res);
          } else {
            // Strict Company Admin / User boundary: Only allow assigned companies
            const userAllowedCompanyIds = new Set([
              storedUser?.companyId,
              ...(storedUser?.companies || []).map((c: any) => c.company_id),
            ].filter(Boolean));
            setCompanies(res.filter((c: any) => userAllowedCompanyIds.has(c.company_id)));
          }
        }
      }).catch(() => {
        if (!isTenantAdminUser && storedUser?.companies) {
          setCompanies(storedUser.companies);
        }
      });

      api.get(`/operational-area${compId ? `?company_id=${compId}` : ""}`).then((res: any) => {
        if (Array.isArray(res)) {
          if (isTenantAdminUser) {
            setOperationalAreas(res);
          } else {
            // Strict Area boundary: only show areas belonging to the user's assigned company or user.operationalAreas
            const userAllowedCompanyIds = new Set([
              storedUser?.companyId,
              ...(storedUser?.companies || []).map((c: any) => c.company_id),
            ].filter(Boolean));
            const userAllowedAreaIds = new Set((storedUser?.operationalAreas || []).map((a: any) => a.area_id));

            setOperationalAreas(res.filter((a: any) => 
              userAllowedAreaIds.has(a.area_id) || userAllowedCompanyIds.has(a.company_id)
            ));
          }
        }
      }).catch(() => {
        // Fallback default operational areas if fresh
        if (storedUser?.operationalAreas && storedUser.operationalAreas.length > 0) {
          setOperationalAreas(storedUser.operationalAreas);
        }
      });
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectTenantScope = () => {
    setActiveWorkspaceScope("TENANT");
    setActiveOperationalAreaId(null);
    setCurrentScope("TENANT");
    setIsOpen(false);
    window.location.href = "/console/dashboard";
  };

  const handleSelectCompany = (companyId: string) => {
    setActiveCompanyId(companyId);
    setActiveWorkspaceScope("COMPANY");
    setActiveOperationalAreaId(null);
    setCurrentScope("COMPANY");
    setActiveCompId(companyId);

    // Patch user
    if (user) {
      const patched = { ...user, companyId, company_id: companyId };
      localStorage.setItem("user", JSON.stringify(patched));
      localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
    }

    setIsOpen(false);
    window.location.href = "/console/dashboard";
  };

  const handleSelectOperationalArea = (area: OperationalAreaItem) => {
    setActiveCompanyId(area.company_id);
    setActiveOperationalAreaId(area.area_id);
    setActiveWorkspaceScope("OPERATIONAL");
    
    // Determine LOB code (PIGGERY, DAIRY, POULTRY)
    const lobName = (area.lob_name || area.lob_code || area.lob_id || "PIGGERY").toUpperCase();
    let normalizedLob = "PIGGERY";
    if (lobName.includes("DAIRY") || lobName.includes("CATTLE")) normalizedLob = "DAIRY";
    else if (lobName.includes("POULTRY") || lobName.includes("BROILER") || lobName.includes("LAYER")) normalizedLob = "POULTRY";
    else if (lobName.includes("PIG") || lobName.includes("SWINE")) normalizedLob = "PIGGERY";

    setActiveLob(normalizedLob);
    setCurrentScope("OPERATIONAL");
    setActiveAreaId(area.area_id);
    setActiveLobCode(normalizedLob);

    // Patch user
    if (user) {
      const patched = {
        ...user,
        companyId: area.company_id,
        company_id: area.company_id,
        operationalAreaId: area.area_id,
        operational_area_id: area.area_id,
      };
      localStorage.setItem("user", JSON.stringify(patched));
      localStorage.setItem("navfarm_auth_user", JSON.stringify(patched));
    }

    setIsOpen(false);
    window.location.href = "/console/dashboard";
  };

  const activeCompanyObj = companies.find((c) => c.company_id === activeCompId) ||
    user?.companies?.find((c) => c.company_id === activeCompId) ||
    companies[0] ||
    user?.companies?.[0];

  const activeAreaObj = operationalAreas.find((a) => a.area_id === activeAreaId) || operationalAreas[0];

  // Derive label and badge text
  let scopeBadge = "TENANT";
  let primaryTitle = "Organization Overview";
  let secondarySubtitle = "All Companies & Group Masters";

  if (currentScope === "COMPANY") {
    scopeBadge = "COMPANY";
    primaryTitle = activeCompanyObj?.company_name || "Active Company";
    secondarySubtitle = "Subsidiary & Commercial Operations";
  } else if (currentScope === "OPERATIONAL") {
    scopeBadge = `AREA · ${activeLobCode}`;
    primaryTitle = activeAreaObj?.area_name || `${activeLobCode} Operational Unit`;
    secondarySubtitle = `${activeCompanyObj?.company_name || "Company"} Farm Operations`;
  }

  const isTenantAdmin = user?.userType === "TENANT_ADMIN";
  const isCompanyAdmin = user?.userType === "COMPANY_ADMIN" || isTenantAdmin;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Switcher Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left transition-all duration-150 rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] p-2.5 group focus:outline-none focus:ring-1 focus:ring-white/20"
        aria-label="Switch Workspace Scope"
      >
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                currentScope === "TENANT"
                  ? "bg-purple-400"
                  : currentScope === "COMPANY"
                  ? "bg-blue-400"
                  : "bg-emerald-400"
              }`}
            />
            {scopeBadge}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 group-hover:text-white/80 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
        <p className="text-xs font-semibold text-white truncate tracking-tight">
          {primaryTitle}
        </p>
        <p className="text-[10px] text-white/40 truncate mt-0.5">
          {secondarySubtitle}
        </p>
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-72 max-w-[90vw] rounded-[var(--radius-md)] border shadow-xl z-50 overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <div
            className="px-3 py-2 border-b flex items-center justify-between"
            style={{
              backgroundColor: "var(--surface-raised)",
              borderColor: "var(--border)",
            }}
          >
            <span className="text-[11px] font-semibold tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
              Workspace Scope
            </span>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              {user?.userType?.replace(/_/g, " ")}
            </span>
          </div>

          <div className="max-h-[380px] overflow-y-auto p-1.5 space-y-2">
            {/* 1. Tenant Scope (Available for TENANT_ADMIN) */}
            {isTenantAdmin && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Organization Level
                </div>
                <button
                  onClick={handleSelectTenantScope}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[var(--radius-sm)] text-xs transition-colors text-left ${
                    currentScope === "TENANT"
                      ? "font-semibold"
                      : "hover:bg-[var(--surface-raised)]"
                  }`}
                  style={
                    currentScope === "TENANT"
                      ? { backgroundColor: "var(--accent-muted)", color: "var(--accent)" }
                      : { color: "var(--text-primary)" }
                  }
                >
                  <Building className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">Tenant Root Workspace</p>
                    <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>
                      Consolidated metrics & All Companies
                    </p>
                  </div>
                  {currentScope === "TENANT" && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                </button>
              </div>
            )}

            {/* 2. Companies List */}
            {isCompanyAdmin && companies.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Legal Entities / Companies
                </div>
                <div className="space-y-0.5">
                  {companies.map((comp) => {
                    const isSelected = currentScope === "COMPANY" && activeCompId === comp.company_id;
                    return (
                      <button
                        key={comp.company_id}
                        onClick={() => handleSelectCompany(comp.company_id)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors text-left ${
                          isSelected
                            ? "font-semibold"
                            : "hover:bg-[var(--surface-raised)]"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: "var(--accent-muted)", color: "var(--accent)" }
                            : { color: "var(--text-primary)" }
                        }
                      >
                        <Building2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-secondary)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{comp.company_name}</p>
                          <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>
                            {comp.company_code || "Company Scope"}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Operational Areas */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                <span>Operational Farm Areas</span>
                {isCompanyAdmin && (
                  <a
                    href="/console/operational-areas"
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] hover:underline flex items-center gap-0.5"
                    style={{ color: "var(--accent)" }}
                  >
                    <Plus className="w-2.5 h-2.5" /> New Area
                  </a>
                )}
              </div>

              {operationalAreas.length === 0 ? (
                <div className="px-3 py-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  No operational areas configured yet.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {operationalAreas.map((area) => {
                    const isSelected = currentScope === "OPERATIONAL" && activeAreaId === area.area_id;
                    const lobLabel = (area.lob_name || area.lob_code || area.lob_id || "PIGGERY").toUpperCase();
                    const isPig = lobLabel.includes("PIG") || lobLabel.includes("SWINE");
                    const isDairy = lobLabel.includes("DAIRY") || lobLabel.includes("CATTLE");

                    return (
                      <button
                        key={area.area_id}
                        onClick={() => handleSelectOperationalArea(area)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs transition-colors text-left ${
                          isSelected
                            ? "font-semibold"
                            : "hover:bg-[var(--surface-raised)]"
                        }`}
                        style={
                          isSelected
                            ? { backgroundColor: "var(--accent-muted)", color: "var(--accent)" }
                            : { color: "var(--text-primary)" }
                        }
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded border"
                          style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}
                        >
                          <Layers className="h-3 w-3" style={{ color: "var(--accent)" }} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{area.area_name}</p>
                          <p className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>
                            {area.company_name ? `${area.company_name} · ` : ""}{isPig ? "Piggery" : isDairy ? "Dairy" : lobLabel} · {area.area_code}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent)" }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-2 border-t" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
            <p className="text-[10px] text-center" style={{ color: "var(--text-muted)" }}>
              Active workspace controls sidebar modules & permissions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
