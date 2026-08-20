"use client";

import { useEffect, useState } from "react";
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import { api } from "@/services/api-client";
import { InlineAlert } from "@/components/ui/alert";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

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

const inputCls = "nf-input-sm";

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
        <h2 className="text-lg font-semibold" style={S.primary}>Stock Balance</h2>
        <p className="mt-0.5 text-xs" style={S.sub}>Current on-hand quantity per item and warehouse, computed from remaining FIFO layers in the Inventory Ledger.</p>
      </div>

      {/* Summary figures read as a single line of related numbers; three
          bordered boxes would imply they are independent modules. */}
      <dl className="flex flex-wrap gap-x-10 gap-y-4 border-y py-4" style={{ borderColor: "var(--border)" }}>
        <div>
          <dt className="nf-text-caption">Item/Warehouse Lines</dt>
          <dd className="mt-0.5 text-xl font-semibold" style={S.primary}>{rows.length}</dd>
        </div>
        <div>
          <dt className="nf-text-caption">Total On-Hand Value</dt>
          <dd className="mt-0.5 text-xl font-semibold" style={S.primary}>₹{fmt(totalValue)}</dd>
        </div>
        <div>
          <dt className="nf-text-caption">At/Below Reorder Level</dt>
          <dd className="mt-0.5 text-xl font-semibold" style={belowReorderCount > 0 ? S.danger : S.primary}>{belowReorderCount}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={`${inputCls} nf-select`} style={S.input}>
          <option value="">All items ({items.length} options)</option>
          {items.map((it, idx) => (
            <option key={it.item_id} value={it.item_id}>
              {idx + 1}. {it.item_code} — {it.item_name}
            </option>
          ))}
        </select>
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className={`${inputCls} nf-select`} style={S.input}>
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

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <TableHeader>
              <tr className="border-b border-(--row-border)">
                <TableHead className="whitespace-nowrap">Item</TableHead>
                <TableHead className="whitespace-nowrap">Warehouse</TableHead>
                <TableHead className="whitespace-nowrap text-right">On Hand</TableHead>
                <TableHead className="whitespace-nowrap">UOM</TableHead>
                <TableHead className="whitespace-nowrap text-right">Value</TableHead>
                <TableHead className="whitespace-nowrap text-right">Reorder Level</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr><TableCell colSpan={7} className="py-10 text-center" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</TableCell></tr>
              ) : rows.length === 0 ? (
                <tr><TableCell colSpan={7} className="py-10 text-center" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No stock on hand — post a Goods Receipt to bring items into inventory.</TableCell></tr>
              ) : (
                rows.map((row) => {
                  const belowReorder = row.reorder_level != null && row.on_hand_qty <= row.reorder_level;
                  return (
                    <TableRow key={`${row.item_id}-${row.warehouse_id}`}>
                      <TableCell className="whitespace-nowrap" style={S.primary}>{row.item_code} — {row.item_description}</TableCell>
                      <TableCell className="whitespace-nowrap" style={S.sub}>{row.warehouse_code ? `${row.warehouse_code} — ${row.warehouse_name}` : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap text-right font-semibold" style={S.primary}>{fmt(row.on_hand_qty)}</TableCell>
                      <TableCell className="whitespace-nowrap" style={S.sub}>{row.uom}</TableCell>
                      <TableCell className="whitespace-nowrap text-right" style={S.primary}>₹{fmt(row.on_hand_value)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right" style={S.sub}>{row.reorder_level != null ? fmt(row.reorder_level) : "—"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {belowReorder ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "var(--danger-muted, #fee2e2)", color: "var(--danger)" }}>
                            <AlertTriangle className="h-3 w-3" /> Reorder
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium" style={S.muted}>OK</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </table>
        </div>
      </div>
    </div>
  );
}
