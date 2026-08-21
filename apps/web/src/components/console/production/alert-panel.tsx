"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  Loader2,
  Inbox,
  CheckCircle2,
  CheckCheck,
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
} from "lucide-react";
import { api } from "@/services/api-client";
import { InlineAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";

const PAGE_SIZE = 20;

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised: { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  accent: { color: "var(--accent)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const SEVERITY_STYLE: Record<string, any> = {
  WARNING: { color: "var(--warning)", borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)" },
  CRITICAL: { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" },
};

export default function AlertPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [batches, setBatches] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const companyId = getActiveCompanyId();

  const loadBatches = async () => {
    if (!companyId) return;
    try {
      const res = await api.get(`/batch?companyId=${companyId}&limit=100`);
      setBatches(unwrap<Row[]>(res) || []);
    } catch {
      // Non-critical, batch dropdown fallback
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (severityFilter) params.set("severity", severityFilter);
      if (readFilter) params.set("isRead", readFilter);
      if (batchFilter) params.set("batchId", batchFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "250");

      const res = await api.get(`/alert?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, readFilter, batchFilter]);

  useEffect(() => {
    setPage(1);
  }, [severityFilter, readFilter, batchFilter, search, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  // Client-side search refinement if rows already loaded
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.message?.toLowerCase().includes(q) ||
        r.parameter_name?.toLowerCase().includes(q) ||
        r.batch_no?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const pagedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  // Compute live statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const critical = rows.filter((r) => r.severity === "CRITICAL").length;
    const warning = rows.filter((r) => r.severity === "WARNING").length;
    const unread = rows.filter((r) => !r.is_read).length;
    return { total, critical, warning, unread };
  }, [rows]);

  const markRead = async (id: string) => {
    setActing(id);
    setError("");
    try {
      await api.post(`/alert/${id}/read`, { companyId });
      setRows((prev) =>
        prev.map((r) => (r.alert_id === id ? { ...r, is_read: true, read_at: new Date().toISOString() } : r))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to mark alert as read.");
    } finally {
      setActing(null);
    }
  };

  const markAllRead = async () => {
    if (!companyId) return;
    setMarkingAll(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/alert/mark-all-read", {
        companyId,
        batchId: batchFilter || undefined,
      });
      setSuccess("All matching alerts acknowledged.");
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to acknowledge alerts.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Page Header & Action Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={S.primary}>
            KPI Alert Center
          </h2>
          <p className="mt-0.5 text-xs" style={S.sub}>
            Real-time monitoring of batch daily entries against configured scheduler benchmarks and tolerance thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={markingAll || loading}
              className="text-xs"
            >
              {markingAll ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="mr-1.5 h-3.5 w-3.5 text-(--success)" />
              )}
              Acknowledge All ({stats.unread})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Summary Metric Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border p-3.5 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>
              Total Alerts
            </span>
            <Layers className="h-4 w-4" style={S.muted} />
          </div>
          <p className="mt-1 text-2xl font-bold" style={S.primary}>
            {stats.total}
          </p>
        </div>

        <div
          className="rounded-[var(--radius-md)] border p-3.5 shadow-sm"
          style={{ ...S.raised, borderColor: stats.critical > 0 ? "var(--danger)" : "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>
              Critical Breaches
            </span>
            <AlertOctagon className="h-4 w-4" style={{ color: "var(--danger)" }} />
          </div>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--danger)" }}>
            {stats.critical}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border p-3.5 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>
              Warnings
            </span>
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--warning)" }} />
          </div>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--warning)" }}>
            {stats.warning}
          </p>
        </div>

        <div className="rounded-[var(--radius-md)] border p-3.5 shadow-sm" style={S.raised}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>
              Pending Attention
            </span>
            <span className="flex h-2 w-2 rounded-full bg-(--accent)" />
          </div>
          <p className="mt-1 text-2xl font-bold" style={S.accent}>
            {stats.unread}
          </p>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-3" style={S.surface}>
        <form onSubmit={handleSearchSubmit} className="flex min-w-[220px] flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input
              type="text"
              placeholder="Search by parameter, batch no, or keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="nf-input pl-8 text-xs"
              style={S.input}
            />
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {batches.length > 0 && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="nf-select rounded-lg border py-1.5 px-2 text-xs outline-none"
              style={S.input}
            >
              <option value="">All Batches ({batches.length})</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_no} {b.current_stage_code ? `(${b.current_stage_code})` : ""}
                </option>
              ))}
            </select>
          )}

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="nf-select rounded-lg border py-1.5 px-2 text-xs outline-none"
            style={S.input}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="WARNING">Warning Only</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="nf-select rounded-lg border py-1.5 px-2 text-xs outline-none"
            style={S.input}
          >
            <option value="">All Statuses</option>
            <option value="false">Unread (Pending)</option>
            <option value="true">Acknowledged (Read)</option>
          </select>
        </div>
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}
      {success && <InlineAlert variant="success">{success}</InlineAlert>}

      {/* ── Alert Cards List ── */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div className="rounded-[var(--radius-md)] border p-12 text-center text-xs" style={S.surface}>
            <Loader2 className="mx-auto mb-2.5 h-6 w-6 animate-spin" style={S.accent} />
            Loading KPI alerts…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border p-12 text-center text-xs" style={{ ...S.surface, ...S.sub }}>
            <Inbox className="mx-auto mb-2 h-7 w-7" style={S.muted} />
            No KPI deviation alerts matching the current criteria.
          </div>
        ) : (
          pagedRows.map((alert) => {
            const devPct = alert.deviation_pct !== null && alert.deviation_pct !== undefined ? Number(alert.deviation_pct) : null;
            const isAbove = devPct !== null ? devPct > 0 : alert.title?.toLowerCase().includes("above");

            return (
              <div
                key={alert.alert_id}
                className="flex flex-col gap-3 rounded-[var(--radius-md)] border p-4 transition hover:border-(--accent)/40 sm:flex-row sm:items-start sm:justify-between"
                style={{
                  ...S.surface,
                  opacity: alert.is_read ? 0.65 : 1,
                  borderLeftWidth: "4px",
                  borderLeftColor: alert.severity === "CRITICAL" ? "var(--danger)" : "var(--warning)",
                }}
              >
                <div className="flex items-start gap-3.5">
                  <div className="mt-0.5 shrink-0">
                    {alert.severity === "CRITICAL" ? (
                      <AlertOctagon className="h-5 w-5" style={{ color: "var(--danger)" }} />
                    ) : (
                      <AlertTriangle className="h-5 w-5" style={{ color: "var(--warning)" }} />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                        style={SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.WARNING}
                      >
                        {alert.severity}
                      </span>

                      {alert.batch_no && (
                        <span className="rounded-md border border-(--border) bg-(--surface-raised) px-2 py-0.5 text-[11px] font-semibold" style={S.primary}>
                          Batch: {alert.batch_no}
                          {alert.current_stage_code ? ` · ${alert.current_stage_code}` : ""}
                        </span>
                      )}

                      {devPct !== null && (
                        <span
                          className="flex items-center gap-1 text-[11px] font-semibold"
                          style={{ color: isAbove ? "var(--danger)" : "var(--warning)" }}
                        >
                          {isAbove ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(devPct).toFixed(2)}% {isAbove ? "above" : "below"} target
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold" style={S.primary}>
                      {alert.title}
                    </h3>

                    <p className="text-xs leading-relaxed" style={S.sub}>
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px]" style={S.muted}>
                      <span>Expected: <strong style={S.primary}>{alert.expected_value ?? "—"}</strong></span>
                      <span>·</span>
                      <span>Actual: <strong style={S.primary}>{alert.actual_value ?? "—"}</strong></span>
                      {alert.kpi_min != null && alert.kpi_max != null && (
                        <>
                          <span>·</span>
                          <span>Range: [{alert.kpi_min}, {alert.kpi_max}]</span>
                        </>
                      )}
                      <span>·</span>
                      <span>Logged: {new Date(alert.created_at).toLocaleString()}</span>
                      {alert.is_read && (
                        <>
                          <span>·</span>
                          <span className="text-(--success) font-medium">✓ Acknowledged</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                  {!alert.is_read ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markRead(alert.alert_id)}
                      disabled={acting === alert.alert_id}
                      className="text-xs"
                    >
                      {acting === alert.alert_id ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-1.5 h-3 w-3 text-(--success)" />
                      )}
                      {acting === alert.alert_id ? "Saving…" : "Mark Read"}
                    </Button>
                  ) : (
                    <span className="rounded-full bg-(--surface-raised) border px-2.5 py-1 text-[10px] font-medium" style={S.muted}>
                      Read
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && filteredRows.length > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
