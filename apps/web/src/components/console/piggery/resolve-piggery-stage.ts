import { DEFAULT_PIGGERY_STAGES } from "./piggery-lifecycle-stepper";

/**
 * Batches store their real stage in `current_stage_code` as a domain code
 * (e.g. "DRY_SOW_GESTATION", "LACTATION") — never the display stepper's own
 * "ST-01".."ST-08" codes. Two screens (Batch Stages, Batch Data Entry)
 * previously matched this independently, one of them incorrectly (falling
 * back to an arbitrary index-based guess when no code matched), which is
 * why the same batch could show two different "current stages" depending
 * on which screen you were looking at. This is the one place that mapping
 * happens now — both screens call it.
 */
export function resolvePiggeryStageId(rawCode: string | null | undefined): { id: number; name: string; standardDays: number } {
  const code = (rawCode || "").toUpperCase().trim();
  const stageOf = (id: number) => {
    const s = DEFAULT_PIGGERY_STAGES.find((st) => st.id === id)!;
    return { id: s.id, name: s.name, standardDays: s.standardDays };
  };

  if (!code) return stageOf(1);

  if (code.includes("QUARANTINE") || code.includes("QUAR")) return stageOf(1);
  if (code.includes("GILT") || code.includes("GROWER") || code.includes("REARING")) return stageOf(2);
  if (code.includes("FLUSH") || code.includes("MATING") || code === "AI" || code.includes("_AI")) return stageOf(3);
  if (code.includes("GESTATION") || code.includes("DRY_SOW") || code.includes("PREGNANT")) return stageOf(4);
  if (code.includes("FARROW")) return stageOf(5);
  if (code.includes("LACTAT") || code.includes("NURSING") || code.includes("SUCKLING")) return stageOf(6);
  if (code.includes("WEAN") || code.includes("NURSERY")) return stageOf(7);
  if (code.includes("NEXT_CYCLE") || code.includes("FINISH") || code.includes("RECOVERY")) return stageOf(8);

  const exact = DEFAULT_PIGGERY_STAGES.find((s) => s.code.toUpperCase() === code || s.name.toUpperCase() === code);
  if (exact) return { id: exact.id, name: exact.name, standardDays: exact.standardDays };

  // Genuinely unrecognized — surface the real code rather than silently
  // guessing a stage (the previous bugs both guessed, in different ways).
  return { id: 1, name: rawCode || DEFAULT_PIGGERY_STAGES[0].name, standardDays: DEFAULT_PIGGERY_STAGES[0].standardDays };
}

/** Elapsed day within the current stage, computed from the batch's real start_date — not a fabricated constant. */
export function computeStageDay(startDate: string | null | undefined, totalDays: number): number {
  if (!startDate) return 1;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return 1;
  const elapsed = Math.floor((Date.now() - start.getTime()) / 86_400_000) + 1;
  return Math.min(Math.max(elapsed, 1), Math.max(totalDays, 1));
}
