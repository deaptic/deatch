import { type JSX, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { captureFocusForRestore } from "../../lib/reactive/focus.ts";
import { trapFocus } from "../../lib/reactive/trapFocus.ts";
import * as shortcuts from "../../lib/services/shortcuts.ts";

/// A dialog centres a short exchange; a palette drops from the top for
/// search-as-you-type.
type ModalLook = "dialog" | "palette";

const SCRIM: Record<ModalLook, string> = {
  dialog: "items-center p-4",
  palette: "items-start px-4 pt-40",
};

const PANEL: Record<ModalLook, string> = {
  dialog: "w-110 bg-surface p-6 gap-4",
  palette: "w-140 max-h-3/5 bg-overlay p-2.5",
};

type Props = {
  look: ModalLook;
  label: string;
  onClose: () => void;
  children: JSX.Element;
};

/// Escape or a click on the scrim closes it; focus returns where it was.
export default function Modal(props: Props) {
  captureFocusForRestore();
  let panel: HTMLDivElement | undefined;
  trapFocus(() => panel);
  onCleanup(shortcuts.registerLocal("escape", () => props.onClose()));
  return (
    <Portal>
      <div
        class={`fixed inset-0 z-50 flex justify-center bg-scrim ${SCRIM[props.look]}`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) props.onClose();
        }}
      >
        <div
          ref={panel}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={props.label}
          class={`max-w-full flex flex-col border border-line rounded-lg transition duration-quick ease-out starting:opacity-0 starting:translate-y-1 ${PANEL[props.look]}`}
        >
          {props.children}
        </div>
      </div>
    </Portal>
  );
}
