import { splitProps, type JSX } from "solid-js";

type Variant = "primary" | "secondary" | "danger";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: JSX.Element;
};

const VARIANTS: Record<Variant, string> = {
  primary: "text-text bg-primary hover:bg-primary/80",
  secondary:
    "text-text-muted hover:text-text bg-bg hover:bg-bg-light border border-border-muted",
  danger: "text-text bg-danger hover:bg-danger/80",
};

export default function Button(props: Props) {
  const [local, others] = splitProps(props, ["class", "variant", "icon", "children"]);
  const iconOnly = () => local.icon !== undefined && local.children == null;
  return (
    <button
      type="button"
      {...others}
      class={`shrink-0 h-8 flex items-center justify-center text-sm rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        iconOnly() ? "w-8" : "px-3 gap-1.5"
      } ${VARIANTS[local.variant ?? "primary"]} ${local.class ?? ""}`}
    >
      {local.icon}
      {local.children}
    </button>
  );
}
