import type { JSX } from "solid-js";

type Props = {
  children: JSX.Element;
  alwaysVisible?: boolean;
};

export default function Toolbar(props: Props) {
  return (
    <div
      class={`absolute right-3 top-0 -translate-y-1/2 z-10 flex items-center gap-0.5 p-0.75 bg-overlay border border-line rounded-sm ${
        props.alwaysVisible
          ? ""
          : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
      }`}
    >
      {props.children}
    </div>
  );
}
