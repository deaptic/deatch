import { fromKeys } from "../../../shared/fromKeys.ts";
import { clampToStops, type Steps } from "../../../shared/accessibility.ts";

export type ShowPref = { show: boolean };
export type Stored<T> = T extends object
  ? { [K in keyof T]?: Stored<T[K]> }
  : T;

export const objectOr = <T>(raw: unknown): Stored<T> =>
  (raw && typeof raw === "object" ? raw : {}) as Stored<T>;

export function bool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

export function bools<T extends Record<string, boolean>>(
  raw: unknown,
  fallback: T,
): T {
  const stored = objectOr<T>(raw) as Partial<Record<string, unknown>>;
  return Object.fromEntries(
    Object.entries(fallback).map(([key, value]) => [
      key,
      bool(stored[key], value),
    ]),
  ) as T;
}

export function oneOf<T extends string>(
  values: readonly T[],
  raw: unknown,
  fallback: T,
): T {
  return values.find((v) => v === raw) ?? fallback;
}

export const text = (raw: unknown) => (typeof raw === "string" ? raw : "");

export function strings(raw: unknown, fallback: string[]): string[] {
  return Array.isArray(raw)
    ? raw.filter((s): s is string => typeof s === "string")
    : fallback;
}

export function step(raw: unknown, steps: Steps, fallback: number): number {
  return typeof raw === "number" && Number.isFinite(raw)
    ? clampToStops(raw, steps)
    : fallback;
}

export function showPrefs<K extends string>(
  keys: readonly K[],
  raw: unknown,
  fallback: Partial<Record<K, ShowPref>> = {},
): Record<K, ShowPref> {
  const stored: Partial<Record<string, unknown>> =
    raw && typeof raw === "object" ? raw : {};
  return fromKeys(keys, (key) => {
    const value = stored[key];
    const show =
      value && typeof value === "object" && "show" in value
        ? value.show
        : undefined;
    return typeof show === "boolean"
      ? { show }
      : (fallback[key] ?? { show: true });
  });
}
