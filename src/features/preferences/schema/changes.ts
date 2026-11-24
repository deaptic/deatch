const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function changesFrom(value: unknown, base: unknown): unknown {
  if (isRecord(value) && isRecord(base)) {
    const changed = Object.entries(value).flatMap(([key, field]) => {
      const diff = changesFrom(field, base[key]);
      return diff === undefined ? [] : [[key, diff] as const];
    });
    return changed.length ? Object.fromEntries(changed) : undefined;
  }
  return JSON.stringify(value) === JSON.stringify(base) ? undefined : value;
}
