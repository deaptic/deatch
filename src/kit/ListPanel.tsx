import type { JSX } from "solid-js";

type Placement = "below" | "above" | "inline";

const PLACEMENTS: Record<Placement, string> = {
  below:
    "absolute top-full right-0 w-full min-w-55 mt-1 z-30 max-h-80 material-regular rounded-md enter-pop origin-top",
  above:
    "absolute bottom-full inset-x-0 mb-2 z-30 max-h-60 material-regular rounded-md enter-pop origin-bottom",
  inline: "max-h-60 rounded-sm",
};

type Props = {
  placement: Placement;
  id?: string;
  role?: "listbox";
  children: JSX.Element;
};

export default function ListPanel(props: Props) {
  return (
    <div
      id={props.id}
      role={props.role}
      class={`overflow-y-auto p-1.5 flex flex-col ${PLACEMENTS[props.placement]}`}
    >
      {props.children}
    </div>
  );
}
