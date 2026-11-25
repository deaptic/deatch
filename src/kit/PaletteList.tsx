import type { JSX } from "solid-js";

type Props = Omit<JSX.HTMLAttributes<HTMLDivElement>, "class">;

export default function PaletteList(props: Props) {
  return (
    <div
      {...props}
      class="flex-1 min-h-0 overflow-y-auto mt-2 flex flex-col gap-0.5"
    />
  );
}
