import {
  createEffect,
  createSignal,
  For,
  type JSX,
  onCleanup,
  Show,
} from "solid-js";
import { Check, ChevronDown, X } from "lucide-solid";
import * as shortcuts from "../shared/keyboard/shortcuts.ts";
import { createListbox } from "../shared/solid/createListbox.ts";
import Field from "./Field.tsx";
import { t } from "../shared/i18n/index.ts";
import OptionRow from "./OptionRow.tsx";

type Props = {
  value: string;
  options: string[];
  search: (query: string) => string[];
  label: (value: string) => string;
  placeholder: string;
  ariaLabel: string;
  icon?: JSX.Element;
  required?: boolean;
  size?: "md" | "lg";
  onChange: (value: string) => void;
};

export default function Combobox(props: Props) {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [typed, setTyped] = createSignal(false);
  let input: HTMLInputElement | undefined;

  const text = () => (props.value ? props.label(props.value) : "");
  const shown = () =>
    typed() && query().trim() ? props.search(query()) : props.options;
  const { active, setActive, move, ...listbox } = createListbox({
    count: () => shown().length,
    open,
  });

  function show() {
    if (open()) return;
    setQuery(text());
    setTyped(false);
    setActive(Math.max(0, props.options.indexOf(props.value)));
    setOpen(true);
    queueMicrotask(() => input?.select());
  }

  function hide() {
    setOpen(false);
    setTyped(false);
  }

  function press(e: MouseEvent) {
    if ((e.target as Element).closest("[role=listbox], button")) return;
    e.preventDefault();
    input?.focus();
    if (open()) hide();
    else show();
  }

  function pick(value: string) {
    props.onChange(value);
    hide();
  }

  createEffect(() => {
    if (open()) onCleanup(shortcuts.registerLocal("escape", hide));
  });

  return (
    <div class="relative flex flex-col" onMouseDown={press}>
      <Field
        ref={input}
        size={props.size ?? "lg"}
        icon={props.icon}
        aria-label={props.ariaLabel}
        {...listbox.field}
        placeholder={props.placeholder}
        value={open() ? query() : text()}
        trailing={
          <Show
            when={props.value && !props.required && !open()}
            fallback={<ChevronDown class="size-4 shrink-0 text-ink-soft" />}
          >
            <button
              type="button"
              aria-label={t("UI_CLEAR_FIELD_LABEL", {
                field: props.ariaLabel.toLowerCase(),
              })}
              class="shrink-0 grid place-items-center text-ink-soft hover:text-ink cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => props.onChange("")}
            >
              <X class="size-4" />
            </button>
          </Show>
        }
        onBlur={hide}
        onInput={(e) => {
          show();
          setQuery(e.currentTarget.value);
          setTyped(true);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open()) return show();
            move(e.key === "ArrowDown" ? 1 : -1);
          } else if (e.key === "Enter" && open()) {
            const value = shown()[active()];
            if (value !== undefined) pick(value);
          }
        }}
      />
      <Show when={open()}>
        <div
          {...listbox.list}
          class="absolute right-0 top-full mt-1 z-30 w-full min-w-55 max-h-80 overflow-y-auto p-1.5 flex flex-col material-regular rounded-md enter-pop origin-top"
        >
          <For
            each={shown()}
            fallback={
              <p class="px-2.5 py-2 text-small text-ink-faint">
                {t("UI_COMBOBOX_EMPTY")}
              </p>
            }
          >
            {(value, i) => (
              <OptionRow
                {...listbox.option(i)}
                aria-selected={value === props.value}
                active={i() === active()}
                onMouseEnter={() => setActive(i())}
                onClick={() => pick(value)}
              >
                <span class="w-4 shrink-0 grid place-items-center text-ink-soft">
                  <Show when={value === props.value}>
                    <Check class="size-4" />
                  </Show>
                </span>
                <span class="truncate">{props.label(value)}</span>
              </OptionRow>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
