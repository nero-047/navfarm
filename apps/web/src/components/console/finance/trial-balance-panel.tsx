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

const inputCls = "nf-input-sm";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

export default function TrialBalancePanel() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const companyId = getActiveCompanyId();

  const load = async () => {
    if (!companyId || !asOfDate) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ companyId, asOfDate });
      const res = await api.get(`/financial-reports/trial-balance?${params.toString()}`);
      setReport(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load Trial Balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOfDate]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={S.primary}>Trial Balance</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Debit/credit totals per GL account, as of a date.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium" style={S.muted}>As of</span>
          <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className={inputCls} style={S.input} />
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-semibold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                <th className="whitespace-nowrap px-4 py-3">Code</th>
                <th className="whitespace-nowrap px-4 py-3">Account</th>
                <th className="whitespace-nowrap px-4 py-3">Type</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-xs" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</td></tr>
              ) : !report || report.accounts.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-xs" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No posted journal activity yet.</td></tr>
              ) : (
                report.accounts.map((a: Row) => (
                  <tr key={a.gl_account_id} className="border-b text-xs" style={{ borderColor: "var(--border)" }}>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{a.account_code}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.primary}>{a.account_name}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{a.account_type}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>{a.total_debit.toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>{a.total_credit.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {report && report.accounts.length > 0 && (
              <tfoot>
                <tr className="border-t text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
                  <td colSpan={3} className="px-4 py-3" style={S.sub}>
                    Total{" "}
                    <span style={{ color: report.isBalanced ? "var(--success)" : "var(--danger)" }}>
                      ({report.isBalanced ? "balanced" : "not balanced"})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" style={S.primary}>{report.totalDebit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right" style={S.primary}>{report.totalCredit.toFixed(2)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
