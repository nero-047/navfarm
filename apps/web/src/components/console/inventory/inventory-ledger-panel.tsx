'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Inbox } from 'lucide-react';
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

const inputCls =
  'rounded-[var(--radius-sm)] border py-1.5 px-2 text-xs outline-none';

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : (res?.data ?? res)) as T;
}

const ENTRY_STYLE: Record<string, any> = {
  POSITIVE: { color: 'var(--success)' },
  NEGATIVE: { color: 'var(--danger)' },
};

export default function InventoryLedgerPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [itemId, setItemId] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('companyId', companyId);
      if (itemId) params.set('itemId', itemId);
      if (transactionType) params.set('transactionType', transactionType);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('limit', '200');
      const res = await api.get(`/inventory-ledger?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load inventory ledger entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [itemId, transactionType, dateFrom, dateTo]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set('companyId', companyId);
    params.set('limit', '500');
    api
      .get(`/item?${params.toString()}`)
      .then((r) => setItems(unwrap<Row[]>(r) || []))
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={S.primary}>
          Inventory Ledger
        </h2>
        <p className="mt-0.5 text-xs" style={S.sub}>
          Read-only movement history. Entries are written automatically when
          documents (Goods Receipt, etc.) are posted.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className={inputCls}
          style={S.input}
        >
          <option value="">All items</option>
          {items.map((it) => (
            <option key={it.item_id} value={it.item_id}>
              {it.item_code} — {it.item_name}
            </option>
          ))}
        </select>
        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className={inputCls}
          style={S.input}
        >
          <option value="">All transaction types</option>
          {[
            'PURCHASE',
            'CONSUMPTION',
            'OUTPUT',
            'TRANSFER_SHIPMENT',
            'TRANSFER_RECEIPT',
            'SALES',
            'VARIANCE_POSITIVE',
            'VARIANCE_NEGATIVE',
          ].map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={S.muted}>
            From
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={inputCls}
            style={S.input}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={S.muted}>
            To
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={inputCls}
            style={S.input}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div
        className="overflow-hidden rounded-[var(--radius-lg)] border"
        style={S.surface}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="border-b text-xs font-bold uppercase tracking-wider"
                style={{ ...S.sub, borderColor: 'var(--border)' }}
              >
                <th className="whitespace-nowrap px-4 py-3">Posting Date</th>
                <th className="whitespace-nowrap px-4 py-3">Document</th>
                <th className="whitespace-nowrap px-4 py-3">Item</th>
                <th className="whitespace-nowrap px-4 py-3">Type</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Qty</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Remaining
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Rate</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">
                  Amount
                </th>
                <th className="whitespace-nowrap px-4 py-3">Lot No.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-xs"
                    style={S.sub}
                  >
                    <Loader2
                      className="mx-auto mb-2 h-5 w-5 animate-spin"
                      style={S.accent}
                    />{' '}
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-xs"
                    style={S.sub}
                  >
                    <Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} />{' '}
                    No ledger entries yet — post a Goods Receipt to see
                    movements here.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.ledger_id}
                    className="border-b text-xs transition-colors hover:bg-(--surface-raised)"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      style={S.primary}
                    >
                      {row.posting_date}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.document_no}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3"
                      style={S.primary}
                    >
                      {row.item_code} — {row.item_description}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.transaction_type?.replace(/_/g, ' ')}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right font-semibold"
                      style={ENTRY_STYLE[row.entry_type] || S.primary}
                    >
                      {row.quantity}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      style={S.sub}
                    >
                      {row.remaining_quantity ?? '—'}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      style={S.sub}
                    >
                      {row.rate ?? '—'}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-right"
                      style={S.primary}
                    >
                      {row.amount ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>
                      {row.lot_no || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
