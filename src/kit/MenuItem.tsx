import { Check, ChevronRight } from "lucide-solid";
import { type JSX, Show, useContext } from "solid-js";
import Kbd from "./Kbd.tsx";
import { MenuClose } from "./menuClose.ts";

type Props = {
  label: string;
  icon?: JSX.Element;
  hint?: string;
  shortcut?: string;
  submenu?: boolean;
  active?: boolean;
  checked?: boolean;
  tone?: "negative" | "caution";
  keepOpen?: boolean;
  ref?: (el: HTMLButtonElement) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
} & (
  | { disabled: true; onClick?: undefined }
  | { disabled?: boolean; onClick: () => void }
);

const TONES = { negative: "text-negative", caution: "text-caution" };

export default function MenuItem(props: Props) {
  const close = useContext(MenuClose);

  function select() {
    const onClick = props.onClick;
    const staysOpen = props.keepOpen || props.checked !== undefined;
    if (!props.submenu && !staysOpen) close?.();
    onClick?.();
  }

  return (
    <button
      ref={props.ref}
      type="button"
      role={props.checked === undefined ? "menuitem" : "menuitemcheckbox"}
      aria-checked={props.checked}
      aria-haspopup={props.submenu ? "menu" : undefined}
      disabled={props.disabled}
      onClick={select}
      onKeyDown={(e) => props.onKeyDown?.(e)}
      class={`w-full h-control-md flex items-center gap-2.5 px-2.5 rounded-sm text-base text-left transition-colors duration-snap ${
        props.disabled
          ? "opacity-40 cursor-default"
          : "cursor-pointer hover:bg-raised"
      } ${props.tone ? TONES[props.tone] : "text-ink"}`}
    >
      <Show when={props.icon}>
        <span
          class={`shrink-0 w-4 grid place-items-center [&>svg]:size-4 ${
            props.tone ? "" : props.active ? "text-positive" : "text-ink-soft"
          }`}
        >
          {props.icon}
        </span>
      </Show>
      <span class="truncate">{props.label}</span>
      <Show when={props.checked !== undefined}>
        <span
          class={`ml-auto shrink-0 size-4.5 grid place-items-center rounded-xs border transition-colors duration-snap [&>svg]:size-3.5 ${
            props.checked
              ? "bg-accent border-accent text-on-accent"
              : "border-line"
          }`}
        >
          <Show when={props.checked}>
            <Check />
          </Show>
        </span>
      </Show>
      <Show when={props.hint || props.shortcut || props.submenu}>
        <span class="ml-auto pl-4 shrink-0 flex items-center gap-3 text-sm text-ink-soft">
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
