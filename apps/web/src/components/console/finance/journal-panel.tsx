"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search, AlertCircle, Loader2, Inbox, Eye, CheckCircle2 } from "lucide-react";
import { api } from "@/services/api-client";
import { Dialog } from "@/components/ui/dialog";
import { getActiveCompanyId } from "@/hooks/useAuth";

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

const inputCls = "w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-(--input-border-focus)";

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const emptyLine = () => ({ gl_account_id: "", debit_amount: "", credit_amount: "", description: "" });

const STATUS_STYLE: Record<string, any> = {
  DRAFT: { color: "var(--text-secondary)", borderColor: "var(--border)", backgroundColor: "var(--surface-raised)" },
  POSTED: { color: "var(--success)", borderColor: "var(--success)", backgroundColor: "var(--accent-muted)" },
  CANCELLED: { color: "var(--danger)", borderColor: "var(--danger)", backgroundColor: "var(--surface-raised)" },
};

export default function JournalPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [glAccounts, setGlAccounts] = useState<Row[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [header, setHeader] = useState<Row>({ posting_date: "", description: "" });
  const [lines, setLines] = useState<Row[]>([emptyLine(), emptyLine()]);

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
      const res = await api.get(`/journal?${params.toString()}`);
      setRows(unwrap<Row[]>(res) || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load journal entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (companyId) params.set("companyId", companyId);
    params.set("limit", "500");
    api.get(`/gl-account?${params.toString()}`).then((r) => setGlAccounts(unwrap<Row[]>(r) || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setHeader({ posting_date: new Date().toISOString().slice(0, 10), description: "" });
    setLines([emptyLine(), emptyLine()]);
    setFormError("");
    setModalOpen(true);
  };

  const setLineField = (idx: number, key: string, value: any) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev));

  const lineTotals = lines.reduce(
    (acc, l) => ({ debit: acc.debit + (Number(l.debit_amount) || 0), credit: acc.credit + (Number(l.credit_amount) || 0) }),
    { debit: 0, credit: 0 }
  );
  const isBalanced = Math.abs(lineTotals.debit - lineTotals.credit) < 0.0001 && lineTotals.debit > 0;

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      if (!header.posting_date) throw new Error("Posting date is required.");
      const cleanLines = lines
        .filter((l) => l.gl_account_id && (Number(l.debit_amount) || Number(l.credit_amount)))
        .map((l) => ({
          gl_account_id: l.gl_account_id,
          debit_amount: Number(l.debit_amount) || 0,
          credit_amount: Number(l.credit_amount) || 0,
          description: l.description || undefined,
        }));
      if (cleanLines.length < 2) throw new Error("Add at least two lines (one debit, one credit).");

      await api.post("/journal", {
        company_id: companyId,
        posting_date: header.posting_date,
        description: header.description || undefined,
        lines: cleanLines,
      });
      setModalOpen(false);
      load();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save journal entry.");
    } finally {
      setSaving(false);
    }
  };

  const openView = async (row: Row) => {
    try {
      const res = await api.get(`/journal/${row.journal_id}`);
      setViewing(unwrap<Row>(res));
    } catch (err: any) {
      setError(err?.message || "Failed to load journal entry details.");
    }
  };

  const handlePost = async () => {
    if (!viewing) return;
    setPosting(true);
    try {
      const res = await api.post(`/journal/${viewing.journal_id}/post`, {});
      setViewing(unwrap<Row>(res));
      load();
    } catch (err: any) {
      setError(err?.message || "Failed to post journal entry.");
    } finally {
      setPosting(false);
    }
  };

  const accountLabel = (id: string) => {
    const acc = glAccounts.find((a) => a.gl_account_id === id);
    return acc ? `${acc.account_code} — ${acc.account_name}` : "—";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold" style={S.primary}>Journal Entries</h2>
          <p className="mt-0.5 text-xs" style={S.sub}>Manual entries and system-generated postings from Inventory movements. Must balance (debits = credits) to post.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border py-1.5 px-2 text-xs outline-none" style={S.input}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Posted</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={S.muted} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-lg border py-1.5 pl-8 pr-3 text-xs outline-none" style={S.input} />
          </div>
          <button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: "var(--accent)" }}>
            <Plus className="h-3.5 w-3.5" /> New Journal Entry
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border" style={S.surface}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ ...S.sub, borderColor: "var(--border)" }}>
                <th className="whitespace-nowrap px-4 py-3">Journal No.</th>
                <th className="whitespace-nowrap px-4 py-3">Posting Date</th>
                <th className="whitespace-nowrap px-4 py-3">Source</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Debit</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={S.sub}><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" style={S.accent} /> Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={S.sub}><Inbox className="mx-auto mb-2 h-6 w-6" style={S.muted} /> No journal entries yet.</td></tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.journal_id} className="border-b text-xs transition-colors hover:bg-(--surface-raised)" style={{ borderColor: "var(--border)" }}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold" style={S.primary}>{row.journal_no}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.primary}>{row.posting_date}</td>
                    <td className="whitespace-nowrap px-4 py-3" style={S.sub}>{row.source}{row.source_document_no ? ` · ${row.source_document_no}` : ""}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>{row.total_debit}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right" style={S.primary}>{row.total_credit}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={STATUS_STYLE[row.status] || STATUS_STYLE.DRAFT}>{row.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openView(row)} title="View" className="rounded-lg p-1.5 transition hover:bg-(--surface-raised)" style={S.sub}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <Dialog
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="New Journal Entry"
        maxWidth="xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm font-medium" style={S.surface}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: "var(--accent)" }}>
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Posting Date <span className="text-red-500">*</span></label>
              <input type="date" value={header.posting_date} onChange={(e) => setHeader((h) => ({ ...h, posting_date: e.target.value }))} className={inputCls} style={S.input} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Description</label>
              <input value={header.description} onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))} className={inputCls} style={S.input} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.sub}>Lines</p>
            <button onClick={addLine} type="button" className="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-semibold" style={S.surface}>
              <Plus className="h-3 w-3" /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border" style={S.surface}>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>GL Account</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Debit</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Credit</th>
                  <th className="px-3 py-2 font-semibold" style={S.sub}>Description</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-2 py-1.5">
                      <select value={line.gl_account_id} onChange={(e) => setLineField(idx, "gl_account_id", e.target.value)} className={inputCls} style={S.input}>
                        <option value="">Select…</option>
                        {glAccounts.map((a) => <option key={a.gl_account_id} value={a.gl_account_id}>{a.account_code} — {a.account_name}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 w-28"><input type="number" value={line.debit_amount} onChange={(e) => setLineField(idx, "debit_amount", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5 w-28"><input type="number" value={line.credit_amount} onChange={(e) => setLineField(idx, "credit_amount", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5"><input value={line.description} onChange={(e) => setLineField(idx, "description", e.target.value)} className={inputCls} style={S.input} /></td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeLine(idx)} type="button" className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2" style={S.sub}>Total</td>
                  <td className="px-3 py-2" style={S.primary}>{lineTotals.debit.toFixed(2)}</td>
                  <td className="px-3 py-2" style={S.primary}>{lineTotals.credit.toFixed(2)}</td>
                  <td colSpan={2} className="px-3 py-2">
                    <span className="text-[11px] font-semibold" style={{ color: isBalanced ? "var(--success)" : "var(--danger)" }}>
                      {isBalanced ? "Balanced" : "Not balanced"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Dialog>

      {/* View / Post modal */}
      <Dialog
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? `Journal Entry ${viewing.journal_no}` : ""}
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
            <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Status</p><span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold" style={STATUS_STYLE[viewing.status] || STATUS_STYLE.DRAFT}>{viewing.status}</span></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Posting Date</p><p style={S.primary}>{viewing.posting_date}</p></div>
              <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Source</p><p style={S.primary}>{viewing.source}</p></div>
              {viewing.source_document_no && <div><p className="font-semibold uppercase tracking-wider" style={S.muted}>Source Document</p><p style={S.primary}>{viewing.source_document_no}</p></div>}
            </div>

            <div className="overflow-x-auto rounded-xl border" style={S.surface}>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>GL Account</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Debit</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Credit</th>
                    <th className="px-3 py-2 font-semibold" style={S.sub}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewing.lines || []).map((l: Row) => (
                    <tr key={l.line_id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                      <td className="px-3 py-2" style={S.primary}>{accountLabel(l.gl_account_id)}</td>
                      <td className="px-3 py-2" style={S.primary}>{Number(l.debit_amount) > 0 ? l.debit_amount : "—"}</td>
                      <td className="px-3 py-2" style={S.primary}>{Number(l.credit_amount) > 0 ? l.credit_amount : "—"}</td>
                      <td className="px-3 py-2" style={S.sub}>{l.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
