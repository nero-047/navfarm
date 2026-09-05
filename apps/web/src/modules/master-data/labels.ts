import type { MasterDataConfig } from "./types";

/**
 * The singular of a master's plural `label`, for "Add X" and "Edit X".
 *
 * Config labels are plural because they head a list. The two call sites used
 * to singularise them with `label.replace(/s$/, "")`, which is right for
 * "Items" and wrong for every other shape English has: it rendered
 * "Add Number Serie", "Add Item Categorie" and "Add Specie".
 *
 * Only the regular `-ies` and `-s` endings are inferred here. A label whose
 * plural is irregular, is identical to its singular, or whose head noun is not
 * the last word declares `singular` in its config — no rule set gets those
 * right, and a wrong guess is a user-visible typo.
 */
export function singularLabel(config: MasterDataConfig): string {
  if (config.singular) return config.singular;
  if (/ies$/.test(config.label)) return config.label.replace(/ies$/, "y");
  return config.label.replace(/s$/, "");
}
