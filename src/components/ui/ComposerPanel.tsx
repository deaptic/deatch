import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../../lib/reactive/dismissOnOutside.ts";
import { captureFocusForRestore } from "../../lib/reactive/focus.ts";

const GAP = 8;

type PanelSize = "picker" | "menu";

const SIZES: Record<PanelSize, string> = {
  picker: "w-100 h-110",
  menu: "w-72 p-1.5",
};

type Props = {
  label: string;
  anchorEl?: HTMLElement | null;
  onClose: () => void;
  size: PanelSize;
  ref?: (el: HTMLDivElement) => void;
  children: JSX.Element;
};

export default function ComposerPanel(props: Props) {
  captureFocusForRestore();
  const [bottom, setBottom] = createSignal(64);
  let panel: HTMLDivElement | undefined;

  dismissOnOutside({ ref: () => panel, onDismiss: props.onClose });

  onMount(() => {
    const anchor = props.anchorEl;
    if (!anchor) return;
    const update = () =>
      setBottom(window.innerHeight - anchor.getBoundingClientRect().top + GAP);
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
        class={`fixed right-4 bottom-(--bottom) z-40 max-w-full material-regular rounded-lg flex flex-col overflow-hidden enter-pop origin-bottom-right ${
          SIZES[props.size]
        }`}
        style={{ "--bottom": `${bottom()}px` }}
      >
        {props.children}
      </div>
    </Portal>
  );
}
