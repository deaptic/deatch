import type { JSX } from "solid-js";

export type ToolbarTone = "neutral" | "positive" | "negative";

type Props = {
  title: string;
  onClick: (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
  children: JSX.Element;
  tone?: ToolbarTone;
  disabled?: boolean;
};

const TONES: Record<ToolbarTone, string> = {
  neutral: "text-ink-soft hover:text-ink hover:bg-raised",
  positive: "text-positive hover:bg-positive/15",
  negative: "text-negative hover:bg-negative/15",
};

export default function ToolbarItem(props: Props) {
  return (
    <button
      type="button"
      data-tip={props.title}
      aria-label={props.title}
      disabled={props.disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e);
      }}
      class={`size-control-sm grid place-items-center rounded-xs pressable enabled:active:pressed cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&>svg]:size-4 ${
        TONES[props.tone ?? "neutral"]
      }`}
    >
      {props.children}
    </button>
  );
}
