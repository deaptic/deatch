import { createSignal, For, Show } from "solid-js";
import { nearestStep, type Steps } from "../shared/accessibility.ts";

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
  const isEnd = (i: number) => i === 0 || i === props.steps.length - 1;
  const labelled = (i: number) =>
    i === index() || (isEnd(i) && Math.abs(i - index()) > 1);
  const stopAt = (el: HTMLInputElement) =>
    props.steps[Number(el.value)] ?? current();

  return (
    <div
      class={`w-full flex flex-col gap-1.5 px-3 ${
        props.disabled ? "opacity-40" : ""
      }`}
    >
      <div
        aria-hidden
        class="flex justify-between items-center h-4 px-2 text-xs tabular-nums"
      >
        <For each={props.steps}>
          {(stop, i) => (
            <span class="w-0 flex justify-center whitespace-nowrap">
              <Show
                when={labelled(i())}
                fallback={<span class="size-1 rounded-full bg-line" />}
              >
                <span
                  class={
                    i() === index()
                      ? "text-accent-ink font-semibold"
                      : "text-ink-soft"
                  }
                >
                  {props.format(stop)}
                </span>
              </Show>
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
