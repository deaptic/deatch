import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside.ts";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";

const GAP = 8;

export type PanelSize = "picker" | "menu";

const SIZES: Record<PanelSize, string> = {
  picker: "w-100 h-110",
  menu: "w-72 p-1.5",
};

type Props = {
  label: string;
  /** The composer box the panel floats above; it follows its height. */
  anchorEl?: HTMLElement | null;
  onClose: () => void;
  size: PanelSize;
  ref?: (el: HTMLDivElement) => void;
  children: JSX.Element;
};

/// A panel opened from the composer's buttons, pinned to the right just
/// above the composer, closing on a click outside.
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
        class={`fixed right-4 bottom-(--bottom) z-40 max-w-full bg-overlay border border-line rounded-lg flex flex-col overflow-hidden transition duration-quick ease-out starting:opacity-0 starting:translate-y-1 ${
          SIZES[props.size]
        }`}
        style={{ "--bottom": `${bottom()}px` }}
      >
        {props.children}
      </div>
    </Portal>
  );
}
