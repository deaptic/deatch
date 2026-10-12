import { createSignal, type JSX, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";

const MARGIN = 8;

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
  captureFocusForRestore();
  const [pos, setPos] = createSignal({ x: props.x, y: props.y });
  const [maxWidth, setMaxWidth] = createSignal(window.innerWidth - MARGIN * 2);
  let ref: HTMLDivElement | undefined;

  onMount(() => {
    if (!ref) return;
    const r = ref.getBoundingClientRect();
    const end = props.align === "end";
    const maxW = end ? props.x - MARGIN : window.innerWidth - MARGIN * 2;
    const width = Math.min(r.width, maxW);
    const left = end
      ? props.x - width
      : props.align === "center"
      ? props.x - width / 2
      : props.x;
    setMaxWidth(maxW);
    setPos({
      x: Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN)),
      y: Math.max(
        MARGIN,
        Math.min(props.y, window.innerHeight - r.height - MARGIN),
      ),
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
        ref={ref}
        style={{
          "--x": `${pos().x}px`,
          "--y": `${pos().y}px`,
          "--max-h": `${window.innerHeight - MARGIN * 2}px`,
          "--max-w": `${maxWidth()}px`,
        }}
        class="fixed left-(--x) top-(--y) max-h-(--max-h) max-w-(--max-w) z-50 flex flex-col bg-overlay border border-line rounded-md overflow-hidden transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {props.children}
      </div>
    </Portal>
  );
}
