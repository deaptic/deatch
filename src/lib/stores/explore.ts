import type { Category } from "../types/index.ts";
import { createStore } from "solid-js/store";

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
