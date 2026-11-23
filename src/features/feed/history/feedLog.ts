import { unwrap } from "solid-js/store";
import {
  feedlogAppend,
  feedlogAround,
  feedlogClear,
  feedlogPage,
} from "../../../platform/feedLog.ts";
import type { InvokeOptions } from "../../../platform/invoke.ts";
import { takeUnlogged } from "../store/index.ts";
import type { Cursor, FeedEntry } from "../../../shared/types/index.ts";
import { fromLog, toLogEntry } from "./feedLogPages.ts";

const FLUSH_MS = 5_000;

export function start(): () => void {
  const flushNow = () => void flush();
  const timer = setInterval(flushNow, FLUSH_MS);
  return () => {
    clearInterval(timer);
    flushNow();
  };
}

function write(broadcasterId: string, entries: FeedEntry[]): Promise<void> {
  return feedlogAppend(
    { broadcasterId, entries: entries.map(toLogEntry) },
    { silent: true },
  ).then(
    () => {},
    () => {},
  );
}

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

export function discard() {
  takeUnlogged();
}

export async function clear(options?: InvokeOptions): Promise<void> {
  await flush();
  await feedlogClear(options);
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
