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
          type="button"
          onClick={onInstall}
          disabled={installing()}
          class="shrink-0 w-full flex items-center gap-2.5 h-9 px-4 bg-accent-soft hover:bg-accent/20 border-b border-line-soft text-small text-left transition-colors duration-snap cursor-pointer disabled:cursor-default disabled:hover:bg-accent-soft"
        >
          <span class="size-2 rounded-full bg-accent shrink-0" />
          <span class="text-ink truncate">
            <Show when={!installing()} fallback={<>Installing update…</>}>
              <span class="font-semibold">Update ready</span>
              <span class="text-ink-soft">
                {" "}
                · {u().version} · click to install
              </span>
            </Show>
          </span>
        </button>
      )}
    </Show>
  );
}
