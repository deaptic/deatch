import { For } from "solid-js";

type Props<T extends string> = {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
};

export default function Segmented<T extends string>(props: Props<T>) {
  return (
    <div class="flex rounded border border-border-muted overflow-hidden text-sm">
      <For each={props.options}>
        {(o) => (
          <button
            type="button"
            onClick={() => props.onChange(o.value)}
            class={`px-3 py-1 cursor-pointer transition-colors ${
              props.value === o.value
                ? "bg-primary text-text"
                : "bg-bg text-text-muted hover:text-text hover:bg-bg-light"
            }`}
          >
            {o.label}
          </button>
        )}
      </For>
    </div>
  );
}
