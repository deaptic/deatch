import { createResource, createSignal, For, Show } from "solid-js";
import Field from "../../kit/Field.tsx";
import { createDebounced } from "../../shared/solid/createDebounced.ts";
import * as triggers from "./store.ts";
import type { Trigger } from "../preferences/index.ts";
import { t } from "../../shared/i18n/index.ts";
import Text from "../../kit/Text.tsx";

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
            : t("SETTINGS_TRIGGERS_TRY_DISABLED_PLACEHOLDER")
        }
        value={text()}
        onInput={(e) => setText(e.currentTarget.value)}
      />
      <Show when={settled().trim() && response.latest !== undefined}>
        <Show
          when={response.latest}
          fallback={
            <Text as="p" size="sm" tone="soft">
              {t("SETTINGS_TRIGGERS_TRY_NO_MATCH_HINT")}
            </Text>
          }
        >
          {(preview) => (
            <div class="flex flex-col gap-2 enter-pop">
              <Show
                when={preview().text}
                fallback={
                  <Text as="p" size="sm" tone="soft">
                    {t("SETTINGS_TRIGGERS_TRY_SILENT_HINT")}
                  </Text>
                }
              >
                <p class="px-3 py-2 rounded-sm bg-raised text-base text-ink break-words">
                  {preview().text}
                </p>
              </Show>
              <For each={preview().filled}>
                {([syntax, value]) => (
                  <p class="flex gap-2 text-sm min-w-0">
                    <Text bold tone="soft">
                      {syntax}
                    </Text>
                    <span class={value ? "text-ink truncate" : "text-ink-soft"}>
                      {value || t("SETTINGS_TRIGGERS_TRY_EMPTY_VALUE")}
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
