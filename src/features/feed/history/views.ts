import { createStore } from "solid-js/store";
import type { HistoryView } from "./types.ts";

export const [historyViews, setHistoryViews] = createStore<
  Record<string, HistoryView | undefined>
>({});
