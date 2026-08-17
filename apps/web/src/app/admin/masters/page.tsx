"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, AlertCircle, CheckCircle, Plus, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { api } from "../../../services/api-client";
import { getStoredToken, getStoredUser } from "../../../hooks/useAuth";
import { Dialog } from "../../../components/ui/dialog";
import { Field } from "../../../components/ui/field";
import { PageHeader } from "../../../components/ui/PageHeader";
import { TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../../components/ui/table";

// ── Shared style tokens ─────────────────────────────────────────────────────
const S = {
  surface:  { backgroundColor: "var(--surface)",        borderColor: "var(--border)" },
  raised:   { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary:  { color: "var(--text-primary)" },
  sub:      { color: "var(--text-secondary)" },
  muted:    { color: "var(--text-muted)" },
  accent:   { color: "var(--accent)" },
  border:   { borderColor: "var(--border)" },
  input:    { backgroundColor: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" },
};

// ── Reusable input / select ─────────────────────────────────────────────────
const inputCls = "nf-input";


type MasterTab = "nobs" | "currencies" | "languages";

export default function AdminMastersPage() {
  const router = useRouter();
  const [activeTab,  setActiveTab]  = useState<MasterTab>("nobs");
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");

  // NOBs
  const [nobs,         setNobs]         = useState<any[]>([]);
  const [expandedNob,  setExpandedNob]  = useState<string | null>(null);
  const [lobs,         setLobs]         = useState<Record<string, any[]>>({});
  const [loadingLobs,  setLoadingLobs]  = useState<Record<string, boolean>>({});
  const [showNobForm,  setShowNobForm]  = useState(false);
  const [nobForm,      setNobForm]      = useState({ nob_code: "", nob_name: "", description: "", default_costing_method: "FIFO" });
  const [showLobForm,  setShowLobForm]  = useState<string | null>(null);
  const [lobForm,      setLobForm]      = useState({ lob_code: "", lob_name: "", costing_method_allowed: "STANDARD,FIFO", qc_required: "NO", qr_required: "NO", batch_copy_allowed: "YES" });
  const [savingNob,    setSavingNob]    = useState(false);
  const [savingLob,    setSavingLob]    = useState(false);

  // Currencies
  const [currencies,   setCurrencies]   = useState<any[]>([]);
  const [showCurrForm, setShowCurrForm] = useState(false);
  const [currForm,     setCurrForm]     = useState({ iso_code: "", currency_name: "", symbol: "", symbol_position: "BEFORE", is_system_default: false });
  const [savingCurr,   setSavingCurr]   = useState(false);

  // Languages
  const [languages,   setLanguages]    = useState<any[]>([]);
  const [showLangForm, setShowLangForm] = useState(false);
  const [langForm,    setLangForm]     = useState({ lang_code: "", lang_name_english: "", lang_name_native: "", script: "LTR", is_system_default: false });
  const [savingLang,  setSavingLang]   = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const user  = getStoredUser();
    if (!token || !user || user.userType !== "SYSTEM_ADMIN") { router.replace("/"); return; }
    loadAll();
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [nobList, currList, langList] = await Promise.all([
        api.get("/setup/wizard/nobs"),
        api.get("/currency"),
        api.get("/language"),
      ]);
      setNobs(nobList); setCurrencies(currList); setLanguages(langList);
    } catch (e: any) { setError(e?.message || "Failed to load master data."); }
    finally { setLoading(false); }
  };

  const loadLobs = async (nobId: string) => {
    if (lobs[nobId]) return;
    setLoadingLobs((p) => ({ ...p, [nobId]: true }));
    try {
      const list = await api.get(`/setup/wizard/lobs/${nobId}`);
      setLobs((p) => ({ ...p, [nobId]: list }));
    } catch { setLobs((p) => ({ ...p, [nobId]: [] })); }
    finally { setLoadingLobs((p) => ({ ...p, [nobId]: false })); }
  };

  const handleExpandNob = (nobId: string) => {
    if (expandedNob === nobId) { setExpandedNob(null); return; }
    setExpandedNob(nobId);
    loadLobs(nobId);
  };

  const handleSaveNob = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingNob(true); setError(""); setSuccess("");
    try {
      await api.post("/setup/wizard/nobs", nobForm);
      setSuccess("Nature of Business created.");
      setShowNobForm(false);
      setNobForm({ nob_code: "", nob_name: "", description: "", default_costing_method: "FIFO" });
      setNobs(await api.get("/setup/wizard/nobs"));
    } catch (err: any) { setError(err?.message || "Failed to create NOB."); }
    finally { setSavingNob(false); }
  };

  const handleSaveLob = async (e: React.FormEvent, nobId: string) => {
    e.preventDefault(); setSavingLob(true); setError(""); setSuccess("");
    try {
      await api.post("/setup/wizard/lobs", { ...lobForm, nob_id: nobId });
      setSuccess("Line of Business created.");
      setShowLobForm(null);
      setLobForm({ lob_code: "", lob_name: "", costing_method_allowed: "STANDARD,FIFO", qc_required: "NO", qr_required: "NO", batch_copy_allowed: "YES" });
      setLobs((p) => ({ ...p, [nobId]: [] }));
      loadLobs(nobId);
    } catch (err: any) { setError(err?.message || "Failed to create LOB."); }
    finally { setSavingLob(false); }
  };

  const handleSaveCurrency = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingCurr(true); setError(""); setSuccess("");
    try {
      await api.post("/currency", currForm);
      setSuccess("Currency added.");
      setShowCurrForm(false);
      setCurrForm({ iso_code: "", currency_name: "", symbol: "", symbol_position: "BEFORE", is_system_default: false });
      setCurrencies(await api.get("/currency"));
    } catch (err: any) { setError(err?.message || "Failed to create currency."); }
    finally { setSavingCurr(false); }
  };

  const handleSaveLanguage = async (e: React.FormEvent) => {
    e.preventDefault(); setSavingLang(true); setError(""); setSuccess("");
    try {
      await api.post("/language", langForm);
      setSuccess("Language added.");
      setShowLangForm(false);
      setLangForm({ lang_code: "", lang_name_english: "", lang_name_native: "", script: "LTR", is_system_default: false });
      setLanguages(await api.get("/language"));
    } catch (err: any) { setError(err?.message || "Failed to create language."); }
    finally { setSavingLang(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin w-5 h-5 mr-2" style={S.accent} />
        <span className="text-sm" style={S.sub}>Loading master data…</span>
      </div>
    );
  }

  const tabBtn = (t: MasterTab, label: string) => (
    <button
      onClick={() => setActiveTab(t)}
      className="px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap"
      style={activeTab === t
        ? { borderColor: "var(--accent)", color: "var(--accent)" }
        : { borderColor: "transparent", color: "var(--text-secondary)" }
      }
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-4 sm:px-6 sm:pb-6 xl:px-8 xl:pb-8">
      <PageHeader
        title="Master Data"
        description="Manage global seed data: NOBs, LOBs, Currencies, Languages"
      />

      {error   && <div className="flex items-center gap-2 text-(--danger) bg-(--danger-muted) border border-(--danger) rounded-lg p-4 text-sm"><AlertCircle className="w-4 h-4 shrink-0" /> {error}</div>}
      {success && <div className="flex items-center gap-2 text-(--success) bg-(--success-muted) border border-(--success) rounded-lg p-4 text-sm"><CheckCircle className="w-4 h-4 shrink-0" /> {success}</div>}

      {/* Tabs sit directly on the page. Boxing them added a second frame
          around content that already gets its own containment below. */}
      <div>
        <div className="flex overflow-x-auto border-b" style={S.border}>
          {tabBtn("nobs",       `NOBs / LOBs (${nobs.length})`)}
          {tabBtn("currencies", `Currencies (${currencies.length})`)}
          {tabBtn("languages",  `Languages (${languages.length})`)}
        </div>

        <div className="pt-6">

          {/* ═══ NOBs TAB ═══════════════════════════════════════════════════ */}
          {activeTab === "nobs" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Nature of Business</p>
                <button onClick={() => setShowNobForm(!showNobForm)}
                  className="flex items-center gap-1.5 text-xs font-semibold" style={S.accent}>
                  <Plus className="w-3.5 h-3.5" /> Add NOB
                </button>
              </div>

              <Dialog open={showNobForm} onClose={() => setShowNobForm(false)} title="Add nature of business" description="Create a configurable farming vertical for company setup." maxWidth="md">
                <form onSubmit={handleSaveNob} className="grid grid-cols-2 gap-4">
                  {[
                    { k: "nob_code",    l: "NOB Code",    p: "POULTRY"              },
                    { k: "nob_name",    l: "NOB Name",    p: "Poultry Farming"      },
                    { k: "description", l: "Description", p: "Broiler & layer farming" },
                  ].map(({ k, l, p }) => (
                    <div key={k} className={k === "description" ? "col-span-2" : ""}>
                      <Field label={l}>
                        <input required value={(nobForm as any)[k]}
                          onChange={(e) => setNobForm({ ...nobForm, [k]: e.target.value })}
                          placeholder={p} className={inputCls} style={S.input} />
                      </Field>
                    </div>
                  ))}
                  <Field label="Costing Method">
                    <select value={nobForm.default_costing_method}
                      onChange={(e) => setNobForm({ ...nobForm, default_costing_method: e.target.value })}
                      className={`${inputCls} nf-select`} style={S.input}>
                      <option value="FIFO">FIFO</option>
                      <option value="STANDARD">Standard</option>
                      <option value="BIO">Bio Asset (IAS 41)</option>
                    </select>
                  </Field>
                  <div className="col-span-2 flex flex-col-reverse gap-3 border-t border-(--border) pt-5 sm:flex-row sm:justify-end">
                    <button type="submit" disabled={savingNob}
                      className="h-11 rounded-[var(--radius-sm)] bg-(--accent) px-5 text-sm font-semibold text-white hover:bg-(--accent-hover) disabled:opacity-50">
                      {savingNob ? "Saving…" : "Save NOB"}
                    </button>
                    <button type="button" onClick={() => setShowNobForm(false)}
                      className="h-11 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) px-5 text-sm text-(--text-secondary) hover:bg-(--surface-raised)">
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog>

              {/* One list of peers separated by hairlines, not a stack of
                  cards — each row is a sibling entry, not its own module. */}
              <div className="border-t" style={S.border}>
                {nobs.length === 0 && <p className="text-sm text-center py-8" style={S.muted}>No NOBs configured.</p>}
                {nobs.map((nob) => {
                  const isExp = expandedNob === nob.nob_id;
                  return (
                    <div key={nob.nob_id} className="border-b" style={S.border}>
                      <button
                        onClick={() => handleExpandNob(nob.nob_id)}
                        aria-expanded={isExp}
                        className="w-full flex min-h-12 items-center justify-between px-1 py-3 text-left transition-colors hover:bg-(--row-hover)">
                        <div className="flex items-center gap-3">
                          {isExp
                            ? <ChevronDown  className="w-4 h-4 shrink-0" style={S.muted} />
                            : <ChevronRight className="w-4 h-4 shrink-0" style={S.muted} />
                          }
                          <span className="font-semibold text-sm" style={S.primary}>{nob.nob_name}</span>
                          <span className="font-mono text-[11px]" style={S.muted}>{nob.nob_code}</span>
                          {/* Costing method is a configured value, not a status —
                              it reads as plain metadata rather than a red chip. */}
                          <span className="text-[11px]" style={S.muted}>{nob.default_costing_method}</span>
                        </div>
                      </button>

                      {isExp && (
                        <div className="px-4 py-3 border-t" style={{ ...S.surface, ...S.border }}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Lines of Business</p>
                            <button onClick={() => setShowLobForm(showLobForm === nob.nob_id ? null : nob.nob_id)}
                              className="text-xs font-semibold flex items-center gap-1" style={S.accent}>
                              <Plus className="w-3.5 h-3.5" /> Add LOB
                            </button>
                          </div>

                          <Dialog open={showLobForm === nob.nob_id} onClose={() => setShowLobForm(null)} title="Add line of business" description={`Add an operating line beneath ${nob.nob_name}.`} maxWidth="md">
                            <form onSubmit={(e) => handleSaveLob(e, nob.nob_id)} className="grid grid-cols-2 gap-4">
                              {[
                                { k: "lob_code", l: "LOB Code", p: "BROILER"           },
                                { k: "lob_name", l: "LOB Name", p: "Broiler Production" },
                              ].map(({ k, l, p }) => (
                                <Field key={k} label={l}>
                                  <input required value={(lobForm as any)[k]}
                                    onChange={(e) => setLobForm({ ...lobForm, [k]: e.target.value })}
                                    placeholder={p} className={inputCls} style={S.input} />
                                </Field>
                              ))}
                              <div className="col-span-2 flex flex-col-reverse gap-3 border-t border-(--border) pt-5 sm:flex-row sm:justify-end">
                                <button type="submit" disabled={savingLob}
                                  className="h-11 rounded-[var(--radius-sm)] bg-(--accent) px-5 text-sm font-semibold text-white hover:bg-(--accent-hover) disabled:opacity-50">
                                  {savingLob ? "Saving…" : "Save LOB"}
                                </button>
                                <button type="button" onClick={() => setShowLobForm(null)}
                                  className="h-11 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) px-5 text-sm text-(--text-secondary) hover:bg-(--surface-raised)">
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </Dialog>

                          {loadingLobs[nob.nob_id] ? (
                            <div className="text-xs flex items-center gap-1.5" style={S.muted}>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
                            </div>
                          ) : (lobs[nob.nob_id] || []).length === 0 ? (
                            <p className="text-xs" style={S.muted}>No LOBs defined yet.</p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(lobs[nob.nob_id] || []).map((lob: any) => (
                                <span key={lob.lob_id}
                                  className="text-xs border rounded-lg px-2.5 py-1 font-medium"
                                  style={{ ...S.raised, ...S.primary }}>
                                  {lob.lob_name}
                                  <span className="font-mono ml-1.5 text-[10px]" style={S.muted}>({lob.lob_code})</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ CURRENCIES TAB ═════════════════════════════════════════════ */}
          {activeTab === "currencies" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Supported Currencies</p>
                <button onClick={() => setShowCurrForm(!showCurrForm)}
                  className="flex items-center gap-1.5 text-xs font-semibold" style={S.accent}>
                  <Plus className="w-3.5 h-3.5" /> Add Currency
                </button>
              </div>

              <Dialog open={showCurrForm} onClose={() => setShowCurrForm(false)} title="Add currency" description="Add a reporting or accounting currency to the system catalog." maxWidth="md">
                <form onSubmit={handleSaveCurrency} className="grid grid-cols-2 gap-4">
                  {[
                    { k: "iso_code",       l: "ISO Code", p: "USD"        },
                    { k: "currency_name",  l: "Name",     p: "US Dollar"  },
                    { k: "symbol",         l: "Symbol",   p: "$"          },
                  ].map(({ k, l, p }) => (
                    <Field key={k} label={l}>
                      <input required value={(currForm as any)[k]}
                        onChange={(e) => setCurrForm({ ...currForm, [k]: e.target.value })}
                        placeholder={p} className={inputCls} style={S.input} />
                    </Field>
                  ))}
                  <Field label="Symbol Position">
                    <select value={currForm.symbol_position}
                      onChange={(e) => setCurrForm({ ...currForm, symbol_position: e.target.value })}
                      className={`${inputCls} nf-select`} style={S.input}>
                      <option value="BEFORE">Before amount</option>
                      <option value="AFTER">After amount</option>
                    </select>
                  </Field>
                  <div className="col-span-2 flex flex-col-reverse gap-3 border-t border-(--border) pt-5 sm:flex-row sm:justify-end">
                    <button type="submit" disabled={savingCurr}
                      className="h-11 rounded-[var(--radius-sm)] bg-(--accent) px-5 text-sm font-semibold text-white hover:bg-(--accent-hover) disabled:opacity-50">
                      {savingCurr ? "Saving…" : "Add Currency"}
                    </button>
                    <button type="button" onClick={() => setShowCurrForm(false)}
                      className="h-11 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) px-5 text-sm text-(--text-secondary) hover:bg-(--surface-raised)">Cancel</button>
                  </div>
                </form>
              </Dialog>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {currencies.length === 0 && (
                  <p className="text-sm col-span-full text-center py-4" style={S.muted}>No currencies configured.</p>
                )}
                {currencies.map((curr) => (
                  <div key={curr.iso_code}
                    className="border rounded-lg p-4 text-center"
                    style={S.raised}>
                    <div className="text-2xl font-semibold mb-1" style={S.primary}>{curr.symbol}</div>
                    <div className="text-xs font-semibold" style={S.primary}>{curr.iso_code}</div>
                    <div className="text-[10px] mt-0.5 truncate" style={S.muted}>{curr.currency_name}</div>
                    {curr.is_system_default && (
                      <span className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{ backgroundColor: "var(--accent-muted)", color: "var(--accent)" }}>Default</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ LANGUAGES TAB ══════════════════════════════════════════════ */}
          {activeTab === "languages" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={S.muted}>Supported Languages</p>
                <button onClick={() => setShowLangForm(!showLangForm)}
                  className="flex items-center gap-1.5 text-xs font-semibold" style={S.accent}>
                  <Plus className="w-3.5 h-3.5" /> Add Language
                </button>
              </div>

              <Dialog open={showLangForm} onClose={() => setShowLangForm(false)} title="Add language" description="Add a supported interface language and script direction." maxWidth="md">
                <form onSubmit={handleSaveLanguage} className="grid grid-cols-2 gap-4">
                  {[
                    { k: "lang_code",         l: "Code",          p: "en"      },
                    { k: "lang_name_english",  l: "English Name",  p: "English" },
                    { k: "lang_name_native",   l: "Native Name",   p: "English" },
                  ].map(({ k, l, p }) => (
                    <Field key={k} label={l}>
                      <input required value={(langForm as any)[k]}
                        onChange={(e) => setLangForm({ ...langForm, [k]: e.target.value })}
                        placeholder={p} className={inputCls} style={S.input} />
                    </Field>
                  ))}
                  <Field label="Script Direction">
                    <select value={langForm.script}
                      onChange={(e) => setLangForm({ ...langForm, script: e.target.value })}
                      className={`${inputCls} nf-select`} style={S.input}>
                      <option value="LTR">Left to Right (LTR)</option>
                      <option value="RTL">Right to Left (RTL)</option>
                    </select>
                  </Field>
                  <div className="col-span-2 flex flex-col-reverse gap-3 border-t border-(--border) pt-5 sm:flex-row sm:justify-end">
                    <button type="submit" disabled={savingLang}
                      className="h-11 rounded-[var(--radius-sm)] bg-(--accent) px-5 text-sm font-semibold text-white hover:bg-(--accent-hover) disabled:opacity-50">
                      {savingLang ? "Saving…" : "Add Language"}
                    </button>
                    <button type="button" onClick={() => setShowLangForm(false)}
                      className="h-11 rounded-[var(--radius-sm)] border border-(--border) bg-(--surface) px-5 text-sm text-(--text-secondary) hover:bg-(--surface-raised)">Cancel</button>
                  </div>
                </form>
              </Dialog>

              <div className="rounded-lg border overflow-hidden" style={S.surface}>
                <table className="w-full border-collapse text-sm">
                  <TableHeader>
                    <tr className="border-b border-(--row-border)">
                      {["Code", "English Name", "Native", "Script", "Default"].map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {languages.length === 0 && (
                      <tr><TableCell colSpan={5} className="text-center py-8" style={S.muted}>No languages configured.</TableCell></tr>
                    )}
                    {languages.map((lang) => (
                      <TableRow key={lang.lang_code}>
                        <TableCell className="font-mono font-semibold" style={S.accent}>{lang.lang_code}</TableCell>
                        <TableCell className="font-semibold" style={S.primary}>{lang.lang_name_english}</TableCell>
                        <TableCell style={S.sub}>{lang.lang_name_native}</TableCell>
                        <TableCell>
                          <span className="text-[11px] font-semibold border rounded px-2 py-0.5"
                            style={S.raised}>{lang.script}</span>
                        </TableCell>
                        <TableCell>
                          {lang.is_system_default
                            ? <CheckCircle className="w-4 h-4 text-(--success)" />
                            : <X className="w-4 h-4" style={S.muted} />
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
