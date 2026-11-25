import { type JSX, splitProps } from "solid-js";

type Look = "card" | "tile";

const LOOKS: Record<Look, string> = {
  card: "flex flex-col text-left rounded-lg overflow-hidden bg-surface hover:bg-raised",
  tile: "flex flex-col items-center gap-2 min-w-0 rounded-md p-2 text-center hover:bg-surface",
};

type Props = JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
  look: Look;
  cursor?: string;
};

export default function CardButton(props: Props) {
  const [local, others] = splitProps(props, ["look", "cursor", "class"]);
  return (
    <button
      type="button"
      {...others}
      class={`group pressable active:pressed ${LOOKS[local.look]} ${
        local.cursor ?? "cursor-pointer"
      } ${local.class ?? ""}`}
    />
  );
}
