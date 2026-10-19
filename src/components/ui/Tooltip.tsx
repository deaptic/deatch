import type { JSX } from "solid-js";
import { Portal } from "solid-js/web";

type Placement = "right" | "above" | "below";

const PLACEMENTS: Record<Placement, string> = {
  right: "-translate-y-1/2",
  above: "-translate-x-1/2 -translate-y-full text-center",
  below: "-translate-x-1/2 text-center",
};

type Props = {
  x: number;
  y: number;
  placement?: Placement;
  children: JSX.Element;
};

export default function Tooltip(props: Props) {
  return (
    <Portal>
      <div
        role="tooltip"
        style={{ "--x": `${props.x}px`, "--y": `${props.y}px` }}
        class={`pointer-events-none fixed left-(--x) top-(--y) z-50 ${
          PLACEMENTS[props.placement ?? "right"]
        } w-max max-w-75 whitespace-pre-line rounded-sm border border-line bg-overlay px-2.5 py-2 text-small text-ink`}
      >
        {props.children}
      </div>
    </Portal>
  );
}
