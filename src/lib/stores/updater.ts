import { createSignal } from "solid-js";
import type { Update } from "../types/index.ts";

export const [pendingUpdate, setPendingUpdate] = createSignal<Update | null>(
  null,
);
export const [installing, setInstalling] = createSignal(false);
