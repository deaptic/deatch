import type { JSX } from "solid-js";

export default function TriggerLead(props: { children: JSX.Element }) {
  return (
    <span class="w-12 shrink-0 h-control-md flex items-center text-small font-semibold text-ink-soft">
      {props.children}
    </span>
  );
}
