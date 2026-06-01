import { JSX } from "solid-js";

export default function EmotePickerSection(
  props: { label: string; children: JSX.Element },
) {
  return (
    <div>
      <p class="text-text-muted text-xs font-semibold uppercase tracking-wider px-1 py-1.5">
        {props.label}
      </p>
      {props.children}
    </div>
  );
}
