import type { Category, Stream } from "../types/index.ts";
import type { StreamSort } from "../utils/liveFilter.ts";
import { createStore } from "solid-js/store";

type ExploreFilters = {
  category: Category | null;
  sort: StreamSort;
};

export const [exploreFilters, setExploreFilters] = createStore<ExploreFilters>({
  category: null,
  sort: "viewers",
});

type LiveBrowse = {
  streams: Stream[];
  cursor: string | null;
  fetching: boolean;
  exhausted: boolean;
};

export const emptyLiveBrowse = (): LiveBrowse => ({
  streams: [],
  cursor: null,
  fetching: false,
  exhausted: false,
});

export const [liveBrowse, setLiveBrowse] =
  createStore<LiveBrowse>(emptyLiveBrowse());
