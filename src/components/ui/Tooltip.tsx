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
        style={{ left: `${props.x}px`, top: `${props.y}px` }}
        class="pointer-events-none fixed z-50 -translate-y-1/2 w-max max-w-xs rounded-lg border border-border-muted bg-bg-dark px-3 py-2 shadow-xl"
      >
        {props.children}
      </div>
    </Portal>
  );
}
