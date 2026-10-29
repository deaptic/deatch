import { unwrap } from "solid-js/store";
import * as feedLog from "./feedLog.ts";
import { feeds } from "../stores/feeds.ts";
import { historyViews, setHistoryViews } from "../stores/history.ts";
import type { FeedEntry } from "../types/index.ts";
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

function live(broadcasterId: string): FeedEntry[] {
  return structuredClone(unwrap(feeds[broadcasterId]?.messages ?? []));
}

/// One load per channel at a time; a failed read was logged by invokeCommand.
async function once(broadcasterId: string, work: () => Promise<void>) {
  if (loading.has(broadcasterId)) return;
  loading.add(broadcasterId);
  try {
    await work();
  } catch {
    // Logged by invokeCommand; the next scroll tries again.
  } finally {
    loading.delete(broadcasterId);
  }
}

/// Reads further back than the feed shows, opening a view on the live feed
/// the first time.
export function older(broadcasterId: string): Promise<void> {
  return once(broadcasterId, async () => {
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
    if (page.length === 0 && !historyViews[broadcasterId]) {
      nothingBefore.set(broadcasterId, getEntryId(first));
      return;
    }
    setHistoryViews(broadcasterId, withOlder(view, page, MAX_VIEW));
  });
}

/// Reads forward from the view's newest entry towards the live feed.
export function newer(broadcasterId: string): Promise<void> {
  return once(broadcasterId, async () => {
    const view = historyViews[broadcasterId];
    const last = view?.entries.at(-1);
    if (!view || !last || view.atLive) return;
    const page = await feedLog.page(
      broadcasterId,
      cursorAt("after", last),
      PAGE,
    );
    setHistoryViews(
      broadcasterId,
      withNewer(view, page, live(broadcasterId), PAGE, MAX_VIEW),
    );
  });
}

/// Opens a view on the logged entries around `messageId`; false when the log
/// no longer has it.
export async function around(
  broadcasterId: string,
  messageId: string,
): Promise<boolean> {
  const entries = await feedLog
    .around(broadcasterId, messageId, PAGE * 2)
    .catch(() => null);
  if (!entries || entries.length === 0) return false;
  setHistoryViews(broadcasterId, { entries, atOldest: false, atLive: false });
  return true;
}

export function close(broadcasterId: string) {
  setHistoryViews(broadcasterId, undefined);
}
