import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../shared/solid/dismissOnOutside.ts";
import * as shortcuts from "../shared/keyboard/shortcuts.ts";
import { captureFocusForRestore } from "../shared/solid/focus.ts";
import { trapFocus } from "../shared/solid/trapFocus.ts";
import { createExitTarget, ExitScope } from "./Transition.tsx";

const MARGIN = 8;

const ORIGIN = {
  start: "origin-top-left",
  center: "origin-top",
  end: "origin-top-right",
};
export const OVERLAY_GAP = 4;
export const SIDE_GAP = 8;

type Props = {
  x: number;
  y: number;
  align?: "start" | "center" | "end";
  opener?: () => HTMLElement | undefined;
  onClose: () => void;
  children: JSX.Element;
  events?: string[];
};

export default function Popover(props: Props) {
  const restoreFocus = captureFocusForRestore();
  const exitTarget = createExitTarget(restoreFocus);
  const [pos, setPos] = createSignal({ x: props.x, y: props.y });
  const [maxWidth, setMaxWidth] = createSignal(window.innerWidth - MARGIN * 2);
  const [maxHeight, setMaxHeight] = createSignal(
    window.innerHeight - MARGIN * 2,
  );
  let ref: HTMLDivElement | undefined;
  const setRef = (el: HTMLDivElement) => {
    ref = el;
    exitTarget(el);
  };
  trapFocus(() => ref);

  function placeInsideWindow(el: HTMLDivElement) {
    const end = props.align === "end";
    const maxW = end ? props.x - MARGIN : window.innerWidth - MARGIN * 2;
    const width = Math.min(el.offsetWidth, maxW);
    const left = end
      ? props.x - width
      : props.align === "center"
        ? props.x - width / 2
        : props.x;
    setMaxWidth(maxW);
    setMaxHeight(window.innerHeight - MARGIN * 2);
    setPos({
      x: Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN)),
      y: Math.max(
        MARGIN,
        Math.min(props.y, window.innerHeight - el.offsetHeight - MARGIN),
      ),
    });
  }

  onMount(() => {
    const el = ref;
    if (!el) return;
    const place = () => placeInsideWindow(el);
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    window.addEventListener("resize", place);
    onCleanup(() => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    });
  });

  dismissOnOutside({
    ref: () => ref,
    opener: props.opener,
    onDismiss: props.onClose,
    events: props.events,
  });

  onCleanup(shortcuts.registerLocal("escape", () => props.onClose()));

  return (
    <Portal>
      <div
        ref={setRef}
        tabIndex={-1}
        style={{
          "--x": `${pos().x}px`,
          "--y": `${pos().y}px`,
          "--max-h": `${maxHeight()}px`,
          "--max-w": `${maxWidth()}px`,
        }}
        class={`fixed left-(--x) top-(--y) max-h-(--max-h) max-w-(--max-w) z-50 flex flex-col outline-none floating-md rounded-md overflow-hidden enter-pop ${ORIGIN[props.align ?? "start"]}`}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        <ExitScope>{props.children}</ExitScope>
      </div>
    </Portal>
  );
}
