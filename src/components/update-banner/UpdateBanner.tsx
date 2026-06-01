import { Show } from "solid-js";
import {
  installing,
  pendingUpdate,
  setInstalling,
} from "../../lib/stores/updater.ts";
import { installUpdate } from "../../lib/services/updater.ts";

export default function UpdateBanner() {
  async function onInstall() {
    const update = pendingUpdate();
    if (!update || installing()) return;
    setInstalling(true);
    try {
      await installUpdate(update);
    } catch (e) {
      console.error("update install failed", e);
      setInstalling(false);
    }
  }

  return (
    <Show when={pendingUpdate()}>
      {(u) => (
        <button
          onClick={onInstall}
          disabled={installing()}
          class="shrink-0 w-full flex items-center gap-2 h-8 px-3 bg-primary/20 hover:bg-primary/30 disabled:hover:bg-primary/20 border-b border-primary/40 text-xs text-left transition-colors cursor-pointer disabled:cursor-default"
        >
          <span class="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span class="text-text truncate">
            <Show
              when={!installing()}
              fallback={<>Installing update…</>}
            >
              <span class="font-semibold">Update available</span>
              <span class="text-text-muted">· v{u().version}</span>
            </Show>
          </span>
        </button>
      )}
    </Show>
  );
}
