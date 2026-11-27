import { type JSX, splitProps } from "solid-js";

type Variant = "card" | "tile" | "insetTile";

const VARIANTS: Record<Variant, string> = {
  card: "flex flex-col text-left rounded-lg overflow-hidden bg-surface hover:bg-raised",
  tile: "flex flex-col items-center gap-2 min-w-0 rounded-md p-2 text-center hover:bg-surface",
  insetTile:
    "flex flex-col items-center gap-2 min-w-0 rounded-md p-2 text-center hover:bg-raised",
};

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: Variant;
  cursor?: string;
};

export default function CardButton(props: Props) {
  const [local, others] = splitProps(props, ["variant", "cursor", "class"]);
  return (
    <button
      type="button"
      {...others}
      class={`group pressable active:pressed ${VARIANTS[local.variant]} ${
        local.cursor ?? "cursor-pointer"
      } ${local.class ?? ""}`}
    />
  );
}
