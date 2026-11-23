import type { Condition } from "../../lib/stores/preferences.ts";
import { removedAt, replacedAt } from "../../lib/utils/listEdit.ts";

type Groups = readonly Condition[][];

export const BLANK_CONDITION: Condition = { left: "", op: "set", right: "" };

const groupAt = (groups: Groups, group: number) => groups[group] ?? [];

export function addCondition(groups: Groups, group: number): Condition[][] {
  return replacedAt(groups, group, [
    ...groupAt(groups, group),
    BLANK_CONDITION,
  ]);
}

export function addGroup(groups: Groups): Condition[][] {
  return [...groups, [BLANK_CONDITION]];
}

export function updateCondition(
  groups: Groups,
  group: number,
  at: number,
  condition: Condition,
): Condition[][] {
  return replacedAt(
    groups,
    group,
    replacedAt(groupAt(groups, group), at, condition),
  );
}

export function removeCondition(
  groups: Groups,
  group: number,
  at: number,
): Condition[][] {
  return replacedAt(
    groups,
    group,
    removedAt(groupAt(groups, group), at),
  ).filter((conditions) => conditions.length > 0);
}
