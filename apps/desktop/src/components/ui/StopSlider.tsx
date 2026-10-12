import { createSignal, For } from "solid-js";
import { nearestStop } from "../../lib/constants/accessibility.ts";

type Props = {
  label: string;
  value: number;
  stops: readonly number[];
  format: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function StopSlider(props: Props) {
  const [dragging, setDragging] = createSignal<number | null>(null);
  const current = () => dragging() ?? nearestStop(props.value, props.stops);
  const index = () => props.stops.indexOf(current());
  const stopAt = (el: HTMLInputElement) => props.stops[Number(el.value)];

  return (
    <div
      class={`w-full flex flex-col gap-1.5 ${
        props.disabled ? "opacity-40" : ""
      }`}
    >
      <div
        aria-hidden
        class="flex justify-between px-2 text-micro tabular-nums"
      >
        <For each={props.stops}>
          {(stop) => (
            <span
              class={`w-0 flex justify-center whitespace-nowrap ${
                stop === current()
                  ? "text-accent-ink font-semibold"
                  : "text-ink-soft"
              }`}
            >
              {props.format(stop)}
            </span>
          )}
        </For>
      </div>
      <input
        type="range"
        aria-label={props.label}
        aria-valuetext={props.format(current())}
        min={0}
        max={props.stops.length - 1}
        step={1}
        value={index()}
        disabled={props.disabled}
        onInput={(e) => setDragging(stopAt(e.currentTarget))}
        onChange={(e) => {
          const stop = stopAt(e.currentTarget);
          setDragging(null);
          props.onChange(stop);
        }}
        class="w-full accent-accent cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
}
