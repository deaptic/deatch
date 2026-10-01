import type { JSX } from "solid-js";

export default function TriggerField(
  props: { label: string; children: JSX.Element },
) {
  return (
    <div class="flex items-center gap-3">
      <span class="w-24 shrink-0 text-small text-ink-soft">{props.label}</span>
      <div>{props.children}</div>
    </div>
  );
}
