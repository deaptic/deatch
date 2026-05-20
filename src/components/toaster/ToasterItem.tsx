import { Show, createSignal, onCleanup, onMount } from "solid-js";
import type { Component } from "solid-js";
import CloseIcon from "../../icons/CloseIcon";
import ErrorIcon from "../../icons/ErrorIcon";
import SuccessIcon from "../../icons/SuccessIcon";
import InfoIcon from "../../icons/InfoIcon";
import WarnIcon from "../../icons/WarnIcon";
import LogIcon from "../../icons/LogIcon";
import type { Toast, ToastType } from "../../state/toasts";

const TYPE: Record<ToastType, { fill: string }> = {
  error: { fill: "bg-danger" },
  info: { fill: "bg-info" },
  success: { fill: "bg-success" },
  warn: { fill: "bg-warning" },
  log: { fill: "bg-text-muted" },
};

const ICONS: Record<ToastType, Component<{ class?: string }>> = {
  error: ErrorIcon,
  info: InfoIcon,
  success: SuccessIcon,
  warn: WarnIcon,
  log: LogIcon,
};

type Props = {
  toast: Toast;
  onDismiss: (id: number) => void;
};

export default function ToasterItem(props: Props) {
  const toast = props.toast;
  const palette = TYPE[toast.type];
  const Icon = ICONS[toast.type];
  const [visible, setVisible] = createSignal(false);
  const [leaving, setLeaving] = createSignal(false);

  function dismiss() {
    if (leaving()) return;
    setLeaving(true);
    setTimeout(() => props.onDismiss(toast.id), 200);
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
      class="flex items-stretch bg-bg-dark border border-border-muted rounded-sm shadow-2xl w-80 overflow-hidden"
      style={{
        opacity: shown() ? "1" : "0",
        transform: shown() ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <div class={`shrink-0 w-14 flex items-center justify-center ${palette.fill}`}>
        <Icon class="w-6 h-6 stroke-white" />
      </div>
      <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5 px-3 py-3">
        <p class="text-text text-sm font-semibold leading-tight break-words">{toast.title}</p>
        <Show when={toast.description}>
          <p class="text-text-muted text-xs leading-snug break-words line-clamp-3">{toast.description}</p>
        </Show>
      </div>
      <button
        onClick={dismiss}
        class="shrink-0 w-9 flex items-center justify-center text-text-muted hover:text-text transition-colors cursor-pointer"
      >
        <CloseIcon class="w-2.5 h-2.5" />
      </button>
    </div>
  );
}
