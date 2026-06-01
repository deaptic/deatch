import { type JSX } from "solid-js";
import { Portal } from "solid-js/web";
import { dismissOnOutside } from "../../lib/primitives/dismissOnOutside";
import { captureFocusForRestore } from "../../lib/utils/focus";

interface Props {
  title: string;
  onClose: () => void;
  ignoreSelector: string;
  sizeClass: string;
  headerActions?: JSX.Element;
  children: JSX.Element;
}

export default function Panel(props: Props) {
  captureFocusForRestore();
  let panelRef: HTMLDivElement | undefined;

  dismissOnOutside({
    ref: () => panelRef,
    onDismiss: props.onClose,
    ignoreSelector: props.ignoreSelector,
  });

  return (
    <Portal>
      <div
        ref={panelRef}
        class={`fixed top-12 right-2 z-40 ${props.sizeClass} bg-bg-dark border border-border-muted rounded-lg shadow-2xl flex flex-col overflow-hidden transition-[opacity,transform] duration-150 ease-out starting:opacity-0 starting:scale-95`}
      >
        <div class="flex items-center px-4 h-11 border-b border-border-muted shrink-0">
          <span class="text-text text-sm font-semibold flex-1">{props.title}</span>
          {props.headerActions}
        </div>
        {props.children}
      </div>
    </Portal>
  );
}
