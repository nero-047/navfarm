/** BBP §1.3, §4 (gilt processing), §10 (DOA). Only documented examples,
 * approved by the user; the remaining client list is deliberately not invented. */
export const REASON_CATEGORIES = ['MORTALITY', 'CULL', 'RETURN', 'SELECTION', 'DISPOSAL', 'TRANSFER'] as const;
export type ReasonCategory = typeof REASON_CATEGORIES[number];
export const DOCUMENTED_REASONS = [
  { reason_code: 'DOA', reason_name: 'Dead on Arrival', category: 'MORTALITY', applicable_stages: null, mandatory_weight: false },
  { reason_code: 'RATION_PIG', reason_name: 'Ration Pig', category: 'MORTALITY', applicable_stages: null, mandatory_weight: true },
  { reason_code: 'CULLED_PROC', reason_name: 'Culled at Processing', category: 'CULL', applicable_stages: ['GILT_REARING'], mandatory_weight: false },
] satisfies { reason_code: string; reason_name: string; category: ReasonCategory; applicable_stages: string[] | null; mandatory_weight: boolean }[];
