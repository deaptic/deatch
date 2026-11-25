import type { FeedEntry, FeedMessage } from "../feed/index.ts";

function plain(message: FeedMessage): FeedMessage {
  return {
    kind: "message",
    message_id: message.message_id,
    chatter_user_id: message.chatter_user_id,
    chatter_login: message.chatter_login,
    chatter_name: message.chatter_name,
    color: message.color,
    fragments: message.fragments,
    badges: message.badges,
    timestamp: message.timestamp,
  };
}

const isPublic = (entry: FeedEntry): entry is FeedMessage =>
  entry.kind === "message" && !entry.automod_hold && !entry.deleted;

export type StreamFilter = {
  maxLines: number;
  hideCommands: boolean;
  hiddenUsers: readonly string[];
};

const COMMAND_PREFIX = "!";

const isCommand = (message: FeedMessage) => {
  const first = message.fragments[0];
  return (
    first?.type === "text" && first.text.trimStart().startsWith(COMMAND_PREFIX)
  );
};

export const userKey = (name: string) =>
  name.trim().replace(/^@/, "").toLowerCase();

export function withUser(users: readonly string[], name: string): string[] {
  const key = userKey(name);
  return key && !users.includes(key) ? [...users, key] : [...users];
}

export function streamEntries(
  entries: readonly FeedEntry[],
  filter: StreamFilter,
): FeedMessage[] {
  const hidden = new Set(filter.hiddenUsers);
  return entries
    .filter(isPublic)
    .filter((m) => !hidden.has(m.chatter_login.toLowerCase()))
    .filter((m) => !filter.hideCommands || !isCommand(m))
    .map(plain)
    .slice(-filter.maxLines);
}

export function chatterIds(messages: readonly FeedMessage[]): string[] {
  return [...new Set(messages.map((m) => m.chatter_user_id))];
}

export const isExpired = (age: number, fadeAfterMs: number) =>
  fadeAfterMs > 0 && age >= fadeAfterMs;

export type Keyed = { key: string };
export type Shown<T extends Keyed> = { row: T; leaving: boolean };

export function withLeaving<T extends Keyed>(
  previous: readonly Shown<T>[],
  next: readonly T[],
): Shown<T>[] {
  const staying = new Set(next.map((row) => row.key));
  const result: Shown<T>[] = [];
  let i = 0;
  for (const { row } of previous) {
    if (!staying.has(row.key)) {
      result.push({ row, leaving: true });
      continue;
    }
    while (i < next.length && next[i]?.key !== row.key) {
      result.push({ row: next[i] as T, leaving: false });
      i++;
    }
    if (i < next.length) {
      result.push({ row: next[i] as T, leaving: false });
      i++;
    }
  }
  for (; i < next.length; i++)
    result.push({ row: next[i] as T, leaving: false });
  return result;
}

export function arrange<T extends Keyed, S>(
  rendered: readonly T[],
  leaving: ReadonlyMap<string, S>,
  next: readonly T[],
  spotOf: (key: string) => S | undefined,
): { rows: T[]; leaving: Map<string, S> } {
  const spots = new Map<string, S>();
  const merged = withLeaving(
    rendered.map((row) => ({ row, leaving: leaving.has(row.key) })),
    next,
  );
  const rows = merged.flatMap(({ row, leaving: going }) => {
    if (!going) return [row];
    const spot = leaving.get(row.key) ?? spotOf(row.key);
    if (spot === undefined) return [];
    spots.set(row.key, spot);
    return [row];
  });
  return { rows, leaving: spots };
}
