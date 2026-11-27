import { createMemo, For, Show } from "solid-js";
import { DONUT_CIRCUMFERENCE, donutSegments } from "./donutGeometry.ts";

export type DonutTone = "chart-1" | "chart-2" | "chart-3" | "chart-4" | "other";

const TONES: Record<DonutTone, string> = {
  "chart-1": "stroke-chart-1",
  "chart-2": "stroke-chart-2",
  "chart-3": "stroke-chart-3",
  "chart-4": "stroke-chart-4",
  other: "stroke-ink-faint",
};

const SIZE = 42;
const RADIUS = DONUT_CIRCUMFERENCE / (2 * Math.PI);
const TOP = DONUT_CIRCUMFERENCE / 4;

type Props = {
  slices: { value: number; tone: DonutTone }[];
  label: string;
  hovered: number | null;
  onHover: (index: number | null) => void;
};

export default function Donut(props: Props) {
  const segments = createMemo(() =>
    donutSegments(props.slices.map((slice) => slice.value)),
  );
  return (
    <svg
      role="img"
      aria-label={props.label}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      class="block size-12 shrink-0"
      onPointerLeave={() => props.onHover(null)}
    >
      <Show when={segments().length === 0}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          class="stroke-raised"
          stroke-width={6}
        />
      </Show>
      <For each={segments()}>
        {(segment, i) => (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            class={TONES[props.slices[i()]?.tone ?? "other"]}
            stroke-width={props.hovered === i() ? 8 : 6}
            stroke-dasharray={`${segment.length} ${DONUT_CIRCUMFERENCE - segment.length}`}
            stroke-dashoffset={TOP - segment.offset}
            onPointerEnter={() => props.onHover(i())}
          />
        )}
      </For>
    </svg>
  );
}
