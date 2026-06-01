import { createSignal } from "solid-js";
import type { Update } from "@tauri-apps/plugin-updater";

export const [pendingUpdate, setPendingUpdate] = createSignal<Update | null>(
  null,
);
export const [installing, setInstalling] = createSignal(false);
