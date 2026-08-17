import React from "react";
import { Card } from "@/components/ui/card";

interface AuditTabProps {
  auditLogs: any[];
}

export default function AuditTab({ auditLogs }: AuditTabProps) {
  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE") || act.includes("REGISTER") || act.includes("ONBOARD")) {
      return "bg-(--success-muted) text-(--success) border-(--success)";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("ASSIGN") || act.includes("SAVE")) {
      return "bg-(--warning-muted) text-(--warning) border-(--warning)";
    }
    if (act.includes("DELETE") || act.includes("REMOVE") || act.includes("REVOKE") || act.includes("UNASSIGN")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    return "bg-(--info-muted) text-(--info) border-(--info)";
  };

  return (
    <Card className="p-0 overflow-hidden border-(--border) bg-(--surface) animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-(--border) text-[10px] font-semibold text-(--text-secondary) uppercase tracking-wider bg-(--surface)">
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
                <td colSpan={5} className="p-8 text-center text-(--text-secondary) text-xs">No operational audit entries registered.</td>
              </tr>
            ) : (
              auditLogs.map((log, idx) => (
                <tr key={log.audit_id} className="border-b border-(--border) text-xs hover:bg-(--surface-raised) transition-colors">
                  <td className="p-4 text-center font-mono text-(--text-muted)">{idx + 1}</td>
                  <td className="p-4 font-mono text-(--text-secondary)">{log.created_at}</td>
                  <td className="p-4 font-semibold text-(--text-primary)">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-semibold border uppercase font-mono ${getActionBadgeColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-(--text-secondary) font-medium">
                    {log.entity_name}{' '}
                    <span className="text-[10px] text-(--text-muted) font-mono">({log.entity_id?.substring(0, 8)}...)</span>
                  </td>
                  <td className="p-4 text-(--text-secondary) font-medium">{log.user_name || "System Background Job"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
