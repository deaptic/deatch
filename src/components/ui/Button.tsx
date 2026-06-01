import { splitProps, type JSX } from "solid-js";
import { isPanelOpen, togglePanel, type Panel } from "../../lib/stores/ui";

type Variant = "primary" | "secondary" | "danger";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: JSX.Element;
  toggle?: Panel;
};

const VARIANTS: Record<Variant, string> = {
  primary: "text-text bg-primary hover:bg-primary/80",
  secondary:
    "text-text-muted hover:text-text bg-bg hover:bg-bg-light border border-border-muted",
  danger: "text-text bg-danger hover:bg-danger/80",
};

const TOGGLE_ACTIVE = "text-text bg-bg-light";
const TOGGLE_INACTIVE = "text-text-muted hover:bg-bg hover:text-text";

export default function Button(props: Props) {
  const [local, others] = splitProps(props, ["class", "variant", "icon", "children", "toggle"]);
  const iconOnly = () => local.icon !== undefined && local.children == null;
  const isToggle = () => local.toggle !== undefined;
  const styleClass = () =>
    isToggle()
      ? (isPanelOpen(local.toggle!) ? TOGGLE_ACTIVE : TOGGLE_INACTIVE)
      : VARIANTS[local.variant ?? "primary"];

  return (
    <button
      type="button"
      {...others}
      {...(isToggle()
        ? {
            onClick: () => togglePanel(local.toggle!),
            onMouseDown: (e: MouseEvent) => e.preventDefault(),
            "data-panel-toggle": local.toggle,
          }
        : {})}
      class={`shrink-0 h-8 flex items-center justify-center text-sm rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        iconOnly() ? "w-8" : "px-3 gap-1.5"
      } ${styleClass()} ${local.class ?? ""}`}
    >
      {local.icon}
      {local.children}
    </button>
  );
}
