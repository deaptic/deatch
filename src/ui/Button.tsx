import { splitProps, type JSX } from "solid-js";

type Variant = "primary" | "secondary" | "danger";

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANTS: Record<Variant, string> = {
  primary: "text-text bg-primary hover:bg-primary/80",
  secondary:
    "text-text-muted hover:text-text bg-bg-light hover:bg-border border border-border",
  danger: "text-text bg-danger hover:bg-danger/80",
};

export default function Button(props: Props) {
  const [local, others] = splitProps(props, ["class", "variant"]);
  return (
    <button
      type="button"
      {...others}
      class={`shrink-0 h-8 px-3 flex items-center justify-center text-sm rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        VARIANTS[local.variant ?? "primary"]
      } ${local.class ?? ""}`}
    />
  );
}
