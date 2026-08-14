"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";
import { LoadingState, ErrorState } from "../../../components/ui/states";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";

export default function AuditPage() {
  const router = useRouter();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser) { router.replace("/"); return; }
    loadAuditLogs();
  }, [router]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(auditLogs); return; }
    const q = search.toLowerCase();
    setFiltered(auditLogs.filter((l) =>
      l.action?.toLowerCase().includes(q) ||
      l.entity_name?.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q)
    ));
  }, [search, auditLogs]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.get("/audit-log");
      setAuditLogs(list);
      setFiltered(list);
    } catch (e: any) {
      setError(e?.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const actionBadge = (action: string) => {
    const act = action?.toUpperCase() || "";
    let variant: "success" | "warning" | "danger" | "info" = "info";
    if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("ONBOARD")) {
      variant = "success";
    } else if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("ASSIGN")) {
      variant = "warning";
    } else if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REVOKE")) {
      variant = "danger";
    }
    return (
      <Badge variant={variant} className="font-mono uppercase">
        {action}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingState label="Loading audit logs…" />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="nf-text-section" style={{ color: "var(--text-primary)" }}>Audit Ledger</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{auditLogs.length} events recorded</p>
        </div>
        <div className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs…"
              className="pl-9 sm:w-64"
            />
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} />}

      {/* Table */}
      <div className="rounded-[var(--radius-md)] border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ backgroundColor: "var(--surface-secondary)", borderColor: "var(--border)" }}>
              {["#", "Timestamp", "Action", "Entity", "User"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm" style={{ color: "var(--text-muted)" }}>
                  {search ? "No results match your search." : "No audit entries found."}
                </td>
              </tr>
            ) : (
              filtered.map((log, idx) => (
                <tr key={log.audit_id || idx} className="border-b transition-colors hover:bg-(--row-hover) last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                  <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5">{actionBadge(log.action)}</td>
                  <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text-primary)" }}>
                    {log.entity_name}{" "}
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ({log.entity_id?.substring(0, 8)}…)
                    </span>
                  </td>
                  <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{log.user_name || "System"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
