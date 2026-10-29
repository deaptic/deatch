import { unwrap } from "solid-js/store";
import * as feedLog from "./feedLog.ts";
import { feeds } from "../stores/feeds.ts";
import { historyViews, setHistoryViews } from "../stores/history.ts";
import type { FeedEntry } from "../types/index.ts";
import type { InvokeOptions } from "../api/utils.ts";
import { withNewer, withOlder } from "../utils/historyView.ts";
import { cursorAt } from "../utils/feedLog.ts";
import { getEntryId } from "../utils/entryId.ts";

const PAGE = 200;
// A view keeps this many entries; reading on lets go of the far end.
const MAX_VIEW = 1_000;

const loading = new Set<string>();
// The oldest live entry a check found nothing logged before, so scrolling at
// the top of a channel with no history doesn't read the log on every event.
const nothingBefore = new Map<string, string>();
const generations = new Map<string, number>();

function generation(broadcasterId: string): number {
  return generations.get(broadcasterId) ?? 0;
}

function supersede(broadcasterId: string): () => boolean {
  const next = generation(broadcasterId) + 1;
  generations.set(broadcasterId, next);
  return () => generation(broadcasterId) === next;
}

function live(broadcasterId: string): FeedEntry[] {
  return structuredClone(unwrap(feeds[broadcasterId]?.messages ?? []));
}

/// One load per channel at a time; a failed read was logged by invokeCommand.
async function once(
  broadcasterId: string,
  work: (current: () => boolean) => Promise<void>,
) {
  if (loading.has(broadcasterId)) return;
  loading.add(broadcasterId);
  const started = generation(broadcasterId);
  try {
    await work(() => generation(broadcasterId) === started);
  } catch {
    // Logged by invokeCommand; the next scroll tries again.
  } finally {
    loading.delete(broadcasterId);
  }
}

/// Reads further back than the feed shows, opening a view on the live feed
/// the first time.
export function older(broadcasterId: string): Promise<void> {
  return once(broadcasterId, async (current) => {
    const view = historyViews[broadcasterId] ?? {
      entries: live(broadcasterId),
      atOldest: false,
      atLive: true,
    };
    const first = view.entries[0];
    if (!first || view.atOldest) return;
    if (nothingBefore.get(broadcasterId) === getEntryId(first)) return;
    const page = await feedLog.page(
      broadcasterId,
      cursorAt("before", first),
      PAGE,
    );
    if (!current()) return;
    if (page.length === 0 && !historyViews[broadcasterId]) {
      nothingBefore.set(broadcasterId, getEntryId(first));
      return;
    }
    setHistoryViews(broadcasterId, withOlder(view, page, MAX_VIEW));
  });
}

/// Reads forward from the view's newest entry towards the live feed.
export function newer(broadcasterId: string): Promise<void> {
  return once(broadcasterId, async (current) => {
    const view = historyViews[broadcasterId];
    const last = view?.entries.at(-1);
    if (!view || !last || view.atLive) return;
    const page = await feedLog.page(
      broadcasterId,
      cursorAt("after", last),
      PAGE,
    );
    if (!current()) return;
    setHistoryViews(
      broadcasterId,
      withNewer(view, page, live(broadcasterId), PAGE, MAX_VIEW),
    );
  });
}

export type AroundOutcome = "opened" | "missing" | "superseded";

/// Opens a view on the logged entries around `messageId`.
export async function around(
  broadcasterId: string,
  messageId: string,
): Promise<AroundOutcome> {
  const current = supersede(broadcasterId);
  const entries = await feedLog
    .around(broadcasterId, messageId, PAGE * 2)
    .catch(() => null);
  if (!current()) return "superseded";
  if (!entries || entries.length === 0) return "missing";
  setHistoryViews(broadcasterId, { entries, atOldest: false, atLive: false });
  return "opened";
}

export async function clear(options?: InvokeOptions): Promise<void> {
  await feedLog.clear(options);
  nothingBefore.clear();
  for (const broadcasterId of Object.keys(historyViews)) close(broadcasterId);
}

export function close(broadcasterId: string) {
  supersede(broadcasterId);
  setHistoryViews(broadcasterId, undefined);
}
