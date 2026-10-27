export type History<T extends { id: string }> = { entries: T[]; index: number };

const LIMIT = 50;

export const emptyHistory = <T extends { id: string }>(): History<T> => ({
  entries: [],
  index: -1,
});

// Revisiting the current entry is a no-op, so stepping can reuse the normal
// select path without truncating what lies ahead.
export function visit<T extends { id: string }>(
  h: History<T>,
  item: T,
): History<T> {
  if (h.entries[h.index]?.id === item.id) return h;
  const entries = [...h.entries.slice(0, h.index + 1), item].slice(-LIMIT);
  return { entries, index: entries.length - 1 };
}

export function step<T extends { id: string }>(
  h: History<T>,
  delta: 1 | -1,
): History<T> | null {
  const index = h.index + delta;
  return index >= 0 && index < h.entries.length
    ? { entries: h.entries, index }
    : null;
}
