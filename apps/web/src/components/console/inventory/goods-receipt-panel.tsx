"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, Loader2, Inbox, Eye, CheckCircle2 } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { Pagination } from "@/components/ui/pagination";
import { getActiveCompanyId } from "@/hooks/useAuth";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const PAGE_SIZE = 25;

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

const inputCls = "nf-input";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const emptyLine = () => ({ item_id: "", quantity: "", uom: "", rate: "", lot_no: "", expiry_date: "" });

const STATUS_STYLE: Record<string, any> = {
  DRAFT: { color: "var(--text-secondary)", borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" },
  POSTED: { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" },
  CANCELLED: { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--surface-raised)" },
};

export default function GoodsReceiptPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [warehouses, setWarehouses] = useState<Row[]>([]);
  const [suppliers, setSuppliers] = useState<Row[]>([]);
  const [items, setItems] = useState<Row[]>([]);
  const [uoms, setUoms] = useState<Row[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [header, setHeader] = useState<Row>({ warehouse_id: "", posting_date: "", supplier_id: "", external_reference_no: "", remarks: "" });
  const [lines, setLines] = useState<Row[]>([emptyLine()]);

  const [viewing, setViewing] = useState<Row | null>(null);
  const [posting, setPosting] = useState(false);

  const companyId = getActiveCompanyId();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (companyId) params.set("companyId", companyId);
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "200");
      const res = await api.get(`/goods-receipt?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load goods receipts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    const qs = params.toString();
    api.get(`/warehouse?${qs}`).then((r) => setWarehouses(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/supplier?${qs}`).then((r) => setSuppliers(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/item?${qs}`).then((r) => setItems(unwrap<Row[]>(r) || [])).catch(() => {});
    api.get(`/uom?${qs}`).then((r) => setUoms(unwrap<Row[]>(r) || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setHeader({ warehouse_id: "", posting_date: new Date().toISOString().slice(0, 10), supplier_id: "", external_reference_no: "", remarks: "" });
    setLines([emptyLine()]);
    setFormError("");
    setModalOpen(true);
  };

  const setLineField = (idx: number, key: string, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (!header.warehouse_id) throw new Error("Warehouse is required.");
      if (!header.posting_date) throw new Error("Posting date is required.");
      const cleanLines = lines
        .filter((l) => l.item_id && l.quantity && l.uom)
        .map((l) => ({
          item_id: l.item_id,
          quantity: Number(l.quantity),
          uom: l.uom,
          rate: l.rate ? Number(l.rate) : undefined,
          lot_no: l.lot_no || undefined,
          expiry_date: l.expiry_date || undefined,
        }));
      if (cleanLines.length === 0) throw new Error("Add at least one line with item, quantity and UOM.");

      await api.post("/goods-receipt", {
        company_id: companyId,
        warehouse_id: header.warehouse_id,
        posting_date: header.posting_date,
        supplier_id: header.supplier_id || undefined,
        external_reference_no: header.external_reference_no || undefined,
        remarks: header.remarks || undefined,
        lines: cleanLines,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save goods receipt.");
    } finally {
      setSaving(false);
    }
  };

  const openView = async (row: Row) => {
    try {
      const res = await api.get(`/goods-receipt/${row.receipt_id}`);
      setViewing(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load goods receipt details.");
    }
  };

  const handlePost = async () => {
    if (!viewing) return;
    setPosting(true);
    try {
      const res = await api.post(`/goods-receipt/${viewing.receipt_id}/post`, {});
      setViewing(unwrap<Row>(res));
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to post goods receipt.");
    } finally {
      setPosting(false);
    }
  };

  const warehouseLabel = (id: string) => warehouses.find((w) => w.warehouse_id === id)?.warehouse_name || "—";
  const itemLabel = (id: string) => {
    const it = items.find((i) => i.item_id === id);
    return it ? `${it.item_code} — ${it.item_name}` : "—";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={S.primary}>Goods Receipt</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Record incoming stock. Draft, then Post to write it to the Inventory Ledger.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border py-1.5 px-2 text-xs outline-none nf-select" style={S.input}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none" style={S.input} />
          </div>
          <Button onClick={openCreate} >
            <Plus className="h-3.5 w-3.5" /> New Receipt
          </Button>
        </div>
      </div>

      {error && (
        <InlineAlert>{error}</InlineAlert>
      )}

      <div className="overflow-hidden rounded-[var(--radius-md)] border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <TableHeader>
              <tr className="border-b border-(--row-border)">
                <TableHead className="whitespace-nowrap">Receipt No.</TableHead>
                <TableHead className="whitespace-nowrap">Posting Date</TableHead>
                <TableHead className="whitespace-nowrap">Warehouse</TableHead>
                <TableHead className="whitespace-nowrap">Reference</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <tr><TableCell colSpan={6} className="py-10 text-center" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</TableCell></tr>
              ) : rows.length === 0 ? (
                <tr><TableCell colSpan={6} className="py-10 text-center" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No goods receipts yet.</TableCell></tr>
              ) : (
                pagedRows.map((row) => (
                  <TableRow key={row.receipt_id}>
                    <TableCell className="whitespace-nowrap font-semibold" style={S.primary}>{row.receipt_no}</TableCell>
                    <TableCell className="whitespace-nowrap" style={S.primary}>{row.posting_date}</TableCell>
                    <TableCell className="whitespace-nowrap" style={S.primary}>{warehouseLabel(row.warehouse_id)}</TableCell>
                    <TableCell className="whitespace-nowrap" style={S.sub}>{row.external_reference_no || "—"}</TableCell>
                    <TableCell className="text-right">
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={STATUS_STYLE[row.status] || STATUS_STYLE.DRAFT}>{row.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button onClick={() => openView(row)} title="View" className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
        {!loading && rows.length > 0 && (
          <div className="border-t px-2" style={{ borderColor: "var(--border)" }}>
            <Pagination page={page} pageSize={pageSize} total={rows.length} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="New Goods Receipt"
        maxWidth="xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
            <Button onClick={handleSave} disabled={saving} >
              {saving ? "Saving…" : "Save Draft"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <InlineAlert>{formError}</InlineAlert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Warehouse <span className="text-(--danger)">*</span></label>
              <select value={header.warehouse_id} onChange={(e) => setHeader((h) => ({ ...h, warehouse_id: e.target.value }))} className={`${inputCls} nf-select`} style={S.input}>
                <option value="">Select…</option>
                {warehouses.map((w) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.warehouse_code} — {w.warehouse_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Posting Date <span className="text-(--danger)">*</span></label>
              <input type="date" value={header.posting_date} onChange={(e) => setHeader((h) => ({ ...h, posting_date: e.target.value }))} className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Supplier</label>
              <select value={header.supplier_id} onChange={(e) => setHeader((h) => ({ ...h, supplier_id: e.target.value }))} className={`${inputCls} nf-select`} style={S.input}>
                <option value="">Select…</option>
                {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_code} — {s.supplier_name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>External Reference</label>
              <input value={header.external_reference_no} onChange={(e) => setHeader((h) => ({ ...h, external_reference_no: e.target.value }))} placeholder="Supplier DC/Invoice No." className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Remarks</label>
              <textarea value={header.remarks} onChange={(e) => setHeader((h) => ({ ...h, remarks: e.target.value }))} rows={2} className={inputCls} style={S.input} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Lines</p>
            <button onClick={addLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
              <Plus className="h-3 w-3" /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto rounded-[var(--radius-sm)] border" style={S.surface}>
            <table className="w-full border-collapse text-left text-xs">
              <TableHeader>
                <tr className="border-b border-(--row-border)">
                  <TableHead className="h-auto px-3 py-2">Item</TableHead>
                  <TableHead className="h-auto px-3 py-2">Qty</TableHead>
                  <TableHead className="h-auto px-3 py-2">UOM</TableHead>
                  <TableHead className="h-auto px-3 py-2">Rate</TableHead>
                  <TableHead className="h-auto px-3 py-2">Lot No.</TableHead>
                  <TableHead className="h-auto px-3 py-2">Expiry</TableHead>
                  <TableHead className="h-auto px-3 py-2"></TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-2 py-1.5">
                      <select value={line.item_id} onChange={(e) => setLineField(idx, "item_id", e.target.value)} className={`${inputCls} nf-select`} style={S.input}>
                        <option value="">Select Item ({items.length} options)…</option>
                        {items.map((it, i) => (
                          <option key={it.item_id} value={it.item_id}>
                            {i + 1}. {it.item_code} — {it.item_name}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 w-24"><input type="number" value={line.quantity} onChange={(e) => setLineField(idx, "quantity", e.target.value)} className={inputCls} style={S.input} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-28">
                      <select value={line.uom} onChange={(e) => setLineField(idx, "uom", e.target.value)} className={`${inputCls} nf-select`} style={S.input}>
                        <option value="">Select…</option>
                        {uoms.map((u) => <option key={u.uom_code} value={u.uom_code}>{u.uom_code}</option>)}
                      </select>
                    </TableCell>
                    <TableCell className="px-2 py-1.5 w-24"><input type="number" value={line.rate} onChange={(e) => setLineField(idx, "rate", e.target.value)} className={inputCls} style={S.input} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-28"><input value={line.lot_no} onChange={(e) => setLineField(idx, "lot_no", e.target.value)} className={inputCls} style={S.input} /></TableCell>
                    <TableCell className="px-2 py-1.5 w-36"><input type="date" value={line.expiry_date} onChange={(e) => setLineField(idx, "expiry_date", e.target.value)} className={inputCls} style={S.input} /></TableCell>
                    <TableCell className="px-2 py-1.5">
                      <button onClick={() => removeLine(idx)} type="button" className="rounded p-1 transition hover:bg-(--danger-muted)" style={{ color: "var(--danger)" }}><Trash2 className="h-3.5 w-3.5" /></button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </table>
          </div>
        </div>
      </Dialog>

      {/* View / Post modal */}
      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Goods Receipt ${viewing.receipt_no}` : ""}
        maxWidth="xl"
        footer={
          viewing?.status === "DRAFT" ? (
            <>
              <button onClick={() => setViewing(null)} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Close</button>
              <button onClick={handlePost} disabled={posting} className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--success)" }}>
                <CheckCircle2 className="h-4 w-4" /> {posting ? "Posting…" : "Post"}
              </button>
            </>
          ) : (
            <button onClick={() => setViewing(null)} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Close</button>
          )
        }
      >
        {viewing && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Status</p><span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={STATUS_STYLE[viewing.status] || STATUS_STYLE.DRAFT}>{viewing.status}</span></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Posting Date</p><p style={S.primary}>{viewing.posting_date}</p></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Warehouse</p><p style={S.primary}>{warehouseLabel(viewing.warehouse_id)}</p></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Reference</p><p style={S.primary}>{viewing.external_reference_no || "—"}</p></div>
              {viewing.posted_at && <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Posted At</p><p style={S.primary}>{viewing.posted_at}</p></div>}
            </div>

            <div className="overflow-x-auto rounded-[var(--radius-sm)] border" style={S.surface}>
              <table className="w-full border-collapse text-left text-xs">
                <TableHeader>
                  <tr className="border-b border-(--row-border)">
                    <TableHead className="h-auto px-3 py-2">Item</TableHead>
                    <TableHead className="h-auto px-3 py-2">Qty</TableHead>
                    <TableHead className="h-auto px-3 py-2">UOM</TableHead>
                    <TableHead className="h-auto px-3 py-2">Rate</TableHead>
                    <TableHead className="h-auto px-3 py-2">Lot No.</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {(viewing.lines || []).map((l: Row) => (
                    <TableRow key={l.line_id}>
                      <TableCell className="px-3 py-2" style={S.primary}>{itemLabel(l.item_id)}</TableCell>
                      <TableCell className="px-3 py-2" style={S.primary}>{l.quantity}</TableCell>
                      <TableCell className="px-3 py-2" style={S.primary}>{l.uom}</TableCell>
                      <TableCell className="px-3 py-2" style={S.primary}>{l.rate ?? "—"}</TableCell>
                      <TableCell className="px-3 py-2" style={S.primary}>{l.lot_no || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
