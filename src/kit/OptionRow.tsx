import { type JSX, splitProps } from "solid-js";

type Size = "md" | "auto" | "lg" | "stack";

const SIZES: Record<Size, string> = {
  md: "h-control-md items-center gap-2.5",
  auto: "min-h-control-md py-1.5 items-center gap-3",
  lg: "h-13 items-center gap-3",
  stack: "flex-col gap-0.5 py-2",
};

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  size?: Size;
  cursor?: string;
};

export default function OptionRow(props: Props) {
  const [local, others] = splitProps(props, [
    "active",
    "size",
    "cursor",
    "class",
  ]);
  return (
    <button
      type="button"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      {...others}
      class={`w-full shrink-0 flex px-2.5 rounded-sm text-base text-ink text-left transition-colors duration-snap ${
        SIZES[local.size ?? "md"]
      } ${local.active ? "bg-raised" : "hover:bg-raised"} ${
        local.cursor ?? "cursor-pointer"
      } ${local.class ?? ""}`}
    />
  );
}
