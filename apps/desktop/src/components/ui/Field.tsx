import { type JSX, Show, splitProps } from "solid-js";

type Size = "sm" | "md" | "lg";

type Props = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: Size;
  icon?: JSX.Element;
  trailing?: JSX.Element;
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
    "icon",
    "trailing",
  ]);
  return (
    <label
      class={`inline-flex items-center gap-2.5 bg-surface border border-line text-ink transition-colors duration-snap hover:border-ink-faint focus-within:border-accent! has-[:disabled]:opacity-40 ${
        SIZES[local.size ?? "md"]
      } ${local.class ?? ""}`}
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
