import { createEffect, createSignal, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

type Placement = "right" | "above" | "below";

const PLACEMENTS: Record<Placement, string> = {
  right: "-translate-y-1/2",
  above: "-translate-y-full text-center",
  below: "text-center",
};

/// Kept this far inside the window edges.
const MARGIN = 8;

type Props = {
  x: number;
  y: number;
  placement?: Placement;
  children: JSX.Element;
};

/// Above and below are centred on `x`, then measured and shifted to stay
/// inside the window; right starts at `x`.
export default function Tooltip(props: Props) {
  const placement = () => props.placement ?? "right";
  const [left, setLeft] = createSignal<number | null>(null);
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    if (!ref || placement() === "right") return setLeft(props.x);
    const width = ref.offsetWidth;
    const max = globalThis.innerWidth - width - MARGIN;
    setLeft(Math.max(MARGIN, Math.min(props.x - width / 2, max)));
  });

  return (
    <Portal>
      <div
        ref={ref}
        role="tooltip"
        style={{ "--x": `${left() ?? 0}px`, "--y": `${props.y}px` }}
        class={`pointer-events-none fixed left-(--x) top-(--y) z-50 ${
          PLACEMENTS[placement()]
        } ${
          left() === null ? "invisible" : ""
        } w-max max-w-75 whitespace-pre-line rounded-sm border border-line bg-overlay px-2.5 py-2 text-small text-ink`}
      >
        {props.children}
      </div>
    </Portal>
  );
}
