"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Download, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight,
  Sparkles, Layers,
} from "lucide-react";
import { api } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { getActiveCompanyId } from "@/hooks/useAuth";

type Row = Record<string, any>;

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised:  { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub:     { color: "var(--text-secondary)" },
  muted:   { color: "var(--text-muted)" },
  accent:  { color: "var(--accent)" },
  danger:  { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--danger-muted)" },
  warning: { color: "var(--warning)", borderColor: "var(--warning)", backgroundColor: "var(--warning-muted)" },
  success: { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--success-muted)" },
};

function formatCurrency(val?: number | string | null) {
  if (val == null) return "₹0.00";
  const num = Number(val);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BioAssetRollForwardPanel() {
  const companyId = getActiveCompanyId();

  const currentYear = new Date().getFullYear();
  const [dateFrom, setDateFrom] = useState(`${currentYear}-01-01`);
  const [dateTo, setDateTo]     = useState(new Date().toISOString().slice(0, 10));

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [data, setData]         = useState<Row | null>(null);

  const loadStatement = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(
        `/financial-reports/bio-asset-roll-forward?companyId=${companyId}&dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      setData(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load Biological Asset Roll-Forward statement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatement();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = () => {
    if (!data) return;
    const lines = [
      ["IAS 41 Biological Asset Roll-Forward Statement"],
      [`Period: ${dateFrom} to ${dateTo}`],
      [],
      ["Movement Line", "Amount (INR)"],
      ["Opening Carrying Value", data.openingCarryingValue],
      ["Additions — Acquisitions / Purchases", data.movements.acquisitions],
      ["Additions — Growth Capitalization (Feed/Meds/Overhead)", data.movements.growthCapitalization],
      ["Deductions — Amortization (Mature Breeding Stock)", data.movements.amortization],
      ["Fair Value Adjustments (P&L)", data.movements.fairValueAdjustments],
      ["Transfers — Harvest / Slaughter to Inventory", data.movements.harvestTransfers],
      ["Deductions — Disposals / Mortalities", data.movements.disposals],
      ["Net Period Movements", data.movements.netMovement],
      ["Closing Carrying Net Book Value (NBV)", data.closingCarryingValue],
      [],
      ["General Ledger (GL) Reconciliation"],
      ["Total GL Balance (Accounts 1050 & 1060)", data.glReconciliation.totalGlBalance],
      ["GL Variance", data.glReconciliation.variance],
      ["Reconciled Status", data.glReconciliation.isReconciled ? "RECONCILED" : "VARIANCE DETECTED"],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + lines.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IAS41_Bio_Asset_RollForward_${dateFrom}_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] border p-4" style={S.surface}>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={S.muted}>
              From Date
            </label>
            <input
              type="date"
              className="nf-input text-xs"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={S.muted}>
              To Date
            </label>
            <input
              type="date"
              className="nf-input text-xs"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end self-end">
            <Button size="sm" onClick={loadStatement} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
              Generate Statement
            </Button>
          </div>
        </div>

        {data && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        )}
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}

      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" style={S.accent} />
          <p className="mt-3 text-sm" style={S.sub}>Calculating IAS 41 Biological Asset Roll-Forward…</p>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-6">
          {/* ── Top Executive KPI Cards ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Opening Carrying Value</p>
              <p className="mt-1.5 text-2xl font-bold" style={S.primary}>
                {formatCurrency(data.openingCarryingValue)}
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>As of {dateFrom}</p>
            </div>

            <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Net Period Movement</p>
              <p className="mt-1.5 text-2xl font-bold" style={Number(data.movements.netMovement) >= 0 ? S.primary : S.danger}>
                {formatCurrency(data.movements.netMovement)}
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>{data.transactionCount} transaction(s) recorded</p>
            </div>

            <div className="rounded-[var(--radius-lg)] border p-4 shadow-sm" style={S.raised}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={S.muted}>Closing Carrying Value</p>
              <p className="mt-1.5 text-2xl font-bold" style={S.primary}>
                {formatCurrency(data.closingCarryingValue)}
              </p>
              <p className="mt-1 text-[11px]" style={S.sub}>As of {dateTo}</p>
            </div>

            <div
              className="rounded-[var(--radius-lg)] border p-4 shadow-sm"
              style={data.glReconciliation.isReconciled ? S.success : S.warning}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide">GL Reconciliation</p>
                {data.glReconciliation.isReconciled ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <p className="mt-1.5 text-2xl font-bold">
                {data.glReconciliation.isReconciled ? "Reconciled" : formatCurrency(data.glReconciliation.variance)}
              </p>
              <p className="mt-1 text-[11px]">
                GL Net: {formatCurrency(data.glReconciliation.totalGlBalance)}
              </p>
            </div>
          </div>

          {/* ── Main Roll-Forward Statement Table ── */}
          <div className="overflow-hidden rounded-[var(--radius-lg)] border shadow-sm" style={S.surface}>
            <div className="border-b px-5 py-4 flex items-center justify-between" style={S.raised}>
              <div>
                <h3 className="text-base font-semibold" style={S.primary}>IAS 41 Biological Asset Roll-Forward</h3>
                <p className="text-xs" style={S.muted}>Reconciliation of carrying amounts from beginning to end of period</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold" style={S.surface}>
                <Sparkles className="h-3 w-3" style={S.accent} /> Standard: IAS 41 Agriculture
              </span>
            </div>

            <table className="w-full text-sm">
              <tbody>
                {/* 1. Opening Carrying Value */}
                <tr className="border-b" style={S.surface}>
                  <td className="px-5 py-3 font-semibold" style={S.primary}>
                    1. Opening Carrying Amount (Pre-mature + Mature)
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold" style={S.primary}>
                    {formatCurrency(data.openingCarryingValue)}
                  </td>
                </tr>

                {/* 2. Additions */}
                <tr className="border-b" style={{ backgroundColor: "var(--surface-secondary)" }}>
                  <td colSpan={2} className="px-5 py-2 text-xs font-semibold uppercase tracking-wider" style={S.muted}>
                    Period Additions & Capitalization
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-8 py-2.5" style={S.sub}>
                    + Acquisitions / Livestock Purchases (PO / GRN)
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono" style={S.primary}>
                    {formatCurrency(data.movements.acquisitions)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-8 py-2.5" style={S.sub}>
                    + Growth Capitalization (Feed, Medicine, Overhead on Pre-mature stock)
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono" style={S.primary}>
                    {formatCurrency(data.movements.growthCapitalization)}
                  </td>
                </tr>

                {/* 3. Deductions & Adjustments */}
                <tr className="border-b" style={{ backgroundColor: "var(--surface-secondary)" }}>
                  <td colSpan={2} className="px-5 py-2 text-xs font-semibold uppercase tracking-wider" style={S.muted}>
                    Period Reductions, Amortization & Fair Value
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-8 py-2.5" style={S.sub}>
                    − Amortization of Mature Breeding Assets
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono" style={data.movements.amortization < 0 ? S.danger : S.primary}>
                    {formatCurrency(data.movements.amortization)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-8 py-2.5" style={S.sub}>
                    ± Fair Value Adjustments (Revaluations recognized in P&L)
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono" style={data.movements.fairValueAdjustments < 0 ? S.danger : S.primary}>
                    {formatCurrency(data.movements.fairValueAdjustments)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-8 py-2.5" style={S.sub}>
                    − Harvest / Slaughter Transfers to Meat/Carcass Inventory
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono" style={data.movements.harvestTransfers < 0 ? S.danger : S.primary}>
                    {formatCurrency(data.movements.harvestTransfers)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-8 py-2.5" style={S.sub}>
                    − Disposals, Sales & Mortality Write-Offs
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono" style={data.movements.disposals < 0 ? S.danger : S.primary}>
                    {formatCurrency(data.movements.disposals)}
                  </td>
                </tr>

                {/* 4. Total Movements Subtotal */}
                <tr className="border-b" style={S.raised}>
                  <td className="px-5 py-3 font-semibold" style={S.primary}>
                    Total Net Period Movements
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-bold" style={S.primary}>
                    {formatCurrency(data.movements.netMovement)}
                  </td>
                </tr>

                {/* 5. Closing Carrying Value */}
                <tr className="border-t-2" style={S.raised}>
                  <td className="px-5 py-4 text-base font-bold" style={S.primary}>
                    Closing Carrying Net Book Value (NBV)
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-lg font-bold" style={S.primary}>
                    {formatCurrency(data.closingCarryingValue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── Asset Dimension Breakdown ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border p-4" style={S.surface}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4" style={S.accent} />
                <h4 className="text-sm font-semibold" style={S.primary}>Asset Tracking Breakdown</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span style={S.sub}>Batch / Cohort Biological Assets</span>
                  <span className="font-mono font-medium" style={S.primary}>
                    {formatCurrency(data.assetTypeBreakdown.batchCarryingValue)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <span style={S.sub}>Individual Tagged Animals (Animal Register)</span>
                  <span className="font-mono font-medium" style={S.primary}>
                    {formatCurrency(data.assetTypeBreakdown.animalCarryingValue)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border p-4" style={S.surface}>
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="h-4 w-4" style={S.accent} />
                <h4 className="text-sm font-semibold" style={S.primary}>General Ledger Accounts</h4>
              </div>
              <div className="space-y-2 text-sm">
                {data.glReconciliation.glAccounts.map((a: Row) => (
                  <div key={a.account_code} className="flex justify-between py-1 border-b">
                    <span style={S.sub}>{a.account_code} — {a.account_name}</span>
                    <span className="font-mono font-medium" style={S.primary}>
                      {formatCurrency(a.balance)}
                    </span>
                  </div>
                ))}
                {data.glReconciliation.glAccounts.length === 0 && (
                  <p className="text-xs" style={S.muted}>No biological asset GL postings recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
