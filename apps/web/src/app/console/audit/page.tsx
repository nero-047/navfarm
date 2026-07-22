"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, AlertCircle, Search } from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";

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
    let bg = "#EFF6FF", color = "#1D4ED8", border = "#BFDBFE";
    if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("ONBOARD")) {
      bg = "#F0FDF4"; color = "#15803D"; border = "#BBF7D0";
    } else if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("ASSIGN")) {
      bg = "#FFFBEB"; color = "#B45309"; border = "#FDE68A";
    } else if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REVOKE")) {
      bg = "#FEF2F2"; color = "#B91C1C"; border = "#FECACA";
    }
    return (
      <span className="text-[11px] font-bold uppercase font-mono px-2 py-0.5 rounded border"
        style={{ backgroundColor: bg, color, borderColor: border }}>
        {action}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-5 h-5 mr-2" style={{ color: "var(--accent)" }} />
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading audit logs…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 xl:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Audit Ledger</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>{auditLogs.length} events recorded</p>
        </div>
        <div className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs…"
              className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm sm:w-64"
              style={{ borderColor: "var(--input-border)", backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden shadow-sm" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" }}>
              {["#", "Timestamp", "Action", "Entity", "User"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</th>
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
                <tr key={log.audit_id || idx} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}>
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
