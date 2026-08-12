"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox } from "lucide-react";
import { InlineAlert } from "@/components/ui/alert";
import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  accent: { color: "var(--accent)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

const inputCls = "rounded-lg border py-1.5 px-2 text-xs outline-none";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

function Section({ title, lines, total }: { title: string; lines: Row[]; total: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={S.surface}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-bold" style={S.primary}>{title}</h3>
      </div>
      <table className="w-full text-left text-sm">
        <tbody>
          {lines.length === 0 ? (
            <tr><td className="px-4 py-6 text-center text-xs" style={S.sub}><Inbox className="mx-auto mb-1.5 h-5 w-5" style={S.muted} /> No activity.</td></tr>
          ) : (
            lines.map((l: Row) => (
              <tr key={l.gl_account_id} className="border-b text-xs last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-2.5" style={S.sub}>{l.account_code}</td>
                <td className="px-4 py-2.5" style={S.primary}>{l.account_name}</td>
                <td className="px-4 py-2.5 text-right" style={S.primary}>{l.balance.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
            <td colSpan={2} className="px-4 py-2.5" style={S.sub}>Total {title}</td>
            <td className="px-4 py-2.5 text-right" style={S.primary}>{total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function ProfitLossPanel() {
  const today = new Date().toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [dateTo, setDateTo] = useState(today);
  const [report, setReport] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const companyId = getActiveCompanyId();

  const load = async () => {
    if (!companyId || !dateFrom || !dateTo) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ companyId, dateFrom, dateTo });
      const res = await api.get(`/financial-reports/profit-loss?${params.toString()}`);
      setReport(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load Profit & Loss.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>Profit &amp; Loss</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Income and Expense for a period.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={S.muted}>From</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} style={S.input} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium" style={S.muted}>To</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} style={S.input} />
          </div>
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={S.accent} /></div>
      ) : report ? (
        <>
          <Section title="Income" lines={report.income} total={report.totalIncome} />
          <Section title="Expense" lines={report.expense} total={report.totalExpense} />
          <div className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold" style={S.surface}>
            <span style={S.sub}>Net Income</span>
            <span style={{ color: report.netIncome >= 0 ? "var(--success)" : "var(--danger)" }}>{report.netIncome.toFixed(2)}</span>
          </div>
        </>
      ) : null}
    </div>
  );
}
