import {
  CircleAlert,
  CircleCheck,
  Info,
  ScrollText,
  TriangleAlert,
  X,
} from "lucide-solid";
import { createSignal, onCleanup, onMount, Show } from "solid-js";
import type { Component } from "solid-js";
import type { Toast, ToastType } from "../../lib/stores/toasts.ts";

const TONE: Record<ToastType, string> = {
  error: "text-negative",
  info: "text-info",
  success: "text-positive",
  warn: "text-caution",
  log: "text-ink-soft",
};

const ICONS: Record<ToastType, Component<{ class?: string }>> = {
  error: CircleAlert,
  info: Info,
  success: CircleCheck,
  warn: TriangleAlert,
  log: ScrollText,
};

type Props = {
  toast: Toast;
  onDismiss: (id: number) => void;
};

export default function ToasterItem(props: Props) {
  const toast = props.toast;
  const Icon = ICONS[toast.type];
  const [visible, setVisible] = createSignal(false);
  const [leaving, setLeaving] = createSignal(false);

  function dismiss() {
    if (leaving()) return;
    setLeaving(true);
    setTimeout(() => props.onDismiss(toast.id), 240);
  }

  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    if (toast.duration > 0) {
      const timer = setTimeout(dismiss, toast.duration);
      onCleanup(() => clearTimeout(timer));
    }
  });

  const shown = () => visible() && !leaving();

  return (
    <div
      role="status"
      class="flex items-center gap-3 w-90 pl-4 pr-2 py-3 bg-overlay border border-line rounded-md transition duration-settle ease-out"
      classList={{
        "opacity-0 -translate-y-2": !shown(),
        "opacity-100 translate-y-0": shown(),
      }}
    >
      <Icon class={`size-4 shrink-0 ${TONE[toast.type]}`} />
      <div class="flex-1 min-w-0 flex flex-col">
        <p class="text-body text-ink break-words">{toast.title}</p>
        <Show when={toast.description}>
          <p class="text-small text-ink-soft break-words line-clamp-3">
            {toast.description}
          </p>
        </Show>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        class="shrink-0 size-7 grid place-items-center rounded-sm text-ink-faint hover:text-ink hover:bg-raised transition-colors duration-snap cursor-pointer"
      >
        <X class="size-3.5" />
      </button>
    </div>
  );
}
