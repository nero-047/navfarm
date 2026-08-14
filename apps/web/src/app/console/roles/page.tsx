"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, getActiveCompanyId, NavUser } from "../../../hooks/useAuth";
import RolesTab from "../../../components/console/console-tabs/roles-tab";
import { LoadingState, ErrorState } from "../../../components/ui/states";
import { Toast } from "../../../components/ui/toast";

const S = {
  surface: { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  raised:  { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub:     { color: "var(--text-secondary)" },
  muted:   { color: "var(--text-muted)" },
  accent:  { color: "var(--accent)" },
};

export default function RolesPage() {
  const router = useRouter();
  const [roles,         setRoles]         = useState<any[]>([]);
  const [activeCompany, setActiveCompany] = useState<any>(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const tid = getStoredTenantId();
    if (!token || !storedUser || !tid) { router.replace("/"); return; }
    loadData(storedUser, tid);
  }, [router]);

  const loadData = async (storedUser: NavUser, tid: string) => {
    setLoading(true); setError("");
    try {
      const companiesList = await api.get(`/company/tenant/${tid}`);
      const activeId = getActiveCompanyId() || storedUser.companyId || storedUser.company_id;
      const myCompany = companiesList.find((c: any) => c.company_id === activeId) || companiesList[0];
      setActiveCompany(myCompany || null);
      if (myCompany?.company_id) {
        const rolesList = await api.get(`/role/company/${myCompany.company_id}`);
        setRoles(rolesList);
      }
    } catch (e: any) { setError(e?.message || "Failed to load roles."); }
    finally { setLoading(false); }
  };

  const refreshRoles = async () => {
    if (!activeCompany?.company_id) return;
    try {
      const list = await api.get(`/role/company/${activeCompany.company_id}`);
      setRoles(list);
    } catch {
      setError("Failed to refresh roles.");
    }
  };

  if (loading) return <LoadingState label="Loading roles…" />;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div>
        <div>
          <h1 className="nf-text-section" style={S.primary}>Role Permissions</h1>
          <p className="text-sm mt-0.5" style={S.sub}>
            RBAC scopes for <span className="font-semibold" style={S.primary}>{activeCompany?.company_name || "—"}</span>
          </p>
        </div>
      </div>

      {error   && <ErrorState message={error} />}
      {success && <Toast variant="success" message={success} onClose={() => setSuccess("")} />}

      <div className="rounded-[var(--radius-lg)] border p-6" style={S.surface}>
        <RolesTab
          roles={roles}
          companyId={activeCompany?.company_id || ""}
          onRefreshRoles={refreshRoles}
          actionError={error}
          actionSuccess={success}
          setActionError={setError}
          setActionSuccess={setSuccess}
        />
      </div>
    </div>
  );
}
