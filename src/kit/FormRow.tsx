import type { JSX } from "solid-js";

export default function FormRow(props: {
  label: string;
  children: JSX.Element;
}) {
  return (
    <div class="flex items-start gap-4">
      <span class="w-28 shrink-0 h-control-md flex items-center text-small text-ink-soft">
        {props.label}
      </span>
      <div class="flex-1 min-w-0 flex flex-col gap-2">{props.children}</div>
    </div>
  );
}
