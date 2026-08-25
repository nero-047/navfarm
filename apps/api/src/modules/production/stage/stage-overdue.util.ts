/**
 * Computes days-in-current-stage and whether the stage's configured duration
 * has elapsed — surfaces the "stage period is done, prompt a transition"
 * feature without any background job or new infrastructure.
 * stage_master.typical_duration_days/auto_move_on_day already exist and are
 * validated on write (see stage.service.ts's assertAutoMoveDayWhenAutoByDay)
 * but were never read anywhere until this. Shared by batch.service.ts (batch/
 * lot stage duration) and animal.service.ts (individual animal stage duration).
 */
export interface StageOverdueInput {
  typical_duration_days: number | null;
  auto_move_on_day: number | null;
  next_stage_id: string | null;
}

export interface StageOverdueResult {
  days_in_stage: number | null;
  stage_duration_days: number | null;
  is_stage_overdue: boolean;
  suggested_next_stage_id: string | null;
}

export function computeStageOverdue(
  stage: StageOverdueInput | null | undefined,
  sinceDate: string | Date | null | undefined,
): StageOverdueResult {
  if (!stage || !sinceDate) {
    return { days_in_stage: null, stage_duration_days: null, is_stage_overdue: false, suggested_next_stage_id: null };
  }

  const since = new Date(sinceDate);
  if (Number.isNaN(since.getTime())) {
    return { days_in_stage: null, stage_duration_days: null, is_stage_overdue: false, suggested_next_stage_id: null };
  }

  const daysInStage = Math.floor((Date.now() - since.getTime()) / 86400000);
  const durationLimit = stage.auto_move_on_day ?? stage.typical_duration_days ?? null;
  const isOverdue = durationLimit != null && daysInStage >= durationLimit;

  return {
    days_in_stage: daysInStage,
    stage_duration_days: durationLimit,
    is_stage_overdue: isOverdue,
    suggested_next_stage_id: stage.next_stage_id || null,
  };
}
