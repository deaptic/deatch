import type { Cursor, FeedEntry, LogEntry, Side } from "../types/index.ts";
import { getEntryId } from "./entryId.ts";

export function toLogEntry(entry: FeedEntry): LogEntry {
  return {
    id: getEntryId(entry),
    timestamp: entry.timestamp,
    entry: JSON.stringify(entry),
  };
}

/// A page of the log read next to `entry`.
export function cursorAt(side: Side, entry: FeedEntry): Cursor {
  return { side, id: getEntryId(entry), timestamp: entry.timestamp };
}

function isFeedEntry(value: unknown): value is FeedEntry {
  if (typeof value !== "object" || value === null) return false;
  if (!("timestamp" in value) || typeof value.timestamp !== "number") {
    return false;
  }
  if (!("kind" in value)) return false;
  if (value.kind === "message") {
    return "message_id" in value && typeof value.message_id === "string";
  }
  return (
    value.kind === "event" && "id" in value && typeof value.id === "string"
  );
}

/// Logged entries that still read as feed entries; the log outlives the code
/// that wrote it, so anything else is dropped.
export function fromLog(lines: string[]): FeedEntry[] {
  return lines.flatMap((line) => {
    try {
      const value: unknown = JSON.parse(line);
      return isFeedEntry(value) ? [value] : [];
    } catch {
      return [];
    }
  });
}
