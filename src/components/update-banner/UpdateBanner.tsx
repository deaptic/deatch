import { Show } from "solid-js";
import {
  installError,
  installing,
  pendingUpdate,
} from "../../lib/stores/updater.ts";
import * as updater from "../../lib/services/updater.ts";
import { t } from "../../lib/i18n/index.ts";

export default function UpdateBanner() {
  return (
    <Show when={pendingUpdate()}>
      {(u) => (
        <button
          type="button"
          onClick={() => void updater.install()}
          disabled={installing()}
          data-tip={installError() ?? undefined}
          class="shrink-0 w-full flex items-center gap-2.5 h-9 px-4 bg-accent-soft hover:bg-accent/20 text-small text-left transition-colors duration-snap cursor-pointer disabled:cursor-default disabled:hover:bg-accent-soft"
        >
          <span class="relative size-2 rounded-full bg-accent shrink-0">
            <span
              aria-hidden
              class="absolute inset-0 rounded-full bg-accent animate-breathe"
            />
          </span>
          <span class="text-ink truncate">
            <Show when={!installing()} fallback={t("UPDATE_INSTALLING")}>
              <Show
                when={installError()}
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
                  failed: installError() ? "yes" : "no",
                })}
              </span>
            </Show>
          </span>
        </button>
      )}
    </Show>
  );
}
