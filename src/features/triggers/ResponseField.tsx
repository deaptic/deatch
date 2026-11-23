import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";
import Field from "../../kit/Field.tsx";
import Suggestions, { type SuggestionsApi } from "../../kit/Suggestions.tsx";
import { fieldFrom } from "../../shared/solid/createListbox.ts";
import { methodQueryAt } from "./template.ts";
import {
  METHODS,
  methodSyntax,
  templateProblems,
  type TriggerMethod,
} from "./methods.ts";
import { t } from "../../shared/i18n/index.ts";

export type Insert = (method: TriggerMethod) => void;

export type Targeting = {
  onActivate: (insert: Insert) => void;
  onRelease: (insert: Insert) => void;
};

type Props = Targeting & {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

const inserted = (method: TriggerMethod) =>
  method.arg === "required" ? methodSyntax(method) : `{${method.name}}`;

export default function ResponseField(props: Props) {
  let input: HTMLInputElement | undefined;
  const [caret, setCaret] = createSignal(0);
  const [dismissed, setDismissed] = createSignal(false);
  const [api, setApi] = createSignal<SuggestionsApi>();
  const listField = fieldFrom(() => api()?.field);

  const query = () =>
    dismissed() ? null : methodQueryAt(props.value, caret());
  const matching = createMemo(() => {
    const q = query();
    return q ? METHODS.filter((m) => m.name.startsWith(q.query)) : [];
  });
  const found = createMemo(() => templateProblems(props.value));

  function track(el: HTMLInputElement) {
    setCaret(el.selectionStart ?? el.value.length);
  }

  function replace(start: number, end: number, text: string) {
    const next = props.value.slice(0, start) + text + props.value.slice(end);
    const at = start + text.length;
    props.onChange(next);
    setCaret(at);
    queueMicrotask(() => {
      input?.focus();
      input?.setSelectionRange(at, at);
    });
  }

  function pick(method: TriggerMethod) {
    const q = query();
    if (q) replace(q.start, caret(), inserted(method));
  }

  const insertAtCaret: Insert = (method) => {
    setDismissed(true);
    replace(caret(), caret(), inserted(method));
  };
  onCleanup(() => props.onRelease(insertAtCaret));

  return (
    <div class="flex-1 min-w-0 flex flex-col gap-2">
      <div class="relative">
        <Show when={matching().length > 0}>
          <Suggestions
            suggestions={matching}
            onSelect={pick}
            onDismiss={() => setDismissed(true)}
            ref={setApi}
            renderItem={(m) => (
              <span class="flex items-baseline gap-2 min-w-0">
                <span class="font-semibold text-ink">{methodSyntax(m)}</span>
                <span class="truncate text-small text-ink-soft">
                  {t(m.description)}
                </span>
              </span>
            )}
          />
        </Show>
        <Field
          ref={input}
          class="w-full"
          placeholder={props.placeholder}
          value={props.value}
          {...listField}
          onInput={(e) => {
            setDismissed(false);
            props.onChange(e.currentTarget.value);
            track(e.currentTarget);
          }}
          onKeyDown={(e) => {
            if (matching().length > 0) api()?.handleKey(e);
          }}
          onKeyUp={(e) => track(e.currentTarget)}
          onClick={(e) => track(e.currentTarget)}
          onFocus={() => props.onActivate(insertAtCaret)}
          onBlur={() => setDismissed(true)}
        />
      </div>
      <For each={found()}>
        {(problem) => (
          <p class="text-small text-negative">
            {t("SETTINGS_TRIGGERS_PROBLEM_ERROR", {
              kind: problem.kind,
              raw: problem.raw,
            })}
          </p>
        )}
      </For>
    </div>
  );
}
