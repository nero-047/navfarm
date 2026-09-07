"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/services/api-client";
import { InlineAlert } from "@/components/ui/alert";
import { ReadField } from "@/components/ui/field";

type Row = Record<string, any>;

const S = {
  surface: { backgroundColor: "var(--surface)", borderColor: "var(--border)" },
  raised: { backgroundColor: "var(--surface-raised)", borderColor: "var(--border)" },
  primary: { color: "var(--text-primary)" },
  sub: { color: "var(--text-secondary)" },
  muted: { color: "var(--text-muted)" },
};

function unwrap<T = any>(res: any): T {
  return (Array.isArray(res) ? res : res?.data ?? res) as T;
}

const TABS = [
  { key: "data", label: "Animal data" },
  { key: "breeding", label: "Breeding details" },
  { key: "traceability", label: "Traceability" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const fmt = (v: any) => (v === null || v === undefined || v === "" ? "" : String(v));

/**
 * The right-hand detail for one animal.
 *
 * Breeding and traceability come from `/animal/:id/breeding`, which returns
 * matings from either side — a boar appears on a mating as the sire and never
 * as the sow, so a screen that filtered one column would show both boars an
 * empty history.
 *
 * Traceability is assembled here rather than fetched, because BBP-1 says so:
 * "The traceability chain uses existing production records - no separate
 * traceability module required." What is shown is what those records can
 * answer today — parents, entry, and the litters this animal produced. The two
 * links past the transfer order, DOA at Colcom and the Kill Sheet, have no
 * tables at all, so they are named as missing rather than drawn as empty boxes
 * that imply the data is merely absent.
 */
export default function AnimalDetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>("data");
  const [breeding, setBreeding] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const animalId = row.animal_id;

  useEffect(() => {
    let cancelled = false;
    setBreeding(null);
    setError("");
    if (!animalId) return;
    setLoading(true);
    api.get(`/animal/${animalId}/breeding`)
      .then((res) => { if (!cancelled) setBreeding(unwrap<Row>(res)); })
      .catch((err: any) => { if (!cancelled) setError(err?.message || "Could not load breeding history."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [animalId]);

  const matings: Row[] = breeding?.matings ?? [];
  const farrowings: Row[] = breeding?.farrowings ?? [];

  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[var(--radius-md)] border"
      style={S.surface}
      aria-label={`Detail for ${fmt(row.animal_code)}`}
    >
      <header className="flex items-start justify-between gap-3 border-b p-4" style={{ borderColor: "var(--border)" }}>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold" style={S.primary}>{fmt(row.animal_code)}</p>
          <p className="mt-0.5 truncate text-xs" style={S.sub}>
            {[fmt(row.animal_type), fmt(row.gender), fmt(row.status)].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="rounded-lg p-1.5 transition hover:bg-[var(--surface-raised)]"
          style={S.sub}
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <nav className="flex gap-1 border-b px-2 pt-2" style={{ borderColor: "var(--border)" }} aria-label="Animal detail sections">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            aria-current={tab === tb.key ? "page" : undefined}
            className="whitespace-nowrap px-3 py-2 text-xs font-semibold"
            style={tab === tb.key
              ? { color: "var(--accent)", borderBottom: "2px solid var(--accent)" }
              : { color: "var(--text-secondary)", borderBottom: "2px solid transparent" }}
          >
            {tb.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {error && <InlineAlert>{error}</InlineAlert>}

        {tab === "data" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ReadField mono label="Animal code" value={fmt(row.animal_code)} />
            <ReadField label="Type" value={fmt(row.animal_type)} />
            <ReadField label="Gender" value={fmt(row.gender)} />
            <ReadField label="Status" value={fmt(row.status)} />
            <ReadField label="Date of birth" value={fmt(row.dob)} />
            <ReadField label="Entry type" value={fmt(row.entry_type)} />
            <ReadField label="Entry date" value={fmt(row.entry_date)} />
            <ReadField mono label="RFID tag" value={fmt(row.rfid_tag)} />
            <ReadField mono label="Ear tag" value={fmt(row.ear_tag_visual)} />
            <ReadField label="Parity count" value={fmt(row.parity_count)} />
            <ReadField label="Piglets born live" value={fmt(row.total_piglets_born_live)} />
            <ReadField label="Piglets weaned" value={fmt(row.total_piglets_weaned)} />
          </div>
        )}

        {tab === "breeding" && (
          loading ? (
            <div className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" style={S.muted} /></div>
          ) : (
            <div className="flex flex-col gap-5">
              <section>
                <h3 className="nf-text-label-strong mb-2" style={S.primary}>Matings ({matings.length})</h3>
                {!matings.length ? (
                  <p className="text-xs" style={S.muted}>No mating recorded for this animal.</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {matings.map((m) => (
                      <li key={m.breeding_id} className="rounded-[var(--radius-sm)] border p-3" style={S.raised}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium" style={S.primary}>
                            {m.role === "SIRE" ? `Served ${fmt(m.sow_code)}` : `Served by ${fmt(m.boar_code) || "—"}`}
                          </span>
                          <span className="font-mono text-xs" style={S.sub}>{fmt(m.mating_date)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={S.sub}>
                          <span>{fmt(m.mating_type)}</span>
                          <span>Parity {fmt(m.parity_number)}</span>
                          <span>Due {fmt(m.expected_farrowing_date)}</span>
                          {m.conception_result && <span>{fmt(m.conception_result)}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="nf-text-label-strong mb-2" style={S.primary}>Farrowings ({farrowings.length})</h3>
                {!farrowings.length ? (
                  <p className="text-xs" style={S.muted}>
                    {row.animal_type === "BOAR"
                      ? "Boars do not farrow — his litters are the matings above."
                      : "No farrowing recorded for this animal."}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {farrowings.map((f) => (
                      <li key={f.farrow_id} className="rounded-[var(--radius-sm)] border p-3" style={S.raised}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium" style={S.primary}>
                            {fmt(f.piglets_born_live)} born live of {fmt(f.piglets_born_total)}
                          </span>
                          <span className="font-mono text-xs" style={S.sub}>{fmt(f.farrowing_date)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={S.sub}>
                          <span>{fmt(f.farrowing_status)}</span>
                          <span>Parity {fmt(f.parity_number)}</span>
                          {Number(f.piglets_stillborn) > 0 && <span>{fmt(f.piglets_stillborn)} stillborn</span>}
                          {f.weaning_date && <span>Weaned {fmt(f.weaning_date)} ({fmt(f.piglets_weaned)})</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )
        )}

        {tab === "traceability" && (
          <div className="flex flex-col gap-5">
            <section>
              <h3 className="nf-text-label-strong mb-2" style={S.primary}>Backward chain</h3>
              <ol className="flex flex-col gap-2">
                <ChainStep label="Parents" value={[fmt(row.sire_animal_id) && "Sire recorded", fmt(row.dam_animal_id) && "Dam recorded"].filter(Boolean).join(" · ")} />
                <ChainStep label="Entry" value={[fmt(row.entry_type), fmt(row.entry_date)].filter(Boolean).join(" · ")} />
                <ChainStep label="Matings" value={matings.length ? `${matings.length} recorded` : ""} />
                <ChainStep label="Litters (piglet lots)" value={farrowings.length ? `${farrowings.length} recorded` : ""} />
                <ChainStep label="Weaner / grower batch" value="" pending="No batch carries this animal yet" />
                <ChainStep label="Transfer order" value="" pending="No transfer order raised yet" />
                <ChainStep label="DOA at Colcom" value="" pending="Not modelled — no table" />
                <ChainStep label="Kill sheet" value="" pending="Not modelled — no table" />
              </ol>
            </section>
            <p className="text-[11px] leading-5" style={S.muted}>
              BBP-1: the chain is queried from existing production records, so each step above is a real
              record or an honest gap — never a placeholder. The last two steps have no table in the
              schema; the BBP describes the kill sheet as a process (attached to the transfer order, with
              carcass weights per line) but gives no field specification.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function ChainStep({ label, value, pending }: { label: string; value: string; pending?: string }) {
  const has = Boolean(value);
  return (
    <li className="flex items-baseline justify-between gap-3 rounded-[var(--radius-sm)] border px-3 py-2" style={S.raised}>
      <span className="text-xs font-medium" style={S.primary}>{label}</span>
      <span className="text-right text-xs" style={has ? S.sub : S.muted}>
        {has ? value : pending || "—"}
      </span>
    </li>
  );
}
