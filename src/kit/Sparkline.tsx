import { createMemo, Show } from "solid-js";
import {
  nearestIndex,
  SPARK_HEIGHT,
  SPARK_WIDTH,
  sparkPoints,
} from "./sparkGeometry.ts";

type Props = {
  values: number[];
  label: string;
  hovered: number | null;
  onHover: (index: number | null) => void;
};

export default function Sparkline(props: Props) {
  const points = createMemo(() => sparkPoints(props.values));
  const line = () =>
    points()
      .map((p) => `${p.x},${p.y}`)
      .join(" ");
  const latest = () => points().at(-1);
  const marked = () => {
    const i = props.hovered;
    return i === null ? undefined : points()[i];
  };

  function track(e: PointerEvent) {
    const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    props.onHover(
      nearestIndex(props.values.length, (e.clientX - box.left) / box.width),
    );
  }

  return (
    <svg
      role="img"
      aria-label={props.label}
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      class="block w-full h-10 overflow-visible"
      onPointerMove={track}
      onPointerLeave={() => props.onHover(null)}
    >
      <Show when={marked()}>
        {(point) => (
          <line
            x1={point().x}
            x2={point().x}
            y1={0}
            y2={SPARK_HEIGHT}
            class="stroke-line"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
        )}
      </Show>
      <polyline
        points={line()}
        fill="none"
        class="stroke-ink-faint"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
      />
      <Show when={marked() ?? latest()}>
        {(point) => (
          <path
            d={`M ${point().x} ${point().y} Z`}
            class="stroke-accent"
            stroke-width="8"
            stroke-linecap="round"
            vector-effect="non-scaling-stroke"
          />
        )}
      </Show>
    </svg>
  );
}
