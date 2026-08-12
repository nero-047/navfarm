"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import { api } from "@/services/api-client";
import { InlineAlert } from "@/components/ui/alert";
import { getActiveCompanyId } from "@/hooks/useAuth";

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
  accent: { color: "var(--accent)" },
  danger: { color: "var(--danger)" },
  input: { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

const inputCls = "rounded-lg border py-1.5 px-2 text-xs outline-none";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function StockBalancePanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);
  const [warehouses, setWarehouses] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [itemId, setItemId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [belowReorderOnly, setBelowReorderOnly] = useState(false);

  const companyId = getActiveCompanyId();

  const load = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("companyId", companyId);
      if (itemId) params.set("itemId", itemId);
      if (warehouseId) params.set("warehouseId", warehouseId);
      if (belowReorderOnly) params.set("belowReorderOnly", "true");
      const res = await api.get(`/inventory-ledger/balance?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load stock balance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, warehouseId, belowReorderOnly]);

  useEffect(() => {
    if (!companyId) return;
    const params = new URLSearchParams({ companyId, limit: "500" });
    api.get(`/item?${params.toString()}`).then((r) => setItems(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/warehouse?companyId=${companyId}`).then((r) => setWarehouses(unwrap<Row[]>(r) || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalValue = rows.reduce((sum, r) => sum + Number(r.on_hand_value || 0), 0);
  const belowReorderCount = rows.filter((r) => r.reorder_level != null && r.on_hand_qty <= r.reorder_level).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold" style={S.primary}>Stock Balance</h2>
        <p className="mt-0.5 text-xs" style={S.sub}>Current on-hand quantity per item and warehouse, computed from remaining FIFO layers in the Inventory Ledger.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border p-4" style={S.surface}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>Item/Warehouse Lines</p>
          <p className="mt-1 text-2xl font-bold" style={S.primary}>{rows.length}</p>
        </div>
        <div className="rounded-2xl border p-4" style={S.surface}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>Total On-Hand Value</p>
          <p className="mt-1 text-2xl font-bold" style={S.primary}>₹{fmt(totalValue)}</p>
        </div>
        <div className="rounded-2xl border p-4" style={S.surface}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={S.muted}>At/Below Reorder Level</p>
          <p className="mt-1 text-2xl font-bold" style={belowReorderCount > 0 ? S.danger : S.primary}>{belowReorderCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputCls} style={S.input}>
          <option value="">All items</option>
          {items.map((it) => <option key={it.item_id} value={it.item_id}>{it.item_code} — {it.item_name}</option>)}
        </select>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={inputCls} style={S.input}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_code} — {w.warehouse_name}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs font-medium" style={S.sub}>
          <input type="checkbox" checked={belowReorderOnly} onChange={(e) => setBelowReorderOnly(e.target.checked)} />
          At/below reorder level only
        </label>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      <div className="overflow-hidden rounded-2xl border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                <th className="whitespace-nowrap px-4 py-3">Item</th>
                <th className="whitespace-nowrap px-4 py-3">Warehouse</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">On Hand</th>
                <th className="whitespace-nowrap px-4 py-3">UOM</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Value</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Reorder Level</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No stock on hand — post a Goods Receipt to bring items into inventory.</td></tr>
              ) : (
                rows.map((row) => {
                  const belowReorder = row.reorder_level != null && row.on_hand_qty <= row.reorder_level;
                  return (
                    <tr key={`${row.item_id}-${row.warehouse_id}`} className="border-b text-xs transition-colors hover:bg-(--surface-raised)" style={{ borderColor: "var(--border)" }}>
                      <td className="whitespace-nowrap px-4 py-3" style={S.primary}>{row.item_code} — {row.item_description}</td>
                      <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{row.warehouse_code ? `${row.warehouse_code} — ${row.warehouse_name}` : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold" style={S.primary}>{fmt(row.on_hand_qty)}</td>
                      <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{row.uom}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>₹{fmt(row.on_hand_value)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right" style={S.sub}>{row.reorder_level != null ? fmt(row.reorder_level) : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {belowReorder ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "var(--danger-muted, #fee2e2)", color: "var(--danger)" }}>
                            <AlertTriangle className="h-3 w-3" /> Reorder
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium" style={S.muted}>OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
