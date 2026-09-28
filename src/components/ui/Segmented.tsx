import { For } from "solid-js";

type Props<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export default function Segmented<T extends string>(props: Props<T>) {
  return (
    <div
      role="radiogroup"
      class="inline-flex gap-0.5 p-0.75 bg-canvas border border-line rounded-sm"
    >
      <For each={props.options}>
        {(o) => (
          <button
            type="button"
            role="radio"
            aria-checked={props.value === o.value}
            onClick={() => props.onChange(o.value)}
            class={`h-7 px-3 rounded-xs text-small font-semibold cursor-pointer transition-colors duration-snap ${
              props.value === o.value
                ? "bg-raised text-ink [[data-theme=light]_&]:bg-surface"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        )}
      </For>
    </div>
  );
}
