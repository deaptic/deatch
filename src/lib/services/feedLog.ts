import { unwrap } from "solid-js/store";
import { feedlogAppend, feedlogAround, feedlogPage } from "../api/feedLog.ts";
import { takeUnlogged } from "../stores/feeds.ts";
import type { Cursor, FeedEntry } from "../types/index.ts";
import { fromLog, toLogEntry } from "../utils/feedLog.ts";

const FLUSH_MS = 5_000;

/// Writes every entry the feeds add or change, every few seconds and when the
/// app goes away, so the log is never more than a moment behind the feed.
export function start(): () => void {
  const flushNow = () => void flush();
  const timer = setInterval(flushNow, FLUSH_MS);
  globalThis.addEventListener("pagehide", flushNow);
  return () => {
    clearInterval(timer);
    globalThis.removeEventListener("pagehide", flushNow);
    flushNow();
  };
}

/// Never rejects: a failed write is logged by invokeCommand.
function write(broadcasterId: string, entries: FeedEntry[]): Promise<void> {
  return feedlogAppend(
    { broadcasterId, entries: entries.map(toLogEntry) },
    { silent: true },
  ).then(
    () => {},
    () => {},
  );
}

/// Writes what is waiting now; reads wait for it so they see it. Entries are
/// read at write time, so each carries its latest state.
export async function flush(): Promise<void> {
  await Promise.all(
    [...takeUnlogged()].map(([id, entries]) =>
      write(
        id,
        entries.map((e) => unwrap(e)),
      ),
    ),
  );
}

/// Drops what is waiting without writing it: the log belongs to whoever is
/// signed in, and these entries were seen by someone who no longer is.
export function discard() {
  takeUnlogged();
}

export async function page(
  broadcasterId: string,
  cursor: Cursor,
  limit: number,
): Promise<FeedEntry[]> {
  await flush();
  const lines = await feedlogPage(
    { broadcasterId, cursor, limit },
    { silent: true },
  );
  return fromLog(lines);
}

/// The logged entries around `id`, or null when the log no longer has it.
export async function around(
  broadcasterId: string,
  id: string,
  limit: number,
): Promise<FeedEntry[] | null> {
  await flush();
  const lines = await feedlogAround(
    { broadcasterId, id, limit },
    { silent: true },
  );
  return lines ? fromLog(lines) : null;
}
