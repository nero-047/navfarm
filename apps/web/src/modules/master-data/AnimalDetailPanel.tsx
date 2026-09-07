"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, ChevronRight } from "lucide-react";
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

type TimelineEvent = {
  id: string;
  date: string;
  title: string;
  summary: string;
  detail: [string, string][];
};

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
 * traceability module required." It reads as a timeline of what actually
 * happened to this animal, newest first, each card opening in place. The two
 * links past the transfer order — DOA at Colcom and the Kill Sheet — have no
 * tables at all, so they are stated as unmodelled below the timeline rather
 * than drawn as empty cards, which would imply the data is merely absent.
 */
export default function AnimalDetailPanel({ row, onClose }: { row: Row; onClose: () => void }) {
  const [tab, setTab] = useState<TabKey>("data");
  const [breeding, setBreeding] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openEvent, setOpenEvent] = useState<string | null>(null);

  const animalId = row.animal_id;

  useEffect(() => {
    let cancelled = false;
    setBreeding(null);
    setError("");
    setOpenEvent(null);
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

  const timeline = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [];

    if (row.dob) {
      events.push({
        id: "dob", date: fmt(row.dob), title: "Born",
        summary: fmt(row.breed_id) ? "On farm" : "Date of birth recorded",
        detail: [["Date of birth", fmt(row.dob)], ["Animal type", fmt(row.animal_type)], ["Gender", fmt(row.gender)]],
      });
    }
    if (row.entry_date) {
      events.push({
        id: "entry", date: fmt(row.entry_date), title: "Entered the herd",
        summary: fmt(row.entry_type).replaceAll("_", " ").toLowerCase() || "Entry recorded",
        detail: [
          ["Entry type", fmt(row.entry_type)], ["Entry date", fmt(row.entry_date)],
          ["Source GRN", fmt(row.source_grn_id)], ["Born from batch", fmt(row.source_batch_id)],
          ["Acquisition cost", fmt(row.acquisition_cost)],
        ],
      });
    }
    for (const m of matings) {
      const partner = m.role === "SIRE" ? fmt(m.sow_code) : fmt(m.boar_code);
      events.push({
        id: `mating-${m.breeding_id}`, date: fmt(m.mating_date),
        title: m.role === "SIRE" ? `Served ${partner || "a sow"}` : `Served by ${partner || "a boar"}`,
        summary: [fmt(m.mating_type), `parity ${fmt(m.parity_number)}`, fmt(m.conception_result).toLowerCase()].filter(Boolean).join(" · "),
        detail: [
          ["Mating type", fmt(m.mating_type)], ["Mating date", fmt(m.mating_date)],
          ["Second mating", fmt(m.second_mating_date)], ["Semen doses", fmt(m.semen_dose_qty)],
          ["Pregnancy check", [fmt(m.preg_check_date), fmt(m.preg_check_method)].filter(Boolean).join(" · ")],
          ["Result", fmt(m.conception_result)], ["Expected farrowing", fmt(m.expected_farrowing_date)],
          ["Parity", fmt(m.parity_number)],
        ],
      });
    }
    for (const f of farrowings) {
      events.push({
        id: `farrow-${f.farrow_id}`, date: fmt(f.farrowing_date),
        title: `Farrowed ${fmt(f.piglets_born_live)} live`,
        summary: [`${fmt(f.piglets_born_total)} born`, fmt(f.farrowing_status).toLowerCase()].filter(Boolean).join(" · "),
        detail: [
          ["Farrowing date", fmt(f.farrowing_date)], ["Born total", fmt(f.piglets_born_total)],
          ["Born live", fmt(f.piglets_born_live)], ["Stillborn", fmt(f.piglets_stillborn)],
          ["Mummified", fmt(f.piglets_mummified)], ["Avg birth weight", fmt(f.avg_birth_weight_kg)],
          ["Litter weight", fmt(f.total_litter_weight_kg)], ["Status", fmt(f.farrowing_status)],
          ["Weaning date", fmt(f.weaning_date)], ["Piglets weaned", fmt(f.piglets_weaned)],
          ["Avg weaning weight", fmt(f.avg_weaning_weight_kg)], ["Parity", fmt(f.parity_number)],
        ],
      });
    }
    if (row.disposal_date) {
      events.push({
        id: "disposal", date: fmt(row.disposal_date), title: `Disposed — ${fmt(row.disposal_type)}`,
        summary: "Left the herd",
        detail: [
          ["Disposal date", fmt(row.disposal_date)], ["Disposal type", fmt(row.disposal_type)],
          ["Disposal value", fmt(row.disposal_value)], ["Gain / loss", fmt(row.gain_loss_on_disposal)],
        ],
      });
    }

    // Newest first: the most recent thing that happened is what someone opening
    // this panel is usually looking for.
    return events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [row, matings, farrowings]);

  return (
    <aside
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[var(--radius-md)] border"
      style={S.surface}
      aria-label={`Detail for ${fmt(row.animal_code)}`}
    >
      {/* The code only. Type, gender and status used to sit here too, and all
          three are fields in the Animal data tab a few pixels below — the same
          facts twice in one panel. The code stays because it is the one thing
          that has to be true on every tab: it says whose history you are
          reading while you are on Breeding or Traceability. For the same
          reason the Animal data tab no longer repeats it. */}
      <header className="flex items-center justify-between gap-3 border-b p-4" style={{ borderColor: "var(--border)" }}>
        <p className="truncate font-mono text-sm font-semibold" style={S.primary}>{fmt(row.animal_code)}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="shrink-0 rounded-lg p-1.5 transition hover:bg-[var(--surface-raised)]"
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
          loading ? (
            <div className="py-10 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" style={S.muted} /></div>
          ) : (
            <div className="flex flex-col gap-4">
              {!timeline.length ? (
                <p className="text-xs" style={S.muted}>Nothing recorded for this animal yet.</p>
              ) : (
                <ol className="relative flex flex-col gap-2 ps-5">
                  {/* The rail. Sits behind the markers rather than between the
                      cards, so it does not break where a card is expanded. */}
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 start-[5px] top-2 w-px"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                  {timeline.map((ev) => {
                    const open = openEvent === ev.id;
                    const rows = ev.detail.filter(([, v]) => v);
                    return (
                      <li key={ev.id} className="relative">
                        <span
                          aria-hidden="true"
                          className="absolute -start-5 top-4 h-[9px] w-[9px] translate-x-[1px] rounded-full border-2"
                          style={{ backgroundColor: "var(--surface)", borderColor: "var(--accent)" }}
                        />
                        <button
                          type="button"
                          onClick={() => setOpenEvent(open ? null : ev.id)}
                          aria-expanded={open}
                          className="w-full rounded-[var(--radius-sm)] border p-3 text-left transition"
                          style={S.raised}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate text-sm font-medium" style={S.primary}>{ev.title}</span>
                            <span className="shrink-0 font-mono text-xs" style={S.sub}>{ev.date}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="min-w-0 truncate text-xs" style={S.sub}>{ev.summary}</span>
                            <ChevronRight
                              className="h-3.5 w-3.5 shrink-0 transition-transform"
                              style={{ color: "var(--text-muted)", transform: open ? "rotate(90deg)" : undefined }}
                            />
                          </div>

                          {open && (
                            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 border-t pt-3 sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
                              {rows.map(([label, value]) => (
                                <div key={label} className="flex min-w-0 flex-col">
                                  <dt className="text-[10px] uppercase tracking-wide" style={S.muted}>{label}</dt>
                                  <dd className="truncate text-xs" style={S.primary}>{value}</dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="rounded-[var(--radius-sm)] border p-3" style={S.raised}>
                <p className="text-[11px] font-semibold" style={S.sub}>Not yet in the chain</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-[11px]" style={S.muted}>
                  <li>Weaner / grower batch — no batch carries this animal yet</li>
                  <li>Transfer order — none raised yet</li>
                  <li>DOA at Colcom — not modelled, no table</li>
                  <li>Kill sheet — not modelled, no table</li>
                </ul>
                <p className="mt-2 text-[11px] leading-5" style={S.muted}>
                  BBP-1 builds this chain from existing production records, so every card above is a real
                  record. The last two have no table in the schema: the BBP describes the kill sheet as a
                  process — attached to the transfer order, carcass weights per line — without a field
                  specification.
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </aside>
  );
}
