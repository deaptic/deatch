import type { Category, Stream } from "../types/index.ts";
import { createStore } from "solid-js/store";

type ExploreFilters = {
  followingOnly: boolean;
  category: Category | null;
};

export const [exploreFilters, setExploreFilters] = createStore<ExploreFilters>({
  followingOnly: true,
  category: null,
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
