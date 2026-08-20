"use client";

import { useEffect, useState } from "react";
import {
  Loader2, Save, RefreshCw,
} from "lucide-react";

import { api } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/alert";
import { getActiveCompanyId } from "@/hooks/useAuth";
import {
  TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

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

interface BatchRowState {
  batch_id: string;
  batch_no: string;
  batch_name?: string;
  stage_name?: string;
  current_quantity?: number;
  feed_qty: string;
  mortality_count: string;
  water_qty: string;
  temperature: string;
  remarks: string;
}

export default function BulkDailyEntryPanel() {
  const companyId = getActiveCompanyId();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [defaultFeedItemId, setDefaultFeedItemId] = useState("");

  const [feedItems, setFeedItems] = useState<Row[]>([]);
  const [rows, setRows]           = useState<BatchRowState[]>([]);

  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  // Load Active Batches and Feed Items
  const loadData = async () => {
    if (!companyId) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const [bRes, iRes] = await Promise.all([
        api.get(`/batch?companyId=${companyId}&status=ACTIVE&limit=100`),
        api.get(`/item?companyId=${companyId}&limit=200`),
      ]);

      const activeBatches = unwrap<Row[]>(bRes) || [];
      const allItems = unwrap<Row[]>(iRes) || [];
      const feedOnly = allItems.filter(
        (it) => it.item_type === "FEED" || it.item_type === "RAW_MATERIAL" || it.category === "FEEDS"
      );
      const items = feedOnly.length > 0 ? feedOnly : allItems;

      setFeedItems(items);

      if (items.length > 0 && !defaultFeedItemId) {
        const preferred = items.find(
          (i) => i.item_code?.includes("GEST") || i.item_code?.includes("FEED") || i.item_type === "FEED"
        ) || items[0];
        setDefaultFeedItemId(preferred.item_id);
      }

      setRows(
        activeBatches.map((b) => ({
          batch_id: b.batch_id,
          batch_no: b.batch_no,
          batch_name: b.batch_name || b.batch_no,
          stage_name: b.stage_name || b.stage || "Active",
          current_quantity: b.current_quantity != null ? Number(b.current_quantity) : Number(b.opening_quantity || 0),
          feed_qty: "",
          mortality_count: "",
          water_qty: "",
          temperature: "",
          remarks: "",
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load active batches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRowChange = (index: number, field: keyof BatchRowState, val: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleBulkSubmit = async () => {
    if (!companyId) return;
    setSaving(true);
    setError("");
    setSuccess("");

    // Build payload with only rows that have at least one entry
    const validEntries = rows
      .filter(
        (r) =>
          (r.feed_qty && Number(r.feed_qty) > 0) ||
          (r.mortality_count && Number(r.mortality_count) > 0) ||
          (r.water_qty && Number(r.water_qty) > 0) ||
          r.temperature !== "" ||
          r.remarks.trim() !== ""
      )
      .map((r) => ({
        batch_id: r.batch_id,
        feed_item_id: defaultFeedItemId || undefined,
        feed_qty: r.feed_qty ? Number(r.feed_qty) : undefined,
        mortality_count: r.mortality_count ? Number(r.mortality_count) : undefined,
        water_qty: r.water_qty ? Number(r.water_qty) : undefined,
        temperature: r.temperature ? Number(r.temperature) : undefined,
        remarks: r.remarks || undefined,
      }));

    if (validEntries.length === 0) {
      setError("Please enter daily feed, mortality, or observations for at least one batch.");
      setSaving(false);
      return;
    }

    try {
      const res = await api.post("/batch/bulk-daily-entry", {
        company_id: companyId,
        entry_date: entryDate,
        entries: validEntries,
      });
      const data = unwrap<Row>(res);
      setSuccess(`Daily log recorded successfully! (${data.successCount} transaction entries processed).`);

      // Clear input fields for next entry
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          feed_qty: "",
          mortality_count: "",
          water_qty: "",
          temperature: "",
          remarks: "",
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Failed to submit bulk daily entries.");
    } finally {
      setSaving(false);
    }
  };

  const totalActiveHeadcount = rows.reduce((sum, r) => sum + (r.current_quantity || 0), 0);
  const totalEnteredFeed = rows.reduce((sum, r) => sum + (r.feed_qty ? Number(r.feed_qty) : 0), 0);
  const totalEnteredMortality = rows.reduce((sum, r) => sum + (r.mortality_count ? Number(r.mortality_count) : 0), 0);

  return (
    <div className="space-y-6">
      {/* ── Top Header & Context Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] border p-4" style={S.surface}>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={S.muted}>
              Log Entry Date
            </label>
            <input
              type="date"
              className="nf-input text-xs"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={S.muted}>
              Default Feed Ration / Item {feedItems.length > 0 ? `(${feedItems.length} items)` : ""}
            </label>
            <select
              className="nf-input text-xs min-w-[260px]"
              value={defaultFeedItemId}
              onChange={(e) => setDefaultFeedItemId(e.target.value)}
            >
              <option value="">
                {feedItems.length > 0 ? `Select feed item (${feedItems.length} available)…` : "Loading feed items…"}
              </option>
              {feedItems.map((item, idx) => (
                <option key={item.item_id} value={item.item_id}>
                  {idx + 1}. {item.item_code ? `${item.item_code} — ${item.item_name}` : item.item_name} ({item.uom_primary || item.uom || "KG"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Reload Batches
          </Button>
          <Button size="sm" onClick={handleBulkSubmit} disabled={saving || rows.length === 0}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Save All Daily Logs
          </Button>
        </div>
      </div>

      {error && <InlineAlert variant="danger">{error}</InlineAlert>}
      {success && <InlineAlert variant="success">{success}</InlineAlert>}

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>Active Batches</p>
          <p className="text-xl font-bold" style={S.primary}>{rows.length}</p>
        </div>
        <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>Total Population</p>
          <p className="text-xl font-bold" style={S.primary}>{totalActiveHeadcount.toLocaleString("en-IN")} head</p>
        </div>
        <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>Feed Input Total</p>
          <p className="text-xl font-bold" style={S.primary}>{totalEnteredFeed.toLocaleString("en-IN")} kg</p>
        </div>
        <div className="rounded-[var(--radius-md)] border p-3" style={S.raised}>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={S.muted}>Mortality Total</p>
          <p className="text-xl font-bold" style={totalEnteredMortality > 0 ? S.danger : S.primary}>
            {totalEnteredMortality} head
          </p>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" style={S.accent} />
          <p className="mt-3 text-sm" style={S.sub}>Loading active production batches…</p>
        </div>
      )}

      {/* ── Multi-Batch Daily Entry Table ── */}
      {!loading && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border shadow-sm" style={S.surface}>
          <table className="w-full text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Batch / Pen</TableHead>
                <TableHead className="w-24">Stage</TableHead>
                <TableHead className="w-24 text-right">Headcount</TableHead>
                <TableHead className="w-32">Feed Qty (kg)</TableHead>
                <TableHead className="w-28">Mortality (head)</TableHead>
                <TableHead className="w-28">Water (L)</TableHead>
                <TableHead className="w-28">Temp (°C)</TableHead>
                <TableHead>Remarks / Health</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, idx) => {
                const hasMortality = Number(r.mortality_count) > 0;
                return (
                  <TableRow key={r.batch_id} className={hasMortality ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                    <TableCell className="font-medium font-mono text-xs">
                      <div>
                        <span style={S.primary}>{r.batch_no}</span>
                        {r.batch_name !== r.batch_no && (
                          <span className="block text-[11px] font-sans font-normal" style={S.sub}>
                            {r.batch_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs" style={S.sub}>
                      {r.stage_name}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold" style={S.primary}>
                      {r.current_quantity?.toLocaleString("en-IN") || 0}
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        className="nf-input text-xs h-8 font-mono"
                        placeholder="0.0"
                        value={r.feed_qty}
                        onChange={(e) => handleRowChange(idx, "feed_qty", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        min="0"
                        className="nf-input text-xs h-8 font-mono"
                        placeholder="0"
                        value={r.mortality_count}
                        onChange={(e) => handleRowChange(idx, "mortality_count", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="nf-input text-xs h-8 font-mono"
                        placeholder="0"
                        value={r.water_qty}
                        onChange={(e) => handleRowChange(idx, "water_qty", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        step="0.1"
                        className="nf-input text-xs h-8 font-mono"
                        placeholder="22.5"
                        value={r.temperature}
                        onChange={(e) => handleRowChange(idx, "temperature", e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="text"
                        className="nf-input text-xs h-8"
                        placeholder="Optional remarks…"
                        value={r.remarks}
                        onChange={(e) => handleRowChange(idx, "remarks", e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center" style={S.sub}>
                    No active production batches found. Create a batch first to record daily metrics.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      )}
    </div>
  );
}
