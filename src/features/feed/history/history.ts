import { unwrap } from "solid-js/store";
import * as feedLog from "./feedLog.ts";
import { feeds } from "../store/index.ts";
import { historyViews, setHistoryViews } from "./views.ts";
import type { FeedEntry } from "../../../shared/types/index.ts";
import type { InvokeOptions } from "../../../platform/invoke.ts";
import { withNewer, withOlder } from "./view.ts";
import { cursorAt, cursorBeforeNow } from "./feedLogPages.ts";
import { getEntryId } from "../store/entryId.ts";

const PAGE = 200;
const MAX_VIEW = 1_000;

const loading = new Set<string>();
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
  } finally {
    loading.delete(broadcasterId);
  }
}

export function older(broadcasterId: string): Promise<void> {
  return once(broadcasterId, async (current) => {
    const opened = historyViews[broadcasterId];
    const view = opened ?? {
      entries: live(broadcasterId),
      atOldest: false,
      atLive: true,
    };
    const first = view.entries[0];
    if (view.atOldest) return;
    const anchor = first ? getEntryId(first) : "";
    if (nothingBefore.get(broadcasterId) === anchor) return;
    const page = await feedLog.page(
      broadcasterId,
      opened && first ? cursorAt("before", first) : cursorBeforeNow(),
      PAGE,
    );
    if (!current()) return;
    if (page.length === 0 && !historyViews[broadcasterId]) {
      nothingBefore.set(broadcasterId, anchor);
      return;
    }
    setHistoryViews(broadcasterId, withOlder(view, page, MAX_VIEW));
  });
}

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
