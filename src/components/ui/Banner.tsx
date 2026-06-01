import { type JSX, Show } from "solid-js";

type Tone = "info" | "danger";

type Props = {
  tone?: Tone;
  onDismiss?: () => void;
  children: JSX.Element;
};

const TONES: Record<Tone, string> = {
  info: "bg-primary/6",
  danger: "bg-danger/10",
};

export default function Banner(props: Props) {
  return (
    <div
      class={`flex items-center gap-2 px-4 py-2 border-b border-border-muted ${
        TONES[props.tone ?? "info"]
      }`}
    >
      <span class="text-xs text-text-muted truncate min-w-0">
        {props.children}
      </span>
      <Show when={props.onDismiss}>
        <button
          onClick={props.onDismiss}
          class="ml-auto shrink-0 text-text-muted hover:text-text cursor-pointer transition-colors text-xs leading-none"
        >
          ✕
        </button>
      </Show>
    </div>
  );
}
