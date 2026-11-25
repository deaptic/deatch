import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../shared/solid/dismissOnOutside.ts";
import { captureFocusForRestore } from "../shared/solid/focus.ts";

const GAP = 8;

type PanelSize = "sm" | "lg";

const SIZES: Record<PanelSize, string> = {
  sm: "w-72 p-1.5",
  lg: "w-120 h-130",
};

type Side = "start" | "end";

const SIDES: Record<Side, string> = {
  start: "left-(--edge) origin-bottom-left",
  end: "right-(--edge) origin-bottom-right",
};

type Props = {
  label: string;
  side: Side;
  anchorEl?: HTMLElement | null;
  onClose: () => void;
  size: PanelSize;
  ref?: (el: HTMLDivElement) => void;
  children: JSX.Element;
};

export default function AnchoredPanel(props: Props) {
  captureFocusForRestore();
  const [bottom, setBottom] = createSignal(64);
  const [edge, setEdge] = createSignal(GAP);
  let panel: HTMLDivElement | undefined;

  dismissOnOutside({ ref: () => panel, onDismiss: props.onClose });

  onMount(() => {
    const anchor = props.anchorEl;
    if (!anchor) return;
    const update = () => {
      const r = anchor.getBoundingClientRect();
      setBottom(window.innerHeight - r.top + GAP);
      setEdge(props.side === "start" ? r.left : window.innerWidth - r.right);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    window.addEventListener("resize", update);
    onCleanup(() => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    });
  });

  return (
    <Portal>
      <div
        ref={(el) => {
          panel = el;
          props.ref?.(el);
        }}
        role="dialog"
        aria-label={props.label}
        class={`fixed bottom-(--bottom) z-40 max-w-full floating-md rounded-lg flex flex-col overflow-hidden enter-pop ${
          SIDES[props.side]
        } ${SIZES[props.size]}`}
        style={{ "--bottom": `${bottom()}px`, "--edge": `${edge()}px` }}
      >
        {props.children}
      </div>
    </Portal>
  );
}
