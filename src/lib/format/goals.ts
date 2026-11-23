import { t } from "../i18n/index.ts";
import type { Goal } from "../types/index.ts";

export function goalProgress(goal: Goal): string {
  return t("HEADER_GOAL_PROGRESS_STATUS", {
    current: goal.current,
    target: goal.target,
  });
}

export function goalTitle(goal: Goal): string {
  return goal.description || t("HEADER_GOAL_TYPE_VALUE", { type: goal.kind });
}

export function goalsTitle(goals: readonly Goal[]): string {
  const [only] = goals;
  return goals.length === 1 && only
    ? goalTitle(only)
    : t("HEADER_GOALS_COUNT_STATUS", { count: goals.length });
}
