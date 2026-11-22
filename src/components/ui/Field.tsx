import { type JSX, Show, splitProps } from "solid-js";

type Size = "sm" | "md" | "lg";
type Look = "boxed" | "inline";

type Props = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: Size;
  look?: Look;
  icon?: JSX.Element;
  trailing?: JSX.Element;
};

const LOOKS: Record<Look, string> = {
  boxed:
    "bg-surface border border-line hover:border-ink-faint focus-within:border-accent!",
  inline:
    "font-semibold border border-transparent hover:bg-raised focus-within:bg-surface focus-within:border-accent!",
};

const SIZES: Record<Size, string> = {
  sm: "h-control-sm px-2.5 rounded-sm",
  md: "h-control-md px-3 rounded-sm",
  lg: "h-control-lg px-3.5 rounded-md",
};

export default function Field(props: Props) {
  const [local, others] = splitProps(props, [
    "class",
    "size",
    "look",
    "icon",
    "trailing",
  ]);
  return (
    <label
      class={`inline-flex items-center gap-2.5 text-ink transition duration-snap focus-within:ring-3 focus-within:ring-accent-soft has-[:disabled]:opacity-40 ${
        LOOKS[local.look ?? "boxed"]
      } ${SIZES[local.size ?? "md"]} ${local.class ?? ""}`}
    >
      <Show when={local.icon}>
        <span class="shrink-0 text-ink-soft [&>svg]:size-4">{local.icon}</span>
      </Show>
      <input
        type="text"
        {...others}
        class="flex-1 min-w-0 bg-transparent text-body outline-none placeholder:text-ink-faint"
      />
      {local.trailing}
    </label>
  );
}
