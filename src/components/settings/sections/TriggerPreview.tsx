import { createResource, createSignal, For, Show } from "solid-js";
import Field from "../../ui/Field.tsx";
import { createDebounced } from "../../../lib/reactive/createDebounced.ts";
import * as triggers from "../../../lib/services/triggers.ts";
import type { Trigger } from "../../../lib/stores/preferences.ts";
import { t } from "../../../lib/i18n/index.ts";

const SETTLE_MS = 300;

export default function TriggerPreview(props: { trigger: Trigger }) {
  const [text, setText] = createSignal("");
  const settled = createDebounced(text, SETTLE_MS);
  const example = () =>
    props.trigger.phrase.split("\n")[0]?.replaceAll("*", "").trim() ?? "";
  const [response] = createResource(
    () => {
      const message = settled().trim();
      return message ? { message, trigger: { ...props.trigger } } : false;
    },
    ({ message, trigger }) => triggers.preview(trigger, message),
  );

  return (
    <div class="flex flex-col gap-2">
      <Field
        class="w-full"
        placeholder={
          example()
            ? t("SETTINGS_TRIGGERS_TRY_PLACEHOLDER", { example: example() })
            : t("SETTINGS_TRIGGERS_TRY_PLACEHOLDER_EMPTY")
        }
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
      />
      <Show when={settled().trim() && response.latest !== undefined}>
        <Show
          when={response.latest}
          fallback={
            <p class="text-small text-ink-soft">
              {t("SETTINGS_TRIGGERS_TRY_NO_MATCH")}
            </p>
          }
        >
          {(preview) => (
            <div class="flex flex-col gap-2 enter-pop">
              <Show
                when={preview().text}
                fallback={
                  <p class="text-small text-ink-soft">
                    {t("SETTINGS_TRIGGERS_TRY_SILENT")}
                  </p>
                }
              >
                <p class="px-3 py-2 rounded-sm bg-raised text-body text-ink break-words">
                  {preview().text}
                </p>
              </Show>
              <For each={preview().filled}>
                {([syntax, value]) => (
                  <p class="flex gap-2 text-small min-w-0">
                    <span class="font-semibold text-ink-soft">{syntax}</span>
                    <span class={value ? "text-ink truncate" : "text-ink-soft"}>
                      {value || t("SETTINGS_TRIGGERS_TRY_EMPTY")}
                    </span>
                  </p>
                )}
              </For>
            </div>
          )}
        </Show>
      </Show>
    </div>
  );
}
