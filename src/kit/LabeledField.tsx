import { type JSX, Show } from "solid-js";

export default function LabeledField(props: {
  label: string;
  inline?: boolean;
  children: JSX.Element;
}) {
  return (
    <Show
      when={props.inline}
      fallback={
        <div class="flex flex-col gap-1.5">
          <span aria-hidden class="text-sm text-ink-soft">
            {props.label}
          </span>
          {props.children}
        </div>
      }
    >
      <div class="flex items-start gap-4">
        <span class="w-28 shrink-0 h-control-md flex items-center text-sm text-ink-soft">
          {props.label}
        </span>
        <div class="flex-1 min-w-0 flex flex-col gap-2">{props.children}</div>
      </div>
    </Show>
  );
}
