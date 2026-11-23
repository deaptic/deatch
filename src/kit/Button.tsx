import { children, type JSX, Show, splitProps } from "solid-js";
import Loading from "./Loading.tsx";

export type ButtonVariant =
  | "accent"
  | "neutral"
  | "ghost"
  | "danger"
  | "media"
  | "toggle";
type ButtonShape = "rect" | "pill";
export type ButtonSize = "sm" | "md" | "lg";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: JSX.Element;
  loading?: boolean;
  pressed?: boolean;
  shape?: ButtonShape;
};

const VARIANTS: Record<ButtonVariant, string> = {
  accent: "bg-accent text-on-accent hover:bg-accent-hover active:opacity-90",
  neutral: "bg-raised text-ink hover:bg-overlay active:bg-surface",
  ghost: "text-ink-soft hover:bg-raised hover:text-ink active:bg-overlay",
  danger: "bg-negative text-on-accent hover:brightness-110 active:opacity-90",
  media: "text-on-accent hover:bg-raised active:bg-overlay",
  toggle: "bg-raised text-ink-soft hover:bg-overlay hover:text-ink",
};

const SHAPES: Record<ButtonShape, string> = {
  rect: "rounded-sm",
  pill: "rounded-full elevation-2",
};

const PRESSED: Partial<Record<ButtonVariant, string>> = {
  ghost: "bg-raised text-ink",
  media: "bg-raised text-on-accent",
  toggle: "bg-positive/15 text-positive hover:bg-positive/20",
  neutral:
    "bg-accent-soft text-accent-ink border border-accent/40 hover:bg-accent/18",
};

const SIZES: Record<ButtonSize, { box: string; pad: string; text: string }> = {
  sm: { box: "h-control-sm", pad: "px-2.5", text: "text-small font-semibold" },
  md: { box: "h-control-md", pad: "px-3.5", text: "text-body font-semibold" },
  lg: { box: "h-control-lg", pad: "px-5", text: "text-body font-semibold" },
};

const SQUARE: Record<ButtonSize, string> = {
  sm: "w-control-sm",
  md: "w-control-md",
  lg: "w-control-lg",
};

export default function Button(props: Props) {
  const [local, others] = splitProps(props, [
    "class",
    "variant",
    "size",
    "icon",
    "loading",
    "pressed",
    "shape",
    "children",
    "disabled",
  ]);
  const size = () => local.size ?? "md";
  const variant = () => local.variant ?? "accent";
  const icon = children(() => local.icon);
  const content = children(() => local.children);
  const iconOnly = () =>
    icon.toArray().length > 0 && content.toArray().length === 0;
  const style = () =>
    (local.pressed && PRESSED[variant()]) || VARIANTS[variant()];

  return (
    <button
      type="button"
      aria-pressed={local.pressed}
      {...others}
      disabled={local.disabled || local.loading}
      class={`relative shrink-0 inline-flex items-center justify-center gap-1.5 ${SHAPES[local.shape ?? "rect"]} cursor-pointer select-none pressable enabled:active:pressed disabled:opacity-40 disabled:cursor-not-allowed ${
        SIZES[size()].box
      } ${SIZES[size()].text} ${
        iconOnly() ? SQUARE[size()] : SIZES[size()].pad
      } ${style()} ${local.class ?? ""}`}
    >
      <Show when={local.loading}>
        <span class="absolute inset-0 grid place-items-center">
          <Loading size={16} />
        </span>
      </Show>
      <span class={`contents ${local.loading ? "invisible" : ""}`}>
        {icon()}
        {content()}
      </span>
    </button>
  );
}
