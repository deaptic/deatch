import { createEffect, createSignal, type JSX } from "solid-js";
import { Portal } from "solid-js/web";

/// Kept this far inside the window edges.
const MARGIN = 8;

/// Beside an element (centred on `y`, its middle, within the window), or over
/// it: above the element when the tip fits between `above` and the title bar,
/// else below it at `below`.
export type TooltipPlace =
  | { side: "right"; x: number; y: number }
  | { side: "over"; x: number; above: number; below: number };

type Props = TooltipPlace & { children: JSX.Element };

/// Everything stays under the title bar, so the window chrome stays clear.
const titleBarBottom = () =>
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--spacing-titlebar",
    ),
  ) || 0;

export default function Tooltip(props: Props) {
  const [pos, setPos] = createSignal<{ x: number; y: number } | null>(null);
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    if (!ref) return;
    const { offsetWidth: width, offsetHeight: height } = ref;
    const top = titleBarBottom() + MARGIN;
    const maxY = globalThis.innerHeight - height - MARGIN;
    if (props.side === "right") {
      const centred = props.y - height / 2;
      return setPos({ x: props.x, y: Math.max(top, Math.min(centred, maxY)) });
    }
    const maxX = globalThis.innerWidth - width - MARGIN;
    setPos({
      x: Math.max(MARGIN, Math.min(props.x - width / 2, maxX)),
      y: props.above - height >= top ? props.above - height : props.below,
    });
  });

  return (
    <Portal>
      <div
        ref={ref}
        role="tooltip"
        style={{ "--x": `${pos()?.x ?? 0}px`, "--y": `${pos()?.y ?? 0}px` }}
        class={`pointer-events-none fixed left-(--x) top-(--y) z-50 w-max max-w-75 whitespace-pre-line rounded-sm border border-line bg-overlay px-2.5 py-2 text-small text-ink ${
          props.side === "over" ? "text-center" : ""
        } ${pos() ? "" : "invisible"}`}
      >
        {props.children}
      </div>
    </Portal>
  );
}
