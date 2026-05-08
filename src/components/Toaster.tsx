import { For, Show, createSignal, onCleanup, onMount } from "solid-js";
import { COLORS, TOASTER_ICONS } from "../constants";
import type { Toast } from "../notifications";

type Props = {
  toasts: () => Toast[];
  onDismiss: (id: number) => void;
};

function ToastItem(props: { t: Toast; onDismiss: (id: number) => void }) {
  const t = props.t;
  const color = COLORS[t.type];
  const Icon = TOASTER_ICONS[t.type];
  const [progress, setProgress] = createSignal(100);
  const [visible, setVisible] = createSignal(false);
  const [leaving, setLeaving] = createSignal(false);

  function dismiss() {
    if (leaving()) return;
    setLeaving(true);
    setTimeout(() => props.onDismiss(t.id), 200);
  }

  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVisible(true);
      if (t.duration > 0) setProgress(0);
    }));
    if (t.duration > 0) {
      const timer = setTimeout(dismiss, t.duration);
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
          <p class="text-[#efeff1] text-sm font-semibold leading-tight">{t.title}</p>
          <Show when={t.description}>
            <p class="text-[#adadb8] text-xs leading-snug">{t.description}</p>
          </Show>
        </div>
        <button
          onClick={dismiss}
          class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[#adadb8] hover:text-[#efeff1] hover:bg-[#2d2d35] transition-colors cursor-pointer"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
      <div class="h-1 rounded-full bg-[#2d2d35] overflow-hidden">
        <div
          class="h-full rounded-full"
          style={{
            width: `${progress()}%`,
            background: color.hex,
            transition: t.duration > 0 ? `width ${t.duration}ms linear` : "none",
          }}
        />
      </div>
    </div>
  );
}

export default function Toaster(props: Props) {
  return (
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
      <For each={props.toasts()}>
        {(t) => <ToastItem t={t} onDismiss={props.onDismiss} />}
      </For>
    </div>
  );
}
