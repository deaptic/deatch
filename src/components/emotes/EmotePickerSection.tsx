import type { JSX } from "solid-js";

export default function EmotePickerSection(
  props: { label: string; children: JSX.Element },
) {
  return (
    <div>
      <p class="text-small text-ink-faint px-1 pt-2 pb-1.5">{props.label}</p>
      {props.children}
    </div>
  );
}
