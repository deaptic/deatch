import { X } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import { t } from "../shared/i18n/index.ts";

type Variant = "tag" | "command" | "label";

const SHAPES: Record<Variant, string> = {
  tag: "h-control-sm px-3 rounded-sm text-sm font-semibold",
  command: "shrink-0 px-2 py-1 rounded-sm text-base font-semibold",
  label: "shrink-0 px-1.5 py-0.5 rounded-xs text-xs font-medium",
};

type Props = {
  label: string;
  variant?: Variant;
  icon?: JSX.Element;
  title?: string;
  selected?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
};

export default function Chip(props: Props) {
  const variant = () => props.variant ?? "tag";
  const tone = () => {
    if (variant() === "label") return "bg-line-soft text-ink-soft";
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
        <Show
          when={props.onClick}
          fallback={
            <span class={base()} data-tip={props.title}>
              {props.icon}
              {props.label}
            </span>
          }
        >
          {(onClick) => (
            <button
              type="button"
              data-tip={props.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onClick()()}
              class={`${base()} cursor-pointer hover:text-ink hover:bg-overlay transition-colors duration-snap pressable active:pressed`}
            >
              {props.icon}
              {props.label}
            </button>
          )}
        </Show>
      }
    >
      <button
        type="button"
        onClick={() => props.onRemove?.()}
        aria-label={t("UI_CHIP_REMOVE_LABEL", { label: props.label })}
        class={`${base()} pr-2 cursor-pointer hover:text-ink hover:bg-overlay transition-colors duration-snap`}
      >
        {props.icon}
        {props.label}
        <X class="size-3.5" />
      </button>
    </Show>
  );
}
