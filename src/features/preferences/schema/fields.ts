import { clampToStops, type Steps } from "../../../shared/accessibility.ts";
import { fromKeys } from "../../../shared/fromKeys.ts";

export type Field<T> = {
  fallback: () => T;
  read: (raw: unknown) => T;
};

export type Value<F> = F extends Field<infer T> ? T : never;

type Spec = Record<string, Field<unknown>>;
type Shape<S extends Spec> = { [K in keyof S]: Value<S[K]> };

const isRecord = (raw: unknown): raw is Record<string, unknown> =>
  !!raw && typeof raw === "object" && !Array.isArray(raw);

export function custom<T>(
  fallback: () => T,
  parse: (raw: unknown, fallback: () => T) => T,
): Field<T> {
  return { fallback, read: (raw) => parse(raw, fallback) };
}

function readSafely<T>(field: Field<T>, raw: unknown, key: string): T {
  try {
    return field.read(raw);
  } catch (e) {
    console.warn(`preferences: ${key} reset to default`, e);
    return field.fallback();
  }
}

export function object<S extends Spec>(spec: S): Field<Shape<S>> {
  const entries = Object.entries(spec);
  return {
    fallback: () =>
      Object.fromEntries(
        entries.map(([key, field]) => [key, field.fallback()]),
      ) as Shape<S>,
    read: (raw) => {
      const stored = isRecord(raw) ? raw : {};
      return Object.fromEntries(
        entries.map(([key, field]) => [
          key,
          readSafely(field, stored[key], key),
        ]),
      ) as Shape<S>;
    },
  };
}

export const bool = (initial: boolean) =>
  custom(
    () => initial,
    (raw, fallback) => (typeof raw === "boolean" ? raw : fallback()),
  );

export const oneOf = <T extends string>(
  values: readonly T[],
  initial: T | (() => T),
) =>
  custom<T>(
    typeof initial === "function" ? initial : () => initial,
    (raw, fallback) => values.find((v) => v === raw) ?? fallback(),
  );

export const steps = (stops: Steps, initial: number) =>
  custom(
    () => initial,
    (raw, fallback) =>
      typeof raw === "number" && Number.isFinite(raw)
        ? clampToStops(raw, stops)
        : fallback(),
  );

export const text = (initial = "") =>
  custom(
    () => initial,
    (raw, fallback) => (typeof raw === "string" ? raw : fallback()),
  );

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const hexColor = () =>
  custom<string | null>(
    () => null,
    (raw) =>
      typeof raw === "string" && HEX_COLOR.test(raw.trim())
        ? raw.trim().toLowerCase()
        : null,
  );

export const textList = (
  options: { limit?: number; nonEmpty?: boolean } = {},
) =>
  custom<string[]>(
    () => [],
    (raw, fallback) =>
      Array.isArray(raw)
        ? raw
            .filter(
              (s): s is string =>
                typeof s === "string" && (!options.nonEmpty || !!s.trim()),
            )
            .slice(0, options.limit)
        : fallback(),
  );

export const flags = <K extends string>(
  keys: readonly K[],
  initial: (key: K) => boolean,
) => object(fromKeys(keys, (key) => bool(initial(key))));

export type ShowPref = { show: boolean };

export const shown = <K extends string>(keys: readonly K[]) =>
  object(
    fromKeys(keys, () =>
      custom<ShowPref>(
        () => ({ show: true }),
        (raw, fallback) =>
          isRecord(raw) && typeof raw.show === "boolean"
            ? { show: raw.show }
            : fallback(),
      ),
    ),
  );

export const numberMap = (clamp: (value: number) => number) =>
  custom<Record<string, number>>(
    () => ({}),
    (raw) =>
      isRecord(raw)
        ? Object.fromEntries(
            Object.entries(raw).flatMap(([key, value]) =>
              typeof value === "number" && Number.isFinite(value)
                ? [[key, clamp(value)]]
                : [],
            ),
          )
        : {},
  );

export const choice = <T extends number>(values: readonly T[], initial: T) =>
  custom<T>(
    () => initial,
    (raw, fallback) => values.find((v) => v === raw) ?? fallback(),
  );
