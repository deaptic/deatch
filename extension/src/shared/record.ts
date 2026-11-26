export type Loose = Record<string, unknown>;

export const asRecord = (value: unknown): Loose =>
  typeof value === "object" && value !== null ? (value as Loose) : {};

export const dig = (value: unknown, ...path: string[]): unknown =>
  path.reduce<unknown>((at, key) => asRecord(at)[key], value);

export const stringOrNull = (value: unknown): string | null =>
  typeof value === "string" ? value : null;

export const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const wholeNumber = (value: unknown): number | null =>
  Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : null;

export const positiveNumber = (value: unknown): number | null =>
  isFiniteNumber(value) && value > 0 ? value : null;

export const asList = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

export function parseJson(text: string | null): unknown {
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
