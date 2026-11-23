import { createStore } from "solid-js/store";
import type { HistoryView } from "../../../lib/types/index.ts";

export const [historyViews, setHistoryViews] = createStore<
  Record<string, HistoryView | undefined>
>({});
