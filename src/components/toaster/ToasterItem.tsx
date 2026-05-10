import { Show, createSignal, onCleanup, onMount } from "solid-js";
import type { Component } from "solid-js";
import CloseIcon from "../../icons/CloseIcon";
import ErrorIcon from "../../icons/ErrorIcon";
import SuccessIcon from "../../icons/SuccessIcon";
import InfoIcon from "../../icons/InfoIcon";
import WarnIcon from "../../icons/WarnIcon";
import LogIcon from "../../icons/LogIcon";
import type { Toast, ToastType } from "../../state/toasts";

const COLORS: Record<ToastType, { hex: string; icon: string }> = {
  error: { hex: "#ef4444", icon: "stroke-red-400" },
  info: { hex: "#3b82f6", icon: "stroke-blue-400" },
  success: { hex: "#22c55e", icon: "stroke-green-400" },
  warn: { hex: "#eab308", icon: "stroke-yellow-400" },
  log: { hex: "#6b7280", icon: "stroke-gray-400" },
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
  const color = COLORS[toast.type];
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
      class="flex flex-col gap-2 bg-[#16161a] border border-[#2d2d35] rounded-xl p-3 shadow-2xl w-80"
      style={{
        opacity: shown() ? "1" : "0",
        transform: shown() ? "translateX(0)" : "translateX(24px)",
        transition: "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <div class="flex items-center gap-3">
        <div
          class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color.hex}28` }}
        >
          <Icon class={`w-5 h-5 ${color.icon}`} />
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <p class="text-[#efeff1] text-sm font-semibold leading-tight">{toast.title}</p>
          <Show when={toast.description}>
            <p class="text-[#adadb8] text-xs leading-snug">{toast.description}</p>
          </Show>
        </div>
        <button
          onClick={dismiss}
          class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[#adadb8] hover:text-[#efeff1] hover:bg-[#2d2d35] transition-colors cursor-pointer"
        >
          <CloseIcon class="w-2.5 h-2.5" />
        </button>
      </div>
      <div class="h-1 rounded-full bg-[#2d2d35] overflow-hidden">
        <div
          class="h-full rounded-full"
          style={{
            width: `${progress()}%`,
            background: color.hex,
            transition: toast.duration > 0 ? `width ${toast.duration}ms linear` : "none",
          }}
        />
      </div>
    </div>
  );
}
