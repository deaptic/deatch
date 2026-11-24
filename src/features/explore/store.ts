import { createEffect, createRoot, on } from "solid-js";
import { getStreams } from "../../platform/twitch/streams.ts";
import { createStore } from "solid-js/store";
import type { Category, Stream } from "../../shared/types/index.ts";
import type { StreamSort } from "./model.ts";
import { exploreLanguage } from "../preferences/index.ts";
import { users } from "../users/index.ts";

type Filters = {
  category: Category | null;
  sort: StreamSort;
};

type Popular = {
  streams: Stream[];
  cursor: string | null;
  fetching: boolean;
  exhausted: boolean;
};

const emptyPopular = (): Popular => ({
  streams: [],
  cursor: null,
  fetching: false,
  exhausted: false,
});

const [filters, setFilters] = createStore<Filters>({
  category: null,
  sort: "viewers",
});
const [popular, setPopular] = createStore<Popular>(emptyPopular());
export { filters, popular };

export function setCategory(category: Category | null) {
  setFilters("category", category);
}

export function toggleCategory(category: Category) {
  setFilters("category", (current) =>
    current?.id === category.id ? null : category,
  );
}

export function setSort(sort: StreamSort) {
  setFilters("sort", sort);
}

const PAGE_SIZE = 40;
const MAX_STREAMS = 200;

let generation = 0;
let watchers = 0;
let loadedAt = 0;

const STALE_MS = 5 * 60_000;

function reload() {
  generation++;
  setPopular(emptyPopular());
  if (watchers > 0) void loadPage(true);
}

function refreshIfStale() {
  if (watchers > 0 && Date.now() - loadedAt > STALE_MS) void loadPage(true);
}

export function start(): () => void {
  return createRoot((dispose) => {
    createEffect(
      on(() => [exploreLanguage(), filters.category], reload, {
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
    setPopular(emptyPopular());
  };
}

export function loadMore(): void {
  void loadPage(false);
}

async function loadPage(first: boolean): Promise<void> {
  if (!first && (popular.fetching || popular.exhausted)) return;
  const mine = ++generation;
  setPopular("fetching", true);
  try {
    const page = await getStreams({
      gameIds: filters.category ? [filters.category.id] : undefined,
      language: exploreLanguage() || undefined,
      first: PAGE_SIZE,
      after: first ? undefined : (popular.cursor ?? undefined),
    }).catch(() => null);
    if (!page || mine !== generation) return;
    const { data, pagination } = page;
    if (first) loadedAt = Date.now();
    if (data.length) users.get(data.map((s) => s.user.id)).catch(() => {});
    const streams = first ? data : [...popular.streams, ...data];
    setPopular({
      streams,
      cursor: pagination.cursor,
      exhausted:
        !pagination.cursor ||
        data.length === 0 ||
        streams.length >= MAX_STREAMS,
    });
  } finally {
    if (mine === generation) setPopular("fetching", false);
  }
}
