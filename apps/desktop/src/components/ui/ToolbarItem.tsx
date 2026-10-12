import type { JSX } from "solid-js";

export type ToolbarTone = "default" | "success" | "danger";

type Props = {
  title: string;
  onClick: (e: MouseEvent & { currentTarget: HTMLButtonElement }) => void;
  children: JSX.Element;
  tone?: ToolbarTone;
  disabled?: boolean;
};

const TONES: Record<ToolbarTone, string> = {
  default: "text-ink-soft hover:text-ink hover:bg-raised",
  success: "text-positive hover:bg-positive/15",
  danger: "text-negative hover:bg-negative/15",
};

export default function ToolbarItem(props: Props) {
  return (
    <button
      type="button"
      title={props.title}
      aria-label={props.title}
      disabled={props.disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick(e);
      }}
      class={`size-7 grid place-items-center rounded-xs transition-colors duration-snap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed [&>svg]:size-4 ${
        TONES[props.tone ?? "default"]
      }`}
    >
      {props.children}
    </button>
  );
}
