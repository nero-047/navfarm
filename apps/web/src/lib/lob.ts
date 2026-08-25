import type { TranslationKeys } from "@/utils/translations";

/**
 * The single place the app decides what line of business it is looking at.
 *
 * `lob_master` ships sixteen codes, all family-prefixed — LVS_PIGGERY,
 * LVS_MILKING, PLT_LAYING, AQA_FISH, AGRI_CROP and so on. Before this module,
 * three screens each guessed at that independently, with different substring
 * rules, and one of them ran its guesses against `area.lob_id` — a UUID, which
 * never contains "DAIRY", so every non-piggery area silently resolved to
 * Piggery. A fourth place (`tLob`) only understood the bare words "PIGGERY",
 * "DAIRY" and "POULTRY", so a real code rendered as the raw string
 * "LVS_PIGGERY" in the UI.
 *
 * Everything now goes through `resolveLobFamily`. Adding a line of business is
 * one row in CODE_TO_FAMILY (or nothing at all, if its code carries a known
 * prefix) plus its capacity fields and label key.
 */
export type LobFamily =
  | "PIGGERY"
  | "DAIRY"
  | "SMALL_RUMINANT"
  | "POULTRY"
  | "AQUACULTURE"
  | "CROP"
  | "APIARY"
  | "INSECT"
  | "FEED"
  | "GENERIC";

/** Exact `lob_master.lob_code` values, as seeded. */
const CODE_TO_FAMILY: Record<string, LobFamily> = {
  LVS_PIGGERY: "PIGGERY",
  LVS_MILKING: "DAIRY",
  LVS_GOAT_SHEEP: "SMALL_RUMINANT",
  PLT_CB: "POULTRY",
  PLT_HATCHING: "POULTRY",
  PLT_LAYING: "POULTRY",
  PLT_REARING: "POULTRY",
  PLT_SLAUGHTER: "POULTRY",
  AQA_FISH: "AQUACULTURE",
  AQA_SLAUGHTER: "AQUACULTURE",
  AGRI_CROP: "CROP",
  AGRI_FRUIT: "CROP",
  AGRI_SEEDS: "CROP",
  INS_BEE: "APIARY",
  BSF: "INSECT",
  FEED_PROD: "FEED",
};

/** Families are also valid input, so a value already normalised stays stable. */
const FAMILIES = new Set<string>(Object.values(CODE_TO_FAMILY).concat("GENERIC"));

/**
 * A new code under a known prefix lands in the right family with no code
 * change — LVS_ alone is ambiguous (piggery vs. dairy vs. sheep) so it is
 * deliberately absent and falls through to the keyword pass below.
 */
const PREFIX_TO_FAMILY: Array<[string, LobFamily]> = [
  ["PLT_", "POULTRY"],
  ["AQA_", "AQUACULTURE"],
  ["AGRI_", "CROP"],
  ["INS_", "APIARY"],
];

/** Last resort, for a free-text LOB name rather than a code. */
const KEYWORD_TO_FAMILY: Array<[RegExp, LobFamily]> = [
  [/\b(PIG|SWINE|PIGGERY|SOW|BOAR)\b|PIG/, "PIGGERY"],
  [/DAIRY|MILK|CATTLE|COW/, "DAIRY"],
  [/GOAT|SHEEP|LAMB/, "SMALL_RUMINANT"],
  [/POULTRY|BROILER|LAYER|CHICK|HATCH/, "POULTRY"],
  [/FISH|SHRIMP|AQUA/, "AQUACULTURE"],
  [/CROP|FRUIT|SEED|ORCHARD/, "CROP"],
  [/BEE|APIAR|HONEY/, "APIARY"],
  [/FLY|LARVA|INSECT/, "INSECT"],
  [/FEED/, "FEED"],
];

/** A UUID is an id, never a LOB code — reject it rather than keyword-match it. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves any of: a real `lob_code`, a family, or a human LOB name, to a
 * family. Pass the fallbacks in priority order — e.g.
 * `resolveLobFamily(area.lob_code, area.lob_name, area.area_name)`.
 */
export function resolveLobFamily(...candidates: Array<string | null | undefined>): LobFamily {
  for (const raw of candidates) {
    if (!raw) continue;
    const value = String(raw).trim();
    if (!value || UUID.test(value)) continue;
    const upper = value.toUpperCase();

    if (FAMILIES.has(upper)) return upper as LobFamily;
    if (CODE_TO_FAMILY[upper]) return CODE_TO_FAMILY[upper];

    const prefixed = PREFIX_TO_FAMILY.find(([p]) => upper.startsWith(p));
    if (prefixed) return prefixed[1];

    const keyword = KEYWORD_TO_FAMILY.find(([re]) => re.test(upper));
    if (keyword) return keyword[1];
  }
  return "GENERIC";
}

/** Translation key for a family's display name. */
export const LOB_LABEL_KEY: Record<LobFamily, TranslationKeys> = {
  PIGGERY: "lobNamePiggery",
  DAIRY: "lobNameDairy",
  SMALL_RUMINANT: "lobNameSmallRuminant",
  POULTRY: "lobNamePoultry",
  AQUACULTURE: "lobNameAquaculture",
  CROP: "lobNameCrop",
  APIARY: "lobNameApiary",
  INSECT: "lobNameInsect",
  FEED: "lobNameFeed",
  GENERIC: "lobNameFarm",
};

/**
 * Which per-LOB screens exist. Piggery and Dairy have purpose-built panels;
 * every other family falls back to the generic batch-centric screens, which
 * work for any LOB because everything there hangs off a batch.
 */
export const LOB_HAS_DEDICATED_PANELS: Record<LobFamily, boolean> = {
  PIGGERY: true,
  DAIRY: true,
  SMALL_RUMINANT: false,
  POULTRY: false,
  AQUACULTURE: false,
  CROP: false,
  APIARY: false,
  INSECT: false,
  FEED: false,
  GENERIC: false,
};
