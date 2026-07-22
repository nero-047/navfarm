"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredUser, getStoredToken, getStoredTenantId, NavUser } from "../../../hooks/useAuth";
import RolesTab from "../../../components/console/console-tabs/roles-tab";

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
      const myId = storedUser.companyId || storedUser.company_id;
      const myCompany = companiesList.find((c: any) => c.company_id === myId) || companiesList[0];
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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
      <span className="text-sm" style={S.sub}>Loading roles…</span>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div>
        <div>
          <h1 className="text-xl font-bold" style={S.primary}>Role Permissions</h1>
          <p className="text-sm mt-0.5" style={S.sub}>
            RBAC scopes for <span className="font-semibold" style={S.primary}>{activeCompany?.company_name || "—"}</span>
          </p>
        </div>
      </div>

      {error   && <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> {success}</div>}

      <div className="rounded-lg border shadow-sm p-6" style={S.surface}>
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
