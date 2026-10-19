import { For, type JSX } from "solid-js";

type Option<T> = { value: T; label: string; icon?: JSX.Element };

type Props<T extends string> = {
  value?: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  fill?: boolean;
};

export default function Segmented<T extends string>(props: Props<T>) {
  return (
    <div
      role="radiogroup"
      class={`gap-0.5 p-0.75 bg-canvas border border-line rounded-sm ${
        props.fill ? "flex w-full" : "inline-flex"
      }`}
    >
      <For each={props.options}>
        {(o) => (
          <button
            type="button"
            role="radio"
            aria-checked={props.value === o.value}
            aria-label={o.icon ? o.label : undefined}
            data-tip={o.icon ? o.label : undefined}
            onClick={() => props.onChange(o.value)}
            class={`h-7 px-3 rounded-xs text-small font-semibold cursor-pointer grid place-items-center transition-colors duration-snap [&>svg]:size-4 ${
              props.fill ? "flex-1" : ""
            } ${
              props.value === o.value
                ? "bg-overlay text-ink"
                : "text-ink-soft hover:text-ink hover:bg-raised"
            }`}
          >
            {o.icon ?? o.label}
          </button>
        )}
      </For>
    </div>
  );
}
