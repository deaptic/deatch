import { createEffect, createRoot, on } from "solid-js";
import { getStreams } from "../../platform/twitch/streams.ts";
import {
  emptyLiveBrowse,
  exploreFilters,
  liveBrowse,
  setLiveBrowse,
} from "../stores/explore.ts";
import { exploreLanguage } from "../stores/preferences.ts";
import * as users from "./users.ts";

const PAGE_SIZE = 40;
const MAX_STREAMS = 200;

let generation = 0;
let watchers = 0;
let loadedAt = 0;

const STALE_MS = 5 * 60_000;

function reload() {
  generation++;
  setLiveBrowse(emptyLiveBrowse());
  if (watchers > 0) void loadPage(true);
}

function refreshIfStale() {
  if (watchers > 0 && Date.now() - loadedAt > STALE_MS) void loadPage(true);
}

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(() => [exploreLanguage(), exploreFilters.category], reload, {
        defer: true,
      }),
    );
    window.addEventListener("focus", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      dispose();
    };
  });
}

export function watch(): () => void {
  watchers++;
  void loadPage(true);
  return () => {
    watchers--;
    if (watchers > 0) return;
    generation++;
    setLiveBrowse(emptyLiveBrowse());
  };
}

export function loadMore(): void {
  void loadPage(false);
}

async function loadPage(first: boolean): Promise<void> {
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
    if (first) loadedAt = Date.now();
    if (data.length) users.get(data.map((s) => s.user.id)).catch(() => {});
    const streams = first ? data : [...liveBrowse.streams, ...data];
    setLiveBrowse({
      streams,
      cursor: pagination.cursor,
      exhausted:
        !pagination.cursor ||
        data.length === 0 ||
        streams.length >= MAX_STREAMS,
    });
  } catch {
    if (mine === generation) setLiveBrowse("exhausted", true);
  } finally {
    if (mine === generation) setLiveBrowse("fetching", false);
  }
}
