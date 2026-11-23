import type { ConditionOp } from "../../lib/stores/preferences.ts";

export const needsValue = (op: ConditionOp) => op !== "set" && op !== "empty";

function number(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  return value !== "" && Number.isFinite(parsed) ? parsed : null;
}

function compare(left: string, right: string, sign: 1 | -1): boolean {
  const a = number(left);
  const b = number(right);
  return a !== null && b !== null && Math.sign(a - b) === sign;
}

export function satisfied(groups: boolean[][]): boolean {
  return groups.some((group) => group.every(Boolean));
}

export function holds(op: ConditionOp, left: string, right: string): boolean {
  const a = left.trim();
  const b = right.trim();
  switch (op) {
    case "set":
      return a !== "";
    case "empty":
      return a === "";
    case "is":
      return a.toLowerCase() === b.toLowerCase();
    case "isNot":
      return a.toLowerCase() !== b.toLowerCase();
    case "contains":
      return a.toLowerCase().includes(b.toLowerCase());
    case "notContains":
      return !a.toLowerCase().includes(b.toLowerCase());
    case "above":
      return compare(a, b, 1);
    case "below":
      return compare(a, b, -1);
  }
}
