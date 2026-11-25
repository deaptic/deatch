import type { JSX } from "solid-js";

export default function InputGroupSlot(props: { children: JSX.Element }) {
  return (
    <div class={`flex items-center gap-1 shrink-0 self-end h-row-content`}>
      {props.children}
    </div>
  );
}
