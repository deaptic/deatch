import { type JSX, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { captureFocusForRestore } from "../shared/solid/focus.ts";
import { trapFocus } from "../shared/solid/trapFocus.ts";
import * as shortcuts from "../lib/services/shortcuts.ts";
import { createExitTarget, ExitScope } from "./Transition.tsx";

type ModalLook = "dialog" | "palette";

const SCRIM: Record<ModalLook, string> = {
  dialog: "items-center p-4",
  palette: "items-start px-4 pt-40",
};

const PANEL: Record<ModalLook, string> = {
  dialog: "w-110 bg-surface elevation-3 p-6 gap-4",
  palette: "w-140 max-h-3/5 material-thick p-2.5",
};

type Props = {
  look: ModalLook;
  label: string;
  onClose: () => void;
  children: JSX.Element;
};

export default function Modal(props: Props) {
  const restoreFocus = captureFocusForRestore();
  const exitTarget = createExitTarget(restoreFocus);
  let panel: HTMLDivElement | undefined;
  trapFocus(() => panel);
  onCleanup(shortcuts.registerLocal("escape", () => props.onClose()));
  return (
    <Portal>
      <div
        ref={exitTarget}
        class={`fixed inset-x-0 bottom-0 top-titlebar z-50 flex justify-center bg-scrim transition-opacity duration-quick ease-out starting:opacity-0 data-closing:opacity-0 data-closing:duration-snap data-closing:pointer-events-none ${SCRIM[props.look]}`}
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
          class={`max-w-full flex flex-col outline-none rounded-lg enter-pop ${PANEL[props.look]}`}
        >
          <ExitScope>{props.children}</ExitScope>
        </div>
      </div>
    </Portal>
  );
}
