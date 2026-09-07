/**
 * The piggery stage master, named as the TDD tracker names it (row 24) and
 * timed as BBP-1 §1.7 times it.
 *
 * Those two documents disagree on vocabulary, not on biology. The tracker says
 * GILT_GROWER, DRY_SOW and WEANING where the blueprint says GILT_REARING,
 * DRY_PERIOD and (for the period the sow nurses) LACTATION; the tracker also
 * lists PRODUCTIVE_SOW, BOAR_AI and the four disposal states as stages, which
 * the blueprint's eight do not cover. Rishi's call is that the tracker governs
 * the names, so the codes here are the tracker's and every duration, minimum
 * and range still cites §1.7.
 *
 * Ranges stay ranges in the description; no arbitrary midpoint is presented as
 * a client-approved typical duration.
 *
 * LACTATION and WEANING both exist deliberately. Lactation is a period §1.7
 * gives 28 days and feed standards to; weaning is what ends it. The tracker
 * names only WEANING, so it is here as the OUTPUT event, and LACTATION stays
 * because dropping it would throw away the one stage the blueprint costs the
 * sow's nursing against. Worth confirming with Triple C whether their "weaning"
 * means the sow's event or the piglets' phase — on the BBP's own chain
 * (Sow → Piglet Lot → Weaner Batch) the weaner phase belongs to a batch, not a
 * sow.
 */
export const BBP_STAGE_SEED = [
  { stage_code: 'QUARANTINE', stage_name: 'Quarantine', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 1, typical_duration_days: 28, min_days_before_move: 0, transition_trigger: 'MANUAL', next_stage_code: 'GILT_GROWER', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: Weeks 1–4. Release requires the quarantine process; elapsed time alone is not clearance.' },
  { stage_code: 'GILT_GROWER', stage_name: 'Gilt Grower', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 2, typical_duration_days: 210, min_days_before_move: 0, transition_trigger: 'MANUAL', next_stage_code: 'FLUSH', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: Weeks 4–34 (approximately 210 days). Selection and service readiness require recorded checkpoints. TDD row 24 calls this GILT_GROWER.' },
  { stage_code: 'DRY_SOW', stage_name: 'Dry Sow', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 3, min_days_before_move: 4, transition_trigger: 'EVENT_BASED', next_stage_code: 'FLUSH', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: 4–7 days after weaning, before flushing. No single typical day has been specified. TDD row 24 calls this DRY_SOW.' },
  { stage_code: 'FLUSH', stage_name: 'Flush', stage_category: 'PRE_PRODUCTIVE', stage_sequence: 4, min_days_before_move: 3, transition_trigger: 'EVENT_BASED', next_stage_code: 'INSEMINATION', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: 3–5 days. Flushing is separate from insemination; no single typical day has been specified.' },
  { stage_code: 'INSEMINATION', stage_name: 'Insemination', stage_category: 'PRODUCTIVE', stage_sequence: 5, typical_duration_days: 2, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: 'GESTATION', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: 2 days. Kept although the TDD list omits it — the blueprint specifies it and the flush → gestation path runs through it.' },
  { stage_code: 'GESTATION', stage_name: 'Gestation', stage_category: 'PRODUCTIVE', stage_sequence: 6, typical_duration_days: 116, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: 'FARROWING', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: 116 days. Pregnancy scan and farrowing events govern progression.' },
  { stage_code: 'FARROWING', stage_name: 'Farrowing', stage_category: 'OUTPUT', stage_sequence: 7, min_days_before_move: 2, transition_trigger: 'EVENT_BASED', next_stage_code: 'LACTATION', data_entry_form: 'FARROWING', show_on_animal_card: true, stage_description: 'BBP §1.7: 2–4 days. Record the litter; no single typical day has been specified.' },
  { stage_code: 'LACTATION', stage_name: 'Lactation', stage_category: 'PRODUCTIVE', stage_sequence: 8, typical_duration_days: 28, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: 'WEANING', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'BBP §1.7: 28 days the sow nurses the litter. Ends at weaning.' },
  { stage_code: 'WEANING', stage_name: 'Weaning', stage_category: 'OUTPUT', stage_sequence: 9, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: 'DRY_SOW', data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. The event that ends lactation and returns the sow to Dry Sow; parity increments here (BBP: "Parity incremented on weaning POST").' },
  { stage_code: 'PRODUCTIVE_SOW', stage_name: 'Productive Sow', stage_category: 'PRODUCTIVE', stage_sequence: 10, min_days_before_move: 0, transition_trigger: 'MANUAL', next_stage_code: null, data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. A sow in the breeding herd, between cycles rather than inside one.' },
  { stage_code: 'BOAR_AI', stage_name: 'Boar AI', stage_category: 'PRODUCTIVE', stage_sequence: 11, min_days_before_move: 0, transition_trigger: 'MANUAL', next_stage_code: null, data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. A boar in the AI station; his cycle is semen collection, not gestation.' },
  { stage_code: 'CULLED', stage_name: 'Culled', stage_category: 'DISPOSAL', stage_sequence: 20, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: null, data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. Removed from the herd. BBP: closure date, reason, disposal destination and weight are recorded, and a write-off is triggered.' },
  { stage_code: 'DEAD', stage_name: 'Dead', stage_category: 'DISPOSAL', stage_sequence: 21, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: null, data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. Mortality. Set through Dispose, which records the disposal type DIED.' },
  { stage_code: 'SOLD', stage_name: 'Sold', stage_category: 'DISPOSAL', stage_sequence: 22, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: null, data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. Set through Dispose, which posts the gain or loss against book value.' },
  { stage_code: 'SLAUGHTERED', stage_name: 'Slaughtered', stage_category: 'DISPOSAL', stage_sequence: 23, min_days_before_move: 0, transition_trigger: 'EVENT_BASED', next_stage_code: null, data_entry_form: 'STANDARD', show_on_animal_card: true, stage_description: 'TDD row 24. Set through Dispose, which blocks until every administered medicine’s withdrawal period has elapsed.' },
] as const;

/**
 * Codes an older build used, mapped onto the ones above.
 *
 * This map used to run the other way — GILT_GROWER was normalised *to*
 * GILT_REARING, because the blueprint's vocabulary governed. Now the tracker's
 * does, so the direction is inverted and the blueprint's names are the legacy
 * side. FLUSH_SERVICE stays absent on purpose: it combines two stages that are
 * separate here and cannot be remapped by guessing.
 */
export const BBP_STAGE_RENAMES: Readonly<Record<string, string>> = {
  GILT_REARING: 'GILT_GROWER',
  DRY_PERIOD: 'DRY_SOW',
  DRY_SOW_GESTATION: 'GESTATION',
  SLAUGHTER: 'SLAUGHTERED',
  DISPOSED: 'DEAD',
};
