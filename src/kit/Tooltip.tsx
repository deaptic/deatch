import { createEffect, createSignal, type JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";

const MARGIN = 8;
const ARROW_INSET = 10;

export type TooltipPlace =
  | { side: "right"; x: number; y: number }
  | { side: "over"; x: number; above: number; below: number };

type Props = TooltipPlace & { instant?: boolean; children: JSX.Element };

type Points = "down" | "up" | "left";

const ARROW: Record<Points, { tip: string; arrow: string }> = {
  down: { tip: "origin-bottom", arrow: "top-full left-(--arrow) rotate-45" },
  up: { tip: "origin-top", arrow: "top-0 left-(--arrow) rotate-225" },
  left: { tip: "origin-left", arrow: "left-0 top-(--arrow) rotate-135" },
};

type Placed = { x: number; y: number; points: Points; arrow: number };

const along = (target: number, start: number, length: number) =>
  Math.max(ARROW_INSET, Math.min(target - start, length - ARROW_INSET));

const safeTop = () =>
  parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--spacing-safe-top",
    ),
  ) || 0;

export default function Tooltip(props: Props) {
  const [pos, setPos] = createSignal<Placed | null>(null);
  let ref: HTMLDivElement | undefined;

  createEffect(() => {
    if (!ref) return;
    const { offsetWidth: width, offsetHeight: height } = ref;
    const top = safeTop() + MARGIN;
    const maxY = globalThis.innerHeight - height - MARGIN;
    if (props.side === "right") {
      const y = Math.max(top, Math.min(props.y - height / 2, maxY));
      return setPos({
        x: props.x,
        y,
        points: "left",
        arrow: along(props.y, y, height),
      });
    }
    const maxX = globalThis.innerWidth - width - MARGIN;
    const fitsAbove = props.above - height >= top;
    const x = Math.max(MARGIN, Math.min(props.x - width / 2, maxX));
    setPos({
      x,
      y: fitsAbove ? props.above - height : props.below,
      points: fitsAbove ? "down" : "up",
      arrow: along(props.x, x, width),
    });
  });

  return (
    <Portal>
      <div
        ref={ref}
        role="tooltip"
        style={{
          "--x": `${pos()?.x ?? 0}px`,
          "--y": `${pos()?.y ?? 0}px`,
          "--arrow": `${pos()?.arrow ?? 0}px`,
        }}
        class={`pointer-events-none fixed left-(--x) top-(--y) z-50 w-max max-w-75 whitespace-pre-line rounded-sm material-thin px-2.5 py-2 text-sm text-ink ${
          props.side === "over" ? "text-center" : ""
        } ${props.instant ? "" : "enter-pop"} ${
          pos() ? ARROW[pos()?.points ?? "down"].tip : "invisible"
        }`}
      >
        <Show when={pos()}>
          {(p) => (
            <span
              aria-hidden
              class={`tooltip-arrow ${ARROW[p().points].arrow}`}
            />
          )}
        </Show>
        {props.children}
      </div>
    </Portal>
  );
}
