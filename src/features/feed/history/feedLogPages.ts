import type { Cursor, LogEntry, Side } from "../../../shared/types/index.ts";
import type { FeedEntry } from "../types.ts";
import { getEntryId } from "../store/entryId.ts";
import {
  CHAT_CONNECT_FAILED,
  CHAT_CONNECTED,
  CHAT_DISCONNECTED,
} from "../../../shared/moderateActions.ts";

const CONNECTION_NOTICES: ReadonlySet<string> = new Set([
  CHAT_CONNECTED,
  CHAT_DISCONNECTED,
  CHAT_CONNECT_FAILED,
]);

export function isLogged(entry: FeedEntry): boolean {
  return !(entry.kind === "event" && CONNECTION_NOTICES.has(entry.notice_type));
}

export function toLogEntry(entry: FeedEntry): LogEntry {
  return {
    id: getEntryId(entry),
    timestamp: entry.timestamp,
    entry: JSON.stringify(entry),
  };
}

export function cursorAt(side: Side, entry: FeedEntry): Cursor {
  return { side, id: getEntryId(entry), timestamp: entry.timestamp };
}

export function cursorBeforeNow(): Cursor {
  return { side: "before", id: "", timestamp: Date.now() };
}

function isFeedEntry(value: unknown): value is FeedEntry {
  if (typeof value !== "object" || value === null) return false;
  if (!("timestamp" in value) || typeof value.timestamp !== "number") {
    return false;
  }
  if (!("kind" in value)) return false;
  if (value.kind === "message") {
    return (
      "message_id" in value &&
      typeof value.message_id === "string" &&
      "fragments" in value &&
      Array.isArray(value.fragments)
    );
  }
  return (
    value.kind === "event" && "id" in value && typeof value.id === "string"
  );
}

export function fromLog(lines: string[]): FeedEntry[] {
  const entries = lines.flatMap((line) => {
    try {
      const value: unknown = JSON.parse(line);
      return isFeedEntry(value) ? [value] : [];
    } catch {
      return [];
    }
  });
  const dropped = lines.length - entries.length;
  if (dropped > 0)
    console.warn(`feed log: ${dropped} unreadable entries skipped`);
  return entries.filter(isLogged);
}
