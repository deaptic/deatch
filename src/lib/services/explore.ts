import { createEffect, createRoot, on } from "solid-js";
import { getStreams } from "../api/twitch/streams.ts";
import {
  emptyLiveBrowse,
  exploreFilters,
  liveBrowse,
  setLiveBrowse,
} from "../stores/explore.ts";
import { exploreLanguage } from "../stores/preferences.ts";
import * as users from "./users.ts";

const PAGE_SIZE = 40;

let generation = 0;
let watchers = 0;

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(
        () => [
          exploreFilters.followingOnly,
          exploreLanguage(),
          exploreFilters.category,
        ],
        () => {
          generation++;
          setLiveBrowse(emptyLiveBrowse());
          if (watchers > 0) void loadPage(true);
        },
        { defer: true },
      ),
    );
    return dispose;
  });
}

export function watch(): () => void {
  watchers++;
  void loadPage(true);
  return () => {
    watchers--;
  };
}

export function loadMore(): void {
  void loadPage(false);
}

async function loadPage(first: boolean): Promise<void> {
  if (exploreFilters.followingOnly) return;
  if (!first && (liveBrowse.fetching || liveBrowse.exhausted)) return;
  const mine = ++generation;
  setLiveBrowse("fetching", true);
  try {
    const { data, pagination } = await getStreams({
      gameIds: exploreFilters.category
        ? [exploreFilters.category.id]
        : undefined,
      language: exploreLanguage() || undefined,
      first: PAGE_SIZE,
      after: first ? undefined : (liveBrowse.cursor ?? undefined),
    });
    if (mine !== generation) return;
    if (data.length) users.get(data.map((s) => s.user.id)).catch(() => {});
    setLiveBrowse({
      streams: first ? data : [...liveBrowse.streams, ...data],
      cursor: pagination.cursor,
      exhausted: !pagination.cursor || data.length === 0,
    });
  } catch {
    if (mine === generation) setLiveBrowse("exhausted", true);
  } finally {
    if (mine === generation) setLiveBrowse("fetching", false);
  }
}
