import { Show } from "solid-js";
import type { JSX } from "solid-js";

type Props = {
  label: string;
  description?: string;
  stacked?: boolean;
  children: JSX.Element;
};

export default function SettingsContentSectionItem(props: Props) {
  return (
    <div
      class={`flex gap-6 ${
        props.stacked
          ? "flex-col gap-2 items-stretch"
          : "items-start justify-between"
      }`}
    >
      <div class="flex flex-col gap-1 min-w-0">
        <span class="text-text text-sm">{props.label}</span>
        <Show when={props.description}>
          <span class="text-text-muted text-xs">{props.description}</span>
        </Show>
      </div>
      <div class={props.stacked ? "flex flex-col gap-2" : ""}>
        {props.children}
      </div>
    </div>
  );
}
