import { type JSX, createSignal, onMount } from "solid-js";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside";

type Props = {
  x: number;
  y: number;
  onClose: () => void;
  children: JSX.Element;
};

export default function ContextMenu(props: Props) {
  const menuWidth = 176;
  const left = Math.min(props.x, window.innerWidth - menuWidth - 8);
  const [top, setTop] = createSignal(props.y);
  let menuRef: HTMLDivElement | undefined;

  onMount(() => {
    if (menuRef) {
      const rect = menuRef.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 8)
        setTop(window.innerHeight - rect.height - 8);
    }
  });

  dismissOnOutside({
    ref: () => menuRef,
    onDismiss: props.onClose,
    events: ["click", "contextmenu"],
  });

  return (
    <>
      <div
        ref={menuRef}
        class="fixed z-50 w-44 bg-bg-dark border border-border-muted rounded-lg shadow-2xl overflow-hidden"
        style={{ top: `${top()}px`, left: `${left}px` }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
      >
        {props.children}
      </div>
    </>
  );
}
