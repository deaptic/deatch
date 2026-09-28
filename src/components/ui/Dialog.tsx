import { type JSX, Show } from "solid-js";
import { Portal } from "solid-js/web";
import { captureFocusForRestore } from "../../lib/utils/focus.ts";

type Props = {
  title: string;
  description?: string;
  onClose: () => void;
  actions: JSX.Element;
  children?: JSX.Element;
};

export default function Dialog(props: Props) {
  captureFocusForRestore();
  return (
    <Portal>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) props.onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={props.title}
          class="w-110 max-w-full bg-surface border border-line rounded-lg p-6 flex flex-col gap-4 transition duration-quick ease-out starting:opacity-0 starting:translate-y-1"
        >
          <div class="flex flex-col gap-1">
            <h2 class="text-title text-ink">{props.title}</h2>
            <Show when={props.description}>
              <p class="text-body text-ink-soft">{props.description}</p>
            </Show>
          </div>
          {props.children}
          <div class="flex gap-2 justify-end pt-2">{props.actions}</div>
        </div>
      </div>
    </Portal>
  );
}
