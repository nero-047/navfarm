"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox } from "lucide-react";
import { InlineAlert } from "@/components/ui/alert";
import { api } from "@/services/api-client";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { TableBody, TableFooter, TableRow, TableCell } from "@/components/ui/table";

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

function Section({ title, lines, total }: { title: string; lines: Row[]; total: number }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
      <div className="border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold" style={S.primary}>{title}</h3>
      </div>
      <table className="w-full border-collapse text-left text-sm">
        <TableBody>
          {lines.length === 0 ? (
            <tr><TableCell className="py-6 text-center" style={S.sub}><Inbox className="mx-auto mb-1.5 h-5 w-5" style={S.muted} /> No activity.</TableCell></tr>
          ) : (
            lines.map((l: Row) => (
              <TableRow key={l.gl_account_id}>
                <TableCell className="py-2.5" style={S.sub}>{l.account_code}</TableCell>
                <TableCell className="py-2.5" style={S.primary}>{l.account_name}</TableCell>
                <TableCell className="py-2.5 text-right" style={S.primary}>{l.balance.toFixed(2)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <tr>
            <TableCell colSpan={2} className="py-2.5" style={S.sub}>Total {title}</TableCell>
            <TableCell className="py-2.5 text-right" style={S.primary}>{total.toFixed(2)}</TableCell>
          </tr>
        </TableFooter>
      </table>
    </div>
  );
}

export default function BalanceSheetPanel() {
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
      const res = await api.get(`/financial-reports/balance-sheet?${params.toString()}`);
      setReport(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load Balance Sheet.");
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
          <h2 className="text-lg font-semibold" style={S.primary}>Balance Sheet</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Assets, Liabilities and Equity as of a date.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium" style={S.muted}>As of</span>
          <input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className={inputCls} style={S.input} />
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" style={S.accent} /></div>
      ) : report ? (
        <>
          <Section title="Assets" lines={report.assets} total={report.totalAssets} />
          <Section title="Liabilities" lines={report.liabilities} total={report.totalLiabilities} />
          <Section title="Equity" lines={report.equity} total={report.totalEquity} />
          <div className="flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold" style={S.surface}>
            <span style={S.sub}>Assets vs. Liabilities + Equity</span>
            <span style={{ color: report.isBalanced ? "var(--success)" : "var(--danger)" }}>
              {report.totalAssets.toFixed(2)} {report.isBalanced ? "=" : "≠"} {report.totalLiabilitiesAndEquity.toFixed(2)}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}
