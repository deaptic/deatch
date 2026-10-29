export type Visits<T extends { id: string }> = { entries: T[]; index: number };

const LIMIT = 50;

export const emptyVisits = <T extends { id: string }>(): Visits<T> => ({
  entries: [],
  index: -1,
});

// Revisiting the current entry is a no-op, so stepping can reuse the normal
// select path without truncating what lies ahead.
export function visit<T extends { id: string }>(
  v: Visits<T>,
  item: T,
): Visits<T> {
  if (v.entries[v.index]?.id === item.id) return v;
  const entries = [...v.entries.slice(0, v.index + 1), item].slice(-LIMIT);
  return { entries, index: entries.length - 1 };
}

export function step<T extends { id: string }>(
  v: Visits<T>,
  delta: 1 | -1,
): Visits<T> | null {
  const index = v.index + delta;
  return index >= 0 && index < v.entries.length
    ? { entries: v.entries, index }
    : null;
}
