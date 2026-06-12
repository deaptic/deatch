import { createStore } from "solid-js/store";
import type { Category } from "../api/twitch/search.ts";

export type ExploreFilters = {
  followingOnly: boolean;
  language: string;
  category: Category | null;
};

export const [exploreFilters, setExploreFilters] = createStore<ExploreFilters>({
  followingOnly: true,
  language: "",
  category: null,
});
