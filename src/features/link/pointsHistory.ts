export type PointsHistory = Record<string, Record<string, number>>;

const DAY_MS = 24 * 60 * 60 * 1000;
const KEPT_DAYS = 7;

type Balances = Readonly<Record<string, number>>;

function recent(history: PointsHistory, day: number): PointsHistory {
  const oldest = day - (KEPT_DAYS - 1) * DAY_MS;
  return Object.fromEntries(
    Object.entries(history).filter(([key]) => Number(key) >= oldest),
  );
}

export function withBalances(
  history: PointsHistory,
  before: Balances | null,
  after: Balances | null,
  day: number,
): PointsHistory {
  if (!before || !after) return history;
  const today = { ...history[day] };
  let changed = false;
  for (const [login, balance] of Object.entries(after)) {
    const previous = before[login];
    if (previous !== undefined && balance > previous) {
      today[login] = (today[login] ?? 0) + balance - previous;
      changed = true;
    }
  }
  return changed ? { ...recent(history, day), [day]: today } : history;
}

export function pointsSince(
  history: PointsHistory,
  since: number,
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const [key, byLogin] of Object.entries(history)) {
    if (Number(key) < since) continue;
    for (const [login, points] of Object.entries(byLogin)) {
      total[login] = (total[login] ?? 0) + points;
    }
  }
  return total;
}

const isCounts = (value: unknown): value is Record<string, number> =>
  typeof value === "object" &&
  value !== null &&
  Object.values(value).every((n) => typeof n === "number" && n >= 0);

export function parseHistory(value: unknown): PointsHistory {
  if (typeof value !== "object" || value === null) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, counts]) => Number.isFinite(Number(key)) && isCounts(counts),
    ),
  );
}
