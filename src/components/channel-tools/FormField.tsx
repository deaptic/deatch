import type { JSX } from "solid-js";

export default function FormField(props: {
  label: string;
  children: JSX.Element;
}) {
  return (
    <div class="flex flex-col gap-1.5">
      <span aria-hidden class="text-small text-ink-soft">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}
