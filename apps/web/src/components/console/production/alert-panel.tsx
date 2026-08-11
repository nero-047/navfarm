'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Loader2,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/services/api-client';
import { getActiveCompanyId } from '@/hooks/useAuth';

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' },
  primary: { color: 'var(--text-primary)' },
  sub: { color: 'var(--text-secondary)' },
  muted: { color: 'var(--text-muted)' },
  accent: { color: 'var(--accent)' },
  input: {
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text)',
    borderColor: 'var(--input-border)',
  },
};

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : (res?.data ?? res)) as T;
}

const SEVERITY_STYLE: Record<string, any> = {
  WARNING: {
    color: '#b45309',
    borderColor: '#b45309',
    backgroundColor: 'rgba(180,83,9,0.1)',
  },
  CRITICAL: {
    color: 'var(--danger)',
    borderColor: 'var(--danger)',
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
};

export default function AlertPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [acting, setActing] = useState<string | null>(null);

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (severityFilter) params.set('severity', severityFilter);
      if (readFilter) params.set('isRead', readFilter);
      params.set('limit', '200');
      const res = await api.get(`/alert?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [severityFilter, readFilter]);

  const markRead = async (id: string) => {
    setActing(id);
    try {
      await api.post(`/alert/${id}/read`, {});
      load();
    } catch (err: any) {
      setError(err?.message || 'Failed to mark alert as read.');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>
            Alert Center
          </h2>
          <p className="mt-0.5 text-xs" style={S.sub}>
            KPI deviations detected on batch daily entries against their
            attached Scheduler.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border py-1.5 px-2 text-xs outline-none"
            style={S.input}
          >
            <option value="">All severities</option>
            <option value="WARNING">Warning</option>
            <option value="CRITICAL">Critical</option>
          </select>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className="rounded-[var(--radius-sm)] border py-1.5 px-2 text-xs outline-none"
            style={S.input}
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {loading ? (
          <div
            className="rounded-[var(--radius-lg)] border p-10 text-center text-xs"
            style={S.surface}
          >
            <Loader2
              className="mx-auto mb-2 h-5 w-5 animate-spin"
              style={S.accent}
            />{' '}
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <div
            className="rounded-[var(--radius-lg)] border p-10 text-center text-xs"
            style={{ ...S.surface, ...S.sub }}
          >
            <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No
            alerts.
          </div>
        ) : (
          rows.map((alert) => (
            <div
              key={alert.alert_id}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border p-4"
              style={{ ...S.surface, opacity: alert.is_read ? 0.6 : 1 }}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: SEVERITY_STYLE[alert.severity]?.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full border px-2 py-0.5 text-xs font-semibold"
                      style={
                        SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.WARNING
                      }
                    >
                      {alert.severity}
                    </span>
                    <p className="text-sm font-semibold" style={S.primary}>
                      {alert.title}
                    </p>
                  </div>
                  <p className="mt-1 text-xs" style={S.sub}>
                    {alert.message}
                  </p>
                  <p className="mt-1 text-xs" style={S.muted}>
                    Expected {alert.expected_value ?? '—'} · Actual{' '}
                    {alert.actual_value ?? '—'}
                    {alert.deviation_pct !== null &&
                    alert.deviation_pct !== undefined
                      ? ` · ${Number(alert.deviation_pct).toFixed(2)}% deviation`
                      : ''}
                    {' · '}
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {!alert.is_read && (
                <button
                  onClick={() => markRead(alert.alert_id)}
                  disabled={acting === alert.alert_id}
                  className="flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] border px-2.5 py-1 text-xs font-semibold"
                  style={S.surface}
                >
                  <CheckCircle2 className="h-3 w-3" />{' '}
                  {acting === alert.alert_id ? '…' : 'Mark Read'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
