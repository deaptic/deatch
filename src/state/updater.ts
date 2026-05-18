import { createSignal } from "solid-js";
import type { Update } from "@tauri-apps/plugin-updater";

const [pendingUpdate, setPendingUpdate] = createSignal<Update | null>(null);
const [installing, setInstalling] = createSignal(false);

export { pendingUpdate, setPendingUpdate, installing, setInstalling };
