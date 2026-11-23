import { createSignal, For } from "solid-js";
import { nearestStep, type Steps } from "../lib/constants/accessibility.ts";

type Props = {
  label: string;
  value: number;
  steps: Steps;
  format: (value: number) => string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export default function StepSlider(props: Props) {
  const [dragging, setDragging] = createSignal<number | null>(null);
  const current = () => dragging() ?? nearestStep(props.value, props.steps);
  const index = () => props.steps.indexOf(current());
  const stopAt = (el: HTMLInputElement) =>
    props.steps[Number(el.value)] ?? current();

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
        <For each={props.steps}>
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
        max={props.steps.length - 1}
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
