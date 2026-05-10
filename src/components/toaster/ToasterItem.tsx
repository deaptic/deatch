import { Show, createSignal, onCleanup, onMount } from "solid-js";
import type { Component } from "solid-js";
import CloseIcon from "../../icons/CloseIcon";
import ErrorIcon from "../../icons/ErrorIcon";
import SuccessIcon from "../../icons/SuccessIcon";
import InfoIcon from "../../icons/InfoIcon";
import WarnIcon from "../../icons/WarnIcon";
import LogIcon from "../../icons/LogIcon";
import type { Toast, ToastType } from "../../state/toasts";

const TYPE: Record<ToastType, { tint: string; stroke: string; fill: string }> = {
  error: { tint: "bg-danger/15", stroke: "stroke-danger", fill: "bg-danger" },
  info: { tint: "bg-info/15", stroke: "stroke-info", fill: "bg-info" },
  success: { tint: "bg-success/15", stroke: "stroke-success", fill: "bg-success" },
  warn: { tint: "bg-warning/15", stroke: "stroke-warning", fill: "bg-warning" },
  log: { tint: "bg-text-muted/15", stroke: "stroke-text-muted", fill: "bg-text-muted" },
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
  const [progress, setProgress] = createSignal(100);
  const [visible, setVisible] = createSignal(false);
  const [leaving, setLeaving] = createSignal(false);

  function dismiss() {
    if (leaving()) return;
    setLeaving(true);
    setTimeout(() => props.onDismiss(toast.id), 200);
  }

  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVisible(true);
      if (toast.duration > 0) setProgress(0);
    }));
    if (toast.duration > 0) {
      const timer = setTimeout(dismiss, toast.duration);
      onCleanup(() => clearTimeout(timer));
    }
  });

  const shown = () => visible() && !leaving();

  return (
    <div
      class="flex flex-col gap-2 bg-bg border border-border-muted rounded-xl p-3 shadow-2xl w-80"
      style={{
        opacity: shown() ? "1" : "0",
        transform: shown() ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <div class="flex items-center gap-3">
        <div class={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${palette.tint}`}>
          <Icon class={`w-5 h-5 ${palette.stroke}`} />
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <p class="text-text text-sm font-semibold leading-tight">{toast.title}</p>
          <Show when={toast.description}>
            <p class="text-text-muted text-xs leading-snug">{toast.description}</p>
          </Show>
        </div>
        <button
          onClick={dismiss}
          class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text hover:bg-bg-light transition-colors cursor-pointer"
        >
          <CloseIcon class="w-2.5 h-2.5" />
        </button>
      </div>
      <div class="h-1 rounded-full bg-bg-light overflow-hidden">
        <div
          class={`h-full rounded-full ${palette.fill}`}
          style={{
            width: `${progress()}%`,
            transition: toast.duration > 0 ? `width ${toast.duration}ms linear` : "none",
          }}
        />
      </div>
    </div>
  );
}
