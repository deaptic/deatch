import type { JSX } from "solid-js";

type Props = {
  title: string;
  children: JSX.Element;
};

export default function SettingsContentSection(props: Props) {
  return (
    <div class="flex flex-col gap-3">
      <h3 class="text-[#adadb8] text-xs font-medium uppercase tracking-wider">{props.title}</h3>
      {props.children}
    </div>
  );
}
