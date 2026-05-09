import { JSX } from "solid-js";

export default function PickerSection(props: { label: string; children: JSX.Element }) {
  return (
    <div>
      <p class="text-[#5c5c7a] text-xs font-semibold uppercase tracking-wider px-1 py-1.5">
        {props.label}
      </p>
      {props.children}
    </div>
  );
}
