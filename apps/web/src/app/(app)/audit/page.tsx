"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";
import { LoadingState, ErrorState } from "../../../components/ui/states";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { PageHeader } from "../../../components/ui/PageHeader";
import { ConsolePage } from "../../../components/ui/console-page";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/table";
import { useLanguage } from "@/hooks/useLanguage";

export default function AuditPage() {
  const { t } = useLanguage();
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
    return <LoadingState label={t("loadingAuditLogs")} />;
  }

  return (
    <ConsolePage>
      <PageHeader
        title={t("auditLedger")}
        description={`${auditLogs.length} events recorded`}
        actions={
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchLogs")}
              className="pl-9 sm:w-64"
            />
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      {/* Table */}
      <div className="rounded-[var(--radius-md)] border overflow-hidden" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <table className="w-full border-collapse text-sm">
          <TableHeader>
            <tr className="border-b" style={{ borderColor: "var(--row-border)" }}>
              {["#", "Timestamp", "Action", "Entity", "User"].map((h) => (
                <TableHead key={h} className="px-5">{h}</TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <tr>
                <TableCell colSpan={5} className="px-5 text-center py-10" style={{ color: "var(--text-muted)" }}>
                  {search ? "No results match your search." : "No audit entries found."}
                </TableCell>
              </tr>
            ) : (
              filtered.map((log, idx) => (
                <TableRow key={log.audit_id || idx}>
                  <TableCell className="px-5 font-mono" style={{ color: "var(--text-muted)" }}>{idx + 1}</TableCell>
                  <TableCell className="px-5 font-mono whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                  </TableCell>
                  <TableCell className="px-5">{actionBadge(log.action)}</TableCell>
                  <TableCell className="px-5 font-medium" style={{ color: "var(--text-primary)" }}>
                    {log.entity_name}{" "}
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                      ({log.entity_id?.substring(0, 8)}…)
                    </span>
                  </TableCell>
                  <TableCell className="px-5" style={{ color: "var(--text-secondary)" }}>{log.user_name || "System"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </table>
      </div>
    </ConsolePage>
  );
}
