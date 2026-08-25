"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Inbox, CheckCircle2 } from "lucide-react";
import { api } from "@/services/api-client";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { StatusBadge } from "@/components/ui/status-badge";

const PAGE_SIZE = 25;

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  accent: { color: "var(--accent)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const SEVERITY_ICON_COLOR: Record<string, string> = {
  WARNING: "var(--warning)",
  CRITICAL: "var(--danger)",
};

export default function AlertPanel() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (severityFilter) params.set("severity", severityFilter);
      if (readFilter) params.set("isRead", readFilter);
      params.set("limit", "200");
      const res = await api.get(`/alert?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || t("alrtLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, readFilter]);

  useEffect(() => { setPage(1); }, [severityFilter, readFilter, pageSize]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const markRead = async (id: string) => {
    setActing(id);
    try {
      await api.post(`/alert/${id}/read`, { companyId });
      load();
    } catch (err: any) {
      setError(err?.message || t("alrtMarkReadFailed"));
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={S.primary}>{t("alrtPageTitle")}</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>{t("alrtPageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="nf-input-sm px-2" style={S.input}>
            <option value="">{t("alrtAllSeverities")}</option>
            <option value="WARNING">{t("alrtSeverityWarning")}</option>
            <option value="CRITICAL">{t("alrtSeverityCritical")}</option>
          </select>
          <select value={readFilter} onChange={(e) => setReadFilter(e.target.value)} className="nf-input-sm px-2" style={S.input}>
            <option value="">{t("alrtAll")}</option>
            <option value="false">{t("alrtUnread")}</option>
            <option value="true">{t("alrtRead")}</option>
          </select>
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="rounded-[var(--radius-md)] border p-10 text-center text-xs" style={S.surface}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> {t("alrtLoading")}</div>
        ) : rows.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border p-10 text-center text-xs" style={{ ...S.surface, ...S.sub }}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> {t("alrtNoAlerts")}</div>
        ) : (
          pagedRows.map((alert) => (
            <div key={alert.alert_id} className="flex items-start justify-between gap-3 rounded-[var(--radius-md)] border p-4" style={{ ...S.surface, opacity: alert.is_read ? 0.6 : 1 }}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: SEVERITY_ICON_COLOR[alert.severity] || "var(--warning)" }} />
                <div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={alert.severity} />
                    <p className="text-sm font-semibold" style={S.primary}>{alert.title}</p>
                  </div>
                  <p className="mt-1 text-xs" style={S.sub}>{alert.message}</p>
                  <p className="mt-1 text-[11px]" style={S.muted}>
                    {t("alrtExpectedActual", { expected: alert.expected_value ?? "—", actual: alert.actual_value ?? "—" })}
                    {alert.deviation_pct !== null && alert.deviation_pct !== undefined ? ` · ${t("alrtDeviationPct", { pct: Number(alert.deviation_pct).toFixed(2) })}` : ""}
                    {" · "}{new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {!alert.is_read && (
                <button onClick={() => markRead(alert.alert_id)} disabled={acting === alert.alert_id} className="flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
                  <CheckCircle2 className="h-3 w-3" /> {acting === alert.alert_id ? "…" : t("alrtMarkRead")}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {!loading && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}
    </div>
  );
}
