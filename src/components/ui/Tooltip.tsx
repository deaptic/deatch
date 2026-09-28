import type { JSX } from "solid-js";
import { Portal } from "solid-js/web";

type Props = {
  x: number;
  y: number;
  children: JSX.Element;
};

export default function Tooltip(props: Props) {
  return (
    <Portal>
      <div
        role="tooltip"
        style={{ "--x": `${props.x}px`, "--y": `${props.y}px` }}
        class="pointer-events-none fixed left-(--x) top-(--y) z-50 -translate-y-1/2 w-max max-w-75 rounded-sm border border-line bg-overlay px-2.5 py-2 text-small text-ink"
      >
        {props.children}
      </div>
    </Portal>
  );
}
