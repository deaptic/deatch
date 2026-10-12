import { ChevronRight } from "lucide-solid";
import { type JSX, Show } from "solid-js";
import Kbd from "./Kbd.tsx";

type Props = {
  label: string;
  icon?: JSX.Element;
  hint?: JSX.Element | string;
  shortcut?: string;
  submenu?: boolean;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function MenuItem(props: Props) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      class={`w-full h-control-md flex items-center gap-2.5 px-2.5 rounded-sm text-body text-left transition-colors duration-snap ${
        props.disabled
          ? "opacity-40 cursor-default"
          : "cursor-pointer hover:bg-raised"
      } ${props.danger ? "text-negative" : "text-ink"}`}
    >
      <span
        class={`shrink-0 w-4 grid place-items-center [&>svg]:size-4 ${
          props.danger ? "" : props.active ? "text-positive" : "text-ink-soft"
        }`}
      >
        {props.icon}
      </span>
      <span class="truncate" title={props.label}>{props.label}</span>
      <Show when={props.hint || props.shortcut || props.submenu}>
        <span class="ml-auto pl-4 shrink-0 flex items-center gap-3 text-small text-ink-soft">
          {props.hint}
          <Show when={props.shortcut}>
            {(combo) => <Kbd combo={combo()} />}
          </Show>
          <Show when={props.submenu}>
            <ChevronRight class="size-4" />
          </Show>
        </span>
      </Show>
    </button>
  );
}
