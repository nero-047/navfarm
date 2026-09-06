"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox, Plus } from "lucide-react";
import { InlineAlert } from "@/components/ui/alert";
import { api } from "@/services/api-client";
import { useLanguage } from "@/hooks/useLanguage";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised: { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

const inputCls = "nf-input-sm";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * BBP-1 §1.1: "Exchange Rate (USD/ZWL) | Decimal(6) | Manual entry by Finance.
 * Alert fires if not updated in 7 days."
 *
 * Rates are kept as dated rows rather than one mutable number, so a past period
 * can be restated with the rate that applied at the time. The newest row is the
 * current rate; older ones stay as history.
 *
 * The staleness alert the BBP asks for is computed here from the newest rate's
 * date. It is a display warning only — no notification is sent, because no
 * alerting channel is wired to this yet.
 */
export default function ExchangeRatePanel() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [currencies, setCurrencies] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fromCurrencyId: "", toCurrencyId: "", rate: "", rateDate: today() });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // The company's own currencies, not the platform catalog. /currency lists
      // every currency any tenant has ever needed — INR among them here — and
      // offering those invites a rate between two currencies this company does
      // not use. BBP-1 §1.1 gives a company one base and one foreign currency.
      const companyId = getActiveCompanyId();
      const [rateRes, detailRes] = await Promise.all([
        api.get("/currency/rates"),
        companyId ? api.get(`/setup/wizard/company-details/${companyId}`) : Promise.resolve(null),
      ]);
      setRows(unwrap<Row[]>(rateRes) || []);
      const detail: any = detailRes ? unwrap<any>(detailRes) : null;
      setCurrencies(detail?.currencies || []);
    } catch (err: any) {
      setError(err?.message || t("finExchangeRateLoadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Newest first from the API, so the head of the list is the rate in force.
  const current = rows[0];
  const daysSince = current?.rate_date
    ? Math.floor((Date.now() - new Date(current.rate_date).getTime()) / 86_400_000)
    : null;
  const stale = daysSince !== null && daysSince > 7;

  const complete = form.fromCurrencyId && form.toCurrencyId && form.rate !== "" && Number(form.rate) > 0
    && form.fromCurrencyId !== form.toCurrencyId;

  const submit = async () => {
    if (!complete) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/currency/rate", {
        fromCurrencyId: form.fromCurrencyId,
        toCurrencyId: form.toCurrencyId,
        rate: Number(form.rate),
        source: "MANUAL",
        rateDate: form.rateDate || undefined,
      });
      setForm({ ...form, rate: "" });
      await load();
    } catch (err: any) {
      setError(err?.message || t("finExchangeRateSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <InlineAlert>{error}</InlineAlert>}

      {stale && (
        <InlineAlert>
          {t("finExchangeRateStale", { days: String(daysSince) })}
        </InlineAlert>
      )}

      <div className="rounded-[var(--radius-sm)] border p-4" style={S.surface}>
        <h3 className="mb-3 text-sm font-semibold" style={S.primary}>{t("finExchangeRateRecord")}</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={S.sub}>{t("finExchangeRateFrom")}</span>
            <select className={`${inputCls} nf-select`} style={S.input} value={form.fromCurrencyId}
              onChange={(e) => setForm({ ...form, fromCurrencyId: e.target.value })}>
              <option value="">{t("selectPlaceholder")}</option>
              {currencies.map((c) => <option key={c.currency_id} value={c.currency_id}>{c.iso_code}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={S.sub}>{t("finExchangeRateTo")}</span>
            <select className={`${inputCls} nf-select`} style={S.input} value={form.toCurrencyId}
              onChange={(e) => setForm({ ...form, toCurrencyId: e.target.value })}>
              <option value="">{t("selectPlaceholder")}</option>
              {currencies.filter((c) => c.currency_id !== form.fromCurrencyId)
                .map((c) => <option key={c.currency_id} value={c.currency_id}>{c.iso_code}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={S.sub}>{t("finExchangeRateRate")}</span>
            <input type="number" step="0.000001" min="0" className={inputCls} style={S.input}
              value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="26.500000" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={S.sub}>{t("finExchangeRateDate")}</span>
            <input type="date" className={inputCls} style={S.input}
              value={form.rateDate} onChange={(e) => setForm({ ...form, rateDate: e.target.value })} />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={submit} disabled={!complete || saving}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--accent)" }}>
              <Plus className="h-3.5 w-3.5" />{saving ? t("saving") : t("mdAdd")}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs" style={S.muted}>{t("finExchangeRateHint")}</p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-sm)] border" style={S.surface}>
        <table className="w-full text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>{t("finExchangeRateDate")}</TableHead>
              <TableHead>{t("finExchangeRatePair")}</TableHead>
              <TableHead className="text-right">{t("finExchangeRateRate")}</TableHead>
              <TableHead>{t("finExchangeRateSource")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={4} className="py-8 text-center">
                <Loader2 className="mx-auto h-4 w-4 animate-spin" style={S.muted} />
              </TableCell></TableRow>
            )}
            {!loading && !rows.length && (
              <TableRow><TableCell colSpan={4} className="py-8 text-center" style={S.muted}>
                <Inbox className="mx-auto mb-2 h-5 w-5" />
                {t("finExchangeRateEmpty")}
              </TableCell></TableRow>
            )}
            {!loading && rows.map((r, i) => (
              <TableRow key={r.rate_id}>
                <TableCell style={S.primary}>
                  {r.rate_date}
                  {i === 0 && <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[10px]" style={S.raised}>{t("finExchangeRateCurrent")}</span>}
                </TableCell>
                <TableCell style={S.sub}>{r.from_currency} → {r.to_currency}</TableCell>
                <TableCell className="text-right font-mono" style={S.primary}>{Number(r.rate).toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}</TableCell>
                <TableCell style={S.muted}>{r.rate_source}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </table>
      </div>
    </div>
  );
}
