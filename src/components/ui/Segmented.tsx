import { For, type JSX } from "solid-js";
import { wrapIndex } from "../../lib/reactive/createListNavigation.ts";

const STEPS: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

type Option<T> = { value: T; label: string; icon?: JSX.Element };

type SegmentedSize = "md" | "lg";

const OPTION_HEIGHT: Record<SegmentedSize, string> = {
  md: "h-7",
  lg: "h-control-sm",
};

type Props<T extends string> = {
  label: string;
  size?: SegmentedSize;
  value?: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  fill?: boolean;
};

export default function Segmented<T extends string>(props: Props<T>) {
  const selected = () =>
    Math.max(
      0,
      props.options.findIndex((o) => o.value === props.value),
    );

  function step(e: KeyboardEvent & { currentTarget: HTMLElement }) {
    const direction = STEPS[e.key];
    if (direction === undefined) return;
    e.preventDefault();
    const next = wrapIndex(selected(), direction, props.options.length);
    const option = props.options[next];
    if (!option) return;
    props.onChange(option.value);
    e.currentTarget
      .querySelectorAll<HTMLElement>("[role=radio]")
      [next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={props.label}
      onKeyDown={step}
      class={`gap-0.5 p-0.75 bg-canvas border border-line rounded-sm ${
        props.fill ? "flex w-full" : "inline-flex"
      }`}
    >
      <For each={props.options}>
        {(o, i) => (
          <button
            type="button"
            role="radio"
            aria-checked={props.value === o.value}
            tabIndex={i() === selected() ? 0 : -1}
            aria-label={o.icon ? o.label : undefined}
            data-tip={o.icon ? o.label : undefined}
            onClick={() => props.onChange(o.value)}
            class={`${OPTION_HEIGHT[props.size ?? "md"]} px-3 rounded-xs text-small font-semibold cursor-pointer grid place-items-center transition-colors duration-snap [&>svg]:size-4 ${
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
