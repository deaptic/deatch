import {
  createEffect,
  createSignal,
  For,
  type JSX,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { Check, ChevronDown, X } from "lucide-solid";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import Field from "./Field.tsx";

type Props = {
  value: string;
  options: string[];
  search: (query: string) => string[];
  label: (value: string) => string;
  placeholder: string;
  ariaLabel: string;
  icon?: JSX.Element;
  onChange: (value: string) => void;
};

export default function Combobox(props: Props) {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal("");
  const [typed, setTyped] = createSignal(false);
  const [active, setActive] = createSignal(0);
  let input: HTMLInputElement | undefined;
  let list: HTMLDivElement | undefined;

  const text = () => (props.value ? props.label(props.value) : "");
  const shown = () =>
    typed() && query().trim() ? props.search(query()) : props.options;

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

  function pick(value: string) {
    props.onChange(value);
    hide();
  }

  function move(step: number) {
    const count = shown().length;
    if (count === 0) return;
    setActive((i) => (i + step + count) % count);
  }

  createEffect(on(active, () => {
    list?.children[active()]?.scrollIntoView({ block: "nearest" });
  }));

  createEffect(() => {
    if (open()) onCleanup(shortcuts.registerLocal("escape", hide));
  });

  return (
    <div class="relative">
      <Field
        ref={input}
        size="sm"
        icon={props.icon}
        role="combobox"
        aria-label={props.ariaLabel}
        aria-expanded={open()}
        placeholder={props.placeholder}
        value={open() ? query() : text()}
        trailing={
          <Show
            when={props.value && !open()}
            fallback={<ChevronDown class="size-4 shrink-0 text-ink-soft" />}
          >
            <button
              type="button"
              aria-label={`Clear ${props.ariaLabel.toLowerCase()}`}
              class="shrink-0 grid place-items-center text-ink-soft hover:text-ink cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => props.onChange("")}
            >
              <X class="size-4" />
            </button>
          </Show>
        }
        onFocus={show}
        onClick={show}
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
          ref={list}
          role="listbox"
          class="absolute right-0 top-full mt-1 z-30 w-full min-w-55 max-h-80 overflow-y-auto p-1.5 flex flex-col bg-overlay border border-line rounded-md transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
        >
          <For
            each={shown()}
            fallback={
              <p class="px-2.5 py-2 text-small text-ink-faint">No matches</p>
            }
          >
            {(value, i) => (
              <div
                role="option"
                aria-selected={value === props.value}
                class={`h-control-md shrink-0 flex items-center gap-2.5 px-2.5 rounded-sm text-body text-ink cursor-pointer ${
                  i() === active() ? "bg-raised" : ""
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i())}
                onClick={() => pick(value)}
              >
                <span class="w-4 shrink-0 grid place-items-center text-ink-soft">
                  <Show when={value === props.value}>
                    <Check class="size-4" />
                  </Show>
                </span>
                <span class="truncate">{props.label(value)}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
