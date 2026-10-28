import { createSignal, Show } from "solid-js";
import {
  installing,
  pendingUpdate,
  setInstalling,
} from "../../lib/stores/updater.ts";
import * as updater from "../../lib/services/updater.ts";
import { errorMessage } from "../../lib/utils/error.ts";
import { t } from "../../lib/i18n/index.ts";

export default function UpdateBanner() {
  const [error, setError] = createSignal<string | null>(null);

  async function onInstall() {
    const update = pendingUpdate();
    if (!update || installing()) return;
    setError(null);
    setInstalling(true);
    try {
      await updater.install(update);
    } catch (e) {
      setError(errorMessage(e));
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
          data-tip={error() ?? undefined}
          class="shrink-0 w-full flex items-center gap-2.5 h-9 px-4 bg-accent-soft hover:bg-accent/20 border-b border-line-soft text-small text-left transition-colors duration-snap cursor-pointer disabled:cursor-default disabled:hover:bg-accent-soft"
        >
          <span class="size-2 rounded-full bg-accent shrink-0" />
          <span class="text-ink truncate">
            <Show when={!installing()} fallback={t("UPDATE_INSTALLING")}>
              <Show
                when={error()}
                fallback={
                  <span class="font-semibold">{t("UPDATE_READY")}</span>
                }
              >
                <span class="font-semibold text-negative">
                  {t("UPDATE_FAILED")}
                </span>
              </Show>
              <span class="text-ink-soft">
                {" "}
                {t("UPDATE_ACTION", {
                  version: u().version,
                  failed: error() ? "yes" : "no",
                })}
              </span>
            </Show>
          </span>
        </button>
      )}
    </Show>
  );
}
