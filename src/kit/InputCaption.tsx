import type { JSX } from "solid-js";

export default function InputCaption(props: { children: JSX.Element }) {
  return (
    <div class="flex items-center gap-2 pl-2 mb-1 min-h-control-sm min-w-0 text-sm text-ink-soft enter-expand">
      {props.children}
    </div>
  );
}
