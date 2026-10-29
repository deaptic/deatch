import { X } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { t } from "../../lib/i18n/index.ts";

type Variant = "pill" | "command" | "media";

const SHAPES: Record<Variant, string> = {
  pill: "h-control-sm px-3 rounded-full text-small font-semibold",
  command: "shrink-0 px-2 py-1 rounded-sm text-body font-semibold",
  media: "px-1.5 py-0.5 rounded-xs text-micro tabular-nums",
};

type Props = {
  label: string;
  variant?: Variant;
  icon?: JSX.Element;
  title?: string;
  selected?: boolean;
  onRemove?: () => void;
};

export default function Chip(props: Props) {
  const variant = () => props.variant ?? "pill";
  const tone = () => {
    if (variant() === "media") return "bg-media-scrim text-on-accent";
    return props.selected
      ? "bg-accent-soft text-accent-ink"
      : "bg-raised text-ink-soft";
  };
  const base = () =>
    `inline-flex items-center gap-1 ${SHAPES[variant()]} ${tone()}`;

  return (
    <Show
      when={props.onRemove}
      fallback={
        <span class={base()} data-tip={props.title}>
          {props.icon}
          {props.label}
        </span>
      }
    >
      <button
        type="button"
        onClick={() => props.onRemove?.()}
        data-tip={t("UI_REMOVE")}
        aria-label={t("UI_CHIP_REMOVE", { label: props.label })}
        class={`${base()} pr-2 cursor-pointer hover:text-ink hover:bg-overlay transition-colors duration-snap`}
      >
        {props.icon}
        {props.label}
        <X class="size-3.5" />
      </button>
    </Show>
  );
}
