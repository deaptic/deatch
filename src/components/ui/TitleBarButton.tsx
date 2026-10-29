import { type JSX, splitProps } from "solid-js";

type Variant = "plain" | "close";

const VARIANTS: Record<Variant, string> = {
  plain: "hover:bg-raised hover:text-ink",
  close: "hover:bg-negative hover:text-on-accent",
};

type Props = Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  label: string;
  variant?: Variant;
  pressed?: boolean;
  children: JSX.Element;
};

export default function TitleBarButton(props: Props) {
  const [local, others] = splitProps(props, [
    "label",
    "variant",
    "pressed",
    "children",
  ]);
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      {...others}
      aria-label={local.label}
      aria-pressed={local.pressed}
      class={`relative w-11.5 h-full grid place-items-center transition-colors duration-snap cursor-pointer ${
        local.pressed ? "bg-raised text-ink" : "text-ink-soft"
      } ${VARIANTS[local.variant ?? "plain"]}`}
    >
      {local.children}
    </button>
  );
}
