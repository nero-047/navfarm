import React from "react";
import { Card } from "@/components/ui/card";

interface AuditTabProps {
  auditLogs: any[];
}

export default function AuditTab({ auditLogs }: AuditTabProps) {
  const getActionBadge = (action: string): React.CSSProperties => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("ONBOARD")) {
      return { backgroundColor: "var(--success-muted)", color: "var(--success)", borderColor: "var(--success)" };
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("ASSIGN") || act.includes("SAVE")) {
      return { backgroundColor: "var(--warning-muted)", color: "var(--warning)", borderColor: "var(--warning)" };
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REVOKE") || act.includes("UNASSIGN")) {
      return { backgroundColor: "var(--danger-muted)", color: "var(--danger)", borderColor: "var(--danger)" };
    }
    return { backgroundColor: "var(--color-blue-soft)", color: "var(--info)", borderColor: "var(--info)" };
  };

  return (
    <Card className="p-0 overflow-hidden animate-fade-in" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="border-b text-[10px] font-semibold uppercase tracking-wider"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--surface)" }}
            >
              <th className="p-4 w-12 text-center">#</th>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Action Event</th>
              <th className="p-4">Entity Target</th>
              <th className="p-4">User Scope</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs" style={{ color: "var(--text-secondary)" }}>
                  No operational audit entries registered.
                </td>
              </tr>
            ) : (
              auditLogs.map((log, idx) => (
                <tr
                  key={log.audit_id}
                  className="border-b text-xs transition-colors hover:bg-[var(--surface-raised)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="p-4 text-center font-mono" style={{ color: "var(--text-muted)" }}>{idx + 1}</td>
                  <td className="p-4 font-mono" style={{ color: "var(--text-secondary)" }}>{log.created_at}</td>
                  <td className="p-4 font-semibold" style={{ color: "var(--text-primary)" }}>
                    <span
                      className="px-2.5 py-0.5 rounded-lg text-[9px] font-semibold border uppercase font-mono"
                      style={getActionBadge(log.action)}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 font-medium" style={{ color: "var(--text-secondary)" }}>
                    {log.entity_name}{' '}
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      ({log.entity_id?.substring(0, 8)}...)
                    </span>
                  </td>
                  <td className="p-4 font-medium" style={{ color: "var(--text-secondary)" }}>
                    {log.user_name || "System Background Job"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
