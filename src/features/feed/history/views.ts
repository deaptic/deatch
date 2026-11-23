import { createStore } from "solid-js/store";
import type { HistoryView } from "../../../shared/types/index.ts";

export const [historyViews, setHistoryViews] = createStore<
  Record<string, HistoryView | undefined>
>({});
